import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageSquare, Plus, Clock, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { CardSkeleton } from "@/components/skeletons";
import { NoDataState, SearchState } from "@/components/EmptyState";

interface Consultation {
  id: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
  is_escalated: boolean;
  created_at: string;
}

export default function MyConsultations() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadConsultations();
    }
  }, [user]);

  const loadConsultations = async () => {
    try {
      const { data, error } = await supabase
        .from("consultations")
        .select("*")
        .eq("user_id", user?.id)
        // Show all consultations, not just resolved/closed
        .order("created_at", { ascending: false });

      if (error) throw error;
      setConsultations(data || []);
    } catch (error: any) {
      console.error("Error loading consultations:", error);
      toast.error("Gagal memuat riwayat konsultasi");
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      submitted: "Menunggu Respon",
      in_progress: "Dalam Proses",
      resolved: "Selesai",
      closed: "Ditutup",
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      submitted: "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200",
      in_progress: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200",
      resolved: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200",
      closed: "bg-gray-100 text-gray-800 dark:bg-gray-950 dark:text-gray-200",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const getPriorityLabel = (priority: string) => {
    const labels: Record<string, string> = {
      low: "Rendah",
      medium: "Sedang",
      high: "Tinggi",
    };
    return labels[priority] || priority;
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      low: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200",
      medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200",
      high: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200",
    };
    return colors[priority] || "bg-gray-100 text-gray-800";
  };

  const stats = {
    total: consultations.length,
    active: consultations.filter(c => !["resolved", "closed"].includes(c.status)).length,
    resolved: consultations.filter(c => c.status === "resolved").length,
    closed: consultations.filter(c => c.status === "closed").length,
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Modern Header with Gradient */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-600 via-purple-500 to-purple-400 p-6 md:p-8 text-white shadow-xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -ml-24 -mb-24"></div>

          <div className="relative z-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 md:p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                    <MessageSquare className="h-6 w-6 md:h-8 md:w-8" />
                  </div>
                  <div>
                    <h1 className="text-2xl md:text-4xl font-bold">Riwayat Konsultasi</h1>
                    <p className="text-sm md:text-base text-white/80 mt-1">
                      Lihat semua riwayat konsultasi Anda
                    </p>
                  </div>
                </div>
              </div>

              <Button
                onClick={() => navigate("/konsultasi/baru")}
                size="lg"
                className="gap-2 bg-white text-purple-600 hover:bg-white/90 shadow-lg"
              >
                <Plus className="h-5 w-5" />
                <span className="hidden sm:inline">Konsultasi Baru</span>
                <span className="sm:hidden">Baru</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
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
                <div className="text-2xl md:text-3xl font-bold text-blue-600 dark:text-blue-400">{stats.active}</div>
              </div>
              <p className="text-xs md:text-sm font-medium text-muted-foreground">Aktif</p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/30 dark:to-green-900/30 border-green-500/30 hover:shadow-lg hover:scale-105 transition-all duration-300 col-span-2 md:col-span-1">
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
        </div>

        {/* Consultations List */}
        <div className="space-y-4">
          <h2 className="text-xl md:text-2xl font-semibold">Daftar Konsultasi</h2>

          {isLoading ? (
            <div className="grid gap-4">
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
            </div>
          ) : consultations.length === 0 ? (
            <div className="py-12">
              <NoDataState message="Belum ada riwayat konsultasi" />
            </div>
          ) : (
            <div className="grid gap-4">
              {consultations.map((consultation) => (
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
                            <h3 className="font-semibold text-base md:text-lg group-hover:text-primary transition-colors">
                              {consultation.subject}
                            </h3>
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                              {consultation.description}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <Badge className={getStatusColor(consultation.status)}>
                            {getStatusLabel(consultation.status)}
                          </Badge>
                          <Badge className={getPriorityColor(consultation.priority)}>
                            Prioritas: {getPriorityLabel(consultation.priority)}
                          </Badge>
                          {consultation.is_escalated && (
                            <Badge variant="destructive" className="gap-1">
                              <AlertCircle className="h-3 w-3" />
                              Tereskalasi
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col items-start md:items-end gap-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span>{format(new Date(consultation.created_at), "dd MMM yyyy, HH:mm", { locale: localeId })}</span>
                        </div>
                        <Button variant="outline" size="sm" className="group-hover:bg-primary group-hover:text-white transition-colors">
                          Lihat Detail
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div >
    </DashboardLayout >
  );
}
