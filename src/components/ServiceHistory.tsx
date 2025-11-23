import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Clock, User, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

interface HistoryItem {
  id: string;
  action: string;
  notes: string | null;
  timestamp: string;
  actor_role: string;
  actor_id: string;
  actor_name?: string;
}

interface ServiceHistoryProps {
  serviceId: string;
  serviceType: string;
}

export function ServiceHistory({ serviceId, serviceType }: ServiceHistoryProps) {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, [serviceId]);

  const loadHistory = async () => {
    try {
      const { data, error } = await supabase
        .from("service_history")
        .select(`
          *,
          profiles!service_history_actor_id_fkey (name)
        `)
        .eq("service_id", serviceId)
        .eq("service_type", serviceType as any)
        .order("timestamp", { ascending: false });

      if (error) throw error;

      const enrichedHistory = (data || []).map((item: any) => ({
        ...item,
        actor_name: item.profiles?.name || "System",
      }));

      setHistory(enrichedHistory);
    } catch (error) {
      console.error("Error loading history:", error);
      toast.error("Gagal memuat riwayat layanan");
    } finally {
      setIsLoading(false);
    }
  };

  const getActionIcon = (action: string) => {
    if (action.includes("disetujui") || action.includes("approved")) {
      return <CheckCircle className="h-5 w-5 text-green-600" />;
    }
    if (action.includes("dikembalikan") || action.includes("returned")) {
      return <XCircle className="h-5 w-5 text-orange-600" />;
    }
    if (action.includes("diajukan") || action.includes("submitted")) {
      return <ArrowRight className="h-5 w-5 text-blue-600" />;
    }
    return <Clock className="h-5 w-5 text-gray-600" />;
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      user_unit: "Pegawai",
      admin_unit: "Admin Unit",
      admin_pusat: "Admin Pusat",
    };
    return labels[role] || role;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-sm text-muted-foreground">Memuat riwayat...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (history.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Riwayat Persetujuan</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Belum ada riwayat</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Riwayat Persetujuan</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {history.map((item, index) => (
            <div key={item.id} className="relative">
              {index !== history.length - 1 && (
                <div className="absolute left-[18px] top-10 bottom-0 w-0.5 bg-border" />
              )}
              <div className="flex gap-4">
                <div className="relative flex-shrink-0 mt-1">
                  <div className="w-9 h-9 rounded-full bg-background border-2 border-border flex items-center justify-center">
                    {getActionIcon(item.action)}
                  </div>
                </div>
                <div className="flex-1 space-y-1 pb-4">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm">{item.action}</p>
                    <Badge variant="outline" className="text-xs">
                      {getRoleLabel(item.actor_role)}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <User className="h-3 w-3" />
                    <span>{item.actor_name}</span>
                    <span>•</span>
                    <Clock className="h-3 w-3" />
                    <span>
                      {format(new Date(item.timestamp), "d MMM yyyy HH:mm", {
                        locale: localeId,
                      })}
                    </span>
                  </div>
                  {item.notes && (
                    <p className="text-sm text-muted-foreground mt-2 p-2 bg-muted rounded-md">
                      {item.notes}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
