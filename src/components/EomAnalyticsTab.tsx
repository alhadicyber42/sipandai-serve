import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { BarChart3, Users, CheckCircle2, XCircle, Building2, TrendingUp, Loader2, Download, Search, Crown, AlertCircle } from "lucide-react";
import { usePagination } from "@/hooks/usePagination";
import { TablePagination } from "@/components/TablePagination";
import { exportMultipleSheets } from "@/lib/export-helper";
import { useDebounce } from "@/hooks/useDebounce";

interface UnitAnalytics {
  unitId: number;
  unitName: string;
  totalEmployees: number;
  employeesRated: number;
  employeesNotRated: number;
  ratedPercentage: number;
  ratedEmployees: EmployeeRatingStatus[];
  notRatedEmployees: EmployeeRatingStatus[];
}

interface EmployeeRatingStatus {
  id: string;
  name: string;
  nip: string;
  avatar_url: string | null;
  kriteria_asn: string | null;
  hasRated: boolean;
  ratedASN: boolean;
  ratedNonASN: boolean;
}

interface WorkUnit {
  id: number;
  name: string;
  code: string;
}

interface EomPeriodSetting {
  id: string;
  period: string;
  rating_start_date: string;
  rating_end_date: string;
}

interface PimpinanRatingStatus {
  id: string;
  name: string;
  nip: string;
  avatar_url: string | null;
  work_unit_name: string;
  hasRated: boolean;
  ratedASN: boolean;
  ratedNonASN: boolean;
}

export function EomAnalyticsTab() {
  const [loading, setLoading] = useState(true);
  const [participatingUnits, setParticipatingUnits] = useState<WorkUnit[]>([]);
  const [allProfiles, setAllProfiles] = useState<any[]>([]);
  const [allRatings, setAllRatings] = useState<any[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<string>("");
  const [periodSettings, setPeriodSettings] = useState<EomPeriodSetting[]>([]);
  const [pimpinanProfiles, setPimpinanProfiles] = useState<any[]>([]);
  
  // Search states
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 300);
  const [activeAnalyticsTab, setActiveAnalyticsTab] = useState<string>("units");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load period settings from eom_settings
      const { data: settingsData, error: settingsError } = await supabase
        .from("eom_settings")
        .select("id, period, rating_start_date, rating_end_date")
        .order("period", { ascending: false });

      if (settingsError) throw settingsError;
      setPeriodSettings(settingsData || []);

      // Set the first period as default if available
      if (settingsData && settingsData.length > 0) {
        setSelectedPeriod(settingsData[0].period);
      }

      // Load participating units
      const { data: participatingUnitsData, error: puError } = await supabase
        .from("eom_participating_units")
        .select("work_unit_id, is_active, work_units(id, name, code)")
        .eq("is_active", true);

      if (puError) throw puError;

      const activeUnits: WorkUnit[] = (participatingUnitsData || [])
        .map((pu: any) => pu.work_units)
        .filter((u: any) => u !== null);

      setParticipatingUnits(activeUnits);

      // Load all user_unit profiles
      const { data: profiles, error: profError } = await supabase
        .from("profiles")
        .select("id, name, nip, avatar_url, kriteria_asn, work_unit_id")
        .eq("role", "user_unit");

      if (profError) throw profError;
      setAllProfiles(profiles || []);

      // Load all ratings
      const { data: ratings, error: ratError } = await supabase
        .from("employee_ratings")
        .select("rater_id, rated_employee_id, rating_period, is_pimpinan_rating");

      if (ratError) throw ratError;
      setAllRatings(ratings || []);

      // Load pimpinan profiles with work unit info
      const { data: pimpinanData, error: pimpinanError } = await supabase
        .from("profiles")
        .select("id, name, nip, avatar_url, work_unit_id")
        .eq("role", "user_pimpinan");

      if (pimpinanError) throw pimpinanError;
      setPimpinanProfiles(pimpinanData || []);

    } catch (error: any) {
      console.error("Error loading analytics data:", error);
      toast.error("Gagal memuat data analytics");
    } finally {
      setLoading(false);
    }
  };

  // Format period for display
  const formatPeriodLabel = (period: string) => {
    const [year, month] = period.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    return date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
  };

  // Calculate analytics per unit
  const unitAnalytics: UnitAnalytics[] = useMemo(() => {
    if (!selectedPeriod) return [];

    // Get ratings for the selected period
    const periodRatings = allRatings.filter(r => r.rating_period === selectedPeriod);
    
    // Create map of rater_id -> rated_employee_ids
    const raterMap: Record<string, { asnRated: boolean; nonAsnRated: boolean }> = {};
    
    periodRatings.forEach(rating => {
      if (!raterMap[rating.rater_id]) {
        raterMap[rating.rater_id] = { asnRated: false, nonAsnRated: false };
      }
      
      // Find the rated employee to check their category
      const ratedEmployee = allProfiles.find(p => p.id === rating.rated_employee_id);
      if (ratedEmployee) {
        if (ratedEmployee.kriteria_asn === "Non ASN") {
          raterMap[rating.rater_id].nonAsnRated = true;
        } else {
          raterMap[rating.rater_id].asnRated = true;
        }
      }
    });

    return participatingUnits.map(unit => {
      // Get employees in this unit
      const unitEmployees = allProfiles.filter(p => p.work_unit_id === unit.id);
      
      const employeeStatuses: EmployeeRatingStatus[] = unitEmployees.map(emp => {
        const raterStatus = raterMap[emp.id] || { asnRated: false, nonAsnRated: false };
        const hasRated = raterStatus.asnRated || raterStatus.nonAsnRated;
        
        return {
          id: emp.id,
          name: emp.name,
          nip: emp.nip,
          avatar_url: emp.avatar_url,
          kriteria_asn: emp.kriteria_asn,
          hasRated,
          ratedASN: raterStatus.asnRated,
          ratedNonASN: raterStatus.nonAsnRated,
        };
      });

      const ratedEmployees = employeeStatuses.filter(e => e.hasRated);
      const notRatedEmployees = employeeStatuses.filter(e => !e.hasRated);
      const ratedPercentage = unitEmployees.length > 0 
        ? (ratedEmployees.length / unitEmployees.length) * 100 
        : 0;

      return {
        unitId: unit.id,
        unitName: unit.name,
        totalEmployees: unitEmployees.length,
        employeesRated: ratedEmployees.length,
        employeesNotRated: notRatedEmployees.length,
        ratedPercentage,
        ratedEmployees,
        notRatedEmployees,
      };
    }).sort((a, b) => b.ratedPercentage - a.ratedPercentage);
  }, [participatingUnits, allProfiles, allRatings, selectedPeriod]);

  // Summary statistics
  const summaryStats = useMemo(() => {
    const totalEmployees = unitAnalytics.reduce((sum, u) => sum + u.totalEmployees, 0);
    const totalRated = unitAnalytics.reduce((sum, u) => sum + u.employeesRated, 0);
    const totalNotRated = totalEmployees - totalRated;
    const overallPercentage = totalEmployees > 0 ? (totalRated / totalEmployees) * 100 : 0;
    
    return {
      totalUnits: unitAnalytics.length,
      totalEmployees,
      totalRated,
      totalNotRated,
      overallPercentage,
    };
  }, [unitAnalytics]);

  // Search filtered employees across all units
  const searchResults = useMemo(() => {
    if (!debouncedSearch.trim()) return [];
    
    const searchLower = debouncedSearch.toLowerCase();
    const allEmployeeStatuses: (EmployeeRatingStatus & { unitName: string })[] = [];
    
    unitAnalytics.forEach(unit => {
      [...unit.ratedEmployees, ...unit.notRatedEmployees].forEach(emp => {
        if (emp.name.toLowerCase().includes(searchLower) || emp.nip.includes(searchLower)) {
          allEmployeeStatuses.push({ ...emp, unitName: unit.unitName });
        }
      });
    });
    
    return allEmployeeStatuses;
  }, [debouncedSearch, unitAnalytics]);

  // Pimpinan rating status
  const pimpinanRatingStatus: PimpinanRatingStatus[] = useMemo(() => {
    if (!selectedPeriod) return [];
    
    // Get pimpinan ratings for the selected period
    const periodRatings = allRatings.filter(r => r.rating_period === selectedPeriod && r.is_pimpinan_rating);
    
    // Create map of pimpinan -> rated categories
    const pimpinanRaterMap: Record<string, { asnRated: boolean; nonAsnRated: boolean }> = {};
    
    periodRatings.forEach(rating => {
      if (!pimpinanRaterMap[rating.rater_id]) {
        pimpinanRaterMap[rating.rater_id] = { asnRated: false, nonAsnRated: false };
      }
      
      // Find the rated employee to check their category
      const ratedEmployee = allProfiles.find(p => p.id === rating.rated_employee_id);
      if (ratedEmployee) {
        if (ratedEmployee.kriteria_asn === "Non ASN") {
          pimpinanRaterMap[rating.rater_id].nonAsnRated = true;
        } else {
          pimpinanRaterMap[rating.rater_id].asnRated = true;
        }
      }
    });

    return pimpinanProfiles.map(pimpinan => {
      const raterStatus = pimpinanRaterMap[pimpinan.id] || { asnRated: false, nonAsnRated: false };
      const hasRated = raterStatus.asnRated || raterStatus.nonAsnRated;
      const unit = participatingUnits.find(u => u.id === pimpinan.work_unit_id);
      
      return {
        id: pimpinan.id,
        name: pimpinan.name,
        nip: pimpinan.nip,
        avatar_url: pimpinan.avatar_url,
        work_unit_name: unit?.name || "Unit tidak diketahui",
        hasRated,
        ratedASN: raterStatus.asnRated,
        ratedNonASN: raterStatus.nonAsnRated,
      };
    }).sort((a, b) => {
      // Sort: not rated first, then by name
      if (a.hasRated && !b.hasRated) return 1;
      if (!a.hasRated && b.hasRated) return -1;
      return a.name.localeCompare(b.name);
    });
  }, [selectedPeriod, allRatings, pimpinanProfiles, allProfiles, participatingUnits]);

  // Pimpinan summary stats
  const pimpinanSummary = useMemo(() => {
    const total = pimpinanRatingStatus.length;
    const rated = pimpinanRatingStatus.filter(p => p.hasRated).length;
    const ratedComplete = pimpinanRatingStatus.filter(p => p.ratedASN && p.ratedNonASN).length;
    const notRated = pimpinanRatingStatus.filter(p => !p.hasRated).length;
    
    return { total, rated, ratedComplete, notRated };
  }, [pimpinanRatingStatus]);

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // Paginated Employee Table Component
  const PaginatedEmployeeTable = ({ 
    employees, 
    type, 
    getInitials 
  }: { 
    employees: EmployeeRatingStatus[]; 
    type: 'rated' | 'not_rated';
    getInitials: (name: string) => string;
  }) => {
    const pagination = usePagination(employees, { initialPageSize: 10 });

    return (
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Pegawai</TableHead>
              <TableHead className="hidden sm:table-cell">NIP</TableHead>
              <TableHead className="hidden md:table-cell">Kategori</TableHead>
              <TableHead>{type === 'rated' ? 'Status' : 'Status'}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pagination.paginatedData.map((emp) => (
              <TableRow key={emp.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-7 w-7 sm:h-8 sm:w-8 flex-shrink-0">
                      <AvatarImage src={emp.avatar_url || undefined} />
                      <AvatarFallback className="text-xs">
                        {getInitials(emp.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <span className="font-medium text-sm block truncate max-w-[120px] sm:max-w-none">{emp.name}</span>
                      <span className="text-xs text-muted-foreground sm:hidden block">{emp.nip}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground hidden sm:table-cell">{emp.nip}</TableCell>
                <TableCell className="hidden md:table-cell">
                  <Badge variant="outline" className={`text-xs ${
                    emp.kriteria_asn === "Non ASN" 
                      ? "bg-success/10 text-success border-success/20"
                      : "bg-primary/10 text-primary border-primary/20"
                  }`}>
                    {emp.kriteria_asn || "ASN"}
                  </Badge>
                </TableCell>
                <TableCell>
                  {type === 'rated' ? (
                    <div className="flex flex-wrap gap-1">
                      {emp.ratedASN && (
                        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[10px] sm:text-xs px-1.5 sm:px-2">
                          ✓ ASN
                        </Badge>
                      )}
                      {emp.ratedNonASN && (
                        <Badge variant="outline" className="bg-success/10 text-success border-success/20 text-[10px] sm:text-xs px-1.5 sm:px-2">
                          ✓ Non
                        </Badge>
                      )}
                    </div>
                  ) : (
                    <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20 text-[10px] sm:text-xs px-1.5 sm:px-2">
                      <XCircle className="h-3 w-3 mr-0.5 sm:mr-1" />
                      <span className="hidden sm:inline">Belum Menilai</span>
                      <span className="sm:hidden">Belum</span>
                    </Badge>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {employees.length > 10 && (
          <TablePagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            totalItems={pagination.totalItems}
            startIndex={pagination.startIndex}
            endIndex={pagination.endIndex}
            pageSize={pagination.pageSize}
            onPageChange={pagination.setCurrentPage}
            onPageSizeChange={pagination.setPageSize}
            pageSizeOptions={[5, 10, 20]}
            showPageSizeSelector={true}
          />
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Memuat data analytics...</span>
        </CardContent>
      </Card>
    );
  }

  // Get rating status description
  const getRatingStatusDescription = (emp: EmployeeRatingStatus) => {
    if (!emp.hasRated) return "Belum menilai";
    if (emp.ratedASN && emp.ratedNonASN) return "Sudah menilai ASN & Non ASN";
    if (emp.ratedASN) return "Sudah menilai ASN, Belum menilai Non ASN";
    if (emp.ratedNonASN) return "Sudah menilai Non ASN, Belum menilai ASN";
    return "Status tidak diketahui";
  };

  // Export analytics data to Excel
  const handleExportAnalytics = () => {
    if (unitAnalytics.length === 0) {
      toast.error("Tidak ada data untuk diekspor");
      return;
    }

    // Prepare summary sheet data
    const summaryData = unitAnalytics.map(unit => ({
      "Unit Kerja": unit.unitName,
      "Total Pegawai": unit.totalEmployees,
      "Sudah Menilai": unit.employeesRated,
      "Belum Menilai": unit.employeesNotRated,
      "Persentase Partisipasi": `${unit.ratedPercentage.toFixed(1)}%`,
    }));

    // Prepare detailed data per unit - all employees
    const detailedData = unitAnalytics.flatMap(unit => 
      [...unit.ratedEmployees, ...unit.notRatedEmployees].map(emp => ({
        "Unit Kerja": unit.unitName,
        "Nama Pegawai": emp.name,
        "NIP": emp.nip,
        "Kategori ASN": emp.kriteria_asn || "ASN",
        "Status": emp.hasRated ? "Sudah Menilai" : "Belum Menilai",
        "Menilai ASN": emp.ratedASN ? "Ya" : "Tidak",
        "Menilai Non ASN": emp.ratedNonASN ? "Ya" : "Tidak",
        "Keterangan": getRatingStatusDescription(emp),
      }))
    );

    // Prepare "Belum Menilai" sheet
    const notRatedData = unitAnalytics.flatMap(unit => 
      unit.notRatedEmployees.map(emp => ({
        "Unit Kerja": unit.unitName,
        "Nama Pegawai": emp.name,
        "NIP": emp.nip,
        "Kategori ASN": emp.kriteria_asn || "ASN",
        "Keterangan": "Belum melakukan penilaian sama sekali",
      }))
    );

    // Prepare "Sudah Menilai" sheet with detailed status
    const ratedData = unitAnalytics.flatMap(unit => 
      unit.ratedEmployees.map(emp => ({
        "Unit Kerja": unit.unitName,
        "Nama Pegawai": emp.name,
        "NIP": emp.nip,
        "Kategori ASN": emp.kriteria_asn || "ASN",
        "Menilai ASN": emp.ratedASN ? "Ya" : "Tidak",
        "Menilai Non ASN": emp.ratedNonASN ? "Ya" : "Tidak",
        "Keterangan": getRatingStatusDescription(emp),
      }))
    );

    // Export to multiple sheets
    exportMultipleSheets([
      { data: summaryData, sheetName: "Ringkasan Per Unit" },
      { data: detailedData, sheetName: "Detail Semua Pegawai" },
      { data: ratedData, sheetName: "Sudah Menilai" },
      { data: notRatedData, sheetName: "Belum Menilai" },
    ], `Analytics_EOM_${formatPeriodLabel(selectedPeriod).replace(' ', '_')}`);
  };

  return (
    <div className="space-y-6">
      {/* Header with Period Selector */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Analytics Partisipasi Penilaian
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Statistik partisipasi penilaian per unit kerja
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-[200px] sm:w-[250px]">
              <SelectValue placeholder="Pilih Periode Penilaian" />
            </SelectTrigger>
            <SelectContent>
              {periodSettings.length === 0 ? (
                <div className="px-3 py-2 text-sm text-muted-foreground">
                  Belum ada periode penilaian
                </div>
              ) : (
                periodSettings.map(setting => (
                  <SelectItem key={setting.id} value={setting.period}>
                    {formatPeriodLabel(setting.period)}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportAnalytics}
            disabled={unitAnalytics.length === 0}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Export Excel</span>
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-primary/10">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Unit Peserta</p>
                <p className="text-2xl font-bold text-primary">{summaryStats.totalUnits}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-secondary/30 to-secondary/50 border-secondary">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-secondary">
                <Users className="h-5 w-5 text-secondary-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Pegawai</p>
                <p className="text-2xl font-bold text-secondary-foreground">{summaryStats.totalEmployees}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-success/5 to-success/10 border-success/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-success/10">
                <CheckCircle2 className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Sudah Menilai</p>
                <p className="text-2xl font-bold text-success">{summaryStats.totalRated}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-warning/5 to-warning/10 border-warning/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-warning/10">
                <XCircle className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Belum Menilai</p>
                <p className="text-2xl font-bold text-warning">{summaryStats.totalNotRated}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Overall Progress */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Tingkat Partisipasi Keseluruhan</span>
            <span className="text-sm font-bold text-primary">
              {summaryStats.overallPercentage.toFixed(1)}%
            </span>
          </div>
          <Progress value={summaryStats.overallPercentage} className="h-3" />
        </CardContent>
      </Card>

      {/* Employee Search Section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Cari Pegawai
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Ketik nama atau NIP pegawai untuk melihat status penilaian mereka
          </p>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari nama atau NIP pegawai..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Search Results */}
          {debouncedSearch.trim() && (
            <div className="mt-4">
              {searchResults.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Tidak ditemukan pegawai dengan nama/NIP "{debouncedSearch}"</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground mb-3">
                    Ditemukan {searchResults.length} pegawai
                  </p>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Pegawai</TableHead>
                          <TableHead className="hidden sm:table-cell">NIP</TableHead>
                          <TableHead className="hidden md:table-cell">Unit Kerja</TableHead>
                          <TableHead>Status Penilaian</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {searchResults.slice(0, 20).map((emp) => (
                          <TableRow key={emp.id}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Avatar className="h-7 w-7 flex-shrink-0">
                                  <AvatarImage src={emp.avatar_url || undefined} />
                                  <AvatarFallback className="text-xs">
                                    {getInitials(emp.name)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="min-w-0">
                                  <span className="font-medium text-sm block truncate max-w-[120px] sm:max-w-none">{emp.name}</span>
                                  <span className="text-xs text-muted-foreground sm:hidden block">{emp.nip}</span>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-muted-foreground hidden sm:table-cell">{emp.nip}</TableCell>
                            <TableCell className="hidden md:table-cell">
                              <span className="text-sm">{emp.unitName}</span>
                            </TableCell>
                            <TableCell>
                              {emp.hasRated ? (
                                <div className="flex flex-wrap gap-1">
                                  {emp.ratedASN && (
                                    <Badge variant="outline" className="bg-success/10 text-success border-success/20 text-[10px] sm:text-xs px-1.5 sm:px-2">
                                      ✓ ASN
                                    </Badge>
                                  )}
                                  {emp.ratedNonASN && (
                                    <Badge variant="outline" className="bg-success/10 text-success border-success/20 text-[10px] sm:text-xs px-1.5 sm:px-2">
                                      ✓ Non ASN
                                    </Badge>
                                  )}
                                </div>
                              ) : (
                                <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20 text-[10px] sm:text-xs px-1.5 sm:px-2">
                                  <XCircle className="h-3 w-3 mr-0.5" />
                                  Belum Menilai
                                </Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    {searchResults.length > 20 && (
                      <p className="text-xs text-muted-foreground text-center mt-2">
                        Menampilkan 20 dari {searchResults.length} hasil. Ketik lebih spesifik untuk mempersempit pencarian.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Main Tabs: Units & Pimpinan */}
      <Tabs value={activeAnalyticsTab} onValueChange={setActiveAnalyticsTab}>
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="units" className="gap-2">
            <Building2 className="h-4 w-4" />
            <span className="hidden sm:inline">Detail per Unit</span>
            <span className="sm:hidden">Unit</span>
          </TabsTrigger>
          <TabsTrigger value="pimpinan" className="gap-2">
            <Crown className="h-4 w-4" />
            <span className="hidden sm:inline">Status Pimpinan</span>
            <span className="sm:hidden">Pimpinan</span>
          </TabsTrigger>
        </TabsList>

        {/* Unit Details Tab */}
        <TabsContent value="units">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Detail per Unit Kerja
              </CardTitle>
            </CardHeader>
            <CardContent>
              {unitAnalytics.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Building2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Tidak ada unit peserta yang aktif</p>
                </div>
              ) : (
                <Accordion type="multiple" className="w-full">
                  {unitAnalytics.map((unit) => (
                    <AccordionItem key={unit.unitId} value={String(unit.unitId)}>
                      <AccordionTrigger className="hover:no-underline py-3 sm:py-4">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full pr-2 sm:pr-4 gap-2 sm:gap-4">
                          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                            <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <span className="font-medium text-sm sm:text-base truncate">{unit.unitName}</span>
                          </div>
                          <div className="flex items-center gap-2 sm:gap-4 ml-6 sm:ml-0">
                            <div className="flex items-center gap-1 sm:gap-2">
                              <Badge variant="outline" className="bg-success/10 text-success border-success/20 text-xs px-1.5 sm:px-2">
                                <CheckCircle2 className="h-3 w-3 sm:mr-1" />
                                <span className="hidden sm:inline">Sudah: </span>{unit.employeesRated}
                              </Badge>
                              <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20 text-xs px-1.5 sm:px-2">
                                <XCircle className="h-3 w-3 sm:mr-1" />
                                <span className="hidden sm:inline">Belum: </span>{unit.employeesNotRated}
                              </Badge>
                            </div>
                            <div className="w-16 sm:w-24 flex items-center gap-1 sm:gap-2">
                              <Progress value={unit.ratedPercentage} className="h-1.5 sm:h-2" />
                              <span className="text-xs font-medium w-10 text-right">
                                {unit.ratedPercentage.toFixed(0)}%
                              </span>
                            </div>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="pt-4">
                          <Tabs defaultValue="not_rated" className="w-full">
                            <TabsList className="grid w-full grid-cols-2 mb-4">
                              <TabsTrigger value="not_rated" className="text-warning data-[state=active]:bg-warning/10">
                                <XCircle className="h-4 w-4 mr-2" />
                                Belum Menilai ({unit.employeesNotRated})
                              </TabsTrigger>
                              <TabsTrigger value="rated" className="text-success data-[state=active]:bg-success/10">
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                Sudah Menilai ({unit.employeesRated})
                              </TabsTrigger>
                            </TabsList>

                            <TabsContent value="not_rated">
                              {unit.notRatedEmployees.length === 0 ? (
                                <div className="text-center py-6 text-success">
                                  <CheckCircle2 className="h-8 w-8 mx-auto mb-2" />
                                  <p className="text-sm">Semua pegawai sudah melakukan penilaian!</p>
                                </div>
                              ) : (
                                <PaginatedEmployeeTable 
                                  employees={unit.notRatedEmployees} 
                                  type="not_rated" 
                                  getInitials={getInitials}
                                />
                              )}
                            </TabsContent>

                            <TabsContent value="rated">
                              {unit.ratedEmployees.length === 0 ? (
                                <div className="text-center py-6 text-muted-foreground">
                                  <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                  <p className="text-sm">Belum ada pegawai yang melakukan penilaian</p>
                                </div>
                              ) : (
                                <PaginatedEmployeeTable 
                                  employees={unit.ratedEmployees} 
                                  type="rated" 
                                  getInitials={getInitials}
                                />
                              )}
                            </TabsContent>
                          </Tabs>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pimpinan Status Tab */}
        <TabsContent value="pimpinan">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Crown className="h-5 w-5 text-primary" />
                    Status Penilaian Pimpinan
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Pimpinan memiliki kuota 2 penilaian (1 ASN, 1 Non-ASN) dengan bobot 1000 poin
                  </p>
                </div>
                {/* Pimpinan Summary */}
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="bg-success/10 text-success border-success/20 px-3 py-1">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Sudah: {pimpinanSummary.rated}
                  </Badge>
                  <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20 px-3 py-1">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Belum: {pimpinanSummary.notRated}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {pimpinanRatingStatus.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Crown className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Belum ada akun pimpinan yang terdaftar</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Pimpinan</TableHead>
                        <TableHead className="hidden sm:table-cell">NIP</TableHead>
                        <TableHead className="hidden md:table-cell">Unit Kerja</TableHead>
                        <TableHead>Status Penilaian</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pimpinanRatingStatus.map((pimpinan) => (
                        <TableRow key={pimpinan.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-8 w-8 flex-shrink-0 ring-2 ring-primary/30">
                                <AvatarImage src={pimpinan.avatar_url || undefined} />
                                <AvatarFallback className="text-xs bg-primary/10 text-primary">
                                  {getInitials(pimpinan.name)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-medium text-sm block truncate max-w-[120px] sm:max-w-none">{pimpinan.name}</span>
                                  <Crown className="h-3 w-3 text-primary flex-shrink-0" />
                                </div>
                                <span className="text-xs text-muted-foreground sm:hidden block">{pimpinan.nip}</span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground hidden sm:table-cell">{pimpinan.nip}</TableCell>
                          <TableCell className="hidden md:table-cell">
                            <span className="text-sm">{pimpinan.work_unit_name}</span>
                          </TableCell>
                          <TableCell>
                            {pimpinan.hasRated ? (
                              <div className="flex flex-col sm:flex-row gap-1">
                                <Badge variant="outline" className={`text-[10px] sm:text-xs px-1.5 sm:px-2 ${
                                  pimpinan.ratedASN 
                                    ? "bg-success/10 text-success border-success/20" 
                                    : "bg-muted text-muted-foreground border-muted"
                                }`}>
                                  {pimpinan.ratedASN ? "✓" : "○"} ASN
                                </Badge>
                                <Badge variant="outline" className={`text-[10px] sm:text-xs px-1.5 sm:px-2 ${
                                  pimpinan.ratedNonASN 
                                    ? "bg-success/10 text-success border-success/20" 
                                    : "bg-muted text-muted-foreground border-muted"
                                }`}>
                                  {pimpinan.ratedNonASN ? "✓" : "○"} Non ASN
                                </Badge>
                                {pimpinan.ratedASN && pimpinan.ratedNonASN && (
                                  <Badge className="bg-success text-success-foreground text-[10px] sm:text-xs px-1.5 sm:px-2 hidden sm:inline-flex">
                                    Lengkap
                                  </Badge>
                                )}
                              </div>
                            ) : (
                              <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20 text-[10px] sm:text-xs px-1.5 sm:px-2">
                                <XCircle className="h-3 w-3 mr-0.5" />
                                Belum Menilai
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
