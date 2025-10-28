import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { MessageSquare, Search, Clock, AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

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
      const { data, error } = await supabase
        .from("consultations")
        .select(`
          *,
          profiles!consultations_user_id_fkey (name),
          work_units (name)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setConsultations(data as any || []);
    } catch (error: any) {
      console.error("Error loading consultations:", error);
      toast.error("Gagal memuat data konsultasi");
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      submitted: { variant: "secondary", icon: Clock, label: "Baru" },
      in_progress: { variant: "default", icon: MessageSquare, label: "Dalam Proses" },
      resolved: { variant: "outline", icon: CheckCircle2, label: "Selesai" },
      closed: { variant: "outline", icon: XCircle, label: "Ditutup" },
    };

    const config = variants[status] || variants.submitted;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const colors: Record<string, string> = {
      low: "bg-blue-100 text-blue-800",
      medium: "bg-yellow-100 text-yellow-800",
      high: "bg-red-100 text-red-800",
    };

    const labels: Record<string, string> = {
      low: "Rendah",
      medium: "Sedang",
      high: "Tinggi",
    };

    return (
      <Badge className={colors[priority] || colors.medium}>
        {labels[priority] || priority}
      </Badge>
    );
  };

  const filteredConsultations = consultations.filter((consultation) => {
    const matchesSearch =
      consultation.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      consultation.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || consultation.status === statusFilter;
    const matchesPriority = priorityFilter === "all" || consultation.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  // Statistics
  const stats = {
    total: consultations.length,
    submitted: consultations.filter((c) => c.status === "submitted").length,
    in_progress: consultations.filter((c) => c.status === "in_progress").length,
    escalated: consultations.filter((c) => c.is_escalated).length,
  };

  if (user?.role !== "admin_pusat") {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Anda tidak memiliki akses ke halaman ini.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Semua Konsultasi</h1>
          <p className="text-muted-foreground mt-1">
            Kelola semua konsultasi dari berbagai unit kerja
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-sm text-muted-foreground">Total Konsultasi</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-blue-600">{stats.submitted}</div>
              <p className="text-sm text-muted-foreground">Konsultasi Baru</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-yellow-600">{stats.in_progress}</div>
              <p className="text-sm text-muted-foreground">Dalam Proses</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-red-600">{stats.escalated}</div>
              <p className="text-sm text-muted-foreground">Tereskalasi</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Daftar Konsultasi
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  <SelectItem value="submitted">Baru</SelectItem>
                  <SelectItem value="in_progress">Dalam Proses</SelectItem>
                  <SelectItem value="resolved">Selesai</SelectItem>
                  <SelectItem value="closed">Ditutup</SelectItem>
                </SelectContent>
              </Select>

              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger>
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
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-sm text-muted-foreground">Memuat data...</p>
              </div>
            ) : filteredConsultations.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Tidak ada konsultasi</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredConsultations.map((consultation) => (
                  <Card
                    key={consultation.id}
                    className="hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => navigate(`/konsultasi/${consultation.id}`)}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-lg">{consultation.subject}</h3>
                            {consultation.is_escalated && (
                              <Badge variant="destructive" className="gap-1">
                                <AlertCircle className="h-3 w-3" />
                                Tereskalasi
                              </Badge>
                            )}
                          </div>
                          
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {consultation.description}
                          </p>

                          <div className="flex flex-wrap items-center gap-2 text-sm">
                            <span className="text-muted-foreground">
                              {(consultation.profiles as any)?.name}
                            </span>
                            <span className="text-muted-foreground">•</span>
                            <span className="text-muted-foreground">
                              {(consultation.work_units as any)?.name}
                            </span>
                            <span className="text-muted-foreground">•</span>
                            <span className="text-muted-foreground">
                              {format(new Date(consultation.created_at), "d MMM yyyy HH:mm", {
                                locale: localeId,
                              })}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-2">
                          {getStatusBadge(consultation.status)}
                          {getPriorityBadge(consultation.priority)}
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
