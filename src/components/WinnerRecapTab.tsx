import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Crown, Calendar, Star, Award, Medal, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { WORK_UNITS } from "@/lib/constants";
import { usePagination } from "@/hooks/usePagination";
import { TablePagination } from "@/components/TablePagination";

interface DesignatedWinner {
  id: string;
  employee_id: string;
  winner_type: 'monthly' | 'yearly';
  employee_category: 'ASN' | 'Non ASN';
  period: string;
  final_points: number;
  designated_at: string;
  notes: string | null;
}

interface Employee {
  id: string;
  name: string;
  avatar_url?: string;
  jabatan?: string;
  work_unit_id?: number;
  kriteria_asn?: string;
}

interface WinnerWithDetails extends DesignatedWinner {
  employee_name: string;
  employee_avatar?: string;
  employee_jabatan?: string;
  employee_work_unit?: string;
}

interface YearlyCandidate {
  employeeId: string;
  employeeName: string;
  employeeAvatar?: string;
  employeeJabatan?: string;
  employeeWorkUnit?: string;
  employeeCategory: string;
  monthlyWinCount: number;
  totalPoints: number;
  avgPoints: number;
  months: string[];
}

export function WinnerRecapTab() {
  const [designatedWinners, setDesignatedWinners] = useState<WinnerWithDetails[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load employees
      const { data: employeeData } = await supabase
        .from("profiles")
        .select("id, name, avatar_url, jabatan, work_unit_id, kriteria_asn");
      
      setEmployees(employeeData || []);

      // Load designated winners
      const { data: winnersData } = await supabase
        .from("designated_winners")
        .select("*")
        .order("period", { ascending: false });

      if (winnersData && employeeData) {
        const enrichedWinners = winnersData.map(winner => {
          const employee = employeeData.find(e => e.id === winner.employee_id);
          const workUnit = WORK_UNITS.find(u => u.id === employee?.work_unit_id);
          return {
            ...winner,
            employee_name: employee?.name || "Unknown",
            employee_avatar: employee?.avatar_url,
            employee_jabatan: employee?.jabatan,
            employee_work_unit: workUnit?.name
          };
        });
        setDesignatedWinners(enrichedWinners as WinnerWithDetails[]);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Get available years from winners
  const availableYears = useMemo(() => {
    const years = new Set<string>();
    designatedWinners.forEach(w => {
      if (w.winner_type === 'monthly') {
        const year = w.period.split('-')[0];
        years.add(year);
      } else {
        years.add(w.period);
      }
    });
    // Add current year if not present
    years.add(new Date().getFullYear().toString());
    return Array.from(years).sort().reverse();
  }, [designatedWinners]);

  // Get monthly winners for selected year
  const monthlyWinners = useMemo(() => {
    return designatedWinners.filter(w => 
      w.winner_type === 'monthly' && w.period.startsWith(selectedYear)
    ).sort((a, b) => b.period.localeCompare(a.period));
  }, [designatedWinners, selectedYear]);

  // Get monthly winners by category
  const monthlyWinnersByCategory = (category: string) => {
    return monthlyWinners.filter(w => w.employee_category === category);
  };

  // Calculate Employee of the Year candidates based on monthly wins
  const yearlyCandicates = useMemo(() => {
    const candidateMap: Record<string, YearlyCandidate> = {};
    
    monthlyWinners.forEach(winner => {
      const key = `${winner.employee_id}-${winner.employee_category}`;
      
      if (!candidateMap[key]) {
        candidateMap[key] = {
          employeeId: winner.employee_id,
          employeeName: winner.employee_name,
          employeeAvatar: winner.employee_avatar,
          employeeJabatan: winner.employee_jabatan,
          employeeWorkUnit: winner.employee_work_unit,
          employeeCategory: winner.employee_category,
          monthlyWinCount: 0,
          totalPoints: 0,
          avgPoints: 0,
          months: []
        };
      }
      
      candidateMap[key].monthlyWinCount += 1;
      candidateMap[key].totalPoints += winner.final_points;
      candidateMap[key].months.push(winner.period);
    });

    // Calculate average and sort by win count, then by total points
    return Object.values(candidateMap)
      .map(c => ({
        ...c,
        avgPoints: c.monthlyWinCount > 0 ? Math.round(c.totalPoints / c.monthlyWinCount) : 0
      }))
      .sort((a, b) => {
        if (b.monthlyWinCount !== a.monthlyWinCount) {
          return b.monthlyWinCount - a.monthlyWinCount;
        }
        return b.totalPoints - a.totalPoints;
      });
  }, [monthlyWinners]);

  // Get yearly candidates by category
  const yearlyCandidatesByCategory = (category: string) => {
    return yearlyCandicates.filter(c => c.employeeCategory === category);
  };

  // Get designated yearly winner
  const getYearlyWinner = (category: string) => {
    return designatedWinners.find(w => 
      w.winner_type === 'yearly' && 
      w.period === selectedYear && 
      w.employee_category === category
    );
  };

  const formatPeriod = (period: string) => {
    const [year, month] = period.split('-');
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    return `${months[parseInt(month) - 1]} ${year}`;
  };

  const formatShortMonth = (period: string) => {
    const [, month] = period.split('-');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'];
    return months[parseInt(month) - 1];
  };

  // Paginated Candidates Table Component
  const PaginatedCandidatesTable = ({ candidates }: { candidates: YearlyCandidate[] }) => {
    const pagination = usePagination(candidates, { initialPageSize: 10 });

    const getRankStyle = (r: number) => {
      if (r === 1) return 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white';
      if (r === 2) return 'bg-gradient-to-r from-gray-300 to-gray-500 text-white';
      if (r === 3) return 'bg-gradient-to-r from-orange-400 to-orange-600 text-white';
      return 'bg-muted text-muted-foreground';
    };

    return (
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16 text-center">#</TableHead>
              <TableHead>Pegawai</TableHead>
              <TableHead className="text-center">Menang Bulanan</TableHead>
              <TableHead className="text-center hidden sm:table-cell">Total Poin</TableHead>
              <TableHead className="text-center hidden md:table-cell">Rata-rata</TableHead>
              <TableHead className="hidden lg:table-cell">Bulan Menang</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pagination.paginatedData.map((candidate, index) => {
              const rank = (pagination.currentPage - 1) * pagination.pageSize + index + 1;
              
              return (
                <TableRow key={candidate.employeeId}>
                  <TableCell className="text-center">
                    <div className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${getRankStyle(rank)}`}>
                      {rank}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={candidate.employeeAvatar} />
                        <AvatarFallback>{candidate.employeeName.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{candidate.employeeName}</p>
                        <p className="text-xs text-muted-foreground">{candidate.employeeWorkUnit}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline" className="bg-yellow-50 border-yellow-300 text-yellow-700">
                      <Medal className="h-3 w-3 mr-1" />
                      {candidate.monthlyWinCount}x
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center hidden sm:table-cell">
                    <span className="font-bold text-purple-600">{candidate.totalPoints}</span>
                  </TableCell>
                  <TableCell className="text-center hidden md:table-cell">
                    <span className="text-muted-foreground">{candidate.avgPoints}</span>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <div className="flex flex-wrap gap-1">
                      {candidate.months.map(m => (
                        <Badge key={m} variant="secondary" className="text-xs">
                          {formatShortMonth(m)}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        {candidates.length > 10 && (
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

  // Paginated Monthly Winners Grid Component
  const PaginatedWinnersGrid = ({ winners }: { winners: WinnerWithDetails[] }) => {
    const pagination = usePagination(winners, { initialPageSize: 9 });

    return (
      <div>
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {pagination.paginatedData.map(winner => (
            <Card key={winner.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 p-2 sm:p-3">
                <div className="flex items-center gap-2 text-white">
                  <Trophy className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="font-semibold text-xs sm:text-sm">
                    {formatPeriod(winner.period)}
                  </span>
                </div>
              </div>
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <Avatar className="h-10 w-10 sm:h-12 sm:w-12 border-2 border-yellow-400 flex-shrink-0">
                    <AvatarImage src={winner.employee_avatar} />
                    <AvatarFallback className="bg-yellow-100 text-yellow-700 font-bold text-sm">
                      {winner.employee_name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm sm:text-base truncate">{winner.employee_name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {winner.employee_jabatan || winner.employee_work_unit}
                    </p>
                  </div>
                </div>
                <div className="mt-2 sm:mt-3 flex items-center justify-between">
                  <Badge variant="secondary" className="text-xs">
                    {winner.employee_category}
                  </Badge>
                  <div className="flex items-center gap-1 text-yellow-600">
                    <Star className="h-3.5 w-3.5 sm:h-4 sm:w-4 fill-yellow-400" />
                    <span className="font-bold text-sm">{winner.final_points}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        {winners.length > 9 && (
          <TablePagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            totalItems={pagination.totalItems}
            startIndex={pagination.startIndex}
            endIndex={pagination.endIndex}
            pageSize={pagination.pageSize}
            onPageChange={pagination.setCurrentPage}
            onPageSizeChange={pagination.setPageSize}
            pageSizeOptions={[6, 9, 12, 18]}
            showPageSizeSelector={true}
          />
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          Memuat data...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Year Filter */}
      <Card>
        <CardContent className="p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <span className="text-sm font-medium">Pilih Tahun:</span>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableYears.map(year => (
                  <SelectItem key={year} value={year}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Employee of the Year Candidates Section */}
      <Card className="border-purple-200 dark:border-purple-800">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-950/50 dark:to-purple-900/30 rounded-t-lg px-3 sm:px-6 py-3 sm:py-4">
          <CardTitle className="flex items-center gap-2 text-purple-700 dark:text-purple-300 text-base sm:text-lg">
            <Trophy className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="hidden sm:inline">Kandidat Employee of The Year {selectedYear}</span>
            <span className="sm:hidden">Kandidat EOY {selectedYear}</span>
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Kandidat otomatis dari pemenang bulanan
          </CardDescription>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 md:p-6">
          <Tabs defaultValue="ASN" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4 h-9 sm:h-10">
              <TabsTrigger value="ASN" className="text-xs sm:text-sm">ASN</TabsTrigger>
              <TabsTrigger value="Non ASN" className="text-xs sm:text-sm">Non ASN</TabsTrigger>
            </TabsList>
            
            {['ASN', 'Non ASN'].map(category => {
              const candidates = yearlyCandidatesByCategory(category);
              const yearlyWinner = getYearlyWinner(category);
              
              return (
                <TabsContent key={category} value={category}>
                  {/* Display Yearly Winner if exists */}
                  {yearlyWinner && (
                    <div className="mb-6 p-4 bg-gradient-to-r from-purple-100 to-purple-50 dark:from-purple-950/50 dark:to-purple-900/30 rounded-xl border border-purple-200 dark:border-purple-800">
                      <div className="flex items-center gap-2 mb-3">
                        <Crown className="h-5 w-5 text-purple-600" />
                        <span className="font-semibold text-purple-700 dark:text-purple-300">
                          Pemenang Ditetapkan
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        <Avatar className="h-16 w-16 border-4 border-purple-400">
                          <AvatarImage src={yearlyWinner.employee_avatar} />
                          <AvatarFallback className="bg-purple-200 text-purple-700 text-lg font-bold">
                            {yearlyWinner.employee_name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-bold text-lg">{yearlyWinner.employee_name}</p>
                          <p className="text-sm text-muted-foreground">{yearlyWinner.employee_work_unit}</p>
                          <Badge className="mt-1 bg-purple-600">
                            <Star className="h-3 w-3 mr-1" />
                            {yearlyWinner.final_points} Poin
                          </Badge>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Candidates Table */}
                  {candidates.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Trophy className="h-12 w-12 mx-auto mb-2 opacity-30" />
                      <p>Belum ada pemenang bulanan untuk kategori {category} di tahun {selectedYear}</p>
                    </div>
                  ) : (
                    <PaginatedCandidatesTable candidates={candidates} />
                  )}
                </TabsContent>
              );
            })}
          </Tabs>
        </CardContent>
      </Card>

      {/* Monthly Winners Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-yellow-600" />
            Pemenang Bulanan {selectedYear}
          </CardTitle>
          <CardDescription>
            Daftar pemenang Employee of The Year yang sudah ditetapkan
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 md:p-6">
          <Tabs defaultValue="ASN" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="ASN">
                ASN ({monthlyWinnersByCategory('ASN').length})
              </TabsTrigger>
              <TabsTrigger value="Non ASN">
                Non ASN ({monthlyWinnersByCategory('Non ASN').length})
              </TabsTrigger>
            </TabsList>
            
            {['ASN', 'Non ASN'].map(category => {
              const winners = monthlyWinnersByCategory(category);
              
              return (
                <TabsContent key={category} value={category}>
                  {winners.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Sparkles className="h-12 w-12 mx-auto mb-2 opacity-30" />
                      <p>Belum ada pemenang {category} di tahun {selectedYear}</p>
                    </div>
                  ) : (
                    <PaginatedWinnersGrid winners={winners} />
                  )}
                </TabsContent>
              );
            })}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
