import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/DashboardLayout";
import { ServiceList } from "@/components/ServiceList";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Users, AlertCircle } from "lucide-react";
import { TRANSFER_CATEGORIES, type TransferCategory } from "@/lib/transfer-categories";

export default function Mutasi() {
  const { user } = useAuth();
  const [services, setServices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<TransferCategory | null>(null);
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
    
    if (!selectedCategory) {
      toast.error("Pilih kategori mutasi terlebih dahulu");
      return;
    }

    // Validate all documents are filled
    const missingDocs = selectedCategory.documents.filter(
      (doc) => !documentLinks[doc.name] || documentLinks[doc.name].trim() === ""
    );

    if (missingDocs.length > 0) {
      toast.error(`Mohon lengkapi semua dokumen persyaratan (${missingDocs.length} dokumen belum dilengkapi)`);
      return;
    }

    setIsSubmitting(true);

    // Prepare documents array with verification status
    const documentsArray = selectedCategory.documents.map((doc) => ({
      name: doc.name,
      url: documentLinks[doc.name],
      note: doc.note,
      verification_status: "menunggu_review",
      verification_note: "",
    }));

    const { error } = await supabase.from("services").insert({
      user_id: user!.id,
      work_unit_id: user!.work_unit_id,
      service_type: "mutasi",
      status: "submitted",
      title: selectedCategory.name,
      description: selectedCategory.description,
      documents: documentsArray,
    });

    if (error) {
      toast.error("Gagal mengajukan usulan");
      console.error("Error submitting transfer:", error);
    } else {
      toast.success("Usulan mutasi berhasil diajukan");
      setIsDialogOpen(false);
      setSelectedCategory(null);
      setDocumentLinks({});
      loadServices();
    }

    setIsSubmitting(false);
  };

  const handleCategoryChange = (categoryId: string) => {
    const category = TRANSFER_CATEGORIES.find((c) => c.id === categoryId);
    setSelectedCategory(category || null);
    setDocumentLinks({});
  };

  const handleDocumentLinkChange = (docName: string, url: string) => {
    setDocumentLinks((prev) => ({
      ...prev,
      [docName]: url,
    }));
  };

  const handleDialogOpenChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setSelectedCategory(null);
      setDocumentLinks({});
    }
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
            <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Ajukan Mutasi
                </Button>
              </DialogTrigger>
              <DialogContent className="w-[95vw] sm:max-w-3xl max-h-[90vh] flex flex-col">
                <DialogHeader>
                  <DialogTitle>Ajukan Mutasi Pegawai</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                  <ScrollArea className="flex-1 pr-4">
                    <div className="space-y-6 pb-4">
                      <div className="space-y-2">
                        <Label htmlFor="category">Kategori Mutasi *</Label>
                        <Select
                          value={selectedCategory?.id || ""}
                          onValueChange={handleCategoryChange}
                        >
                          <SelectTrigger id="category">
                            <SelectValue placeholder="Pilih kategori mutasi" />
                          </SelectTrigger>
                          <SelectContent>
                            {TRANSFER_CATEGORIES.map((category) => (
                              <SelectItem key={category.id} value={category.id}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {selectedCategory && (
                          <p className="text-sm text-muted-foreground">
                            {selectedCategory.description}
                          </p>
                        )}
                      </div>

                      {selectedCategory && (
                        <div className="space-y-4">
                          <div className="border-t pt-4">
                            <h3 className="font-semibold mb-4">
                              Dokumen Persyaratan ({selectedCategory.documents.length})
                            </h3>
                            <div className="space-y-4">
                              {selectedCategory.documents.map((doc, index) => (
                                <div key={index} className="space-y-2 p-3 border rounded-lg">
                                  <Label htmlFor={`doc-${index}`}>
                                    {index + 1}. {doc.name} *
                                  </Label>
                                  {doc.note && (
                                    <p className="text-xs text-muted-foreground flex items-start gap-1">
                                      <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                                      {doc.note}
                                    </p>
                                  )}
                                  <Input
                                    id={`doc-${index}`}
                                    type="url"
                                    placeholder="Masukkan link dokumen"
                                    value={documentLinks[doc.name] || ""}
                                    onChange={(e) =>
                                      handleDocumentLinkChange(doc.name, e.target.value)
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
