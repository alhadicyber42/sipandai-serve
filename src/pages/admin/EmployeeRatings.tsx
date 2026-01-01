import { useState, useEffect, useMemo } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Trophy, Star, Search, Eye, Calendar, Award, User, ClipboardCheck, AlertCircle, CheckCircle2, Crown, Building2, Gavel, X, FileText, Lock, CalendarClock, BarChart3 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AdminUnitEvaluationForm } from "@/components/AdminUnitEvaluationForm";
import { AdminPusatEvaluationForm } from "@/components/AdminPusatEvaluationForm";
import { WinnerRecapTab } from "@/components/WinnerRecapTab";
import { EomSettingsTab } from "@/components/EomSettingsTab";
import { EomAnalyticsTab } from "@/components/EomAnalyticsTab";
import { WORK_UNITS } from "@/lib/constants";
import { toast } from "sonner";
import { useEomPeriodStatus } from "@/hooks/useEomPeriodStatus";
import { usePagination } from "@/hooks/usePagination";
import { TablePagination } from "@/components/TablePagination";
interface Rating {
  id: string;
  rater_id: string;
  rater_name: string;
  rated_employee_id: string;
  rated_employee_name: string;
  rated_employee_work_unit?: string;
  rating_period: string;
  reason: string;
  detailed_ratings: Record<string, Record<number, number>>;
  criteria_totals: Record<string, number>;
  total_points: number;
  max_possible_points: number;
  created_at: string;
}
interface AggregatedRating {
  employeeId: string;
  employeeName: string;
  employeeWorkUnit?: string;
  employeeWorkUnitId?: number;
  employeeCategory?: string;
  ratingPeriod: string;
  totalPoints: number;
  ratingCount: number;
  hasUnitEvaluation: boolean;
  unitEvaluation?: any;
  hasFinalEvaluation: boolean;
  finalEvaluation?: any;
}
interface DesignatedWinner {
  id: string;
  employee_id: string;
  winner_type: 'monthly' | 'yearly';
  employee_category: 'ASN' | 'Non ASN';
  period: string;
  final_points: number;
}
export default function AdminEmployeeRatings() {
  const {
    user
  } = useAuth();
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPeriod, setSelectedPeriod] = useState<string>("all");
  const [selectedRating, setSelectedRating] = useState<Rating | null>(null);
  const [leaderboard, setLeaderboard] = useState<Array<{
    employeeId: string;
    employeeName: string;
    totalPoints: number;
    ratingCount: number;
    finalPoints?: number;
    hasEvaluation?: boolean;
    hasFinalEvaluation?: boolean;
  }>>([]);
  const [unitEmployeeIds, setUnitEmployeeIds] = useState<string[]>([]);
  const [unitEvaluations, setUnitEvaluations] = useState<any[]>([]);
  const [finalEvaluations, setFinalEvaluations] = useState<any[]>([]);
  const [aggregatedRatings, setAggregatedRatings] = useState<AggregatedRating[]>([]);
  const [evaluationFilter, setEvaluationFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [workUnitFilter, setWorkUnitFilter] = useState<string>("all");
  const [designatedWinners, setDesignatedWinners] = useState<DesignatedWinner[]>([]);
  const [isDesignateDialogOpen, setIsDesignateDialogOpen] = useState(false);
  const [selectedForDesignation, setSelectedForDesignation] = useState<AggregatedRating | null>(null);
  const [designationType, setDesignationType] = useState<'monthly' | 'yearly'>('monthly');
  const [activeMainTab, setActiveMainTab] = useState<string>("penilaian");

  // Period status for feature lock
  const periodStatus = useEomPeriodStatus(selectedPeriod !== 'all' ? selectedPeriod : undefined, user?.work_unit_id);

  // Evaluation form state for admin_unit
  const [isEvaluationFormOpen, setIsEvaluationFormOpen] = useState(false);
  const [selectedEmployeeForEval, setSelectedEmployeeForEval] = useState<AggregatedRating | null>(null);

  // Evaluation form state for admin_pusat
  const [isFinalEvaluationFormOpen, setIsFinalEvaluationFormOpen] = useState(false);
  const [selectedEmployeeForFinalEval, setSelectedEmployeeForFinalEval] = useState<AggregatedRating | null>(null);
  useEffect(() => {
    loadData();
    loadDesignatedWinners();
  }, []);
  useEffect(() => {
    calculateLeaderboard();
    calculateAggregatedRatings();
  }, [ratings, selectedPeriod, unitEvaluations, finalEvaluations]);
  const loadData = async () => {
    // Load employees from Supabase
    let employeeQuery = supabase.from("profiles").select("*").eq("role", "user_unit");

    // If admin_unit, filter by work_unit_id
    if (user?.role === "admin_unit" && user?.work_unit_id) {
      employeeQuery = employeeQuery.eq("work_unit_id", user.work_unit_id);
    }
    const {
      data: employeeData
    } = await employeeQuery;
    if (employeeData) {
      setEmployees(employeeData);
      const employeeIds = employeeData.map(emp => emp.id);
      setUnitEmployeeIds(employeeIds);
    }

    // Load ratings from database
    let ratingsQuery = supabase.from("employee_ratings").select("*").order("created_at", {
      ascending: false
    });

    // Filter ratings based on user role
    if (user?.role === "admin_unit" && employeeData) {
      const employeeIds = employeeData.map(emp => emp.id);
      ratingsQuery = ratingsQuery.in("rated_employee_id", employeeIds);
    }
    const {
      data: ratingsData,
      error
    } = await ratingsQuery;
    if (error) {
      console.error("Error loading ratings:", error);
      return;
    }

    // Enrich ratings with employee names and work unit
    const enrichedRatings = (ratingsData || []).map((rating: any) => {
      const ratedEmployee = employeeData?.find(e => e.id === rating.rated_employee_id);
      const rater = employeeData?.find(e => e.id === rating.rater_id);
      const workUnit = WORK_UNITS.find(u => u.id === ratedEmployee?.work_unit_id);
      return {
        ...rating,
        rated_employee_name: ratedEmployee?.name || "Unknown",
        rated_employee_work_unit: workUnit?.name,
        rater_name: rater?.name || "Unknown"
      };
    });
    setRatings(enrichedRatings);

    // Load admin unit evaluations
    const {
      data: unitEvalData
    } = await supabase.from("admin_unit_evaluations").select("*");
    setUnitEvaluations(unitEvalData || []);

    // Load admin pusat final evaluations
    const {
      data: finalEvalData
    } = await supabase.from("admin_pusat_evaluations").select("*");
    setFinalEvaluations(finalEvalData || []);
  };
  const calculateAggregatedRatings = () => {
    const periodRatings = selectedPeriod === "all" ? ratings : ratings.filter(r => r.rating_period === selectedPeriod);

    // Aggregate by employee and period
    const aggregated: Record<string, AggregatedRating> = {};
    periodRatings.forEach(rating => {
      const key = `${rating.rated_employee_id}-${rating.rating_period}`;
      if (!aggregated[key]) {
        const unitEvaluation = unitEvaluations.find(e => e.rated_employee_id === rating.rated_employee_id && e.rating_period === rating.rating_period);
        const finalEvaluation = finalEvaluations.find(e => e.rated_employee_id === rating.rated_employee_id && e.rating_period === rating.rating_period);
        const employee = employees.find(e => e.id === rating.rated_employee_id);
        const workUnit = WORK_UNITS.find(u => u.id === employee?.work_unit_id);
        aggregated[key] = {
          employeeId: rating.rated_employee_id,
          employeeName: rating.rated_employee_name,
          employeeWorkUnit: workUnit?.name,
          employeeWorkUnitId: employee?.work_unit_id,
          ratingPeriod: rating.rating_period,
          totalPoints: 0,
          ratingCount: 0,
          hasUnitEvaluation: !!unitEvaluation,
          unitEvaluation,
          hasFinalEvaluation: !!finalEvaluation,
          finalEvaluation
        };
      }
      aggregated[key].totalPoints += rating.total_points || 0;
      aggregated[key].ratingCount += 1;
    });
    const result = Object.values(aggregated).sort((a, b) => b.totalPoints - a.totalPoints);
    setAggregatedRatings(result);
  };
  const calculateLeaderboard = () => {
    const filteredRatings = selectedPeriod === "all" ? ratings : ratings.filter(r => r.rating_period === selectedPeriod);
    const pointsByEmployee: Record<string, {
      totalPoints: number;
      count: number;
      name: string;
    }> = {};
    filteredRatings.forEach(rating => {
      const employeeId = rating.rated_employee_id;
      if (!pointsByEmployee[employeeId]) {
        pointsByEmployee[employeeId] = {
          totalPoints: 0,
          count: 0,
          name: rating.rated_employee_name
        };
      }
      pointsByEmployee[employeeId].totalPoints += rating.total_points || 0;
      pointsByEmployee[employeeId].count += 1;
    });

    // Apply evaluation adjustments - prioritize final evaluation, then unit evaluation
    const leaderboardData = Object.entries(pointsByEmployee).map(([employeeId, data]) => {
      const unitEvaluation = unitEvaluations.find(e => e.rated_employee_id === employeeId && (selectedPeriod === "all" || e.rating_period === selectedPeriod));
      const finalEvaluation = finalEvaluations.find(e => e.rated_employee_id === employeeId && (selectedPeriod === "all" || e.rating_period === selectedPeriod));

      // Priority: final evaluation > unit evaluation > raw points
      let finalPoints = data.totalPoints;
      if (finalEvaluation) {
        finalPoints = finalEvaluation.final_total_points;
      } else if (unitEvaluation) {
        finalPoints = unitEvaluation.final_total_points;
      }
      return {
        employeeId,
        employeeName: data.name,
        totalPoints: data.totalPoints,
        ratingCount: data.count,
        finalPoints,
        hasEvaluation: !!unitEvaluation,
        hasFinalEvaluation: !!finalEvaluation
      };
    }).sort((a, b) => (b.finalPoints || b.totalPoints) - (a.finalPoints || a.totalPoints));
    setLeaderboard(leaderboardData);
  };
  const getPeriods = () => {
    const periods = [...new Set(ratings.map(r => r.rating_period))].sort().reverse();
    return periods;
  };
  const filteredRatings = ratings.filter(rating => {
    const matchesSearch = rating.rated_employee_name.toLowerCase().includes(searchTerm.toLowerCase()) || rating.rater_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPeriod = selectedPeriod === "all" || rating.rating_period === selectedPeriod;
    return matchesSearch && matchesPeriod;
  });
  const filteredAggregatedRatings = aggregatedRatings.filter(item => {
    const matchesSearch = item.employeeName.toLowerCase().includes(searchTerm.toLowerCase());
    const isAdminPusatRole = user?.role === "admin_pusat";

    // For admin_unit, filter by unit evaluation status
    // For admin_pusat, filter by final evaluation status
    const matchesEvaluation = evaluationFilter === "all" || evaluationFilter === "evaluated" && (isAdminPusatRole ? item.hasFinalEvaluation : item.hasUnitEvaluation) || evaluationFilter === "not_evaluated" && (isAdminPusatRole ? !item.hasFinalEvaluation : !item.hasUnitEvaluation);
    
    // Filter by work unit (only for admin_pusat)
    const matchesWorkUnit = workUnitFilter === "all" || item.employeeWorkUnitId?.toString() === workUnitFilter;
    
    return matchesSearch && matchesEvaluation && matchesWorkUnit;
  });

  // Helper function to get employee category
  const getEmployeeCategory = (employeeId: string) => {
    const employee = employees.find(e => e.id === employeeId);
    return employee?.kriteria_asn === 'Non ASN' ? 'Non ASN' : 'ASN';
  };

  // Filtered by category for aggregated ratings
  const filteredAggregatedByCategory = (category: string) => {
    if (category === 'all') return filteredAggregatedRatings;
    return filteredAggregatedRatings.filter(item => getEmployeeCategory(item.employeeId) === category);
  };

  // Filtered by category for all ratings
  const filteredRatingsByCategory = (category: string) => {
    if (category === 'all') return filteredRatings;
    return filteredRatings.filter(rating => getEmployeeCategory(rating.rated_employee_id) === category);
  };
  const formatPeriod = (period: string) => {
    const [year, month] = period.split('-');
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    return `${months[parseInt(month) - 1]} ${year}`;
  };
  const handleOpenEvaluationForm = (item: AggregatedRating) => {
    setSelectedEmployeeForEval(item);
    setIsEvaluationFormOpen(true);
  };
  const handleEvaluationSuccess = () => {
    loadData();
  };
  const handleOpenFinalEvaluationForm = (item: AggregatedRating) => {
    setSelectedEmployeeForFinalEval(item);
    setIsFinalEvaluationFormOpen(true);
  };

  // Handle designation of winner
  const handleDesignateWinner = async (item: AggregatedRating, type: 'monthly' | 'yearly' = 'monthly') => {
    if (!user) return;
    try {
      const category = employees.find(e => e.id === item.employeeId)?.kriteria_asn === 'Non ASN' ? 'Non ASN' : 'ASN';
      const period = type === 'monthly' ? item.ratingPeriod : item.ratingPeriod.split('-')[0];
      const finalPoints = item.hasFinalEvaluation ? item.finalEvaluation?.final_total_points : item.hasUnitEvaluation ? item.unitEvaluation?.final_total_points : Math.round(item.totalPoints / item.ratingCount);

      // Check if winner already exists for this period and category
      const {
        data: existing
      } = await supabase.from("designated_winners").select("id").eq("winner_type", type).eq("employee_category", category).eq("period", period);
      if (existing && existing.length > 0) {
        // Update existing winner
        const {
          error
        } = await supabase.from("designated_winners").update({
          employee_id: item.employeeId,
          final_points: finalPoints,
          designated_by: user.id,
          designated_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }).eq("id", existing[0].id);
        if (error) throw error;
      } else {
        // Insert new winner
        const {
          error
        } = await supabase.from("designated_winners").insert({
          employee_id: item.employeeId,
          winner_type: type,
          employee_category: category,
          period,
          final_points: finalPoints,
          designated_by: user.id
        });
        if (error) throw error;
      }
      toast.success(`${item.employeeName} berhasil ditetapkan sebagai pemenang ${category}!`);
      loadDesignatedWinners();
    } catch (error: any) {
      console.error('Error designating winner:', error);
      toast.error("Gagal menetapkan pemenang: " + error.message);
    }
  };
  const loadDesignatedWinners = async () => {
    const {
      data
    } = await supabase.from("designated_winners").select("*");
    setDesignatedWinners(data as DesignatedWinner[] || []);
  };
  const removeDesignatedWinner = async (winnerId: string) => {
    try {
      const {
        error
      } = await supabase.from("designated_winners").delete().eq("id", winnerId);
      if (error) throw error;
      toast.success("Penetapan pemenang berhasil dibatalkan");
      loadDesignatedWinners();
    } catch (error: any) {
      console.error('Error removing winner:', error);
      toast.error("Gagal membatalkan penetapan: " + error.message);
    }
  };
  const isDesignatedWinner = (employeeId: string, period: string) => {
    return designatedWinners.find(w => w.employee_id === employeeId && w.period === period);
  };
  const isAdminUnit = user?.role === "admin_unit";
  const isAdminPusat = user?.role === "admin_pusat";
  return <DashboardLayout>
            <div className="space-y-6">
                {/* Enhanced Header with Gradient */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-yellow-600 via-yellow-500 to-yellow-400 p-6 md:p-8 text-white shadow-xl">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32 blur-3xl" />
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-16 -translate-x-16 blur-2xl" />
                    
                    <div className="relative flex items-start gap-4">
                        <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                            <Award className="h-8 w-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-white">
                                Penilaian Employee of The Year
                            </h1>
                            <p className="text-white/90 mt-1 text-sm md:text-base">
                                {isAdminUnit ? "Lihat dan berikan evaluasi lanjutan untuk pegawai terbaik di unit Anda" : isAdminPusat ? "Berikan penilaian final untuk menentukan Employee of The Year" : "Lihat semua penilaian dan leaderboard pegawai terbaik"}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Info Badge for Admin Unit */}
                {isAdminUnit && <Card className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
                        <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                                    <ClipboardCheck className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                                        Penilaian Lanjutan Pimpinan Unit
                                    </h3>
                                    <p className="text-sm text-blue-700 dark:text-blue-300">
                                        Sebagai pimpinan unit, Anda dapat memberikan evaluasi lanjutan berdasarkan kriteria: 
                                        <strong> Hukuman Disiplin (-15%), Presensi Kehadiran (-5%), E-Kinerja (-5%), dan Kontribusi (+10%)</strong>.
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>}

                {/* Info Badge for Admin Pusat */}
                {isAdminPusat && <Card className="bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800">
                        <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
                                    <Crown className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-semibold text-purple-900 dark:text-purple-100 mb-1">
                                        Penilaian Final Admin Pusat
                                    </h3>
                                    <p className="text-sm text-purple-700 dark:text-purple-300">
                                        Sebagai Admin Pusat, Anda dapat memberikan <strong>penilaian final</strong> dengan mengadjust semua kriteria 
                                        dan menambahkan penyesuaian khusus untuk menentukan pemenang Employee of The Year.
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>}
                {leaderboard.length > 0}

                {/* Main Tabs for Admin Pusat */}
                {isAdminPusat ? (
                    <Tabs value={activeMainTab} onValueChange={setActiveMainTab} className="w-full">
                        <TabsList className="grid w-full grid-cols-4 mb-4">
                            <TabsTrigger value="penilaian" className="gap-2">
                                <ClipboardCheck className="h-4 w-4" />
                                Penilaian
                            </TabsTrigger>
                            <TabsTrigger value="rekap" className="gap-2">
                                <FileText className="h-4 w-4" />
                                Rekap
                            </TabsTrigger>
                            <TabsTrigger value="pengaturan" className="gap-2">
                                <Calendar className="h-4 w-4" />
                                Pengaturan
                            </TabsTrigger>
                            <TabsTrigger value="analytics" className="gap-2">
                                <BarChart3 className="h-4 w-4" />
                                Analitik
                            </TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="rekap">
                            <WinnerRecapTab />
                        </TabsContent>
                        
                        <TabsContent value="pengaturan">
                            <EomSettingsTab />
                        </TabsContent>
                        
                        <TabsContent value="analytics">
                            <EomAnalyticsTab />
                        </TabsContent>
                        
                        <TabsContent value="penilaian" className="space-y-6">
                            {/* Filters */}
                            <Card>
                                <CardContent className="p-4">
                                    <div className="flex flex-col md:flex-row gap-4">
                                        <div className="flex-1">
                                            <div className="relative">
                                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                <Input placeholder="Cari pegawai..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
                                            </div>
                                        </div>
                                        <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                                            <SelectTrigger className="w-full md:w-[200px]">
                                                <SelectValue placeholder="Pilih Periode" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">Semua Periode</SelectItem>
                                                {getPeriods().map(period => <SelectItem key={period} value={period}>
                                                        {formatPeriod(period)}
                                                    </SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                        <Select value={evaluationFilter} onValueChange={setEvaluationFilter}>
                                            <SelectTrigger className="w-full md:w-[200px]">
                                                <SelectValue placeholder="Status Evaluasi" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">Semua Status</SelectItem>
                                                <SelectItem value="evaluated">Sudah Dievaluasi</SelectItem>
                                                <SelectItem value="not_evaluated">Belum Dievaluasi</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <Select value={workUnitFilter} onValueChange={setWorkUnitFilter}>
                                            <SelectTrigger className="w-full md:w-[200px]">
                                                <Building2 className="h-4 w-4 mr-2" />
                                                <SelectValue placeholder="Unit Kerja" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">Semua Unit Kerja</SelectItem>
                                                {WORK_UNITS.map(unit => <SelectItem key={unit.id} value={unit.id.toString()}>
                                                        {unit.name}
                                                    </SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Admin Pusat: Final Evaluation Table */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Crown className="h-5 w-5 text-purple-600" />
                                        Penilaian Final
                                    </CardTitle>
                                    <CardDescription>
                                        Berikan penilaian final untuk menentukan Employee of The Year
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="p-2 sm:p-6">
                                    <Tabs defaultValue="ASN" className="w-full">
                                        <TabsList className="grid w-full grid-cols-2 mb-4">
                                            <TabsTrigger value="ASN">ASN ({filteredAggregatedByCategory('ASN').length})</TabsTrigger>
                                            <TabsTrigger value="Non ASN">Non ASN ({filteredAggregatedByCategory('Non ASN').length})</TabsTrigger>
                                        </TabsList>
                                        
                                        {['ASN', 'Non ASN'].map(tabValue => {
                                            const dataToShow = filteredAggregatedByCategory(tabValue);
                                            const getFinalPointsForSort = (r: AggregatedRating) => {
                                                if (r.hasFinalEvaluation && r.finalEvaluation) return r.finalEvaluation.final_total_points;
                                                if (r.hasUnitEvaluation && r.unitEvaluation) return r.unitEvaluation.final_total_points;
                                                return r.totalPoints;
                                            };
                                            const sortedData = [...dataToShow].sort((a, b) => getFinalPointsForSort(b) - getFinalPointsForSort(a));
                                            
                                            return (
                                                <TabsContent key={tabValue} value={tabValue}>
                                                    <div className="overflow-x-auto">
                                                        <Table>
                                                            <TableHeader>
                                                                <TableRow>
                                                                    <TableHead className="pl-4 w-16 text-center">#</TableHead>
                                                                    <TableHead>Pegawai</TableHead>
                                                                    <TableHead className="hidden lg:table-cell">Unit Kerja</TableHead>
                                                                    <TableHead className="hidden md:table-cell">Periode</TableHead>
                                                                    <TableHead className="text-center">Poin Rekan</TableHead>
                                                                    <TableHead className="text-center hidden sm:table-cell">Poin Unit</TableHead>
                                                                    <TableHead className="text-center hidden sm:table-cell">Poin Final</TableHead>
                                                                    <TableHead className="text-center">Status</TableHead>
                                                                    <TableHead className="text-right pr-4">Aksi</TableHead>
                                                                </TableRow>
                                                            </TableHeader>
                                                            <TableBody>
                                                                {sortedData.length === 0 ? (
                                                                    <TableRow>
                                                                        <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                                                                            Belum ada penilaian
                                                                        </TableCell>
                                                                    </TableRow>
                                                                ) : sortedData.map((item, index) => {
                                                                    const rank = index + 1;
                                                                    const getRankStyle = (r: number) => {
                                                                        if (r === 1) return 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white';
                                                                        if (r === 2) return 'bg-gradient-to-r from-gray-300 to-gray-500 text-white';
                                                                        if (r === 3) return 'bg-gradient-to-r from-orange-400 to-orange-600 text-white';
                                                                        return 'bg-muted text-muted-foreground';
                                                                    };
                                                                    return (
                                                                        <TableRow key={`${item.employeeId}-${item.ratingPeriod}`}>
                                                                            <TableCell className="pl-4 text-center">
                                                                                <div className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${getRankStyle(rank)}`}>
                                                                                    {rank}
                                                                                </div>
                                                                            </TableCell>
                                                                            <TableCell>
                                                                                <div className="font-medium">{item.employeeName}</div>
                                                                                <div className="lg:hidden text-xs text-muted-foreground mt-1">
                                                                                    {item.employeeWorkUnit || 'Unit tidak diketahui'}
                                                                                </div>
                                                                                <div className="md:hidden text-xs text-muted-foreground">
                                                                                    {formatPeriod(item.ratingPeriod)}
                                                                                </div>
                                                                            </TableCell>
                                                                            <TableCell className="hidden lg:table-cell">
                                                                                <Badge variant="outline" className="text-xs">
                                                                                    <Building2 className="h-3 w-3 mr-1" />
                                                                                    {item.employeeWorkUnit || '-'}
                                                                                </Badge>
                                                                            </TableCell>
                                                                            <TableCell className="hidden md:table-cell">
                                                                                <Badge variant="outline">
                                                                                    <Calendar className="h-3 w-3 mr-1" />
                                                                                    {formatPeriod(item.ratingPeriod)}
                                                                                </Badge>
                                                                            </TableCell>
                                                                            <TableCell className="text-center">
                                                                                <div className="flex items-center justify-center gap-1">
                                                                                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                                                                    <span className="font-bold text-yellow-600">
                                                                                        {item.totalPoints}
                                                                                    </span>
                                                                                </div>
                                                                            </TableCell>
                                                                            <TableCell className="text-center hidden sm:table-cell">
                                                                                {item.hasUnitEvaluation && item.unitEvaluation ? (
                                                                                    <div className="flex items-center justify-center gap-1">
                                                                                        <Star className="h-4 w-4 fill-blue-500 text-blue-500" />
                                                                                        <span className="font-bold text-blue-600">
                                                                                            {item.unitEvaluation.final_total_points}
                                                                                        </span>
                                                                                    </div>
                                                                                ) : <span className="text-muted-foreground text-sm">-</span>}
                                                                            </TableCell>
                                                                            <TableCell className="text-center hidden sm:table-cell">
                                                                                {item.hasFinalEvaluation && item.finalEvaluation ? (
                                                                                    <div className="flex items-center justify-center gap-1">
                                                                                        <Crown className="h-4 w-4 text-purple-500" />
                                                                                        <span className={`font-bold ${item.finalEvaluation.final_total_points >= item.totalPoints ? 'text-purple-600' : 'text-orange-600'}`}>
                                                                                            {item.finalEvaluation.final_total_points}
                                                                                        </span>
                                                                                    </div>
                                                                                ) : <span className="text-muted-foreground text-sm">-</span>}
                                                                            </TableCell>
                                                                            <TableCell className="text-center">
                                                                                {item.hasFinalEvaluation ? (
                                                                                    <Badge variant="outline" className="border-purple-500 text-purple-600">
                                                                                        <CheckCircle2 className="h-3 w-3 mr-1" />
                                                                                        <span className="hidden sm:inline">Final</span>
                                                                                    </Badge>
                                                                                ) : item.hasUnitEvaluation ? (
                                                                                    <Badge variant="outline" className="border-blue-500 text-blue-600">
                                                                                        <Building2 className="h-3 w-3 mr-1" />
                                                                                        <span className="hidden sm:inline">Unit</span>
                                                                                    </Badge>
                                                                                ) : (
                                                                                    <Badge variant="outline" className="border-orange-500 text-orange-600">
                                                                                        <AlertCircle className="h-3 w-3 mr-1" />
                                                                                        <span className="hidden sm:inline">Belum</span>
                                                                                    </Badge>
                                                                                )}
                                                                            </TableCell>
                                                                            <TableCell className="text-right pr-4">
                                                                                <div className="flex items-center justify-end gap-2">
                                                                                    <Button variant={item.hasFinalEvaluation ? "outline" : "default"} size="sm" onClick={() => handleOpenFinalEvaluationForm(item)} className={`h-8 px-3 ${!item.hasFinalEvaluation ? 'bg-purple-600 hover:bg-purple-700' : ''}`}>
                                                                                        <Crown className="h-4 w-4 md:mr-2" />
                                                                                        <span className="hidden md:inline">
                                                                                            {item.hasFinalEvaluation ? "Edit Final" : "Nilai Final"}
                                                                                        </span>
                                                                                    </Button>
                                                                                    {(() => {
                                                                                        const monthlyWinner = isDesignatedWinner(item.employeeId, item.ratingPeriod);
                                                                                        const category = employees.find(e => e.id === item.employeeId)?.kriteria_asn === 'Non ASN' ? 'Non ASN' : 'ASN';
                                                                                        const period = item.ratingPeriod;
                                                                                        const year = period.split('-')[0];
                                                                                        const sameCategory = filteredAggregatedRatings.filter(r => {
                                                                                            const empCat = employees.find(e => e.id === r.employeeId)?.kriteria_asn === 'Non ASN' ? 'Non ASN' : 'ASN';
                                                                                            return r.ratingPeriod === period && empCat === category;
                                                                                        });
                                                                                        const getFinalPoints = (r: AggregatedRating) => {
                                                                                            if (r.hasFinalEvaluation && r.finalEvaluation) return r.finalEvaluation.final_total_points;
                                                                                            if (r.hasUnitEvaluation && r.unitEvaluation) return r.unitEvaluation.final_total_points;
                                                                                            return r.totalPoints;
                                                                                        };
                                                                                        const sortedByPoints = [...sameCategory].sort((a, b) => getFinalPoints(b) - getFinalPoints(a));
                                                                                        const isTopMonthly = sortedByPoints.length > 0 && sortedByPoints[0].employeeId === item.employeeId;
                                                                                        const yearlyWinner = designatedWinners.find(w => w.employee_id === item.employeeId && w.period === year && w.winner_type === 'yearly');
                                                                                        const sameYearCategory = filteredAggregatedRatings.filter(r => {
                                                                                            const empCat = employees.find(e => e.id === r.employeeId)?.kriteria_asn === 'Non ASN' ? 'Non ASN' : 'ASN';
                                                                                            return r.ratingPeriod.startsWith(year) && empCat === category;
                                                                                        });
                                                                                        const yearlyAggregate: Record<string, number> = {};
                                                                                        sameYearCategory.forEach(r => {
                                                                                            if (!yearlyAggregate[r.employeeId]) yearlyAggregate[r.employeeId] = 0;
                                                                                            yearlyAggregate[r.employeeId] += getFinalPoints(r);
                                                                                        });
                                                                                        const sortedYearly = Object.entries(yearlyAggregate).sort((a, b) => b[1] - a[1]);
                                                                                        const isTopYearly = sortedYearly.length > 0 && sortedYearly[0][0] === item.employeeId;
                                                                                        if (!isTopMonthly && !isTopYearly) return null;
                                                                                        return (
                                                                                            <div className="flex flex-col gap-1">
                                                                                                {isTopMonthly && (monthlyWinner ? (
                                                                                                    <Button variant="outline" size="sm" onClick={() => removeDesignatedWinner(monthlyWinner.id)} className="h-8 px-3 text-red-600 border-red-300 hover:bg-red-50">
                                                                                                        <X className="h-4 w-4 md:mr-2" />
                                                                                                        <span className="hidden md:inline">Batal Bulanan</span>
                                                                                                    </Button>
                                                                                                ) : (
                                                                                                    <Button size="sm" onClick={() => handleDesignateWinner(item, 'monthly')} className="h-8 px-3 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white">
                                                                                                        <Gavel className="h-4 w-4 md:mr-2" />
                                                                                                        <span className="hidden md:inline">Tetapkan Bulanan</span>
                                                                                                    </Button>
                                                                                                ))}
                                                                                                
                                                                                                {isTopYearly && (yearlyWinner ? (
                                                                                                    <Button variant="outline" size="sm" onClick={() => removeDesignatedWinner(yearlyWinner.id)} className="h-8 px-3 text-purple-600 border-purple-300 hover:bg-purple-50">
                                                                                                        <X className="h-4 w-4 md:mr-2" />
                                                                                                        <span className="hidden md:inline">Batal Tahunan</span>
                                                                                                    </Button>
                                                                                                ) : (
                                                                                                    <Button size="sm" onClick={() => handleDesignateWinner(item, 'yearly')} className="h-8 px-3 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white">
                                                                                                        <Trophy className="h-4 w-4 md:mr-2" />
                                                                                                        <span className="hidden md:inline">Tetapkan Tahunan</span>
                                                                                                    </Button>
                                                                                                ))}
                                                                                            </div>
                                                                                        );
                                                                                    })()}
                                                                                </div>
                                                                            </TableCell>
                                                                        </TableRow>
                                                                    );
                                                                })}
                                                            </TableBody>
                                                        </Table>
                                                    </div>
                                                </TabsContent>
                                            );
                                        })}
                                    </Tabs>
                                </CardContent>
                            </Card>

                            {/* All Ratings Table for Admin Pusat */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Semua Penilaian</CardTitle>
                                    <CardDescription>
                                        Daftar lengkap penilaian Employee of The Year
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="p-2 sm:p-6">
                                    <Tabs defaultValue="ASN" className="w-full">
                                        <TabsList className="grid w-full grid-cols-2 mb-4">
                                            <TabsTrigger value="ASN">ASN ({filteredRatingsByCategory('ASN').length})</TabsTrigger>
                                            <TabsTrigger value="Non ASN">Non ASN ({filteredRatingsByCategory('Non ASN').length})</TabsTrigger>
                                        </TabsList>
                                        
                                        {['ASN', 'Non ASN'].map(tabValue => {
                                            const ratingsToShow = filteredRatingsByCategory(tabValue);
                                            return (
                                                <TabsContent key={tabValue} value={tabValue}>
                                                    <div className="overflow-x-auto">
                                                        <Table>
                                                            <TableHeader>
                                                                <TableRow>
                                                                    <TableHead className="pl-4">Pegawai Dinilai</TableHead>
                                                                    <TableHead className="hidden md:table-cell">Penilai</TableHead>
                                                                    <TableHead className="hidden md:table-cell">Periode</TableHead>
                                                                    <TableHead className="text-center whitespace-nowrap">Total Poin</TableHead>
                                                                    <TableHead className="hidden lg:table-cell">Tanggal</TableHead>
                                                                    <TableHead className="text-right pr-4">Aksi</TableHead>
                                                                </TableRow>
                                                            </TableHeader>
                                                            <TableBody>
                                                                {ratingsToShow.length === 0 ? (
                                                                    <TableRow>
                                                                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                                                            Belum ada penilaian
                                                                        </TableCell>
                                                                    </TableRow>
                                                                ) : ratingsToShow.map(rating => (
                                                                    <TableRow key={rating.id}>
                                                                        <TableCell className="pl-4">
                                                                            <div className="font-medium">{rating.rated_employee_name}</div>
                                                                            <div className="md:hidden text-xs text-muted-foreground mt-1 space-y-0.5">
                                                                                <div className="flex items-center gap-1">
                                                                                    <User className="h-3 w-3" /> {rating.rater_name}
                                                                                </div>
                                                                                <div className="flex items-center gap-1">
                                                                                    <Calendar className="h-3 w-3" /> {formatPeriod(rating.rating_period)}
                                                                                </div>
                                                                            </div>
                                                                        </TableCell>
                                                                        <TableCell className="hidden md:table-cell">
                                                                            <div className="text-sm">{rating.rater_name}</div>
                                                                        </TableCell>
                                                                        <TableCell className="hidden md:table-cell">
                                                                            <Badge variant="outline">
                                                                                <Calendar className="h-3 w-3 mr-1" />
                                                                                {formatPeriod(rating.rating_period)}
                                                                            </Badge>
                                                                        </TableCell>
                                                                        <TableCell className="text-center">
                                                                            <div className="flex items-center justify-center gap-1">
                                                                                <Star className="h-3 w-3 sm:h-4 sm:w-4 fill-yellow-400 text-yellow-400" />
                                                                                <span className="font-bold text-yellow-600 text-sm sm:text-base">
                                                                                    {rating.total_points}/{rating.max_possible_points}
                                                                                </span>
                                                                            </div>
                                                                        </TableCell>
                                                                        <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                                                                            {new Date(rating.created_at).toLocaleDateString('id-ID')}
                                                                        </TableCell>
                                                                        <TableCell className="text-right pr-4">
                                                                            <Dialog>
                                                                                <DialogTrigger asChild>
                                                                                    <Button variant="ghost" size="sm" onClick={() => setSelectedRating(rating)} className="h-8 w-8 p-0 md:w-auto md:h-9 md:px-3 md:py-2">
                                                                                        <Eye className="h-4 w-4 md:mr-2" />
                                                                                        <span className="hidden md:inline">Detail</span>
                                                                                    </Button>
                                                                                </DialogTrigger>
                                                                                <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto p-4 md:p-6">
                                                                                    <DialogHeader>
                                                                                        <DialogTitle>Detail Penilaian</DialogTitle>
                                                                                    </DialogHeader>
                                                                                    {selectedRating && (
                                                                                        <div className="space-y-4">
                                                                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 bg-muted/30 p-4 rounded-lg">
                                                                                                <div>
                                                                                                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Pegawai Dinilai</p>
                                                                                                    <p className="font-semibold text-base">{selectedRating.rated_employee_name}</p>
                                                                                                </div>
                                                                                                <div>
                                                                                                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Penilai</p>
                                                                                                    <p className="font-semibold text-base">{selectedRating.rater_name}</p>
                                                                                                </div>
                                                                                                <div>
                                                                                                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Periode</p>
                                                                                                    <p className="font-semibold text-base">{formatPeriod(selectedRating.rating_period)}</p>
                                                                                                </div>
                                                                                                <div>
                                                                                                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Total Poin</p>
                                                                                                    <p className="font-semibold text-yellow-600 text-lg flex items-center gap-1">
                                                                                                        <Star className="h-4 w-4 fill-yellow-400" />
                                                                                                        {selectedRating.total_points}/{selectedRating.max_possible_points}
                                                                                                    </p>
                                                                                                </div>
                                                                                            </div>

                                                                                            <div>
                                                                                                <p className="text-sm font-medium mb-2">Alasan</p>
                                                                                                <p className="text-sm bg-muted/50 p-3 rounded-lg border italic text-muted-foreground">"{selectedRating.reason}"</p>
                                                                                            </div>

                                                                                            <div>
                                                                                                <p className="text-sm font-medium mb-2">Rincian Penilaian per Kriteria</p>
                                                                                                <div className="space-y-2">
                                                                                                    {Object.entries(selectedRating.criteria_totals || {}).map(([criteriaId, total]) => (
                                                                                                        <div key={criteriaId} className="flex justify-between items-center p-3 bg-card border rounded-lg shadow-sm">
                                                                                                            <span className="text-sm capitalize font-medium">{criteriaId.replace(/_/g, ' ')}</span>
                                                                                                            <Badge variant={total >= 20 ? "default" : total >= 15 ? "secondary" : "outline"}>
                                                                                                                {total}/25
                                                                                                            </Badge>
                                                                                                        </div>
                                                                                                    ))}
                                                                                                </div>
                                                                                            </div>
                                                                                        </div>
                                                                                    )}
                                                                                </DialogContent>
                                                                            </Dialog>
                                                                        </TableCell>
                                                                    </TableRow>
                                                                ))}
                                                            </TableBody>
                                                        </Table>
                                                    </div>
                                                </TabsContent>
                                            );
                                        })}
                                    </Tabs>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                ) : (
                    <>
                        {/* Filters for Admin Unit */}
                        <Card>
                            <CardContent className="p-4">
                                <div className="flex flex-col md:flex-row gap-4">
                                    <div className="flex-1">
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input placeholder="Cari pegawai..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
                                        </div>
                                    </div>
                                    <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                                        <SelectTrigger className="w-full md:w-[200px]">
                                            <SelectValue placeholder="Pilih Periode" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Semua Periode</SelectItem>
                                            {getPeriods().map(period => (
                                                <SelectItem key={period} value={period}>
                                                    {formatPeriod(period)}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Select value={evaluationFilter} onValueChange={setEvaluationFilter}>
                                        <SelectTrigger className="w-full md:w-[200px]">
                                            <SelectValue placeholder="Status Evaluasi" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Semua Status</SelectItem>
                                            <SelectItem value="evaluated">Sudah Dievaluasi</SelectItem>
                                            <SelectItem value="not_evaluated">Belum Dievaluasi</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Admin Unit: Aggregated Ratings for Evaluation */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <ClipboardCheck className="h-5 w-5" />
                                    Penilaian Unit Anda ({filteredAggregatedRatings.length})
                                </CardTitle>
                                <CardDescription>
                                    Berikan evaluasi lanjutan untuk setiap pegawai berdasarkan kriteria pimpinan unit
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-2 sm:p-6">
                                <Tabs defaultValue="ASN" className="w-full">
                                    <TabsList className="grid w-full grid-cols-2 mb-4">
                                        <TabsTrigger value="ASN">ASN ({filteredAggregatedByCategory('ASN').length})</TabsTrigger>
                                        <TabsTrigger value="Non ASN">Non ASN ({filteredAggregatedByCategory('Non ASN').length})</TabsTrigger>
                                    </TabsList>
                                    
                                    {['ASN', 'Non ASN'].map(tabValue => {
                                        const dataToShow = filteredAggregatedByCategory(tabValue);
                                        const getUnitFinalPoints = (r: AggregatedRating) => {
                                            if (r.hasUnitEvaluation && r.unitEvaluation) return r.unitEvaluation.final_total_points;
                                            return r.totalPoints;
                                        };
                                        const sortedData = [...dataToShow].sort((a, b) => getUnitFinalPoints(b) - getUnitFinalPoints(a));
                                        
                                        return (
                                            <TabsContent key={tabValue} value={tabValue}>
                                                <div className="overflow-x-auto">
                                                    <Table>
                                                        <TableHeader>
                                                            <TableRow>
                                                                <TableHead className="pl-4 w-16 text-center">#</TableHead>
                                                                <TableHead>Pegawai</TableHead>
                                                                <TableHead className="hidden md:table-cell">Periode</TableHead>
                                                                <TableHead className="text-center">Poin Awal</TableHead>
                                                                <TableHead className="text-center hidden sm:table-cell">Poin Akhir</TableHead>
                                                                <TableHead className="text-center">Status</TableHead>
                                                                <TableHead className="text-right pr-4">Aksi</TableHead>
                                                            </TableRow>
                                                        </TableHeader>
                                                        <TableBody>
                                                            {sortedData.length === 0 ? (
                                                                <TableRow>
                                                                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                                                        Belum ada penilaian
                                                                    </TableCell>
                                                                </TableRow>
                                                            ) : sortedData.map((item, index) => {
                                                                const rank = index + 1;
                                                                const getRankStyle = (r: number) => {
                                                                    if (r === 1) return 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white';
                                                                    if (r === 2) return 'bg-gradient-to-r from-gray-300 to-gray-500 text-white';
                                                                    if (r === 3) return 'bg-gradient-to-r from-orange-400 to-orange-600 text-white';
                                                                    return 'bg-muted text-muted-foreground';
                                                                };
                                                                return (
                                                                    <TableRow key={`${item.employeeId}-${item.ratingPeriod}`}>
                                                                        <TableCell className="pl-4 text-center">
                                                                            <div className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${getRankStyle(rank)}`}>
                                                                                {rank}
                                                                            </div>
                                                                        </TableCell>
                                                                        <TableCell>
                                                                            <div className="font-medium">{item.employeeName}</div>
                                                                            <div className="md:hidden text-xs text-muted-foreground mt-1">
                                                                                {formatPeriod(item.ratingPeriod)} • {item.ratingCount} penilaian
                                                                            </div>
                                                                        </TableCell>
                                                                        <TableCell className="hidden md:table-cell">
                                                                            <Badge variant="outline">
                                                                                <Calendar className="h-3 w-3 mr-1" />
                                                                                {formatPeriod(item.ratingPeriod)}
                                                                            </Badge>
                                                                        </TableCell>
                                                                        <TableCell className="text-center">
                                                                            <div className="flex items-center justify-center gap-1">
                                                                                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                                                                <span className="font-bold text-yellow-600">
                                                                                    {item.totalPoints}
                                                                                </span>
                                                                            </div>
                                                                        </TableCell>
                                                                        <TableCell className="text-center hidden sm:table-cell">
                                                                            {item.hasUnitEvaluation && item.unitEvaluation ? (
                                                                                <div className="flex items-center justify-center gap-1">
                                                                                    <Star className="h-4 w-4 fill-green-500 text-green-500" />
                                                                                    <span className={`font-bold ${item.unitEvaluation.final_total_points >= item.totalPoints ? 'text-green-600' : 'text-orange-600'}`}>
                                                                                        {item.unitEvaluation.final_total_points}
                                                                                    </span>
                                                                                </div>
                                                                            ) : <span className="text-muted-foreground text-sm">-</span>}
                                                                        </TableCell>
                                                                        <TableCell className="text-center">
                                                                            {item.hasUnitEvaluation ? (
                                                                                <Badge variant="outline" className="border-green-500 text-green-600">
                                                                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                                                                    <span className="hidden sm:inline">Sudah</span>
                                                                                </Badge>
                                                                            ) : (
                                                                                <Badge variant="outline" className="border-orange-500 text-orange-600">
                                                                                    <AlertCircle className="h-3 w-3 mr-1" />
                                                                                    <span className="hidden sm:inline">Belum</span>
                                                                                </Badge>
                                                                            )}
                                                                        </TableCell>
                                                                        <TableCell className="text-right pr-4">
                                                                            <Button variant={item.hasUnitEvaluation ? "outline" : "default"} size="sm" onClick={() => handleOpenEvaluationForm(item)} className="h-8 px-3">
                                                                                <ClipboardCheck className="h-4 w-4 md:mr-2" />
                                                                                <span className="hidden md:inline">
                                                                                    {item.hasUnitEvaluation ? "Edit Evaluasi" : "Evaluasi"}
                                                                                </span>
                                                                            </Button>
                                                                        </TableCell>
                                                                    </TableRow>
                                                                );
                                                            })}
                                                        </TableBody>
                                                    </Table>
                                                </div>
                                            </TabsContent>
                                        );
                                    })}
                                </Tabs>
                            </CardContent>
                        </Card>

                        {/* All Ratings Table for Admin Unit */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Detail Penilaian Rekan Kerja</CardTitle>
                                <CardDescription>
                                    Daftar lengkap penilaian dari rekan kerja untuk pegawai di unit Anda
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-2 sm:p-6">
                                <Tabs defaultValue="ASN" className="w-full">
                                    <TabsList className="grid w-full grid-cols-2 mb-4">
                                        <TabsTrigger value="ASN">ASN ({filteredRatingsByCategory('ASN').length})</TabsTrigger>
                                        <TabsTrigger value="Non ASN">Non ASN ({filteredRatingsByCategory('Non ASN').length})</TabsTrigger>
                                    </TabsList>
                                    
                                    {['ASN', 'Non ASN'].map(tabValue => {
                                        const ratingsToShow = filteredRatingsByCategory(tabValue);
                                        return (
                                            <TabsContent key={tabValue} value={tabValue}>
                                                <div className="overflow-x-auto">
                                                    <Table>
                                                        <TableHeader>
                                                            <TableRow>
                                                                <TableHead className="pl-4">Pegawai Dinilai</TableHead>
                                                                <TableHead className="hidden md:table-cell">Penilai</TableHead>
                                                                <TableHead className="hidden md:table-cell">Periode</TableHead>
                                                                <TableHead className="text-center whitespace-nowrap">Total Poin</TableHead>
                                                                <TableHead className="hidden lg:table-cell">Tanggal</TableHead>
                                                                <TableHead className="text-right pr-4">Aksi</TableHead>
                                                            </TableRow>
                                                        </TableHeader>
                                                        <TableBody>
                                                            {ratingsToShow.length === 0 ? (
                                                                <TableRow>
                                                                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                                                        Belum ada penilaian
                                                                    </TableCell>
                                                                </TableRow>
                                                            ) : ratingsToShow.map(rating => (
                                                                <TableRow key={rating.id}>
                                                                    <TableCell className="pl-4">
                                                                        <div className="font-medium">{rating.rated_employee_name}</div>
                                                                        <div className="md:hidden text-xs text-muted-foreground mt-1 space-y-0.5">
                                                                            <div className="flex items-center gap-1">
                                                                                <User className="h-3 w-3" /> {rating.rater_name}
                                                                            </div>
                                                                            <div className="flex items-center gap-1">
                                                                                <Calendar className="h-3 w-3" /> {formatPeriod(rating.rating_period)}
                                                                            </div>
                                                                        </div>
                                                                    </TableCell>
                                                                    <TableCell className="hidden md:table-cell">
                                                                        <div className="text-sm">{rating.rater_name}</div>
                                                                    </TableCell>
                                                                    <TableCell className="hidden md:table-cell">
                                                                        <Badge variant="outline">
                                                                            <Calendar className="h-3 w-3 mr-1" />
                                                                            {formatPeriod(rating.rating_period)}
                                                                        </Badge>
                                                                    </TableCell>
                                                                    <TableCell className="text-center">
                                                                        <div className="flex items-center justify-center gap-1">
                                                                            <Star className="h-3 w-3 sm:h-4 sm:w-4 fill-yellow-400 text-yellow-400" />
                                                                            <span className="font-bold text-yellow-600 text-sm sm:text-base">
                                                                                {rating.total_points}/{rating.max_possible_points}
                                                                            </span>
                                                                        </div>
                                                                    </TableCell>
                                                                    <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                                                                        {new Date(rating.created_at).toLocaleDateString('id-ID')}
                                                                    </TableCell>
                                                                    <TableCell className="text-right pr-4">
                                                                        <Dialog>
                                                                            <DialogTrigger asChild>
                                                                                <Button variant="ghost" size="sm" onClick={() => setSelectedRating(rating)} className="h-8 w-8 p-0 md:w-auto md:h-9 md:px-3 md:py-2">
                                                                                    <Eye className="h-4 w-4 md:mr-2" />
                                                                                    <span className="hidden md:inline">Detail</span>
                                                                                </Button>
                                                                            </DialogTrigger>
                                                                            <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto p-4 md:p-6">
                                                                                <DialogHeader>
                                                                                    <DialogTitle>Detail Penilaian</DialogTitle>
                                                                                </DialogHeader>
                                                                                {selectedRating && (
                                                                                    <div className="space-y-4">
                                                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 bg-muted/30 p-4 rounded-lg">
                                                                                            <div>
                                                                                                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Pegawai Dinilai</p>
                                                                                                <p className="font-semibold text-base">{selectedRating.rated_employee_name}</p>
                                                                                            </div>
                                                                                            <div>
                                                                                                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Penilai</p>
                                                                                                <p className="font-semibold text-base">{selectedRating.rater_name}</p>
                                                                                            </div>
                                                                                            <div>
                                                                                                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Periode</p>
                                                                                                <p className="font-semibold text-base">{formatPeriod(selectedRating.rating_period)}</p>
                                                                                            </div>
                                                                                            <div>
                                                                                                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Total Poin</p>
                                                                                                <p className="font-semibold text-yellow-600 text-lg flex items-center gap-1">
                                                                                                    <Star className="h-4 w-4 fill-yellow-400" />
                                                                                                    {selectedRating.total_points}/{selectedRating.max_possible_points}
                                                                                                </p>
                                                                                            </div>
                                                                                        </div>

                                                                                        <div>
                                                                                            <p className="text-sm font-medium mb-2">Alasan</p>
                                                                                            <p className="text-sm bg-muted/50 p-3 rounded-lg border italic text-muted-foreground">"{selectedRating.reason}"</p>
                                                                                        </div>

                                                                                        <div>
                                                                                            <p className="text-sm font-medium mb-2">Rincian Penilaian per Kriteria</p>
                                                                                            <div className="space-y-2">
                                                                                                {Object.entries(selectedRating.criteria_totals || {}).map(([criteriaId, total]) => (
                                                                                                    <div key={criteriaId} className="flex justify-between items-center p-3 bg-card border rounded-lg shadow-sm">
                                                                                                        <span className="text-sm capitalize font-medium">{criteriaId.replace(/_/g, ' ')}</span>
                                                                                                        <Badge variant={total >= 20 ? "default" : total >= 15 ? "secondary" : "outline"}>
                                                                                                            {total}/25
                                                                                                        </Badge>
                                                                                                    </div>
                                                                                                ))}
                                                                                            </div>
                                                                                        </div>
                                                                                    </div>
                                                                                )}
                                                                            </DialogContent>
                                                                        </Dialog>
                                                                    </TableCell>
                                                                </TableRow>
                                                            ))}
                                                        </TableBody>
                                                    </Table>
                                                </div>
                                            </TabsContent>
                                        );
                                    })}
                                </Tabs>
                            </CardContent>
                        </Card>
                    </>
                )}
            </div>

            {/* Evaluation Form Dialog */}
            {selectedEmployeeForEval && user && <AdminUnitEvaluationForm 
              isOpen={isEvaluationFormOpen} 
              onClose={() => {
                setIsEvaluationFormOpen(false);
                setSelectedEmployeeForEval(null);
              }} 
              employeeId={selectedEmployeeForEval.employeeId} 
              employeeName={selectedEmployeeForEval.employeeName} 
              ratingPeriod={selectedEmployeeForEval.ratingPeriod} 
              originalTotalPoints={selectedEmployeeForEval.totalPoints} 
              workUnitId={user.work_unit_id!} 
              evaluatorId={user.id} 
              existingEvaluation={selectedEmployeeForEval.unitEvaluation} 
              onSuccess={handleEvaluationSuccess}
              verificationStatus={selectedEmployeeForEval.finalEvaluation ? {
                disciplinary_verified: selectedEmployeeForEval.finalEvaluation.disciplinary_verified,
                attendance_verified: selectedEmployeeForEval.finalEvaluation.attendance_verified,
                performance_verified: selectedEmployeeForEval.finalEvaluation.performance_verified,
                contribution_verified: selectedEmployeeForEval.finalEvaluation.contribution_verified,
              } : undefined}
            />}

            {selectedEmployeeForFinalEval && user && <AdminPusatEvaluationForm isOpen={isFinalEvaluationFormOpen} onClose={() => {
      setIsFinalEvaluationFormOpen(false);
      setSelectedEmployeeForFinalEval(null);
    }} employeeId={selectedEmployeeForFinalEval.employeeId} employeeName={selectedEmployeeForFinalEval.employeeName} employeeWorkUnit={selectedEmployeeForFinalEval.employeeWorkUnit} ratingPeriod={selectedEmployeeForFinalEval.ratingPeriod} peerTotalPoints={selectedEmployeeForFinalEval.totalPoints} adminUnitEvaluation={selectedEmployeeForFinalEval.unitEvaluation} evaluatorId={user.id} existingEvaluation={selectedEmployeeForFinalEval.finalEvaluation} onSuccess={handleEvaluationSuccess} />}
        </DashboardLayout>;
}