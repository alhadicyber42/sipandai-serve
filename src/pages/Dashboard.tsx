import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { WORK_UNITS, SERVICE_LABELS } from "@/lib/constants";
import { FileText, Clock, CheckCircle, MessageSquare, TrendingUp, AlertCircle, Sparkles, ArrowRight, Users, Cake, UserMinus, Coffee, Megaphone, Pin, ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState, useRef } from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [services, setServices] = useState<any[]>([]);
  const [consultations, setConsultations] = useState<any[]>([]);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [employeeStats, setEmployeeStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activitiesPage, setActivitiesPage] = useState(1);
  const [announcementsPage, setAnnouncementsPage] = useState(1);
  const [activitiesPerPage, setActivitiesPerPage] = useState(2);
  const activitiesContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  // Calculate dynamic items per page based on container height
  useEffect(() => {
    const calculateItemsPerPage = () => {
      if (!activitiesContainerRef.current) return;

      const containerHeight = activitiesContainerRef.current.clientHeight;
      const style = window.getComputedStyle(activitiesContainerRef.current);
      const paddingTop = parseFloat(style.paddingTop);
      const paddingBottom = parseFloat(style.paddingBottom);

      // Approximate height per activity item including gap
      // Item content ~80px + gap 12px = ~92px. Using 95px to be safe but maximize usage.
      const ITEM_HEIGHT = 95;

      // Reserve space for pagination controls: ~60px (button sm is 36px + margins/padding)
      const PAGINATION_HEIGHT = 60;

      // Calculate available height for items
      const availableHeight = containerHeight - PAGINATION_HEIGHT - paddingTop - paddingBottom;

      // Calculate items that can fit
      const itemsFit = Math.floor(availableHeight / ITEM_HEIGHT);

      // Minimum 2, maximum 10
      const calculatedItems = Math.max(2, Math.min(10, itemsFit));

      setActivitiesPerPage(calculatedItems);
    };

    // Calculate on mount and window resize
    calculateItemsPerPage();
    window.addEventListener('resize', calculateItemsPerPage);

    // Recalculate after content loads
    const timer = setTimeout(calculateItemsPerPage, 500);

    return () => {
      window.removeEventListener('resize', calculateItemsPerPage);
      clearTimeout(timer);
    };
  }, [recentActivities]);

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
      toast.error("Gagal memuat data usulan layanan");
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

    // Load recent activities from service_history
    let historyQuery = supabase
      .from("service_history")
      .select(`
        *,
        services (
          id,
          title,
          service_type,
          status,
          user_id
        )
      `)
      .order("timestamp", { ascending: false })
      .limit(10);

    // Filter by user role
    if (user?.role === "user_unit") {
      // User can only see their own activities
      historyQuery = historyQuery.eq("actor_id", user.id);
    }

    const { data: historyData, error: historyError } = await historyQuery;

    if (!historyError && historyData) {
      // For admin_unit, filter activities from their unit
      let filteredHistory = historyData;
      if (user?.role === "admin_unit") {
        const userUnitServiceIds = servicesList
          .filter(s => s.work_unit_id === user.work_unit_id)
          .map(s => s.id);
        filteredHistory = historyData.filter(h =>
          h.services && userUnitServiceIds.includes(h.services.id)
        );
      }

      // Load actor profiles
      const actorIds = [...new Set(filteredHistory.map(h => h.actor_id))];
      const { data: actorProfiles } = await supabase
        .from("profiles")
        .select("id, name")
        .in("id", actorIds);

      const actorMap = new Map((actorProfiles || []).map(p => [p.id, p]));

      const enrichedHistory = filteredHistory.map(h => ({
        ...h,
        actor_profile: actorMap.get(h.actor_id),
      }));

      setRecentActivities(enrichedHistory);
    } else {
      setRecentActivities([]);
    }

    // Load employee statistics for admin only
    if (user?.role === "admin_unit" || user?.role === "admin_pusat") {
      await loadEmployeeStats();
    }

    // Load leave stats for user_unit
    if (user?.role === "user_unit") {
      await loadUserLeaveStats();
    }

    setIsLoading(false);
  };

  const loadUserLeaveStats = async () => {
    try {
      const currentYear = new Date().getFullYear();

      // Get approved and pending leave requests
      const { data: leaves } = await supabase
        .from("services")
        .select(`
          *,
          leave_details (*)
        `)
        .eq("user_id", user?.id)
        .eq("service_type", "cuti")
        .in("status", ["submitted", "under_review_unit", "under_review_central", "approved_by_unit", "approved_final"]);

      let usedDays = 0;
      let pendingDays = 0;

      if (leaves) {
        leaves.forEach(service => {
          const details = service.leave_details?.[0];
          if (!details) return;

          // Only count Annual Leave (Cuti Tahunan)
          if (details.leave_type === 'tahunan') {
            const serviceYear = new Date(details.start_date).getFullYear();
            if (serviceYear === currentYear) {
              if (service.status === 'approved_final') {
                usedDays += details.total_days;
              } else {
                pendingDays += details.total_days;
              }
            }
          }
        });
      }

      // Get active deferrals
      const { data: deferrals } = await supabase
        .from("leave_deferrals")
        .select("days_deferred")
        .eq("user_id", user?.id)
        .eq("status", "active");

      const carriedOver = (deferrals || []).reduce((sum, d) => sum + d.days_deferred, 0);

      setEmployeeStats({
        remaining: 12 + carriedOver - usedDays - pendingDays,
        carriedOver,
        used: usedDays,
        pending: pendingDays
      });

    } catch (error) {
      console.error("Error loading user leave stats:", error);
    }
  };

  const loadEmployeeStats = async () => {
    try {
      // Query employees based on role
      let employeesQuery = supabase
        .from("profiles")
        .select("id, name, nip, work_unit_id");

      // Filter by work unit for admin_unit
      if (user?.role === "admin_unit" && user?.work_unit_id) {
        employeesQuery = employeesQuery.eq("work_unit_id", user.work_unit_id);
      }

      const { data: employees, error: employeesError } = await employeesQuery;

      if (employeesError) {
        console.error("Error loading employees:", employeesError);
        return;
      }

      const employeeList = employees || [];
      const totalEmployees = employeeList.length;

      // For now, we'll skip birthday and retirement data since it requires auth.users access
      // which is not available on client side
      const birthdaysThisMonth: any[] = [];
      const retiringThisYear: any[] = [];

      // Get active leaves (cuti)
      let leavesQuery = supabase
        .from("services")
        .select(`
          *,
          leave_details (*)
        `)
        .eq("service_type", "cuti")
        .in("status", ["approved_by_unit", "approved_final"]);

      // Filter by work unit for admin_unit
      if (user?.role === "admin_unit" && user?.work_unit_id) {
        leavesQuery = leavesQuery.eq("work_unit_id", user.work_unit_id);
      }

      const { data: leaves, error: leavesError } = await leavesQuery;

      if (!leavesError && leaves) {
        // Filter active leaves (within date range)
        const today = new Date();
        const activeLeaves = leaves.filter(leave => {
          if (!leave.leave_details || leave.leave_details.length === 0) return false;
          const detail = leave.leave_details[0];
          const startDate = new Date(detail.start_date);
          const endDate = new Date(detail.end_date);
          return startDate <= today && endDate >= today;
        });

        // Count by leave type
        const leaveTypeCount: Record<string, number> = {};
        activeLeaves.forEach(leave => {
          const detail = leave.leave_details[0];
          const type = detail.leave_type;
          leaveTypeCount[type] = (leaveTypeCount[type] || 0) + 1;
        });

        setEmployeeStats({
          totalEmployees,
          birthdaysThisMonth,
          retiringThisYear,
          activeLeaves: activeLeaves.length,
          leaveTypeCount,
        });
      } else {
        setEmployeeStats({
          totalEmployees,
          birthdaysThisMonth,
          retiringThisYear,
          activeLeaves: 0,
          leaveTypeCount: {},
        });
      }
    } catch (error) {
      console.error("Error loading employee stats:", error);
    }
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

  // Pagination constants
  const ANNOUNCEMENTS_PER_PAGE = 3;

  // State for announcements
  const [announcements, setAnnouncements] = useState<any[]>([]);

  // Load announcements from database
  useEffect(() => {
    if (user) {
      loadAnnouncements();
    }
  }, [user]);

  const loadAnnouncements = async () => {
    if (!user) return;

    try {
      let query = supabase
        .from("announcements")
        .select(`*`)
        .order("is_pinned", { ascending: false })
        .order("created_at", { ascending: false });

      // Filter based on role
      if (user.role === "admin_unit" || user.role === "user_unit") {
        // Users can see announcements for all units (null) or their specific unit
        query = query.or(`work_unit_id.is.null,work_unit_id.eq.${user.work_unit_id}`);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error loading announcements:", error);
      } else {
        setAnnouncements(data || []);
      }
    } catch (error) {
      console.error("Error loading announcements:", error);
    }
  };

  const getWorkUnitName = (workUnitId: number | null) => {
    if (workUnitId === null) return "Semua Unit";
    return WORK_UNITS.find(u => u.id === workUnitId)?.name || "Unit Tidak Diketahui";
  };

  // Calculate pagination
  const totalActivitiesPages = Math.ceil(recentActivities.length / activitiesPerPage);
  const totalAnnouncementsPages = Math.ceil(announcements.length / ANNOUNCEMENTS_PER_PAGE);

  const paginatedActivities = recentActivities.slice(
    (activitiesPage - 1) * activitiesPerPage,
    activitiesPage * activitiesPerPage
  );

  const paginatedAnnouncements = announcements.slice(
    (announcementsPage - 1) * ANNOUNCEMENTS_PER_PAGE,
    announcementsPage * ANNOUNCEMENTS_PER_PAGE
  );

  // Calculate statistics
  const stats = {
    total: userServices.length,
    pending: userServices.filter((s) =>
      s.status === "submitted" ||
      s.status === "resubmitted" ||
      s.status === "approved_by_unit"
    ).length,
    pendingForMe: user?.role === "admin_unit"
      ? userServices.filter((s) => s.status === "submitted" || s.status === "resubmitted").length
      : user?.role === "admin_pusat"
        ? userServices.filter((s) => s.status === "approved_by_unit").length
        : 0,
    approved: userServices.filter((s) => s.status === "approved_final").length,
    returned: userServices.filter((s) =>
      s.status === "returned_to_user" ||
      s.status === "returned_to_unit"
    ).length,
    rejected: userServices.filter((s) =>
      s.status === "rejected" ||
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
      <div className="space-y-4 md:space-y-6 lg:space-y-8">
        {/* Header with Gradient Background */}
        <div className="relative overflow-hidden rounded-xl md:rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-primary/80 p-4 md:p-6 lg:p-8 text-primary-foreground shadow-xl">
          <div className="absolute top-0 right-0 w-32 h-32 md:w-64 md:h-64 bg-white/10 rounded-full blur-3xl -mr-16 md:-mr-32 -mt-16 md:-mt-32"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 md:w-48 md:h-48 bg-white/10 rounded-full blur-3xl -ml-12 md:-ml-24 -mb-12 md:-mb-24"></div>

          <div className="relative z-10">
            <div className="flex items-center gap-1.5 md:gap-2 mb-1 md:mb-2">
              <Sparkles className="h-4 w-4 md:h-5 md:w-5 lg:h-6 lg:w-6 animate-pulse" />
              <span className="text-xs md:text-sm lg:text-base font-medium opacity-90">{getGreeting()}</span>
            </div>
            <h1 className="text-xl md:text-2xl lg:text-4xl font-bold mb-1 md:mb-2 break-words">
              {user?.name}
            </h1>
            <p className="text-xs md:text-sm lg:text-base text-primary-foreground/80">
              {user?.role === "admin_pusat"
                ? "Administrator Pusat - Kelola seluruh sistem"
                : user?.role === "admin_unit"
                  ? `Administrator Unit - ${workUnit?.name}`
                  : `Pegawai - ${workUnit?.name}`}
            </p>
          </div>
        </div>

        {/* Statistics Cards - Responsive Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
          <Card className="relative overflow-hidden border-primary/20 hover:shadow-lg hover:scale-105 transition-all duration-300">
            <div className="absolute top-0 right-0 w-20 h-20 bg-primary/5 rounded-full blur-2xl"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 md:p-4 lg:p-6">
              <CardTitle className="text-xs md:text-sm font-medium">Total Usulan</CardTitle>
              <FileText className="h-3.5 w-3.5 md:h-4 md:w-4 text-primary flex-shrink-0" />
            </CardHeader>
            <CardContent className="p-3 md:p-4 lg:p-6 pt-0">
              <div className="text-lg md:text-xl lg:text-2xl font-bold text-primary">{stats.total}</div>
              <p className="text-[10px] md:text-xs text-muted-foreground mt-0.5 md:mt-1">
                {user?.role === "user_unit" ? "Usulan Anda" : "Semua usulan"}
              </p>
            </CardContent>
          </Card>

          {user?.role === "user_unit" && employeeStats?.remaining !== undefined && (
            <Card className="relative overflow-hidden bg-gradient-to-br from-indigo-50 to-indigo-100/50 dark:from-indigo-950/30 dark:to-indigo-900/30 border-indigo-500/30 hover:shadow-lg hover:scale-105 transition-all duration-300">
              <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-500/10 rounded-full blur-2xl"></div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 md:p-4 lg:p-6">
                <CardTitle className="text-xs md:text-sm font-medium">Sisa Cuti</CardTitle>
                <Coffee className="h-3.5 w-3.5 md:h-4 md:w-4 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
              </CardHeader>
              <CardContent className="p-3 md:p-4 lg:p-6 pt-0">
                <div className="text-lg md:text-xl lg:text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                  {employeeStats.remaining} Hari
                </div>
                <p className="text-[10px] md:text-xs text-muted-foreground mt-0.5 md:mt-1">
                  {employeeStats.carriedOver > 0 ? `+${employeeStats.carriedOver} hari penangguhan` : "Kuota tahun ini"}
                </p>
              </CardContent>
            </Card>
          )}

          {(user?.role === "admin_unit" || user?.role === "admin_pusat") && (
            <Card className="relative overflow-hidden bg-gradient-to-br from-orange-50 to-orange-100/50 dark:from-orange-950/30 dark:to-orange-900/30 border-orange-500/30 hover:shadow-lg hover:scale-105 transition-all duration-300">
              <div className="absolute top-0 right-0 w-20 h-20 bg-orange-500/10 rounded-full blur-2xl"></div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 md:p-4 lg:p-6">
                <CardTitle className="text-xs md:text-sm font-medium">Perlu Persetujuan</CardTitle>
                <Clock className="h-3.5 w-3.5 md:h-4 md:w-4 text-orange-600 dark:text-orange-400 animate-pulse flex-shrink-0" />
              </CardHeader>
              <CardContent className="p-3 md:p-4 lg:p-6 pt-0">
                <div className="text-lg md:text-xl lg:text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {stats.pendingForMe}
                </div>
                <p className="text-[10px] md:text-xs text-muted-foreground mt-0.5 md:mt-1">
                  {user?.role === "admin_unit" ? "Menunggu review" : "Approval pusat"}
                </p>
              </CardContent>
            </Card>
          )}

          <Card className="relative overflow-hidden bg-gradient-to-br from-yellow-50 to-yellow-100/50 dark:from-yellow-950/30 dark:to-yellow-900/30 border-yellow-500/30 hover:shadow-lg hover:scale-105 transition-all duration-300">
            <div className="absolute top-0 right-0 w-20 h-20 bg-yellow-500/10 rounded-full blur-2xl"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 md:p-4 lg:p-6">
              <CardTitle className="text-xs md:text-sm font-medium">Diproses</CardTitle>
              <Clock className="h-3.5 w-3.5 md:h-4 md:w-4 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
            </CardHeader>
            <CardContent className="p-3 md:p-4 lg:p-6 pt-0">
              <div className="text-lg md:text-xl lg:text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.pending}</div>
              <p className="text-[10px] md:text-xs text-muted-foreground mt-0.5 md:mt-1">Menunggu persetujuan</p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/30 dark:to-green-900/30 border-green-500/30 hover:shadow-lg hover:scale-105 transition-all duration-300">
            <div className="absolute top-0 right-0 w-20 h-20 bg-green-500/10 rounded-full blur-2xl"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 md:p-4 lg:p-6">
              <CardTitle className="text-xs md:text-sm font-medium">Disetujui</CardTitle>
              <CheckCircle className="h-3.5 w-3.5 md:h-4 md:w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
            </CardHeader>
            <CardContent className="p-3 md:p-4 lg:p-6 pt-0">
              <div className="text-lg md:text-xl lg:text-2xl font-bold text-green-600 dark:text-green-400">{stats.approved}</div>
              <p className="text-[10px] md:text-xs text-muted-foreground mt-0.5 md:mt-1">Usulan selesai</p>
            </CardContent>
          </Card>

          {user?.role === "user_unit" && (
            <Card className="relative overflow-hidden bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-950/30 dark:to-red-900/30 border-red-500/30 hover:shadow-lg hover:scale-105 transition-all duration-300">
              <div className="absolute top-0 right-0 w-20 h-20 bg-red-500/10 rounded-full blur-2xl"></div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 md:p-4 lg:p-6">
                <CardTitle className="text-xs md:text-sm font-medium">Ditolak/Dikembalikan</CardTitle>
                <AlertCircle className="h-3.5 w-3.5 md:h-4 md:w-4 text-red-600 dark:text-red-400 flex-shrink-0" />
              </CardHeader>
              <CardContent className="p-3 md:p-4 lg:p-6 pt-0">
                <div className="text-lg md:text-xl lg:text-2xl font-bold text-red-600 dark:text-red-400">{stats.rejected}</div>
                <p className="text-[10px] md:text-xs text-muted-foreground mt-0.5 md:mt-1">Perlu perbaikan</p>
              </CardContent>
            </Card>
          )}

          <Card className="relative overflow-hidden bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/30 border-blue-500/30 hover:shadow-lg hover:scale-105 transition-all duration-300">
            <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/10 rounded-full blur-2xl"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 md:p-4 lg:p-6">
              <CardTitle className="text-xs md:text-sm font-medium">Konsultasi</CardTitle>
              <MessageSquare className="h-3.5 w-3.5 md:h-4 md:w-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
            </CardHeader>
            <CardContent className="p-3 md:p-4 lg:p-6 pt-0">
              <div className="text-lg md:text-xl lg:text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.consultations}</div>
              <p className="text-[10px] md:text-xs text-muted-foreground mt-0.5 md:mt-1">
                {user?.role === "user_unit" ? "Konsultasi Anda" : "Total konsultasi"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Grid Layout for Activities and Employee Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activities */}
          <Card className="shadow-lg border-primary/10 h-full flex flex-col">
            <CardHeader className="border-b bg-muted/30">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Aktivitas Terbaru
                </CardTitle>
                {recentActivities.length > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {recentActivities.length} Aktivitas
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent ref={activitiesContainerRef} className="p-4 md:p-6 flex flex-col flex-1">
              {recentActivities.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 md:w-20 md:h-20 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center">
                    <TrendingUp className="h-8 w-8 md:h-10 md:w-10 text-muted-foreground/50" />
                  </div>
                  <p className="text-sm md:text-base text-muted-foreground">Belum ada aktivitas terbaru</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {paginatedActivities.map((activity) => (
                    <div
                      key={activity.id}
                      className="group flex items-center gap-3 p-3 md:p-4 rounded-xl bg-gradient-to-r from-muted/30 to-muted/10 hover:from-muted/50 hover:to-muted/30 transition-all duration-300 border border-transparent hover:border-primary/20 cursor-pointer"
                      onClick={() => {
                        if (activity.services) {
                          // Navigate to appropriate page based on role and service type
                          // Convert service_type from snake_case to kebab-case for URL
                          const serviceType = activity.services.service_type.replace(/_/g, '-');
                          if (user?.role === "user_unit") {
                            // User goes to their service page (layanan)
                            navigate(`/layanan/${serviceType}`);
                          } else {
                            // Admin goes to usulan page
                            navigate(`/usulan/${serviceType}`);
                          }
                        }
                      }}
                    >
                      <div className="flex-shrink-0">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <FileText className="h-4 w-4 text-primary" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm mb-0.5">
                          <span className="text-primary">{activity.actor_profile?.name || "Seseorang"}</span>
                          {" "}
                          <span className="text-muted-foreground">{activity.action.toLowerCase()}</span>
                        </p>
                        {activity.services && (
                          <p className="text-xs text-foreground font-medium truncate">
                            {activity.services.title}
                          </p>
                        )}
                        <div className="flex items-center gap-3 mt-1.5">
                          {activity.services && (
                            <>
                              <Badge variant="outline" className="text-xs">
                                {SERVICE_LABELS[activity.services.service_type as keyof typeof SERVICE_LABELS]}
                              </Badge>
                              <span className="text-muted-foreground">•</span>
                            </>
                          )}
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>
                              {new Date(activity.timestamp).toLocaleDateString("id-ID", {
                                day: 'numeric',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                        </div>
                        {activity.notes && (
                          <p className="text-xs text-muted-foreground mt-1.5 line-clamp-1 italic">
                            "{activity.notes}"
                          </p>
                        )}
                      </div>
                      <div className="flex-shrink-0">
                        <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Pagination Controls for Activities */}
              {recentActivities.length > activitiesPerPage && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setActivitiesPage(p => Math.max(1, p - 1))}
                    disabled={activitiesPage === 1}
                    className="gap-2"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Sebelumnya
                  </Button>
                  <div className="text-sm text-muted-foreground">
                    Halaman {activitiesPage} dari {totalActivitiesPages}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setActivitiesPage(p => Math.min(totalActivitiesPages, p + 1))}
                    disabled={activitiesPage === totalActivitiesPages}
                    className="gap-2"
                  >
                    Berikutnya
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions for User - Only show if not showing employee stats */}
          {user?.role === "user_unit" && (
            <Card className="shadow-lg border-primary/10">
              <CardHeader className="border-b bg-gradient-to-r from-blue-500/10 to-indigo-500/10">
                <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                  <Sparkles className="h-5 w-5 text-blue-600" />
                  Layanan Kepegawaian
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 md:p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div
                    className="group p-4 rounded-lg bg-gradient-to-r from-primary/5 to-primary/10 hover:from-primary/10 hover:to-primary/20 border border-primary/20 cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-md"
                    onClick={() => navigate("/layanan/kenaikan-pangkat")}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                        <TrendingUp className="h-5 w-5 text-primary" />
                      </div>
                      <p className="font-semibold text-sm">Kenaikan Pangkat</p>
                    </div>
                    <p className="text-xs text-muted-foreground">Ajukan usulan kenaikan pangkat</p>
                  </div>

                  <div
                    className="group p-4 rounded-lg bg-gradient-to-r from-blue-500/5 to-blue-500/10 hover:from-blue-500/10 hover:to-blue-500/20 border border-blue-500/20 cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-md"
                    onClick={() => navigate("/layanan/cuti")}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-blue-500/10 rounded-lg group-hover:bg-blue-500/20 transition-colors">
                        <FileText className="h-5 w-5 text-blue-600" />
                      </div>
                      <p className="font-semibold text-sm">Cuti Pegawai</p>
                    </div>
                    <p className="text-xs text-muted-foreground">Ajukan permohonan cuti</p>
                  </div>

                  <div
                    className="group p-4 rounded-lg bg-gradient-to-r from-green-500/5 to-green-500/10 hover:from-green-500/10 hover:to-green-500/20 border border-green-500/20 cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-md"
                    onClick={() => navigate("/layanan/mutasi")}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-green-500/10 rounded-lg group-hover:bg-green-500/20 transition-colors">
                        <FileText className="h-5 w-5 text-green-600" />
                      </div>
                      <p className="font-semibold text-sm">Mutasi Pegawai</p>
                    </div>
                    <p className="text-xs text-muted-foreground">Ajukan usulan mutasi</p>
                  </div>

                  <div
                    className="group p-4 rounded-lg bg-gradient-to-r from-purple-500/5 to-purple-500/10 hover:from-purple-500/10 hover:to-purple-500/20 border border-purple-500/20 cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-md"
                    onClick={() => navigate("/layanan/pensiun")}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-purple-500/10 rounded-lg group-hover:bg-purple-500/20 transition-colors">
                        <FileText className="h-5 w-5 text-purple-600" />
                      </div>
                      <p className="font-semibold text-sm">Pensiun</p>
                    </div>
                    <p className="text-xs text-muted-foreground">Ajukan usulan pensiun</p>
                  </div>

                  <div
                    className="group p-4 rounded-lg bg-gradient-to-r from-amber-500/5 to-amber-500/10 hover:from-amber-500/10 hover:to-amber-500/20 border border-amber-500/20 cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-md"
                    onClick={() => navigate("/konsultasi")}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-amber-500/10 rounded-lg group-hover:bg-amber-500/20 transition-colors">
                        <MessageSquare className="h-5 w-5 text-amber-600" />
                      </div>
                      <p className="font-semibold text-sm">Konsultasi</p>
                    </div>
                    <p className="text-xs text-muted-foreground">Ajukan pertanyaan kepegawaian</p>
                  </div>

                  <div
                    className="group p-4 rounded-lg bg-gradient-to-r from-yellow-500/5 to-yellow-500/10 hover:from-yellow-500/10 hover:to-yellow-500/20 border border-yellow-500/20 cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-md"
                    onClick={() => navigate("/employee-of-the-month")}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-yellow-500/10 rounded-lg group-hover:bg-yellow-500/20 transition-colors">
                        <Sparkles className="h-5 w-5 text-yellow-600" />
                      </div>
                      <p className="font-semibold text-sm">Pegawai Terbaik</p>
                    </div>
                    <p className="text-xs text-muted-foreground">Lihat pencapaian pegawai</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Employee Statistics - Only for admin */}
          {(user?.role === "admin_unit" || user?.role === "admin_pusat") && employeeStats && (
            <Card className="shadow-lg border-primary/10">
              <CardHeader className="border-b bg-gradient-to-r from-emerald-500/10 to-teal-500/10">
                <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                  <Users className="h-5 w-5 text-emerald-600" />
                  Statistik Pegawai
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 md:p-6 space-y-4">
                {/* Total Employees */}
                <div className="p-4 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                        <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Total Pegawai</p>
                        <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                          {employeeStats.totalEmployees}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Active Leaves */}
                <div className="p-4 rounded-lg bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-200 dark:border-amber-800">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-amber-100 dark:bg-amber-900/50 rounded-lg">
                      <Coffee className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Pegawai Sedang Cuti</p>
                      <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                        {employeeStats.activeLeaves}
                      </p>
                    </div>
                  </div>
                  {/* Leave Type Breakdown */}
                  {Object.keys(employeeStats.leaveTypeCount).length > 0 ? (
                    <div className="space-y-2 mt-3 pl-11">
                      {Object.entries(employeeStats.leaveTypeCount).map(([type, count]: [string, any]) => (
                        <div key={type} className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground capitalize">
                            {type === 'tahunan' && 'Cuti Tahunan'}
                            {type === 'sakit' && 'Cuti Sakit'}
                            {type === 'melahirkan' && 'Cuti Melahirkan'}
                            {type === 'alasan_penting' && 'Cuti Alasan Penting'}
                            {type === 'besar' && 'Cuti Besar'}
                            {!['tahunan', 'sakit', 'melahirkan', 'alasan_penting', 'besar'].includes(type) && type}
                          </span>
                          <Badge variant="secondary">{count} orang</Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-sm text-muted-foreground">
                      Tidak ada pegawai yang sedang cuti
                    </div>
                  )}
                </div>

                {/* Birthdays This Month */}
                <div className="p-4 rounded-lg bg-gradient-to-r from-pink-50 to-rose-50 dark:from-pink-950/30 dark:to-rose-950/30 border border-pink-200 dark:border-pink-800">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-pink-100 dark:bg-pink-900/50 rounded-lg">
                      <Cake className="h-5 w-5 text-pink-600 dark:text-pink-400" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Ulang Tahun Bulan Ini</p>
                      <p className="text-2xl font-bold text-pink-600 dark:text-pink-400">
                        {employeeStats.birthdaysThisMonth.length}
                      </p>
                    </div>
                  </div>
                  {employeeStats.birthdaysThisMonth.length > 0 ? (
                    <div className="space-y-2 mt-3 pl-11 max-h-32 overflow-y-auto">
                      {employeeStats.birthdaysThisMonth.map((emp: any) => (
                        <div key={emp.id} className="text-sm text-muted-foreground">
                          <span className="font-medium">{emp.name}</span> - {new Date(emp.tanggal_lahir).toLocaleDateString('id-ID', { day: 'numeric', month: 'long' })}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-sm text-muted-foreground italic">
                      Data ulang tahun belum tersedia
                    </div>
                  )}
                </div>

                {/* Retiring This Year */}
                <div className="p-4 rounded-lg bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-950/30 dark:to-violet-950/30 border border-purple-200 dark:border-purple-800">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
                      <UserMinus className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Pensiun Tahun Ini</p>
                      <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                        {employeeStats.retiringThisYear.length}
                      </p>
                    </div>
                  </div>
                  {employeeStats.retiringThisYear.length > 0 ? (
                    <div className="space-y-2 mt-3 pl-11 max-h-32 overflow-y-auto">
                      {employeeStats.retiringThisYear.map((emp: any) => (
                        <div key={emp.id} className="text-sm text-muted-foreground">
                          <span className="font-medium">{emp.name}</span> - {new Date(emp.tmt_pensiun).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-sm text-muted-foreground italic">
                      Data pensiun belum tersedia
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Pengumuman Section - Full Width */}
        <Card className="shadow-lg border-primary/10">
          <CardHeader className="border-b bg-gradient-to-r from-orange-500/10 to-red-500/10">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                <Megaphone className="h-5 w-5 text-orange-600" />
                Pengumuman
              </CardTitle>
              {user?.role !== "user_unit" && (
                <Button
                  onClick={() => navigate("/pengumuman")}
                  size="sm"
                  variant="outline"
                  className="gap-2"
                >
                  Kelola Pengumuman
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-4 md:p-6">
            {paginatedAnnouncements.map((announcement) => (
              <div
                key={announcement.id}
                className={`group p-4 rounded-lg border transition-all duration-300 hover:shadow-md mb-3 ${announcement.is_pinned
                  ? 'bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950/30 dark:to-red-950/30 border-orange-200 dark:border-orange-800'
                  : 'bg-muted/20 border-muted-foreground/20 hover:border-primary/30'
                  }`}
              >
                <div className="flex items-start gap-3">
                  {announcement.is_pinned && (
                    <Pin className="h-4 w-4 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-1" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-semibold text-base flex items-center gap-2">
                        {announcement.title}
                        {announcement.is_pinned && (
                          <Badge variant="secondary" className="text-xs">
                            Disematkan
                          </Badge>
                        )}
                      </h3>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      {announcement.content}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span className="font-medium">{announcement.profiles?.name || 'Admin'}</span>
                      <span>•</span>
                      <span>{getWorkUnitName(announcement.work_unit_id)}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(announcement.created_at).toLocaleDateString("id-ID", {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Pagination Controls for Announcements */}
            {announcements.length > ANNOUNCEMENTS_PER_PAGE && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAnnouncementsPage(p => Math.max(1, p - 1))}
                  disabled={announcementsPage === 1}
                  className="gap-2"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Sebelumnya
                </Button>
                <div className="text-sm text-muted-foreground">
                  Halaman {announcementsPage} dari {totalAnnouncementsPages}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAnnouncementsPage(p => Math.min(totalAnnouncementsPages, p + 1))}
                  disabled={announcementsPage === totalAnnouncementsPages}
                  className="gap-2"
                >
                  Berikutnya
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </DashboardLayout>
  );
}
