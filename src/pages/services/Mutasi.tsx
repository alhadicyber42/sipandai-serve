import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { StatusBadge } from "@/components/StatusBadge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Upload, FileText, Eye, CheckCircle, XCircle } from "lucide-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

export default function Mutasi() {
  const { user } = useAuth();
  const [services, setServices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadServices();
  }, [user]);

  const loadServices = async () => {
    if (!user) return;

    setIsLoading(true);
    let query = supabase
      .from("services")
      .select("*, profiles!services_user_id_fkey(name)")
      .eq("service_type", "mutasi");

    if (user.role === "user_unit") {
      query = query.eq("user_id", user.id);
    } else if (user.role === "admin_unit") {
      query = query.eq("work_unit_id", user.work_unit_id);
    }

    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) {
      toast.error("Gagal memuat data");
    } else {
      setServices(data || []);
    }
    setIsLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;

    const { error } = await supabase.from("services").insert({
      user_id: user!.id,
      work_unit_id: user!.work_unit_id,
      service_type: "mutasi",
      status: "submitted",
      title,
      description,
      documents: [],
    });

    if (error) {
      toast.error("Gagal mengajukan usulan");
    } else {
      toast.success("Usulan berhasil diajukan");
      setIsDialogOpen(false);
      loadServices();
    }

    setIsSubmitting(false);
  };

  const handleApprove = async (serviceId: string) => {
    const newStatus = user?.role === "admin_unit" ? "approved_by_unit" : "approved_final";
    const { error } = await supabase
      .from("services")
      .update({
        status: newStatus,
        notes: [
          ...(selectedService?.notes || []),
          {
            actor: user?.name,
            role: user?.role,
            note: "Disetujui",
            timestamp: new Date().toISOString(),
          },
        ],
      })
      .eq("id", serviceId);

    if (error) {
      toast.error("Gagal menyetujui usulan");
    } else {
      toast.success("Usulan berhasil disetujui");
      setSelectedService(null);
      loadServices();
    }
  };

  const handleReturn = async (serviceId: string, note: string) => {
    const newStatus = user?.role === "admin_unit" ? "returned_to_user" : "returned_to_unit";
    const { error } = await supabase
      .from("services")
      .update({
        status: newStatus,
        notes: [
          ...(selectedService?.notes || []),
          {
            actor: user?.name,
            role: user?.role,
            note,
            timestamp: new Date().toISOString(),
          },
        ],
      })
      .eq("id", serviceId);

    if (error) {
      toast.error("Gagal mengembalikan usulan");
    } else {
      toast.success("Usulan dikembalikan untuk revisi");
      setSelectedService(null);
      loadServices();
    }
  };

  const isAdmin = user?.role === "admin_unit" || user?.role === "admin_pusat";

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Mutasi Pegawai</h1>
            <p className="text-muted-foreground mt-1">
              {user?.role === "user_unit" ? "Kelola usulan mutasi Anda" : "Review usulan mutasi pegawai"}
            </p>
          </div>
          {user?.role === "user_unit" && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Ajukan Mutasi
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Ajukan Mutasi Pegawai</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Judul Usulan</Label>
                    <Input
                      id="title"
                      name="title"
                      placeholder="Contoh: Permohonan Mutasi ke BBPVP Bandung"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Deskripsi</Label>
                    <Textarea
                      id="description"
                      name="description"
                      placeholder="Jelaskan alasan dan tujuan mutasi..."
                      rows={4}
                      required
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Batal
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? "Mengirim..." : "Ajukan Usulan"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <div className="grid gap-4">
          {isLoading ? (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-4 text-muted-foreground">Memuat data...</p>
              </CardContent>
            </Card>
          ) : services.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">Belum ada usulan</p>
              </CardContent>
            </Card>
          ) : (
            services.map((service) => (
              <Card key={service.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{service.title}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {user?.role !== "user_unit" && `Diajukan oleh: ${service.profiles?.name} • `}
                        {format(new Date(service.created_at), "dd MMMM yyyy", { locale: localeId })}
                      </p>
                    </div>
                    <StatusBadge status={service.status} />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm mb-4">{service.description}</p>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" onClick={() => setSelectedService(service)}>
                        <Eye className="mr-2 h-4 w-4" />
                        Detail
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Detail Usulan</DialogTitle>
                      </DialogHeader>
                      {selectedService && (
                        <div className="space-y-4">
                          <div>
                            <Label>Judul</Label>
                            <p className="text-sm mt-1">{selectedService.title}</p>
                          </div>
                          <div>
                            <Label>Deskripsi</Label>
                            <p className="text-sm mt-1">{selectedService.description}</p>
                          </div>
                          <div>
                            <Label>Status</Label>
                            <div className="mt-1">
                              <StatusBadge status={selectedService.status} />
                            </div>
                          </div>
                          {isAdmin && (selectedService.status === "submitted" || selectedService.status === "approved_by_unit") && (
                            <div className="flex gap-2 pt-4 border-t">
                              <Button className="flex-1" onClick={() => handleApprove(selectedService.id)}>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Setujui
                              </Button>
                              <Button
                                variant="destructive"
                                className="flex-1"
                                onClick={() => {
                                  const note = prompt("Alasan pengembalian:");
                                  if (note) handleReturn(selectedService.id, note);
                                }}
                              >
                                <XCircle className="mr-2 h-4 w-4" />
                                Kembalikan
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
