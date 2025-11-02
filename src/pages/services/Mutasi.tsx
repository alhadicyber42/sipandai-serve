import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/DashboardLayout";
import { ServiceList } from "@/components/ServiceList";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Users } from "lucide-react";

export default function Mutasi() {
  const { user } = useAuth();
  const [services, setServices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadServices();
  }, [user]);

  const loadServices = async () => {
    if (!user) return;

    setIsLoading(true);
    let query = supabase
      .from("services")
      .select("*")
      .eq("service_type", "mutasi");

    if (user.role === "user_unit") {
      query = query.eq("user_id", user.id);
    } else if (user.role === "admin_unit") {
      query = query.eq("work_unit_id", user.work_unit_id);
    }

    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) {
      toast.error("Gagal memuat data");
      setServices([]);
      setIsLoading(false);
      return;
    }

    const list = data || [];
    if (list.length > 0) {
      const userIds = [...new Set(list.map(s => s.user_id))];
      const workUnitIds = [...new Set(list.map(s => s.work_unit_id))];

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

      setServices(list.map(s => ({
        ...s,
        profiles: profilesMap.get(s.user_id),
        work_units: workUnitsMap.get(s.work_unit_id),
      })));
    } else {
      setServices([]);
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

  const isAdmin = user?.role === "admin_unit" || user?.role === "admin_pusat";

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Mutasi Pegawai</h1>
                <p className="text-muted-foreground mt-1">
                  {user?.role === "user_unit"
                    ? "Kelola usulan mutasi Anda"
                    : user?.role === "admin_unit"
                    ? "Review usulan mutasi unit Anda"
                    : "Kelola semua usulan mutasi pegawai"}
                </p>
              </div>
            </div>
          </div>
          {user?.role === "user_unit" && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Ajukan Mutasi
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Ajukan Mutasi Pegawai</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Judul Usulan *</Label>
                    <Input
                      id="title"
                      name="title"
                      placeholder="Contoh: Permohonan Mutasi ke BBPVP Bandung"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Deskripsi *</Label>
                    <Textarea
                      id="description"
                      name="description"
                      placeholder="Jelaskan alasan dan tujuan mutasi..."
                      rows={5}
                      required
                    />
                  </div>
                  <div className="flex gap-2 justify-end pt-4 border-t">
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

        {/* Statistics for Admin */}
        {isAdmin && (
          <div className="grid md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{services.length}</div>
                <p className="text-sm text-muted-foreground">Total Usulan</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-yellow-600">
                  {services.filter((s) => s.status === "submitted").length}
                </div>
                <p className="text-sm text-muted-foreground">Menunggu Review</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-green-600">
                  {services.filter((s) => s.status === "approved_final").length}
                </div>
                <p className="text-sm text-muted-foreground">Disetujui</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-red-600">
                  {
                    services.filter(
                      (s) =>
                        s.status === "returned_to_user" ||
                        s.status === "returned_to_unit" ||
                        s.status === "rejected"
                    ).length
                  }
                </div>
                <p className="text-sm text-muted-foreground">Dikembalikan/Ditolak</p>
              </CardContent>
            </Card>
          </div>
        )}

        <ServiceList
          services={services}
          isLoading={isLoading}
          onReload={loadServices}
          showFilters={isAdmin}
          allowActions={isAdmin}
        />
      </div>
    </DashboardLayout>
  );
}
