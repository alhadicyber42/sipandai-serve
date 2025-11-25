import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Trophy, Star, Search, Eye, Calendar, Award } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Rating {
    id: string;
    rater_id: string;
    rater_name: string;
    rated_employee_id: string;
    rated_employee_name: string;
    rating_period: string;
    reason: string;
    detailed_ratings: Record<string, Record<number, number>>;
    criteria_totals: Record<string, number>;
    total_points: number;
    max_possible_points: number;
    created_at: string;
}

export default function AdminEmployeeRatings() {
    const { user } = useAuth();
    const [ratings, setRatings] = useState<Rating[]>([]);
    const [employees, setEmployees] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedPeriod, setSelectedPeriod] = useState<string>("all");
    const [selectedRating, setSelectedRating] = useState<Rating | null>(null);
    const [leaderboard, setLeaderboard] = useState<Array<{ employeeId: string, employeeName: string, totalPoints: number, ratingCount: number }>>([]);
    const [unitEmployeeIds, setUnitEmployeeIds] = useState<string[]>([]);

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        calculateLeaderboard();
    }, [ratings, selectedPeriod]);

    const loadData = async () => {
        // Load employees from Supabase
        let employeeQuery = supabase
            .from("profiles")
            .select("*")
            .eq("role", "user_unit");

        // If admin_unit, filter by work_unit_id
        if (user?.role === "admin_unit" && user?.work_unit_id) {
            employeeQuery = employeeQuery.eq("work_unit_id", user.work_unit_id);
        }

        const { data: employeeData } = await employeeQuery;

        if (employeeData) {
            setEmployees(employeeData);
            const employeeIds = employeeData.map(emp => emp.id);
            setUnitEmployeeIds(employeeIds);
        }

        // Load ratings from localStorage
        const storedRatings = JSON.parse(localStorage.getItem('employee_ratings') || '[]');
        
        // Filter ratings based on user role
        let filteredRatings = storedRatings;
        if (user?.role === "admin_unit" && employeeData) {
            const employeeIds = employeeData.map(emp => emp.id);
            // Only show ratings where the rated employee is from this unit
            filteredRatings = storedRatings.filter((rating: Rating) => 
                employeeIds.includes(rating.rated_employee_id)
            );
        }
        
        setRatings(filteredRatings);
    };

    const calculateLeaderboard = () => {
        const filteredRatings = selectedPeriod === "all"
            ? ratings
            : ratings.filter(r => r.rating_period === selectedPeriod);

        const pointsByEmployee: Record<string, { totalPoints: number, count: number, name: string }> = {};

        filteredRatings.forEach((rating) => {
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

        const leaderboardData = Object.entries(pointsByEmployee).map(([employeeId, data]) => ({
            employeeId,
            employeeName: data.name,
            totalPoints: data.totalPoints,
            ratingCount: data.count
        })).sort((a, b) => b.totalPoints - a.totalPoints);

        setLeaderboard(leaderboardData);
    };

    const getPeriods = () => {
        const periods = [...new Set(ratings.map(r => r.rating_period))].sort().reverse();
        return periods;
    };

    const filteredRatings = ratings.filter(rating => {
        const matchesSearch = rating.rated_employee_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            rating.rater_name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesPeriod = selectedPeriod === "all" || rating.rating_period === selectedPeriod;
        return matchesSearch && matchesPeriod;
    });

    const formatPeriod = (period: string) => {
        const [year, month] = period.split('-');
        const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
        return `${months[parseInt(month) - 1]} ${year}`;
    };

    return (
        <DashboardLayout>
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
                                Penilaian Employee of The Month
                            </h1>
                            <p className="text-white/90 mt-1 text-sm md:text-base">
                                {user?.role === "admin_unit" 
                                    ? "Lihat penilaian dan leaderboard pegawai terbaik di unit Anda"
                                    : "Lihat semua penilaian dan leaderboard pegawai terbaik"
                                }
                            </p>
                        </div>
                    </div>
                </div>

                {/* Info Badge for Admin Unit */}
                {user?.role === "admin_unit" && (
                    <Card className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
                        <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                                    <Trophy className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                                        Data Unit Kerja Anda
                                    </h3>
                                    <p className="text-sm text-blue-700 dark:text-blue-300">
                                        Anda hanya dapat melihat penilaian dan leaderboard untuk pegawai di unit kerja Anda. 
                                        Total <span className="font-semibold">{employees.length} pegawai</span> dan <span className="font-semibold">{ratings.length} penilaian</span> di unit Anda.
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Leaderboard */}
                {leaderboard.length > 0 && (
                    <Card className="bg-gradient-to-br from-yellow-50 to-white dark:from-yellow-950/30 dark:to-background border-yellow-200 dark:border-yellow-800">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Trophy className="h-6 w-6 text-yellow-600" />
                                Leaderboard {selectedPeriod !== "all" ? formatPeriod(selectedPeriod) : "Semua Periode"}
                                {user?.role === "admin_unit" && (
                                    <Badge variant="secondary" className="ml-2">Unit Anda</Badge>
                                )}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {leaderboard.slice(0, 3).map((leader, index) => (
                                    <Card key={leader.employeeId} className={index === 0 ? "border-2 border-yellow-400" : ""}>
                                        <CardContent className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`text-2xl font-bold ${index === 0 ? 'text-yellow-600' : index === 1 ? 'text-gray-400' : 'text-orange-600'}`}>
                                                    #{index + 1}
                                                </div>
                                                <div className="flex-1">
                                                    <p className="font-semibold">{leader.employeeName}</p>
                                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                                        <span className="font-bold text-yellow-600">{leader.totalPoints} poin</span>
                                                        <span>({leader.ratingCount} penilaian)</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Filters */}
                <Card>
                    <CardContent className="p-4">
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="flex-1">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Cari pegawai atau penilai..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-10"
                                    />
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
                        </div>
                    </CardContent>
                </Card>

                {/* Ratings Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>
                            {user?.role === "admin_unit" ? "Penilaian Unit Anda" : "Semua Penilaian"} ({filteredRatings.length})
                        </CardTitle>
                        <CardDescription>
                            {user?.role === "admin_unit" 
                                ? "Daftar penilaian Employee of The Month untuk pegawai di unit Anda"
                                : "Daftar lengkap penilaian Employee of The Month"
                            }
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Pegawai Dinilai</TableHead>
                                    <TableHead>Penilai</TableHead>
                                    <TableHead>Periode</TableHead>
                                    <TableHead className="text-center">Total Poin</TableHead>
                                    <TableHead>Tanggal</TableHead>
                                    <TableHead className="text-right">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredRatings.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                            Belum ada penilaian
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredRatings.map((rating) => (
                                        <TableRow key={rating.id}>
                                            <TableCell>
                                                <div className="font-medium">{rating.rated_employee_name}</div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-sm">{rating.rater_name}</div>
                                            </TableCell>
                                            <TableCell>
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
                                            <TableCell className="text-sm text-muted-foreground">
                                                {new Date(rating.created_at).toLocaleDateString('id-ID')}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Dialog>
                                                    <DialogTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => setSelectedRating(rating)}
                                                        >
                                                            <Eye className="h-4 w-4 mr-2" />
                                                            Detail
                                                        </Button>
                                                    </DialogTrigger>
                                                    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                                                        <DialogHeader>
                                                            <DialogTitle>Detail Penilaian</DialogTitle>
                                                        </DialogHeader>
                                                        {selectedRating && (
                                                            <div className="space-y-4">
                                                                <div className="grid grid-cols-2 gap-4">
                                                                    <div>
                                                                        <p className="text-sm font-medium text-muted-foreground">Pegawai Dinilai</p>
                                                                        <p className="font-semibold">{selectedRating.rated_employee_name}</p>
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-sm font-medium text-muted-foreground">Penilai</p>
                                                                        <p className="font-semibold">{selectedRating.rater_name}</p>
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-sm font-medium text-muted-foreground">Periode</p>
                                                                        <p className="font-semibold">{formatPeriod(selectedRating.rating_period)}</p>
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-sm font-medium text-muted-foreground">Total Poin</p>
                                                                        <p className="font-semibold text-yellow-600 text-lg">
                                                                            {selectedRating.total_points}/{selectedRating.max_possible_points}
                                                                        </p>
                                                                    </div>
                                                                </div>

                                                                <div>
                                                                    <p className="text-sm font-medium text-muted-foreground mb-2">Alasan</p>
                                                                    <p className="text-sm bg-muted p-3 rounded-lg">{selectedRating.reason}</p>
                                                                </div>

                                                                <div>
                                                                    <p className="text-sm font-medium text-muted-foreground mb-2">Rincian Penilaian per Kriteria</p>
                                                                    <div className="space-y-2">
                                                                        {Object.entries(selectedRating.criteria_totals || {}).map(([criteriaId, total]) => (
                                                                            <div key={criteriaId} className="flex justify-between items-center p-2 bg-muted rounded">
                                                                                <span className="text-sm capitalize">{criteriaId.replace(/_/g, ' ')}</span>
                                                                                <span className="font-semibold">{total}/25</span>
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
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
