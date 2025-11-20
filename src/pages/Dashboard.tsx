import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { WORK_UNITS, SERVICE_LABELS } from "@/lib/constants";
import { FileText, Clock, CheckCircle, MessageSquare, TrendingUp, AlertCircle, Sparkles, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [services, setServices] = useState<any[]>([]);
  const [consultations, setConsultations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    setIsLoading(true);

    // Load services based on role
    let servicesQuery = supabase
      .from("services")
      .select("*");

    if (user?.role === "user_unit") {
      servicesQuery = servicesQuery.eq("user_id", user.id);
    } else if (user?.role === "admin_unit") {
      servicesQuery = servicesQuery.eq("work_unit_id", user.work_unit_id);
    }

    const { data: servicesData, error: servicesError } = await servicesQuery.order("created_at", { ascending: false });

    if (servicesError) {
      console.error("Error loading services:", servicesError);
      toast.error("Gagal memuat data usulan");
      setServices([]);
      setIsLoading(false);
      return;
    }

    // Load profiles and work_units data separately
    const servicesList = servicesData || [];
    if (servicesList.length > 0) {
      const userIds = [...new Set(servicesList.map(s => s.user_id))];
      const workUnitIds = [...new Set(servicesList.map(s => s.work_unit_id))];

      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, name")
        .in("id", userIds);

      const { data: workUnitsData } = await supabase
        .from("work_units")
        .select("id, name")
        .in("id", workUnitIds);

      const profilesMap = new Map((profilesData || []).map(p => [p.id, p]));
      const workUnitsMap = new Map((workUnitsData || []).map(w => [w.id, w]));

      const enrichedServices = servicesList.map(service => ({
        ...service,
        profiles: profilesMap.get(service.user_id),
        work_units: workUnitsMap.get(service.work_unit_id),
      }));

      setServices(enrichedServices);
    } else {
      setServices([]);
    }

    // Load consultations based on role
    let consultationsQuery = supabase.from("consultations").select("*");
    if (user?.role === "user_unit") {
      consultationsQuery = consultationsQuery.eq("user_id", user.id);
    } else if (user?.role === "admin_unit") {
      consultationsQuery = consultationsQuery.eq("work_unit_id", user.work_unit_id);
    }

    const { data: consultationsData } = await consultationsQuery.order("created_at", { ascending: false });
    setConsultations(consultationsData || []);

    setIsLoading(false);
  };

  // Get user's work unit name
  const workUnit = WORK_UNITS.find((u) => u.id === user?.work_unit_id);

  // Filter data based on role
  const getUserServices = () => {
    if (user?.role === "admin_pusat") {
      return services;
    }
    if (user?.role === "admin_unit") {
      return services.filter((s) => s.work_unit_id === user.work_unit_id);
    }
    return services.filter((s) => s.user_id === user?.id);
  };

  const getUserConsultations = () => {
    if (user?.role === "admin_pusat") {
      return consultations;
    }
    if (user?.role === "admin_unit") {
      return consultations.filter((c) => c.work_unit_id === user.work_unit_id);
    }
    return consultations.filter((c) => c.user_id === user?.id);
  };

  const userServices = getUserServices();
  const userConsultations = getUserConsultations();

  // Calculate statistics
  const stats = {
    total: userServices.length,
    pending: userServices.filter((s) =>
      s.status === "submitted" ||
      s.status === "approved_by_unit"
    ).length,
    pendingForMe: user?.role === "admin_unit"
      ? userServices.filter((s) => s.status === "submitted").length
      : user?.role === "admin_pusat"
        ? userServices.filter((s) => s.status === "approved_by_unit").length
        : 0,
    approved: userServices.filter((s) => s.status === "approved_final").length,
    returned: userServices.filter((s) =>
      s.status === "returned_to_user" ||
      s.status === "returned_to_unit"
    ).length,
    consultations: userConsultations.length,
    pendingConsultations: user?.role !== "user_unit"
      ? userConsultations.filter((c) => c.status === "submitted" || c.status === "in_progress").length
      : 0,
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Selamat Pagi";
    if (hour < 15) return "Selamat Siang";
    if (hour < 18) return "Selamat Sore";
    return "Selamat Malam";
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      "submitted": { label: "Diajukan", variant: "secondary" },
      "under_review_unit": { label: "Review Unit", variant: "default" },
      "approved_by_unit": { label: "Disetujui Unit", variant: "default" },
      "under_review_central": { label: "Review Pusat", variant: "default" },
      "approved_final": { label: "Disetujui", variant: "outline" },
      "returned_to_user": { label: "Dikembalikan", variant: "destructive" },
      "returned_to_unit": { label: "Dikembalikan", variant: "destructive" },
      "rejected": { label: "Ditolak", variant: "destructive" },
    };

    const config = statusConfig[status] || { label: status, variant: "secondary" as const };
    return <Badge variant={config.variant} className="text-xs">{config.label}</Badge>;
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground">Memuat dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 md:space-y-8">
        {/* Header with Gradient Background */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-primary/80 p-6 md:p-8 text-primary-foreground shadow-xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -ml-24 -mb-24"></div>

          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-5 w-5 md:h-6 md:w-6 animate-pulse" />
              <span className="text-sm md:text-base font-medium opacity-90">{getGreeting()}</span>
            </div>
            <h1 className="text-2xl md:text-4xl font-bold mb-2">
              {user?.name}
            </h1>
            <p className="text-sm md:text-base text-primary-foreground/80">
              {user?.role === "admin_pusat"
                ? "Administrator Pusat - Kelola seluruh sistem"
                : user?.role === "admin_unit"
                  ? `Administrator Unit - ${workUnit?.name}`
                  : `Pegawai - ${workUnit?.name}`}
            </p>
          </div>
        </div>

        {/* Statistics Cards - Responsive Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
          <Card className="relative overflow-hidden border-primary/20 hover:shadow-lg hover:scale-105 transition-all duration-300">
            <div className="absolute top-0 right-0 w-20 h-20 bg-primary/5 rounded-full blur-2xl"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs md:text-sm font-medium">Total Usulan</CardTitle>
              <FileText className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-xl md:text-2xl font-bold text-primary">{stats.total}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {user?.role === "user_unit" ? "Usulan Anda" : "Semua usulan"}
              </p>
            </CardContent>
          </Card>

          {(user?.role === "admin_unit" || user?.role === "admin_pusat") && (
            <Card className="relative overflow-hidden bg-gradient-to-br from-orange-50 to-orange-100/50 dark:from-orange-950/30 dark:to-orange-900/30 border-orange-500/30 hover:shadow-lg hover:scale-105 transition-all duration-300">
              <div className="absolute top-0 right-0 w-20 h-20 bg-orange-500/10 rounded-full blur-2xl"></div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs md:text-sm font-medium">Perlu Persetujuan</CardTitle>
                <Clock className="h-4 w-4 text-orange-600 dark:text-orange-400 animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="text-xl md:text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {stats.pendingForMe}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {user?.role === "admin_unit" ? "Menunggu review" : "Approval pusat"}
                </p>
              </CardContent>
            </Card>
          )}

          <Card className="relative overflow-hidden bg-gradient-to-br from-yellow-50 to-yellow-100/50 dark:from-yellow-950/30 dark:to-yellow-900/30 border-yellow-500/30 hover:shadow-lg hover:scale-105 transition-all duration-300">
            <div className="absolute top-0 right-0 w-20 h-20 bg-yellow-500/10 rounded-full blur-2xl"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs md:text-sm font-medium">Diproses</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
            </CardHeader>
            <CardContent>
              <div className="text-xl md:text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.pending}</div>
              <p className="text-xs text-muted-foreground mt-1">Menunggu persetujuan</p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/30 dark:to-green-900/30 border-green-500/30 hover:shadow-lg hover:scale-105 transition-all duration-300">
            <div className="absolute top-0 right-0 w-20 h-20 bg-green-500/10 rounded-full blur-2xl"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs md:text-sm font-medium">Disetujui</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-xl md:text-2xl font-bold text-green-600 dark:text-green-400">{stats.approved}</div>
              <p className="text-xs text-muted-foreground mt-1">Usulan selesai</p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/30 border-blue-500/30 hover:shadow-lg hover:scale-105 transition-all duration-300">
            <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/10 rounded-full blur-2xl"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs md:text-sm font-medium">Konsultasi</CardTitle>
              <MessageSquare className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-xl md:text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.consultations}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {user?.role === "user_unit" ? "Konsultasi Anda" : "Total konsultasi"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Services with Better Design */}
        <Card className="shadow-lg border-primary/10">
          <CardHeader className="border-b bg-muted/30">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                <TrendingUp className="h-5 w-5 text-primary" />
                Aktivitas Terbaru
              </CardTitle>
              {userServices.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2 text-xs md:text-sm"
                  onClick={() => navigate(user?.role === "user_unit" ? "/layanan/kenaikan-pangkat" : "/usulan/kenaikan-pangkat")}
                >
                  Lihat Semua
                  <ArrowRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-4 md:p-6">
            {userServices.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 md:w-20 md:h-20 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center">
                  <FileText className="h-8 w-8 md:h-10 md:w-10 text-muted-foreground/50" />
                </div>
                <p className="text-sm md:text-base text-muted-foreground mb-4">Belum ada usulan</p>
                {user?.role === "user_unit" && (
                  <Button onClick={() => navigate("/layanan/kenaikan-pangkat")} className="gap-2">
                    <FileText className="h-4 w-4" />
                    Buat Usulan Baru
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {userServices.slice(0, 5).map((service) => (
                  <div
                    key={service.id}
                    className="group flex flex-col md:flex-row md:items-center justify-between gap-3 p-3 md:p-4 rounded-xl bg-gradient-to-r from-muted/30 to-muted/10 hover:from-muted/50 hover:to-muted/30 transition-all duration-300 border border-transparent hover:border-primary/20 cursor-pointer"
                    onClick={() => {
                      // Navigate to service detail or list based on role
                      if (user?.role === "user_unit") {
                        navigate(`/layanan/${service.service_type}`);
                      } else {
                        navigate(`/usulan/${service.service_type}`);
                      }
                    }}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2 mb-1">
                        <p className="font-semibold text-sm md:text-base truncate">{service.title}</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        {user?.role !== "user_unit" && service.profiles?.name && (
                          <>
                            <span className="flex items-center gap-1">
                              <FileText className="h-3 w-3" />
                              {service.profiles.name}
                            </span>
                            <span>•</span>
                          </>
                        )}
                        <span>{SERVICE_LABELS[service.service_type as keyof typeof SERVICE_LABELS]}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(service.created_at).toLocaleDateString("id-ID", {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(service.status)}
                      <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions for User */}
        {user?.role === "user_unit" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            <Card className="group hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer border-primary/20" onClick={() => navigate("/layanan/kenaikan-pangkat")}>
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 md:p-3 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                    <TrendingUp className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm md:text-base">Kenaikan Pangkat</p>
                    <p className="text-xs text-muted-foreground">Ajukan usulan</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer border-primary/20" onClick={() => navigate("/layanan/cuti")}>
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 md:p-3 bg-blue-500/10 rounded-lg group-hover:bg-blue-500/20 transition-colors">
                    <FileText className="h-5 w-5 md:h-6 md:w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm md:text-base">Cuti Pegawai</p>
                    <p className="text-xs text-muted-foreground">Ajukan cuti</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer border-primary/20" onClick={() => navigate("/konsultasi/baru")}>
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 md:p-3 bg-green-500/10 rounded-lg group-hover:bg-green-500/20 transition-colors">
                    <MessageSquare className="h-5 w-5 md:h-6 md:w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm md:text-base">Konsultasi</p>
                    <p className="text-xs text-muted-foreground">Tanya admin</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer border-primary/20" onClick={() => navigate("/employee-of-the-month")}>
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 md:p-3 bg-yellow-500/10 rounded-lg group-hover:bg-yellow-500/20 transition-colors">
                    <Sparkles className="h-5 w-5 md:h-6 md:w-6 text-yellow-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm md:text-base">Employee of The Month</p>
                    <p className="text-xs text-muted-foreground">Lihat penilaian</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
