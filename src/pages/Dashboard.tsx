import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WORK_UNITS, SERVICE_LABELS } from "@/lib/constants";
import { FileText, Clock, CheckCircle, MessageSquare, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";

export default function Dashboard() {
  const { user } = useAuth();
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
    let servicesQuery = supabase.from("services").select("*");
    if (user?.role === "user_unit") {
      servicesQuery = servicesQuery.eq("user_id", user.id);
    } else if (user?.role === "admin_unit") {
      servicesQuery = servicesQuery.eq("work_unit_id", user.work_unit_id);
    }
    
    const { data: servicesData } = await servicesQuery.order("created_at", { ascending: false });
    setServices(servicesData || []);

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
    pending:
      userServices.filter((s) => s.status === "submitted" || s.status === "under_review_unit" || s.status === "under_review_central")
        .length,
    approved: userServices.filter((s) => s.status === "approved_final").length,
    returned: userServices.filter((s) => s.status === "returned_to_user" || s.status === "returned_to_unit").length,
    consultations: userConsultations.length,
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Selamat Pagi";
    if (hour < 15) return "Selamat Siang";
    if (hour < 18) return "Selamat Sore";
    return "Selamat Malam";
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            {getGreeting()}, {user?.name}
          </h1>
          <p className="text-muted-foreground mt-1">
            {user?.role === "admin_pusat"
              ? "Administrator Pusat - Kelola seluruh sistem"
              : user?.role === "admin_unit"
              ? `Administrator Unit - ${workUnit?.name}`
              : `Pegawai - ${workUnit?.name}`}
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-gradient-to-br from-card to-card/50 border-primary/20 hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Usulan</CardTitle>
              <FileText className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{stats.total}</div>
              <p className="text-xs text-muted-foreground">
                {user?.role === "user_unit" ? "Usulan Anda" : "Semua usulan"}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-card to-card/50 border-warning/20 hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sedang Diproses</CardTitle>
              <Clock className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-warning">{stats.pending}</div>
              <p className="text-xs text-muted-foreground">Menunggu persetujuan</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-card to-card/50 border-success/20 hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Disetujui</CardTitle>
              <CheckCircle className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">{stats.approved}</div>
              <p className="text-xs text-muted-foreground">Usulan selesai</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-card to-card/50 border-accent/20 hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Konsultasi</CardTitle>
              <MessageSquare className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-accent">{stats.consultations}</div>
              <p className="text-xs text-muted-foreground">
                {user?.role === "user_unit" ? "Konsultasi Anda" : "Total konsultasi"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Services */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Aktivitas Terbaru
            </CardTitle>
          </CardHeader>
          <CardContent>
            {userServices.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Belum ada usulan</p>
              </div>
            ) : (
              <div className="space-y-3">
                {userServices.slice(0, 5).map((service) => (
                  <div
                    key={service.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-sm">{service.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {SERVICE_LABELS[service.service_type as keyof typeof SERVICE_LABELS]} •{" "}
                        {new Date(service.created_at).toLocaleDateString("id-ID")}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        service.status === "approved_final"
                          ? "bg-success/10 text-success"
                          : service.status.includes("returned")
                          ? "bg-destructive/10 text-destructive"
                          : "bg-warning/10 text-warning"
                      }`}
                    >
                      {service.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
