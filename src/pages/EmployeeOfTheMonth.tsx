import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Trophy, ThumbsUp, Star, Medal } from "lucide-react";

export default function EmployeeOfTheMonth() {
    const { user } = useAuth();
    const [employees, setEmployees] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [votes, setVotes] = useState<Record<string, number>>({});

    useEffect(() => {
        loadEmployees();
    }, []);

    const loadEmployees = async () => {
        setIsLoading(true);
        // Fetch all users with role 'user_unit'
        const { data, error } = await supabase
            .from("profiles")
            .select("*")
            .eq("role", "user_unit");

        if (error) {
            toast.error("Gagal memuat data pegawai");
            console.error(error);
        } else {
            // Filter out the current user so they can't vote for themselves (optional rule, but common)
            // For now, let's show everyone but disable voting for self
            setEmployees(data || []);
        }
        setIsLoading(false);
    };

    const handleVote = (employeeId: string, employeeName: string) => {
        if (employeeId === user?.id) {
            toast.error("Anda tidak dapat memilih diri sendiri!");
            return;
        }

        // Mock voting logic for now
        setVotes(prev => ({
            ...prev,
            [employeeId]: (prev[employeeId] || 0) + 1
        }));

        toast.success(`Anda memberikan Good Point untuk ${employeeName}`);
    };

    // Sort employees by votes (mock leaderboard)
    const sortedEmployees = [...employees].sort((a, b) => {
        const votesA = votes[a.id] || 0;
        const votesB = votes[b.id] || 0;
        return votesB - votesA;
    });

    const topEmployee = sortedEmployees[0];

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
                {topEmployee && (votes[topEmployee.id] || 0) > 0 && (
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
                            <div className="text-center md:text-left space-y-2">
                                <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white border-none mb-2">
                                    Current Leader
                                </Badge>
                                <h2 className="text-3xl font-bold">{topEmployee.name}</h2>
                                <p className="text-lg text-muted-foreground">{topEmployee.nip}</p>
                                <div className="flex items-center justify-center md:justify-start gap-2 text-yellow-600 dark:text-yellow-400 font-bold text-xl mt-2">
                                    <Star className="h-6 w-6 fill-current" />
                                    <span>{votes[topEmployee.id] || 0} Good Points</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Employee Grid */}
                <div>
                    <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Daftar Pegawai
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {sortedEmployees.map((employee, index) => (
                            <Card key={employee.id} className="hover:shadow-md transition-shadow border-l-4 border-l-transparent hover:border-l-primary">
                                <CardContent className="p-6">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex items-center gap-4">
                                            <Avatar className="h-12 w-12 border-2 border-muted">
                                                <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${employee.name}`} />
                                                <AvatarFallback>{employee.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <h4 className="font-semibold line-clamp-1">{employee.name}</h4>
                                                <p className="text-xs text-muted-foreground">{employee.nip}</p>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-1">
                                            <Badge variant="secondary" className="font-mono">
                                                #{index + 1}
                                            </Badge>
                                        </div>
                                    </div>

                                    <div className="mt-6 flex items-center justify-between">
                                        <div className="flex items-center gap-1 text-sm font-medium text-muted-foreground">
                                            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                                            <span>{votes[employee.id] || 0} Points</span>
                                        </div>
                                        <Button
                                            size="sm"
                                            onClick={() => handleVote(employee.id, employee.name)}
                                            disabled={employee.id === user?.id}
                                            variant={employee.id === user?.id ? "outline" : "default"}
                                            className={employee.id !== user?.id ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700" : ""}
                                        >
                                            <ThumbsUp className="h-4 w-4 mr-2" />
                                            {employee.id === user?.id ? "You" : "Vote"}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}

// Helper component for the icon
function Users({ className }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
    )
}
