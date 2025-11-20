import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Trophy, ThumbsUp, Star, Medal, Search, User } from "lucide-react";

export default function EmployeeOfTheMonth() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [employees, setEmployees] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [votes, setVotes] = useState<Record<string, number>>({});
    const [searchTerm, setSearchTerm] = useState("");
    const [leaderboard, setLeaderboard] = useState<Array<{ employeeId: string, totalPoints: number, ratingCount: number }>>([]);

    useEffect(() => {
        loadEmployees();
        loadLeaderboard();
    }, []);

    const loadEmployees = async () => {
        setIsLoading(true);
        // Fetch all users with role 'user_unit'
        const { data, error } = await supabase
            .from("profiles")
            .select("*")
            .eq("role", "user_unit");

        console.log("Fetched employees:", data);
        console.log("Number of employees:", data?.length || 0);
        console.log("Employee details:", JSON.stringify(data, null, 2));

        if (error) {
            toast.error("Gagal memuat data pegawai");
            console.error("Error details:", error);
        } else {
            setEmployees(data || []);
            console.log("Employees set to state:", data?.length || 0);
        }
        setIsLoading(false);
    };

    const loadLeaderboard = () => {
        try {
            const ratings = JSON.parse(localStorage.getItem('employee_ratings') || '[]');

            // Get current period
            const now = new Date();
            const currentPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

            // Filter ratings for current period
            const currentPeriodRatings = ratings.filter((r: any) => r.rating_period === currentPeriod);

            // Aggregate points by employee
            const pointsByEmployee: Record<string, { totalPoints: number, count: number }> = {};

            currentPeriodRatings.forEach((rating: any) => {
                const employeeId = rating.rated_employee_id;
                if (!pointsByEmployee[employeeId]) {
                    pointsByEmployee[employeeId] = { totalPoints: 0, count: 0 };
                }
                pointsByEmployee[employeeId].totalPoints += rating.total_points || 0;
                pointsByEmployee[employeeId].count += 1;
            });

            // Convert to array and sort by total points
            const leaderboardData = Object.entries(pointsByEmployee).map(([employeeId, data]) => ({
                employeeId,
                totalPoints: data.totalPoints,
                ratingCount: data.count
            })).sort((a, b) => b.totalPoints - a.totalPoints);

            setLeaderboard(leaderboardData);
            console.log('Leaderboard loaded:', leaderboardData);
        } catch (error) {
            console.error('Error loading leaderboard:', error);
        }
    };

    // Sort employees by votes (mock leaderboard)
    const sortedEmployees = [...employees].sort((a, b) => {
        const votesA = votes[a.id] || 0;
        const votesB = votes[b.id] || 0;
        return votesB - votesA;
    });

    const topEmployee = sortedEmployees[0];

    // Filter employees based on search term
    const filteredEmployees = sortedEmployees.filter(employee =>
        employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.nip.includes(searchTerm)
    );

    return (
        <DashboardLayout>
            <div className="space-y-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-600 to-yellow-400 bg-clip-text text-transparent">
                            Employee of The Month
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            Berikan apresiasi "Good Point" kepada rekan kerja terbaik Anda!
                        </p>
                    </div>
                    <div className="flex items-center gap-2 bg-yellow-100 dark:bg-yellow-900/30 px-4 py-2 rounded-full border border-yellow-200 dark:border-yellow-700">
                        <Trophy className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                        <span className="font-semibold text-yellow-800 dark:text-yellow-200">
                            Periode: November 2025
                        </span>
                    </div>
                </div>

                {/* Leaderboard Highlight */}
                {leaderboard.length > 0 && (() => {
                    const topLeader = leaderboard[0];
                    const topEmployee = employees.find(e => e.id === topLeader.employeeId);

                    if (!topEmployee) return null;

                    return (
                        <Card className="bg-gradient-to-br from-yellow-50 to-white dark:from-yellow-950/30 dark:to-background border-yellow-200 dark:border-yellow-800 shadow-lg overflow-hidden relative">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <Trophy className="h-64 w-64 text-yellow-500" />
                            </div>
                            <CardContent className="p-8 flex flex-col md:flex-row items-center gap-8 relative z-10">
                                <div className="relative">
                                    <div className="absolute -top-6 -right-6">
                                        <Medal className="h-12 w-12 text-yellow-500 drop-shadow-md animate-bounce" />
                                    </div>
                                    <Avatar className="h-32 w-32 border-4 border-yellow-400 shadow-xl">
                                        <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${topEmployee.name}`} />
                                        <AvatarFallback className="text-2xl">{topEmployee.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                </div>
                                <div className="text-center md:text-left space-y-2 flex-1">
                                    <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white border-none mb-2">
                                        🏆 Peringkat #1
                                    </Badge>
                                    <h2 className="text-3xl font-bold">{topEmployee.name}</h2>
                                    <p className="text-lg text-muted-foreground">{topEmployee.nip}</p>
                                    <div className="flex flex-col md:flex-row items-center justify-center md:justify-start gap-4 mt-4">
                                        <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400 font-bold text-xl">
                                            <Star className="h-6 w-6 fill-current" />
                                            <span>{topLeader.totalPoints} Poin</span>
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                            dari {topLeader.ratingCount} penilaian
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })()}

                {/* Employee Table */}
                <Card>
                    <CardHeader>
                        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                            <CardTitle className="flex items-center gap-2">
                                <User className="h-5 w-5" />
                                Daftar Pegawai
                            </CardTitle>
                            <div className="relative w-full md:w-72">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Cari nama atau NIP..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-8"
                                />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[50px]">No</TableHead>
                                        <TableHead>Nama Pegawai</TableHead>
                                        <TableHead>NIP</TableHead>
                                        <TableHead>Jabatan</TableHead>
                                        <TableHead className="text-right">Aksi</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredEmployees.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                                Tidak ada pegawai ditemukan
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredEmployees.map((employee, index) => (
                                            <TableRow key={employee.id}>
                                                <TableCell>{index + 1}</TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="h-8 w-8">
                                                            <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${employee.name}`} />
                                                            <AvatarFallback>{employee.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                                                        </Avatar>
                                                        <span className="font-medium">{employee.name}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>{employee.nip}</TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="capitalize">
                                                        {employee.role === 'user_unit' ? 'Pegawai Unit' : employee.role.replace('_', ' ')}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button
                                                        size="sm"
                                                        onClick={() => navigate(`/employee-of-the-month/rate/${employee.id}`)}
                                                        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                                                    >
                                                        <ThumbsUp className="h-4 w-4 mr-2" />
                                                        Nilai Pegawai
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
