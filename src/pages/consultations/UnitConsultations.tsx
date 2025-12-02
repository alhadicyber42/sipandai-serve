import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MessageSquare, Search, Clock, AlertCircle, CheckCircle2, ArrowRight, Sparkles, User, TrendingUp } from "lucide-react";
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
  profiles: {
    name: string;
  };
}

export default function UnitConsultations() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [escalationFilter, setEscalationFilter] = useState<string>("all"); // all, escalated, not_escalated

  useEffect(() => {
    if (user?.work_unit_id) {
      loadConsultations();

      // Subscribe to real-time updates
      const channel = supabase
        .channel('unit-consultations-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'consultations',
            filter: `work_unit_id=eq.${user.work_unit_id}`
          },
          () => {
            loadConsultations();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const loadConsultations = async () => {
    try {
      // First, get consultations without join
      const { data: consultationsData, error } = await supabase
        .from("consultations")
        .select("*")
        .eq("work_unit_id", user?.work_unit_id)
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
      toast.error("Gagal memuat konsultasi unit");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredConsultations = consultations.filter((consultation) => {
    const matchesSearch =
      consultation.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      consultation.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || consultation.status === statusFilter;
    const matchesPriority =
      priorityFilter === "all" || consultation.priority === priorityFilter;
    const matchesEscalation =
      escalationFilter === "all" ||
      (escalationFilter === "escalated" && consultation.is_escalated) ||
      (escalationFilter === "not_escalated" && !consultation.is_escalated);

    return matchesSearch && matchesStatus && matchesPriority && matchesEscalation;
  });

  const stats = {
    total: consultations.length,
    submitted: consultations.filter((c) => c.status === "submitted").length,
    inProgress: consultations.filter((c) => c.status === "in_progress").length,
    resolved: consultations.filter((c) => c.status === "resolved").length,
    escalated: consultations.filter((c) => c.is_escalated).length,
  };

  const getPriorityBadge = (priority: string) => {
    const config = {
      high: { label: "Tinggi", className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" },
      medium: { label: "Sedang", className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400" },
      low: { label: "Rendah", className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" },
    };
    const { label, className } = config[priority as keyof typeof config] || config.medium;
    return <Badge className={className}>{label}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    const config = {
      submitted: { label: "Baru", variant: "secondary" as const },
      in_progress: { label: "Diproses", variant: "default" as const },
      resolved: { label: "Selesai", variant: "outline" as const },
      closed: { label: "Ditutup", variant: "outline" as const },
      escalated: { label: "Tereskalasi", variant: "destructive" as const },
    };
    const { label, variant } = config[status as keyof typeof config] || { label: status, variant: "secondary" as const };
    return <Badge variant={variant}>{label}</Badge>;
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-blue-500 to-blue-400 p-6 md:p-8 text-white shadow-xl">
            {/* Keep header static or skeletonize it too if dynamic, but static is fine for perceived performance */}
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 md:p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <MessageSquare className="h-6 w-6 md:h-8 md:w-8" />
                </div>
                <div>
                  <h1 className="text-2xl md:text-4xl font-bold">Konsultasi Masuk</h1>
                  <p className="text-sm md:text-base text-white/80 mt-1">
                    Kelola konsultasi dari pegawai unit Anda
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4">
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </div>

          <div className="grid gap-4">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Modern Header with Gradient */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-blue-500 to-blue-400 p-6 md:p-8 text-white shadow-xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -ml-24 -mb-24"></div>

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 md:p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <MessageSquare className="h-6 w-6 md:h-8 md:w-8" />
              </div>
              <div>
                <h1 className="text-2xl md:text-4xl font-bold">Konsultasi Masuk</h1>
                <p className="text-sm md:text-base text-white/80 mt-1">
                  Kelola konsultasi dari pegawai unit Anda
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics Cards - Responsive Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4">
          <Card className="relative overflow-hidden border-blue-500/20 hover:shadow-lg hover:scale-105 transition-all duration-300">
            <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/5 rounded-full blur-2xl"></div>
            <CardContent className="p-4 md:p-6 relative z-10">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <MessageSquare className="h-5 w-5 text-blue-600" />
                </div>
                <div className="text-2xl md:text-3xl font-bold text-blue-600">{stats.total}</div>
              </div>
              <p className="text-xs md:text-sm text-muted-foreground font-medium">Total</p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden bg-gradient-to-br from-orange-50 to-orange-100/50 dark:from-orange-950/30 dark:to-orange-900/30 border-orange-500/30 hover:shadow-lg hover:scale-105 transition-all duration-300">
            <div className="absolute top-0 right-0 w-20 h-20 bg-orange-500/10 rounded-full blur-2xl"></div>
            <CardContent className="p-4 md:p-6 relative z-10">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-orange-500/10 rounded-lg">
                  <Sparkles className="h-5 w-5 text-orange-600 dark:text-orange-400 animate-pulse" />
                </div>
                <div className="text-2xl md:text-3xl font-bold text-orange-600 dark:text-orange-400">{stats.submitted}</div>
              </div>
              <p className="text-xs md:text-sm text-muted-foreground font-medium">Baru</p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden bg-gradient-to-br from-yellow-50 to-yellow-100/50 dark:from-yellow-950/30 dark:to-yellow-900/30 border-yellow-500/30 hover:shadow-lg hover:scale-105 transition-all duration-300">
            <div className="absolute top-0 right-0 w-20 h-20 bg-yellow-500/10 rounded-full blur-2xl"></div>
            <CardContent className="p-4 md:p-6 relative z-10">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-yellow-500/10 rounded-lg">
                  <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div className="text-2xl md:text-3xl font-bold text-yellow-600 dark:text-yellow-400">{stats.inProgress}</div>
              </div>
              <p className="text-xs md:text-sm text-muted-foreground font-medium">Diproses</p>
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
              <p className="text-xs md:text-sm text-muted-foreground font-medium">Selesai</p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-950/30 dark:to-red-900/30 border-red-500/30 hover:shadow-lg hover:scale-105 transition-all duration-300">
            <div className="absolute top-0 right-0 w-20 h-20 bg-red-500/10 rounded-full blur-2xl"></div>
            <CardContent className="p-4 md:p-6 relative z-10">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-red-500/10 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
                <div className="text-2xl md:text-3xl font-bold text-red-600 dark:text-red-400">{stats.escalated}</div>
              </div>
              <p className="text-xs md:text-sm text-muted-foreground font-medium">Tereskalasi</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters and List */}
        <Card className="shadow-lg border-primary/10">
          <CardHeader className="border-b bg-muted/30">
            <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
              <MessageSquare className="h-5 w-5 text-primary" />
              Daftar Konsultasi
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6">
            {/* Filters - Responsive Grid */}
            <div className="mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari konsultasi..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-12"
                />
              </div>

              <Select value={escalationFilter} onValueChange={setEscalationFilter}>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Filter Eskalasi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Konsultasi</SelectItem>
                  <SelectItem value="not_escalated">Konsultasi Biasa</SelectItem>
                  <SelectItem value="escalated">Diteruskan ke Pusat</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Filter Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="submitted">Baru</SelectItem>
                  <SelectItem value="in_progress">Diproses</SelectItem>
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
                  <SelectItem value="high">Tinggi</SelectItem>
                  <SelectItem value="medium">Sedang</SelectItem>
                  <SelectItem value="low">Rendah</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Consultations List */}
            {filteredConsultations.length === 0 ? (
              <div className="py-12">
                {searchQuery || statusFilter !== "all" || priorityFilter !== "all" || escalationFilter !== "all" ? (
                  <SearchState message="Tidak ada konsultasi yang sesuai dengan filter pencarian" />
                ) : (
                  <NoDataState message="Belum ada konsultasi masuk" />
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredConsultations.map((consultation) => (
                  <Card
                    key={consultation.id}
                    className="group hover:shadow-md transition-all duration-300 cursor-pointer border-l-4 hover:border-l-primary"
                    onClick={() => navigate(`/konsultasi/${consultation.id}`)}
                    style={{
                      borderLeftColor: consultation.priority === "high" ? "#ef4444" :
                        consultation.priority === "medium" ? "#f59e0b" : "#3b82f6"
                    }}
                  >
                    <CardContent className="p-4 md:p-6">
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-3 md:gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start gap-2 mb-2 flex-wrap">
                            <h3 className="font-semibold text-base md:text-lg truncate max-w-full">
                              {consultation.subject}
                            </h3>
                          </div>

                          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                            {consultation.description}
                          </p>

                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1 shrink-0">
                              <User className="h-3 w-3" />
                              {(consultation.profiles as any)?.name}
                            </span>
                            <span className="hidden sm:inline">•</span>
                            <span className="flex items-center gap-1 shrink-0">
                              <Clock className="h-3 w-3" />
                              {format(new Date(consultation.created_at), "d MMM yyyy HH:mm", { locale: localeId })}
                            </span>
                            {consultation.is_escalated && (
                              <>
                                <span className="hidden sm:inline">•</span>
                                <Badge variant="destructive" className="text-[10px] md:text-xs h-5 md:h-auto">
                                  <AlertCircle className="h-3 w-3 mr-1" />
                                  Tereskalasi
                                </Badge>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-row md:flex-col items-center md:items-end gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 mt-2 md:mt-0">
                          <div className="flex gap-2">
                            {getStatusBadge(consultation.status)}
                            {getPriorityBadge(consultation.priority)}
                          </div>
                          <ArrowRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity hidden md:block" />
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
