import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { WORK_UNITS } from "@/lib/constants";
import { Trophy, ThumbsUp, Star, Medal, Search, User, TrendingUp, Award, Crown, Briefcase, Building2, Quote } from "lucide-react";
import confetti from "canvas-confetti";
import { TestimonialCarousel, Testimonial } from "@/components/ui/testimonial-carousel";

export default function EmployeeOfTheMonth() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [employees, setEmployees] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [leaderboard, setLeaderboard] = useState<Array<{ employeeId: string, totalPoints: number, ratingCount: number }>>([]);
    const [activeTab, setActiveTab] = useState("employees");
    const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
    const [yearlyLeaderboard, setYearlyLeaderboard] = useState<Array<{ employeeId: string, totalPoints: number, ratingCount: number }>>([]);

    useEffect(() => {
        loadEmployees();
        loadLeaderboard();
        loadYearlyLeaderboard();
    }, []);

    // Trigger confetti fireworks when winner is displayed
    useEffect(() => {
        if ((leaderboard.length > 0 && activeTab === "leaderboard") || (yearlyLeaderboard.length > 0 && activeTab === "yearly")) {
            // Delay to ensure page is rendered
            const timer = setTimeout(() => {
                const duration = 5 * 1000; // 5 seconds
                const animationEnd = Date.now() + duration;
                const defaults = {
                    startVelocity: 30,
                    spread: 360,
                    ticks: 60,
                    zIndex: 0,
                    colors: ["#facc15", "#fbbf24", "#f59e0b", "#f97316", "#eab308"] // Gold/Yellow colors
                };

                const randomInRange = (min: number, max: number) =>
                    Math.random() * (max - min) + min;

                const interval = window.setInterval(() => {
                    const timeLeft = animationEnd - Date.now();

                    if (timeLeft <= 0) {
                        return clearInterval(interval);
                    }

                    const particleCount = 50 * (timeLeft / duration);

                    // Fire from left side
                    confetti({
                        ...defaults,
                        particleCount,
                        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
                    });

                    // Fire from right side
                    confetti({
                        ...defaults,
                        particleCount,
                        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
                    });
                }, 250);

                return () => clearInterval(interval);
            }, 500);

            return () => clearTimeout(timer);
        }
    }, [leaderboard, yearlyLeaderboard, activeTab]);

    const loadEmployees = async () => {
        setIsLoading(true);
        const { data, error } = await supabase
            .from("profiles")
            .select("*")
            .eq("role", "user_unit");

        if (error) {
            toast.error("Gagal memuat data pegawai");
            console.error("Error details:", error);
        } else {
            setEmployees(data || []);
        }
        setIsLoading(false);
    };

    const loadLeaderboard = async () => {
        try {
            // Get current period
            const now = new Date();
            const currentPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

            // Fetch ratings from database
            const { data: ratings, error } = await supabase
                .from("employee_ratings")
                .select("*")
                .eq("rating_period", currentPeriod);

            if (error) {
                console.error('Error loading ratings:', error);
                return;
            }

            // Aggregate points by employee
            const pointsByEmployee: Record<string, { totalPoints: number, count: number }> = {};

            (ratings || []).forEach((rating: any) => {
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

            // Get testimonials for the winner (top employee)
            if (leaderboardData.length > 0) {
                const winnerId = leaderboardData[0].employeeId;
                const winnerRatings = (ratings || []).filter((r: any) => r.rated_employee_id === winnerId && r.reason);

                // Get rater profiles for testimonials
                const raterIds = winnerRatings.map((r: any) => r.rater_id);
                const { data: raterProfiles } = await supabase
                    .from("profiles")
                    .select("id, name")
                    .in("id", raterIds);

                const raterMap = (raterProfiles || []).reduce((acc: any, p: any) => {
                    acc[p.id] = p.name;
                    return acc;
                }, {});

                const testimonialData: Testimonial[] = winnerRatings.map((r: any, index: number) => ({
                    id: index,
                    name: raterMap[r.rater_id] || "Rekan Kerja",
                    role: "Pegawai",
                    company: "Kemnaker",
                    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${raterMap[r.rater_id] || "User"}`,
                    rating: 5,
                    text: r.reason,
                    results: r.criteria_totals ? Object.entries(r.criteria_totals).map(([key, value]: [string, any]) => `${key.replace('_', ' ')}: ${value}/25`).slice(0, 3) : undefined
                }));

                setTestimonials(testimonialData);
            }
        } catch (error) {
            console.error('Error loading leaderboard:', error);
        }
    };

    const loadYearlyLeaderboard = async () => {
        try {
            const now = new Date();
            const currentYear = now.getFullYear().toString();

            // Fetch all ratings for the current year
            const { data: ratings, error } = await supabase
                .from("employee_ratings")
                .select("*")
                .ilike("rating_period", `${currentYear}-%`);

            if (error) {
                console.error('Error loading yearly ratings:', error);
                return;
            }

            // Aggregate points by employee
            const pointsByEmployee: Record<string, { totalPoints: number, count: number }> = {};

            (ratings || []).forEach((rating: any) => {
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

            setYearlyLeaderboard(leaderboardData);
        } catch (error) {
            console.error('Error loading yearly leaderboard:', error);
        }
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    // Filter employees based on search term
    const filteredEmployees = employees.filter(employee =>
        employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.nip.includes(searchTerm)
    );

    // Get employee details for leaderboard
    const leaderboardWithDetails = leaderboard.map((entry, index) => {
        const employee = employees.find(e => e.id === entry.employeeId);
        return {
            ...entry,
            rank: index + 1,
            employee
        };
    }).filter(entry => entry.employee); // Filter out entries without employee data

    const yearlyLeaderboardWithDetails = yearlyLeaderboard.map((entry, index) => {
        const employee = employees.find(e => e.id === entry.employeeId);
        return {
            ...entry,
            rank: index + 1,
            employee
        };
    }).filter(entry => entry.employee);

    const topEmployee = leaderboardWithDetails[0];

    return (
        <DashboardLayout>
            <div className="space-y-8">
                {/* Enhanced Header with Gradient */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-yellow-600 via-yellow-500 to-yellow-400 p-6 md:p-8 text-white shadow-xl">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32 blur-3xl" />
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-16 -translate-x-16 blur-2xl" />

                    <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                                <Trophy className="h-8 w-8 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl md:text-3xl font-bold text-white">
                                    Employee of The Month
                                </h1>
                                <p className="text-white/90 mt-1 text-sm md:text-base">
                                    Berikan apresiasi "Good Point" kepada rekan kerja terbaik Anda!
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full border border-white/30 shadow-sm">
                            <Trophy className="h-5 w-5 text-white" />
                            <span className="font-semibold text-white text-sm">
                                Periode: {new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Winner Section with Testimonials */}
                {topEmployee && activeTab !== "yearly" && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
                        {/* Winner Card */}
                        <Card className="bg-gradient-to-br from-yellow-50 via-white to-yellow-50/50 dark:from-yellow-950/30 dark:via-background dark:to-yellow-950/20 border-yellow-200 dark:border-yellow-800 shadow-xl overflow-hidden relative h-full">
                            <div className="absolute top-0 right-0 p-4 opacity-5">
                                <Trophy className="h-96 w-96 text-yellow-500" />
                            </div>
                            <CardContent className="p-8 md:p-12 h-full flex flex-col justify-center">
                                <div className="flex flex-col items-center text-center space-y-6 relative z-10">
                                    {/* Crown Icon */}
                                    <div className="relative">
                                        <Crown className="h-16 w-16 text-yellow-500 drop-shadow-lg animate-pulse" />
                                    </div>

                                    {/* Avatar */}
                                    <div className="relative">
                                        <div className="absolute -inset-4 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full blur-xl opacity-50 animate-pulse"></div>
                                        <Avatar className="h-40 w-40 md:h-48 md:w-48 border-8 border-yellow-400 shadow-2xl relative z-10 ring-4 ring-yellow-200 dark:ring-yellow-800">
                                            <AvatarImage
                                                src={topEmployee.employee.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${topEmployee.employee.name}`}
                                                alt={topEmployee.employee.name}
                                            />
                                            <AvatarFallback className="text-4xl md:text-5xl font-bold bg-gradient-to-br from-yellow-400 to-yellow-600 text-white">
                                                {getInitials(topEmployee.employee.name)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2">
                                            <Badge className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white border-none px-4 py-1 text-sm font-bold shadow-lg">
                                                🏆 WINNER
                                            </Badge>
                                        </div>
                                    </div>

                                    {/* Employee Info */}
                                    <div className="space-y-3">
                                        <h2 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-yellow-600 to-yellow-800 bg-clip-text text-transparent">
                                            {topEmployee.employee.name}
                                        </h2>
                                        <p className="text-xl text-muted-foreground font-medium">
                                            NIP: {topEmployee.employee.nip}
                                        </p>

                                        {/* Jabatan dan Unit Kerja */}
                                        <div className="flex flex-col gap-2 mt-3">
                                            {topEmployee.employee.jabatan && (
                                                <div className="flex items-center justify-center gap-2 text-base">
                                                    <Briefcase className="h-5 w-5 text-muted-foreground" />
                                                    <span className="font-semibold">{topEmployee.employee.jabatan}</span>
                                                </div>
                                            )}
                                            {topEmployee.employee.work_unit_id && (() => {
                                                const workUnit = WORK_UNITS.find(u => u.id === topEmployee.employee.work_unit_id);
                                                return workUnit ? (
                                                    <div className="flex items-center justify-center gap-2 text-base">
                                                        <Building2 className="h-5 w-5 text-muted-foreground" />
                                                        <span className="font-semibold">{workUnit.name}</span>
                                                    </div>
                                                ) : null;
                                            })()}
                                        </div>
                                    </div>

                                    {/* Points Display */}
                                    <div className="flex flex-col md:flex-row items-center gap-6 mt-6">
                                        <div className="flex items-center gap-3 bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 dark:from-yellow-500/10 dark:to-yellow-600/10 px-8 py-4 rounded-2xl border-2 border-yellow-400 dark:border-yellow-600">
                                            <Star className="h-10 w-10 fill-yellow-500 text-yellow-500" />
                                            <div className="text-left">
                                                <p className="text-sm text-muted-foreground font-medium">Total Poin</p>
                                                <p className="text-4xl font-black text-yellow-600 dark:text-yellow-400">
                                                    {topEmployee.totalPoints}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 bg-muted/50 px-6 py-4 rounded-2xl">
                                            <Award className="h-8 w-8 text-muted-foreground" />
                                            <div className="text-left">
                                                <p className="text-sm text-muted-foreground font-medium">Penilaian</p>
                                                <p className="text-2xl font-bold">
                                                    {topEmployee.ratingCount}x
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Testimonials Card */}
                        <div className="flex flex-col justify-center">
                            {testimonials.length > 0 ? (
                                <div className="space-y-4">
                                    <div className="text-center lg:text-left mb-6">
                                        <h3 className="text-2xl font-bold flex items-center justify-center lg:justify-start gap-2">
                                            <Quote className="h-6 w-6 text-yellow-500" />
                                            Kata Rekan Kerja
                                        </h3>
                                        <p className="text-muted-foreground">
                                            Apa kata mereka tentang {topEmployee.employee.name.split(' ')[0]}?
                                        </p>
                                    </div>
                                    <TestimonialCarousel testimonials={testimonials} />
                                </div>
                            ) : (
                                <Card className="h-full flex items-center justify-center p-8 bg-muted/30 border-dashed">
                                    <div className="text-center space-y-4 text-muted-foreground">
                                        <Quote className="h-12 w-12 mx-auto opacity-20" />
                                        <p className="text-lg font-medium">Belum ada ulasan tertulis</p>
                                        <p className="text-sm">
                                            Jadilah yang pertama memberikan penilaian dan ulasan untuk {topEmployee.employee.name}!
                                        </p>
                                    </div>
                                </Card>
                            )}
                        </div>
                    </div>
                )}

                {/* Tabs for Employees List and Leaderboard */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-3 h-12 bg-muted/50">
                        <TabsTrigger
                            value="employees"
                            className="text-base font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white"
                        >
                            <User className="h-4 w-4 mr-2" />
                            Daftar Pegawai
                        </TabsTrigger>
                        <TabsTrigger
                            value="leaderboard"
                            className="text-base font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-yellow-500 data-[state=active]:to-yellow-600 data-[state=active]:text-white"
                        >
                            <TrendingUp className="h-4 w-4 mr-2" />
                            Leaderboard Bulanan
                        </TabsTrigger>
                        <TabsTrigger
                            value="yearly"
                            className="text-base font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-600 data-[state=active]:text-white"
                        >
                            <Crown className="h-4 w-4 mr-2" />
                            Employee of The Year
                        </TabsTrigger>
                    </TabsList>

                    {/* Employees List Tab */}
                    <TabsContent value="employees" className="mt-6 data-[state=active]:animate-in data-[state=active]:fade-in data-[state=active]:slide-in-from-bottom-4 data-[state=active]:duration-500">
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
                                <Tabs defaultValue="asn" className="w-full">
                                    <TabsList className="grid w-full grid-cols-2 mb-6">
                                        <TabsTrigger value="asn">ASN</TabsTrigger>
                                        <TabsTrigger value="non_asn">Non ASN</TabsTrigger>
                                    </TabsList>

                                    {["asn", "non_asn"].map((type) => (
                                        <TabsContent key={type} value={type}>
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
                                                        {filteredEmployees.filter(e =>
                                                            type === "asn"
                                                                ? (e.kriteria_asn === "ASN" || !e.kriteria_asn)
                                                                : e.kriteria_asn === "Non ASN"
                                                        ).length === 0 ? (
                                                            <TableRow>
                                                                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                                                    Tidak ada pegawai {type === "asn" ? "ASN" : "Non ASN"} ditemukan
                                                                </TableCell>
                                                            </TableRow>
                                                        ) : (
                                                            filteredEmployees
                                                                .filter(e =>
                                                                    type === "asn"
                                                                        ? (e.kriteria_asn === "ASN" || !e.kriteria_asn)
                                                                        : e.kriteria_asn === "Non ASN"
                                                                )
                                                                .map((employee, index) => (
                                                                    <TableRow key={employee.id}>
                                                                        <TableCell>{index + 1}</TableCell>
                                                                        <TableCell>
                                                                            <div className="flex items-center gap-3">
                                                                                <Avatar className="h-8 w-8">
                                                                                    <AvatarImage
                                                                                        src={employee.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${employee.name}`}
                                                                                        alt={employee.name}
                                                                                    />
                                                                                    <AvatarFallback>{getInitials(employee.name)}</AvatarFallback>
                                                                                </Avatar>
                                                                                <span className="font-medium">{employee.name}</span>
                                                                            </div>
                                                                        </TableCell>
                                                                        <TableCell>{employee.nip || "-"}</TableCell>
                                                                        <TableCell>
                                                                            <Badge variant="outline" className="capitalize">
                                                                                {employee.jabatan || (employee.role === 'user_unit' ? 'Pegawai Unit' : employee.role.replace('_', ' '))}
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
                                        </TabsContent>
                                    ))}
                                </Tabs>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Leaderboard Tab */}
                    <TabsContent value="leaderboard" className="mt-6 data-[state=active]:animate-in data-[state=active]:fade-in data-[state=active]:slide-in-from-bottom-4 data-[state=active]:duration-500">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <TrendingUp className="h-5 w-5 text-yellow-600" />
                                    Leaderboard Bulanan
                                </CardTitle>
                                <p className="text-sm text-muted-foreground mt-2">
                                    Peringkat berdasarkan total poin yang diperoleh dari penilaian rekan kerja bulan ini
                                </p>
                            </CardHeader>
                            <CardContent>
                                <Tabs defaultValue="asn" className="w-full">
                                    <TabsList className="grid w-full grid-cols-2 mb-6">
                                        <TabsTrigger value="asn">ASN</TabsTrigger>
                                        <TabsTrigger value="non_asn">Non ASN</TabsTrigger>
                                    </TabsList>

                                    {["asn", "non_asn"].map((type) => (
                                        <TabsContent key={type} value={type}>
                                            {leaderboardWithDetails.filter(e =>
                                                type === "asn"
                                                    ? (e.employee.kriteria_asn === "ASN" || !e.employee.kriteria_asn)
                                                    : e.employee.kriteria_asn === "Non ASN"
                                            ).length === 0 ? (
                                                <div className="text-center py-12">
                                                    <Trophy className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                                                    <p className="text-muted-foreground text-lg">
                                                        Belum ada data penilaian {type === "asn" ? "ASN" : "Non ASN"} untuk periode ini
                                                    </p>
                                                    <p className="text-sm text-muted-foreground mt-2">
                                                        Mulai berikan penilaian kepada rekan kerja Anda!
                                                    </p>
                                                </div>
                                            ) : (
                                                <div className="space-y-3">
                                                    {leaderboardWithDetails
                                                        .filter(e =>
                                                            type === "asn"
                                                                ? (e.employee.kriteria_asn === "ASN" || !e.employee.kriteria_asn)
                                                                : e.employee.kriteria_asn === "Non ASN"
                                                        )
                                                        .map((entry, index) => {
                                                            const rank = index + 1;
                                                            const isTop3 = rank <= 3;
                                                            const isWinner = rank === 1;

                                                            return (
                                                                <div
                                                                    key={entry.employeeId}
                                                                    className={`
                                                                        flex items-center gap-4 p-4 rounded-xl border-2 transition-all hover:shadow-md
                                                                        ${isWinner ? 'bg-gradient-to-r from-yellow-50 to-yellow-100/50 dark:from-yellow-950/30 dark:to-yellow-900/20 border-yellow-400 dark:border-yellow-600' :
                                                                            isTop3 ? 'bg-gradient-to-r from-blue-50 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/10 border-blue-300 dark:border-blue-700' :
                                                                                'bg-muted/30 border-border hover:border-primary/50'}
                                                                    `}
                                                                >
                                                                    {/* Rank Badge */}
                                                                    <div className={`
                                                                        flex items-center justify-center w-12 h-12 rounded-full font-black text-lg shrink-0
                                                                        ${isWinner ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-white shadow-lg' :
                                                                            rank === 2 ? 'bg-gradient-to-br from-gray-300 to-gray-500 text-white shadow-md' :
                                                                                rank === 3 ? 'bg-gradient-to-br from-orange-400 to-orange-600 text-white shadow-md' :
                                                                                    'bg-muted text-muted-foreground'}
                                                                    `}>
                                                                        {isWinner ? <Crown className="h-6 w-6" /> :
                                                                            rank === 2 ? <Medal className="h-6 w-6" /> :
                                                                                rank === 3 ? <Medal className="h-6 w-6" /> :
                                                                                    `#${rank}`}
                                                                    </div>

                                                                    {/* Avatar */}
                                                                    <Avatar className={`h-14 w-14 ${isTop3 ? 'border-4' : 'border-2'} ${isWinner ? 'border-yellow-400' : isTop3 ? 'border-blue-400' : 'border-border'}`}>
                                                                        <AvatarImage
                                                                            src={entry.employee.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${entry.employee.name}`}
                                                                            alt={entry.employee.name}
                                                                        />
                                                                        <AvatarFallback className={isWinner ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300' : ''}>
                                                                            {getInitials(entry.employee.name)}
                                                                        </AvatarFallback>
                                                                    </Avatar>

                                                                    {/* Employee Info */}
                                                                    <div className="flex-1 min-w-0">
                                                                        <h3 className={`font-bold truncate ${isWinner ? 'text-lg text-yellow-700 dark:text-yellow-400' : 'text-base'}`}>
                                                                            {entry.employee.name}
                                                                        </h3>
                                                                        <p className="text-sm text-muted-foreground truncate">
                                                                            {entry.employee.nip}
                                                                        </p>
                                                                    </div>

                                                                    {/* Points */}
                                                                    <div className="text-right">
                                                                        <div className={`flex items-center gap-2 ${isWinner ? 'text-yellow-600 dark:text-yellow-400' : 'text-foreground'}`}>
                                                                            <Star className={`h-5 w-5 ${isWinner ? 'fill-current' : ''}`} />
                                                                            <span className="text-2xl font-black">
                                                                                {entry.totalPoints}
                                                                            </span>
                                                                        </div>
                                                                        <p className="text-xs text-muted-foreground mt-1">
                                                                            {entry.ratingCount} penilaian
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                </div>
                                            )}
                                        </TabsContent>
                                    ))}
                                </Tabs>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Yearly Leaderboard Tab */}
                    <TabsContent value="yearly" className="mt-6 data-[state=active]:animate-in data-[state=active]:fade-in data-[state=active]:slide-in-from-bottom-4 data-[state=active]:duration-500">
                        <Card className="border-purple-200 dark:border-purple-800">
                            <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/20">
                                <CardTitle className="flex items-center gap-2 text-purple-700 dark:text-purple-400">
                                    <Crown className="h-6 w-6" />
                                    Employee of The Year {new Date().getFullYear()}
                                </CardTitle>
                                <p className="text-sm text-muted-foreground mt-2">
                                    Akumulasi total poin sepanjang tahun ini. Pemenang akan dinobatkan di akhir tahun!
                                </p>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <Tabs defaultValue="asn" className="w-full">
                                    <TabsList className="grid w-full grid-cols-2 mb-6">
                                        <TabsTrigger value="asn">ASN</TabsTrigger>
                                        <TabsTrigger value="non_asn">Non ASN</TabsTrigger>
                                    </TabsList>

                                    {["asn", "non_asn"].map((type) => (
                                        <TabsContent key={type} value={type}>
                                            {yearlyLeaderboardWithDetails.filter(e =>
                                                type === "asn"
                                                    ? (e.employee.kriteria_asn === "ASN" || !e.employee.kriteria_asn)
                                                    : e.employee.kriteria_asn === "Non ASN"
                                            ).length === 0 ? (
                                                <div className="text-center py-12">
                                                    <Crown className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                                                    <p className="text-muted-foreground text-lg">
                                                        Belum ada data penilaian {type === "asn" ? "ASN" : "Non ASN"} untuk tahun ini
                                                    </p>
                                                </div>
                                            ) : (
                                                <div className="space-y-4">
                                                    {/* Top 1 Yearly Winner Display */}
                                                    {yearlyLeaderboardWithDetails
                                                        .filter(e =>
                                                            type === "asn"
                                                                ? (e.employee.kriteria_asn === "ASN" || !e.employee.kriteria_asn)
                                                                : e.employee.kriteria_asn === "Non ASN"
                                                        )[0] && (
                                                            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-600 via-purple-500 to-pink-500 p-8 text-white shadow-xl mb-8">
                                                                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32 blur-3xl" />
                                                                <div className="flex flex-col items-center text-center relative z-10">
                                                                    <div className="bg-white/20 p-3 rounded-full mb-4 backdrop-blur-sm">
                                                                        <Crown className="h-12 w-12 text-white" />
                                                                    </div>
                                                                    <h3 className="text-xl font-medium text-white/90 mb-2">Kandidat Terkuat {type === "asn" ? "ASN" : "Non ASN"}</h3>
                                                                    <h2 className="text-4xl font-bold mb-4">
                                                                        {yearlyLeaderboardWithDetails
                                                                            .filter(e =>
                                                                                type === "asn"
                                                                                    ? (e.employee.kriteria_asn === "ASN" || !e.employee.kriteria_asn)
                                                                                    : e.employee.kriteria_asn === "Non ASN"
                                                                            )[0].employee.name}
                                                                    </h2>
                                                                    <div className="flex items-center gap-2 bg-white/20 px-6 py-3 rounded-full backdrop-blur-sm">
                                                                        <Star className="h-6 w-6 fill-yellow-400 text-yellow-400" />
                                                                        <span className="text-2xl font-bold">
                                                                            {yearlyLeaderboardWithDetails
                                                                                .filter(e =>
                                                                                    type === "asn"
                                                                                        ? (e.employee.kriteria_asn === "ASN" || !e.employee.kriteria_asn)
                                                                                        : e.employee.kriteria_asn === "Non ASN"
                                                                                )[0].totalPoints} Poin
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}

                                                    <div className="space-y-3">
                                                        {yearlyLeaderboardWithDetails
                                                            .filter(e =>
                                                                type === "asn"
                                                                    ? (e.employee.kriteria_asn === "ASN" || !e.employee.kriteria_asn)
                                                                    : e.employee.kriteria_asn === "Non ASN"
                                                            )
                                                            .map((entry, index) => {
                                                                const rank = index + 1;
                                                                const isWinner = rank === 1;

                                                                return (
                                                                    <div
                                                                        key={entry.employeeId}
                                                                        className={`
                                                                            flex items-center gap-4 p-4 rounded-xl border-2 transition-all hover:shadow-md
                                                                            ${isWinner ? 'bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/20 border-purple-400 dark:border-purple-600' :
                                                                                'bg-muted/30 border-border hover:border-primary/50'}
                                                                        `}
                                                                    >
                                                                        <div className={`
                                                                            flex items-center justify-center w-12 h-12 rounded-full font-black text-lg shrink-0
                                                                            ${isWinner ? 'bg-gradient-to-br from-purple-400 to-pink-600 text-white shadow-lg' :
                                                                                'bg-muted text-muted-foreground'}
                                                                        `}>
                                                                            {isWinner ? <Crown className="h-6 w-6" /> : `#${rank}`}
                                                                        </div>

                                                                        <Avatar className={`h-14 w-14 ${isWinner ? 'border-4 border-purple-400' : 'border-2 border-border'}`}>
                                                                            <AvatarImage
                                                                                src={entry.employee.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${entry.employee.name}`}
                                                                                alt={entry.employee.name}
                                                                            />
                                                                            <AvatarFallback>{getInitials(entry.employee.name)}</AvatarFallback>
                                                                        </Avatar>

                                                                        <div className="flex-1 min-w-0">
                                                                            <h3 className="font-bold truncate text-base">
                                                                                {entry.employee.name}
                                                                            </h3>
                                                                            <p className="text-sm text-muted-foreground truncate">
                                                                                {entry.employee.nip}
                                                                            </p>
                                                                        </div>

                                                                        <div className="text-right">
                                                                            <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
                                                                                <Star className="h-5 w-5 fill-current" />
                                                                                <span className="text-2xl font-black">
                                                                                    {entry.totalPoints}
                                                                                </span>
                                                                            </div>
                                                                            <p className="text-xs text-muted-foreground mt-1">
                                                                                Total {entry.ratingCount} penilaian
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                    </div>
                                                </div>
                                            )}
                                        </TabsContent>
                                    ))}
                                </Tabs>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </DashboardLayout>
    );
}
