import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { MessageSquare, Search, Clock, CheckCircle, XCircle } from "lucide-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { CardSkeleton, StatCardSkeleton } from "@/components/skeletons";
import { NoDataState, SearchState } from "@/components/EmptyState";

interface Consultation {
    id: string;
    subject: string;
    description: string;
    status: string;
    priority: string;
    is_escalated: boolean;
    created_at: string;
    resolved_at: string | null;
    closed_at: string | null;
    profiles: {
        name: string;
    };
}

export default function UnitConsultationHistory() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [consultations, setConsultations] = useState<Consultation[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");

    useEffect(() => {
        if (user?.work_unit_id) {
            loadConsultations();
        }
    }, [user]);

    const loadConsultations = async () => {
        try {
            // Fetch consultations without join
            const { data: consultationsData, error } = await supabase
                .from("consultations")
                .select("*")
                .eq("work_unit_id", user?.work_unit_id)
                .in("status", ["resolved", "closed"])
                .order("created_at", { ascending: false });

            if (error) throw error;

            // If we have consultations, fetch user names separately
            if (consultationsData && consultationsData.length > 0) {
                const userIds = [...new Set(consultationsData.map(c => c.user_id))];

                const { data: profilesData } = await supabase
                    .from("profiles")
                    .select("id, name")
                    .in("id", userIds);

                // Map profiles to consultations
                const consultationsWithProfiles = consultationsData.map(consultation => ({
                    ...consultation,
                    profiles: profilesData?.find(p => p.id === consultation.user_id) || { name: "Unknown User" }
                }));

                setConsultations(consultationsWithProfiles as any);
            } else {
                setConsultations([]);
            }
        } catch (error: any) {
            console.error("Error loading consultations:", error);
            toast.error("Gagal memuat riwayat konsultasi");
        } finally {
            setIsLoading(false);
        }
    };

    const filteredConsultations = consultations.filter((consultation) => {
        const matchesSearch =
            consultation.subject.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus =
            statusFilter === "all" || consultation.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    const stats = {
        total: consultations.length,
        resolved: consultations.filter((c) => c.status === "resolved").length,
        closed: consultations.filter((c) => c.status === "closed").length,
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Modern Header with Gradient */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-600 via-purple-500 to-purple-400 p-6 md:p-8 text-white shadow-xl">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -ml-24 -mb-24"></div>

                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 md:p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                                <CheckCircle className="h-6 w-6 md:h-8 md:w-8" />
                            </div>
                            <div>
                                <h1 className="text-2xl md:text-4xl font-bold">Riwayat Konsultasi Unit</h1>
                                <p className="text-sm md:text-base text-white/80 mt-1">
                                    Konsultasi yang telah selesai atau ditutup dari unit Anda
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Statistics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
                    {isLoading ? (
                        <>
                            <StatCardSkeleton />
                            <StatCardSkeleton />
                            <StatCardSkeleton />
                        </>
                    ) : (
                        <>
                            <Card className="relative overflow-hidden border-primary/20 hover:shadow-lg hover:scale-105 transition-all duration-300">
                                <div className="absolute top-0 right-0 w-20 h-20 bg-primary/5 rounded-full blur-2xl"></div>
                                <CardContent className="p-4 md:p-6 relative z-10">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="p-2 bg-primary/10 rounded-lg">
                                            <MessageSquare className="h-5 w-5 text-primary" />
                                        </div>
                                        <div className="text-2xl md:text-3xl font-bold text-primary">{stats.total}</div>
                                    </div>
                                    <p className="text-xs md:text-sm font-medium text-muted-foreground">Total Riwayat</p>
                                </CardContent>
                            </Card>
                            <Card className="relative overflow-hidden bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/30 dark:to-green-900/30 border-green-500/30 hover:shadow-lg hover:scale-105 transition-all duration-300">
                                <div className="absolute top-0 right-0 w-20 h-20 bg-green-500/10 rounded-full blur-2xl"></div>
                                <CardContent className="p-4 md:p-6 relative z-10">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="p-2 bg-green-500/10 rounded-lg">
                                            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                                        </div>
                                        <div className="text-2xl md:text-3xl font-bold text-green-600 dark:text-green-400">{stats.resolved}</div>
                                    </div>
                                    <p className="text-xs md:text-sm font-medium text-muted-foreground">Selesai</p>
                                </CardContent>
                            </Card>
                            <Card className="relative overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100/50 dark:from-gray-950/30 dark:to-gray-900/30 border-gray-500/30 hover:shadow-lg hover:scale-105 transition-all duration-300">
                                <div className="absolute top-0 right-0 w-20 h-20 bg-gray-500/10 rounded-full blur-2xl"></div>
                                <CardContent className="p-4 md:p-6 relative z-10">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="p-2 bg-gray-500/10 rounded-lg">
                                            <XCircle className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                                        </div>
                                        <div className="text-2xl md:text-3xl font-bold text-gray-600 dark:text-gray-400">{stats.closed}</div>
                                    </div>
                                    <p className="text-xs md:text-sm font-medium text-muted-foreground">Ditutup</p>
                                </CardContent>
                            </Card>
                        </>
                    )}
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CheckCircle className="h-5 w-5" />
                            Riwayat Konsultasi
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {/* Filters */}
                        <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Cari konsultasi..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10"
                                />
                            </div>

                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Filter Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua Status</SelectItem>
                                    <SelectItem value="resolved">Selesai</SelectItem>
                                    <SelectItem value="closed">Ditutup</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {isLoading ? (
                            <div className="grid gap-4">
                                <CardSkeleton />
                                <CardSkeleton />
                                <CardSkeleton />
                            </div>
                        ) : filteredConsultations.length === 0 ? (
                            <div className="py-12">
                                {searchQuery || statusFilter !== "all" ? (
                                    <SearchState message="Tidak ada riwayat konsultasi yang sesuai dengan filter pencarian" />
                                ) : (
                                    <NoDataState message="Tidak ada riwayat konsultasi" />
                                )}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {filteredConsultations.map((consultation) => (
                                    <Card
                                        key={consultation.id}
                                        className="hover:shadow-md transition-shadow cursor-pointer"
                                        onClick={() => navigate(`/konsultasi/${consultation.id}`)}
                                    >
                                        <CardContent className="p-4 md:p-6">
                                            <div className="flex flex-col md:flex-row items-start justify-between gap-3 md:gap-4">
                                                <div className="flex-1 space-y-2 min-w-0 w-full">
                                                    <div className="flex items-center gap-2">
                                                        <h3 className="font-semibold text-base md:text-lg truncate">
                                                            {consultation.subject}
                                                        </h3>
                                                    </div>

                                                    <p className="text-sm text-muted-foreground line-clamp-2">
                                                        {consultation.description}
                                                    </p>

                                                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs md:text-sm text-muted-foreground">
                                                        <span className="shrink-0">
                                                            {(consultation.profiles as any)?.name}
                                                        </span>
                                                        <span className="hidden sm:inline text-muted-foreground">•</span>
                                                        <div className="flex items-center gap-1 shrink-0">
                                                            <Clock className="h-3 w-3 text-muted-foreground" />
                                                            <span>
                                                                {format(
                                                                    new Date(consultation.created_at),
                                                                    "d MMM yyyy HH:mm",
                                                                    { locale: localeId }
                                                                )}
                                                            </span>
                                                        </div>
                                                        {consultation.resolved_at && (
                                                            <>
                                                                <span className="hidden sm:inline text-muted-foreground">•</span>
                                                                <div className="flex items-center gap-1 shrink-0">
                                                                    <CheckCircle className="h-3 w-3 text-green-600" />
                                                                    <span className="text-green-600 text-xs">
                                                                        Selesai: {format(
                                                                            new Date(consultation.resolved_at),
                                                                            "d MMM yyyy",
                                                                            { locale: localeId }
                                                                        )}
                                                                    </span>
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex items-center pt-2 md:pt-0 border-t md:border-t-0 w-full md:w-auto mt-2 md:mt-0">
                                                    <Badge
                                                        variant={
                                                            consultation.status === "resolved"
                                                                ? "outline"
                                                                : "secondary"
                                                        }
                                                        className={`text-[10px] md:text-xs ${
                                                            consultation.status === "resolved"
                                                                ? "border-green-600 text-green-600"
                                                                : ""
                                                        }`}
                                                    >
                                                        {consultation.status === "resolved" && "Selesai"}
                                                        {consultation.status === "closed" && "Ditutup"}
                                                    </Badge>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
