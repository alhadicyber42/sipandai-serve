import { useMemo } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Star, Eye, Calendar, Building2, User, Crown, CheckCircle2, Trophy, Lock, AlertCircle, ClipboardCheck } from "lucide-react";
import { usePagination } from "@/hooks/usePagination";
import { TablePagination } from "@/components/TablePagination";

// Types
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

// Helper function
const formatPeriod = (period: string) => {
  const [year, month] = period.split('-');
  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  return `${months[parseInt(month) - 1]} ${year}`;
};

// Paginated Ratings Table for "Semua Penilaian" section
interface PaginatedRatingsTableProps {
  ratings: Rating[];
  onSelectRating: (rating: Rating) => void;
  selectedRating: Rating | null;
}

export function PaginatedRatingsTable({ 
  ratings, 
  onSelectRating, 
  selectedRating 
}: PaginatedRatingsTableProps) {
  const pagination = usePagination(ratings, { initialPageSize: 10 });

  if (ratings.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Belum ada penilaian
      </div>
    );
  }

  return (
    <div>
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
            {pagination.paginatedData.map(rating => (
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
                <TableCell className="hidden md:table-cell">{rating.rater_name}</TableCell>
                <TableCell className="hidden md:table-cell">
                  <Badge variant="outline">
                    <Calendar className="h-3 w-3 mr-1" />
                    {formatPeriod(rating.rating_period)}
                  </Badge>
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-bold text-yellow-600">
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
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => onSelectRating(rating)} 
                        className="h-8 w-8 p-0 md:w-auto md:h-9 md:px-3 md:py-2"
                      >
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
                                  <Badge variant={(total as number) >= 20 ? "default" : (total as number) >= 15 ? "secondary" : "outline"}>
                                    {total as number}/25
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
      {ratings.length > 10 && (
        <TablePagination
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          totalItems={pagination.totalItems}
          startIndex={pagination.startIndex}
          endIndex={pagination.endIndex}
          pageSize={pagination.pageSize}
          onPageChange={pagination.setCurrentPage}
          onPageSizeChange={pagination.setPageSize}
          pageSizeOptions={[5, 10, 20, 50]}
          showPageSizeSelector={true}
        />
      )}
    </div>
  );
}

// Paginated Admin Unit Table for unit evaluation
interface PaginatedAdminUnitTableProps {
  data: AggregatedRating[];
  onOpenEvaluationForm: (item: AggregatedRating) => void;
}

export function PaginatedAdminUnitTable({
  data,
  onOpenEvaluationForm,
}: PaginatedAdminUnitTableProps) {
  const getUnitFinalPoints = (r: AggregatedRating) => {
    if (r.hasUnitEvaluation && r.unitEvaluation) return r.unitEvaluation.final_total_points;
    return r.totalPoints;
  };

  const sortedData = useMemo(() => 
    [...data].sort((a, b) => getUnitFinalPoints(b) - getUnitFinalPoints(a)),
    [data]
  );

  const pagination = usePagination(sortedData, { initialPageSize: 10 });

  const getRankStyle = (r: number) => {
    if (r === 1) return 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white';
    if (r === 2) return 'bg-gradient-to-r from-gray-300 to-gray-500 text-white';
    if (r === 3) return 'bg-gradient-to-r from-orange-400 to-orange-600 text-white';
    return 'bg-muted text-muted-foreground';
  };

  if (sortedData.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Belum ada penilaian
      </div>
    );
  }

  return (
    <div>
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
            {pagination.paginatedData.map((item, index) => {
              const globalIndex = sortedData.findIndex(d => d.employeeId === item.employeeId && d.ratingPeriod === item.ratingPeriod);
              
              return (
                <TableRow key={`${item.employeeId}-${item.ratingPeriod}`}>
                  <TableCell className="pl-4 text-center">
                    <div className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${getRankStyle(globalIndex + 1)}`}>
                      {globalIndex + 1}
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
                    <Button 
                      variant={item.hasUnitEvaluation ? "outline" : "default"} 
                      size="sm" 
                      onClick={() => onOpenEvaluationForm(item)} 
                      className="h-8 px-3"
                    >
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
      {sortedData.length > 10 && (
        <TablePagination
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          totalItems={pagination.totalItems}
          startIndex={pagination.startIndex}
          endIndex={pagination.endIndex}
          pageSize={pagination.pageSize}
          onPageChange={pagination.setCurrentPage}
          onPageSizeChange={pagination.setPageSize}
          pageSizeOptions={[5, 10, 20, 50]}
          showPageSizeSelector={true}
        />
      )}
    </div>
  );
}

// Paginated Aggregated Ratings Table for "Penilaian Final" section (Admin Pusat)
interface PaginatedAggregatedTableProps {
  data: AggregatedRating[];
  isAdminPusat: boolean;
  periodStatus: any;
  selectedPeriod: string;
  designatedWinners: DesignatedWinner[];
  employees: any[];
  filteredAggregatedRatings: AggregatedRating[];
  onOpenFinalEvaluationForm: (item: AggregatedRating) => void;
  onDesignateWinner: (item: AggregatedRating, type: 'monthly' | 'yearly') => void;
  onRemoveDesignatedWinner: (winnerId: string) => void;
  isDesignatedWinner: (employeeId: string, period: string) => DesignatedWinner | undefined;
  getEmployeeCategory: (employeeId: string) => string;
}

export function PaginatedAggregatedTable({
  data,
  isAdminPusat,
  periodStatus,
  selectedPeriod,
  designatedWinners,
  employees,
  filteredAggregatedRatings,
  onOpenFinalEvaluationForm,
  onDesignateWinner,
  onRemoveDesignatedWinner,
  isDesignatedWinner,
  getEmployeeCategory,
}: PaginatedAggregatedTableProps) {
  const getFinalPointsForSort = (r: AggregatedRating) => {
    if (r.hasFinalEvaluation && r.finalEvaluation) return r.finalEvaluation.final_total_points;
    if (r.hasUnitEvaluation && r.unitEvaluation) return r.unitEvaluation.final_total_points;
    return r.totalPoints;
  };

  const sortedData = useMemo(() => 
    [...data].sort((a, b) => getFinalPointsForSort(b) - getFinalPointsForSort(a)),
    [data]
  );

  const pagination = usePagination(sortedData, { initialPageSize: 10 });

  const getRankStyle = (r: number) => {
    if (r === 1) return 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white';
    if (r === 2) return 'bg-gradient-to-r from-gray-300 to-gray-500 text-white';
    if (r === 3) return 'bg-gradient-to-r from-orange-400 to-orange-600 text-white';
    return 'bg-muted text-muted-foreground';
  };

  if (sortedData.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Belum ada penilaian
      </div>
    );
  }

  return (
    <div>
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
            {pagination.paginatedData.map((item, index) => {
              const globalIndex = sortedData.findIndex(d => d.employeeId === item.employeeId && d.ratingPeriod === item.ratingPeriod);
              const winner = isDesignatedWinner(item.employeeId, item.ratingPeriod);
              const category = getEmployeeCategory(item.employeeId);
              
              // Calculate if this is top for designations
              const period = item.ratingPeriod;
              const year = period.split('-')[0];
              const sameCategory = filteredAggregatedRatings.filter(r => {
                const empCat = employees.find(e => e.id === r.employeeId)?.kriteria_asn === 'Non ASN' ? 'Non ASN' : 'ASN';
                return r.ratingPeriod === period && empCat === category;
              });
              const sameCategorySorted = [...sameCategory].sort((a, b) => getFinalPointsForSort(b) - getFinalPointsForSort(a));
              const isTopMonthly = sameCategorySorted[0]?.employeeId === item.employeeId;

              const yearRatings = filteredAggregatedRatings.filter(r => {
                const empCat = employees.find(e => e.id === r.employeeId)?.kriteria_asn === 'Non ASN' ? 'Non ASN' : 'ASN';
                return r.ratingPeriod.startsWith(year) && empCat === category;
              });
              const yearSorted = [...yearRatings].sort((a, b) => getFinalPointsForSort(b) - getFinalPointsForSort(a));
              const isTopYearly = yearSorted[0]?.employeeId === item.employeeId;

              const monthlyWinner = designatedWinners.find(w => w.employee_id === item.employeeId && w.period === period && w.winner_type === 'monthly');
              const yearlyWinner = designatedWinners.find(w => w.employee_id === item.employeeId && w.period === year && w.winner_type === 'yearly');

              return (
                <TableRow key={`${item.employeeId}-${item.ratingPeriod}`}>
                  <TableCell className="pl-4 text-center">
                    <div className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${getRankStyle(globalIndex + 1)}`}>
                      {globalIndex + 1}
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
                    ) : (
                      <span className="text-muted-foreground text-xs">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center hidden sm:table-cell">
                    {item.hasFinalEvaluation && item.finalEvaluation ? (
                      <div className="flex items-center justify-center gap-1">
                        <Crown className="h-4 w-4 text-purple-500" />
                        <span className={`font-bold ${item.finalEvaluation.final_total_points >= item.totalPoints ? 'text-purple-600' : 'text-orange-600'}`}>
                          {item.finalEvaluation.final_total_points}
                        </span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-xs">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {winner ? (
                      <Badge className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-white border-0">
                        <Trophy className="h-3 w-3 mr-1" />
                        Pemenang
                      </Badge>
                    ) : item.hasFinalEvaluation ? (
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
                    <div className="flex items-center justify-end gap-2 flex-wrap">
                      <Button 
                        variant={item.hasFinalEvaluation ? "outline" : "default"} 
                        size="sm" 
                        onClick={() => onOpenFinalEvaluationForm(item)} 
                        className={`h-8 px-3 ${!item.hasFinalEvaluation ? 'bg-purple-600 hover:bg-purple-700' : ''}`}
                      >
                        <Crown className="h-4 w-4 md:mr-2" />
                        <span className="hidden md:inline">
                          {item.hasFinalEvaluation ? "Edit Final" : "Nilai Final"}
                        </span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      {sortedData.length > 10 && (
        <TablePagination
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          totalItems={pagination.totalItems}
          startIndex={pagination.startIndex}
          endIndex={pagination.endIndex}
          pageSize={pagination.pageSize}
          onPageChange={pagination.setCurrentPage}
          onPageSizeChange={pagination.setPageSize}
          pageSizeOptions={[5, 10, 20, 50]}
          showPageSizeSelector={true}
        />
      )}
    </div>
  );
}
