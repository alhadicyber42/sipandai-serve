import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageSquare, Plus, Clock, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

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

  const getPriorityLabel = (priority: string) => {
    const labels: Record<string, string> = {
      low: "Rendah",
      medium: "Sedang",
      high: "Tinggi",
    };
    return labels[priority] || priority;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Riwayat Konsultasi</h1>
            <p className="text-muted-foreground mt-1">
              Kelola konsultasi Anda dengan admin
            </p>
          </div>
          <Button onClick={() => navigate("/konsultasi/baru")} className="gap-2">
            <Plus className="h-4 w-4" />
            Konsultasi Baru
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Daftar Konsultasi Saya
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-sm text-muted-foreground">Memuat data...</p>
              </div>
            ) : consultations.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">
                  Anda belum memiliki konsultasi
                </p>
                <Button onClick={() => navigate("/konsultasi/baru")}>
                  Buat Konsultasi Pertama
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {consultations.map((consultation) => (
                  <Card
                    key={consultation.id}
                    className="hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => navigate(`/konsultasi/${consultation.id}`)}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-lg">
                              {consultation.subject}
                            </h3>
                            {consultation.is_escalated && (
                              <Badge variant="destructive" className="gap-1">
                                <AlertCircle className="h-3 w-3" />
                                Tereskalasi ke Pusat
                              </Badge>
                            )}
                          </div>

                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {consultation.description}
                          </p>

                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            {format(
                              new Date(consultation.created_at),
                              "d MMMM yyyy HH:mm",
                              { locale: localeId }
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-2">
                          <Badge
                            variant={
                              consultation.status === "resolved"
                                ? "outline"
                                : "default"
                            }
                          >
                            {getStatusLabel(consultation.status)}
                          </Badge>
                          <Badge
                            className={
                              consultation.priority === "high"
                                ? "bg-red-100 text-red-800"
                                : consultation.priority === "medium"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-blue-100 text-blue-800"
                            }
                          >
                            Prioritas: {getPriorityLabel(consultation.priority)}
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
