import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/DashboardLayout";
import { ServiceList } from "@/components/ServiceList";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, UserX, AlertCircle } from "lucide-react";
import { RETIREMENT_CATEGORIES } from "@/lib/retirement-categories";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function Pensiun() {
  const { user } = useAuth();
  const [services, setServices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [documentLinks, setDocumentLinks] = useState<Record<string, string>>({});

  useEffect(() => {
    loadServices();
  }, [user]);

  const loadServices = async () => {
    if (!user) return;

    setIsLoading(true);
    let query = supabase
      .from("services")
      .select("*")
      .eq("service_type", "pensiun");

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
    
    if (!selectedCategory) {
      toast.error("Pilih kategori pensiun terlebih dahulu");
      return;
    }

    const category = RETIREMENT_CATEGORIES.find(c => c.id === selectedCategory);
    if (!category) {
      toast.error("Kategori tidak valid");
      return;
    }

    // Validate all required documents have links
    const missingDocs = category.documents.filter(doc => !documentLinks[doc.name]?.trim());
    if (missingDocs.length > 0) {
      toast.error(`Lengkapi link dokumen: ${missingDocs[0].name}`);
      return;
    }

    setIsSubmitting(true);

    const documents = category.documents.map(doc => ({
      name: doc.name,
      url: documentLinks[doc.name],
      note: doc.note
    }));

    const { error } = await supabase.from("services").insert({
      user_id: user!.id,
      work_unit_id: user!.work_unit_id,
      service_type: "pensiun",
      status: "submitted",
      title: `Pengajuan ${category.name}`,
      description: `Kategori: ${category.name}`,
      documents,
    });

    if (error) {
      toast.error("Gagal mengajukan usulan");
      console.error(error);
    } else {
      toast.success("Usulan berhasil diajukan");
      setIsDialogOpen(false);
      setSelectedCategory("");
      setDocumentLinks({});
      loadServices();
    }

    setIsSubmitting(false);
  };

  const handleDialogOpenChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setSelectedCategory("");
      setDocumentLinks({});
    }
  };

  const selectedCategoryData = RETIREMENT_CATEGORIES.find(c => c.id === selectedCategory);

  const isAdmin = user?.role === "admin_unit" || user?.role === "admin_pusat";

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <UserX className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Pensiun</h1>
                <p className="text-muted-foreground mt-1">
                  {user?.role === "user_unit"
                    ? "Kelola usulan pensiun Anda"
                    : user?.role === "admin_unit"
                    ? "Review usulan pensiun unit Anda"
                    : "Kelola semua usulan pensiun"}
                </p>
              </div>
            </div>
          </div>
          {user?.role === "user_unit" && (
            <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Ajukan Pensiun
                </Button>
              </DialogTrigger>
              <DialogContent className="w-[95vw] sm:max-w-3xl max-h-[90vh] flex flex-col">
                <DialogHeader>
                  <DialogTitle>Ajukan Usulan Pensiun</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                  <ScrollArea className="h-[60vh] sm:h-[65vh] pr-4">
                    <div className="space-y-6 pb-4">
                      <div className="space-y-2">
                        <Label htmlFor="category">Kategori Pensiun *</Label>
                        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih kategori pensiun" />
                          </SelectTrigger>
                          <SelectContent>
                            {RETIREMENT_CATEGORIES.map((category) => (
                              <SelectItem key={category.id} value={category.id}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {selectedCategoryData && (
                        <div className="space-y-4">
                          <div className="bg-muted/50 p-4 rounded-lg">
                            <h3 className="font-semibold mb-3">Dokumen Persyaratan</h3>
                            <p className="text-sm text-muted-foreground mb-4">
                              Masukkan link/URL untuk setiap dokumen yang diperlukan
                            </p>
                            <div className="space-y-4">
                              {selectedCategoryData.documents.map((doc, index) => (
                                <div key={index} className="space-y-2 p-3 border rounded-lg bg-background">
                                  <Label htmlFor={`doc-${index}`} className="flex items-start gap-2">
                                    <span className="flex-1">
                                      {index + 1}. {doc.name}
                                    </span>
                                  </Label>
                                  {doc.note && (
                                    <div className="flex items-start gap-2 text-xs text-muted-foreground mb-2">
                                      <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                                      <span>{doc.note}</span>
                                    </div>
                                  )}
                                  <Input
                                    id={`doc-${index}`}
                                    type="url"
                                    placeholder="https://..."
                                    value={documentLinks[doc.name] || ""}
                                    onChange={(e) =>
                                      setDocumentLinks({
                                        ...documentLinks,
                                        [doc.name]: e.target.value,
                                      })
                                    }
                                    required
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </ScrollArea>

                  <div className="flex flex-col sm:flex-row gap-2 justify-end pt-4 border-t mt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleDialogOpenChange(false)}
                      className="w-full sm:w-auto"
                    >
                      Batal
                    </Button>
                    <Button type="submit" disabled={isSubmitting || !selectedCategory} className="w-full sm:w-auto">
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
