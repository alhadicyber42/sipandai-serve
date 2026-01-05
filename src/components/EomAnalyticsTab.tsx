import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { BarChart3, Users, CheckCircle2, XCircle, Building2, TrendingUp, Loader2 } from "lucide-react";
import { usePagination } from "@/hooks/usePagination";
import { TablePagination } from "@/components/TablePagination";

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

export function EomAnalyticsTab() {
  const [loading, setLoading] = useState(true);
  const [participatingUnits, setParticipatingUnits] = useState<WorkUnit[]>([]);
  const [allProfiles, setAllProfiles] = useState<any[]>([]);
  const [allRatings, setAllRatings] = useState<any[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<string>("");
  const [periodSettings, setPeriodSettings] = useState<EomPeriodSetting[]>([]);

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
        .select("rater_id, rated_employee_id, rating_period");

      if (ratError) throw ratError;
      setAllRatings(ratings || []);

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
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-yellow-50 text-yellow-700 border-yellow-200"
                  }`}>
                    {emp.kriteria_asn || "ASN"}
                  </Badge>
                </TableCell>
                <TableCell>
                  {type === 'rated' ? (
                    <div className="flex flex-wrap gap-1">
                      {emp.ratedASN && (
                        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 text-[10px] sm:text-xs px-1.5 sm:px-2">
                          ✓ ASN
                        </Badge>
                      )}
                      {emp.ratedNonASN && (
                        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] sm:text-xs px-1.5 sm:px-2">
                          ✓ Non
                        </Badge>
                      )}
                    </div>
                  ) : (
                    <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 text-[10px] sm:text-xs px-1.5 sm:px-2">
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
        <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
          <SelectTrigger className="w-[250px]">
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
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20 border-blue-200 dark:border-blue-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-blue-500/10">
                <Building2 className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Unit Peserta</p>
                <p className="text-2xl font-bold text-blue-600">{summaryStats.totalUnits}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/30 dark:to-purple-900/20 border-purple-200 dark:border-purple-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-purple-500/10">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Pegawai</p>
                <p className="text-2xl font-bold text-purple-600">{summaryStats.totalEmployees}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/30 dark:to-green-900/20 border-green-200 dark:border-green-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-green-500/10">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Sudah Menilai</p>
                <p className="text-2xl font-bold text-green-600">{summaryStats.totalRated}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100/50 dark:from-orange-950/30 dark:to-orange-900/20 border-orange-200 dark:border-orange-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-orange-500/10">
                <XCircle className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Belum Menilai</p>
                <p className="text-2xl font-bold text-orange-600">{summaryStats.totalNotRated}</p>
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

      {/* Unit Details */}
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
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs px-1.5 sm:px-2">
                            <CheckCircle2 className="h-3 w-3 sm:mr-1" />
                            <span className="hidden sm:inline">Sudah: </span>{unit.employeesRated}
                          </Badge>
                          <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 text-xs px-1.5 sm:px-2">
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
                          <TabsTrigger value="not_rated" className="text-orange-600 data-[state=active]:bg-orange-100 dark:data-[state=active]:bg-orange-900/30">
                            <XCircle className="h-4 w-4 mr-2" />
                            Belum Menilai ({unit.employeesNotRated})
                          </TabsTrigger>
                          <TabsTrigger value="rated" className="text-green-600 data-[state=active]:bg-green-100 dark:data-[state=active]:bg-green-900/30">
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Sudah Menilai ({unit.employeesRated})
                          </TabsTrigger>
                        </TabsList>

                        <TabsContent value="not_rated">
                          {unit.notRatedEmployees.length === 0 ? (
                            <div className="text-center py-6 text-green-600">
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
    </div>
  );
}
