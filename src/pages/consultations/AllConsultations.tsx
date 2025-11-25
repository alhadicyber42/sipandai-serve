import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MessageSquare, Search, Clock, AlertCircle, CheckCircle2, XCircle, TrendingUp, Building2 } from "lucide-react";
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
  category: string | null;
  is_escalated: boolean;
  created_at: string;
  user_id: string;
  work_unit_id: number;
  profiles: {
    name: string;
  };
  work_units: {
    name: string;
  };
}

export default function AllConsultations() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");

  useEffect(() => {
    loadConsultations();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('consultations-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'consultations'
        },
        () => {
          loadConsultations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadConsultations = async () => {
    try {
      // Load escalated consultations
      let query = supabase
        .from("consultations")
        .select(`
          *,
          profiles!consultations_user_id_fkey (name),
          work_units (name)
        `);

      // If admin_unit, only show escalated consultations from their unit
      if (user?.role === "admin_unit") {
        query = query.eq("is_escalated", true);
        if (user?.work_unit_id) {
          query = query.eq("work_unit_id", user.work_unit_id);
        }
      }

      const { data, error } = await query.order("created_at", { ascending: false });

      if (error) throw error;
      setConsultations(data as any || []);
    } catch (error: any) {
      console.error("Error loading consultations:", error);
      toast.error("Gagal memuat data konsultasi");
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      submitted: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200",
      in_progress: "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200",
      resolved: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200",
      closed: "bg-gray-100 text-gray-800 dark:bg-gray-950 dark:text-gray-200",
      escalated: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200",
    };
    return colors[status] || colors.submitted;
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      submitted: "Baru",
      in_progress: "Dalam Proses",
      resolved: "Selesai",
      closed: "Ditutup",
      escalated: "Tereskalasi",
    };
    return labels[status] || status;
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      low: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200",
      medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200",
      high: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200",
    };
    return colors[priority] || colors.medium;
  };

  const getPriorityLabel = (priority: string) => {
    const labels: Record<string, string> = {
      low: "Rendah",
      medium: "Sedang",
      high: "Tinggi",
    };
    return labels[priority] || priority;
  };

  const filteredConsultations = consultations.filter((consultation) => {
    const matchesSearch =
      consultation.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      consultation.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || consultation.status === statusFilter;
    const matchesPriority = priorityFilter === "all" || consultation.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  // Statistics (all are escalated since we filter by is_escalated=true)
  const stats = {
    total: consultations.length,
    pending: consultations.filter((c) => c.status === "escalated" || c.status === "submitted").length,
    in_progress: consultations.filter((c) => c.status === "under_review" || c.status === "escalated_responded").length,
    resolved: consultations.filter((c) => c.status === "resolved" || c.status === "closed").length,
  };

  // Allow both admin_pusat and admin_unit to access this page
  if (user?.role !== "admin_pusat" && user?.role !== "admin_unit") {
    return (
      <DashboardLayout>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Akses Ditolak</h3>
            <p className="text-sm text-muted-foreground">Anda tidak memiliki akses ke halaman ini.</p>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Modern Header with Gradient */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-cyan-600 via-cyan-500 to-cyan-400 p-6 md:p-8 text-white shadow-xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -ml-24 -mb-24"></div>

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 md:p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <MessageSquare className="h-6 w-6 md:h-8 md:w-8" />
              </div>
              <div>
                <h1 className="text-2xl md:text-4xl font-bold">
                  {user?.role === "admin_pusat" ? "Konsultasi Masuk" : "Konsultasi Tereskalasi"}
                </h1>
                <p className="text-sm md:text-base text-white/80 mt-1">
                  {user?.role === "admin_pusat"
                    ? "Kelola semua konsultasi yang masuk dari unit kerja"
                    : "Konsultasi dari unit Anda yang diteruskan ke Admin Pusat"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {isLoading ? (
            <>
              <StatCardSkeleton />
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
                  <p className="text-xs md:text-sm font-medium text-muted-foreground">Total Konsultasi</p>
                </CardContent>
              </Card>

              <Card className="relative overflow-hidden bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/30 border-blue-500/30 hover:shadow-lg hover:scale-105 transition-all duration-300">
                <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/10 rounded-full blur-2xl"></div>
                <CardContent className="p-4 md:p-6 relative z-10">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-blue-500/10 rounded-lg">
                      <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="text-2xl md:text-3xl font-bold text-blue-600 dark:text-blue-400">{stats.pending}</div>
                  </div>
                  <p className="text-xs md:text-sm font-medium text-muted-foreground">Menunggu Review</p>
                </CardContent>
              </Card>

              <Card className="relative overflow-hidden bg-gradient-to-br from-yellow-50 to-yellow-100/50 dark:from-yellow-950/30 dark:to-yellow-900/30 border-yellow-500/30 hover:shadow-lg hover:scale-105 transition-all duration-300">
                <div className="absolute top-0 right-0 w-20 h-20 bg-yellow-500/10 rounded-full blur-2xl"></div>
                <CardContent className="p-4 md:p-6 relative z-10">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-yellow-500/10 rounded-lg">
                      <TrendingUp className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                    </div>
                    <div className="text-2xl md:text-3xl font-bold text-yellow-600 dark:text-yellow-400">{stats.in_progress}</div>
                  </div>
                  <p className="text-xs md:text-sm font-medium text-muted-foreground">Dalam Proses</p>
                </CardContent>
              </Card>

              <Card className="relative overflow-hidden bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/30 dark:to-green-900/30 border-green-500/30 hover:shadow-lg hover:scale-105 transition-all duration-300">
                <div className="absolute top-0 right-0 w-20 h-20 bg-green-500/10 rounded-full blur-2xl"></div>
                <CardContent className="p-4 md:p-6 relative z-10">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-green-500/10 rounded-lg">
                      <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="text-2xl md:text-3xl font-bold text-green-600 dark:text-green-400">{stats.resolved}</div>
                  </div>
                  <p className="text-xs md:text-sm font-medium text-muted-foreground">Selesai</p>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Consultations List */}
        <Card className="shadow-lg">
          <CardContent className="p-6">
            {/* Filters */}
            <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari konsultasi..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-12"
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Filter Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="submitted">Baru</SelectItem>
                  <SelectItem value="in_progress">Dalam Proses</SelectItem>
                  <SelectItem value="resolved">Selesai</SelectItem>
                  <SelectItem value="closed">Ditutup</SelectItem>
                </SelectContent>
              </Select>

              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Filter Prioritas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Prioritas</SelectItem>
                  <SelectItem value="low">Rendah</SelectItem>
                  <SelectItem value="medium">Sedang</SelectItem>
                  <SelectItem value="high">Tinggi</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {isLoading ? (
              <div className="grid gap-4">
                <CardSkeleton />
                <CardSkeleton />
                <CardSkeleton />
              </div>
            ) : (
              <div className="grid gap-4">
                {filteredConsultations.length === 0 ? (
                  <div className="py-12">
                    {searchQuery || statusFilter !== "all" || priorityFilter !== "all" ? (
                      <SearchState message="Tidak ada konsultasi yang sesuai dengan filter pencarian" />
                    ) : (
                      <NoDataState message="Belum ada data konsultasi" />
                    )}
                  </div>
                ) : (
                  filteredConsultations.map((consultation) => (
                    <Card
                      key={consultation.id}
                      className="hover:shadow-lg transition-all duration-300 cursor-pointer group"
                      onClick={() => navigate(`/konsultasi/${consultation.id}`)}
                    >
                      <CardContent className="p-4 md:p-6">
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                          <div className="flex-1 space-y-3">
                            <div className="flex items-start gap-3">
                              <div className="p-2 bg-primary/10 rounded-lg mt-1">
                                <MessageSquare className="h-5 w-5 text-primary" />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="font-semibold text-base md:text-lg group-hover:text-primary transition-colors">
                                    {consultation.subject}
                                  </h3>
                                  {consultation.is_escalated && (
                                    <Badge variant="destructive" className="gap-1">
                                      <AlertCircle className="h-3 w-3" />
                                      Tereskalasi
                                    </Badge>
                                  )}
                                </div>

                                <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                                  {consultation.description}
                                </p>

                                <div className="flex flex-wrap items-center gap-2 text-xs md:text-sm text-muted-foreground">
                                  <div className="flex items-center gap-1">
                                    <Building2 className="h-3 w-3" />
                                    <span>{(consultation.profiles as any)?.name}</span>
                                  </div>
                                  <span>•</span>
                                  <span>{(consultation.work_units as any)?.name}</span>
                                  <span>•</span>
                                  <div className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    <span>
                                      {format(new Date(consultation.created_at), "d MMM yyyy HH:mm", {
                                        locale: localeId,
                                      })}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-row md:flex-col items-start gap-2">
                            <Badge className={getStatusColor(consultation.status)}>
                              {getStatusLabel(consultation.status)}
                            </Badge>
                            <Badge className={getPriorityColor(consultation.priority)}>
                              {getPriorityLabel(consultation.priority)}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout >
  );
}
