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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, TrendingUp, AlertCircle } from "lucide-react";
import { PROMOTION_CATEGORIES, MONTHS, YEARS } from "@/lib/promotion-categories";

export default function KenaikanPangkat() {
  const { user } = useAuth();
  const [services, setServices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState<string>("");
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
      .eq("service_type", "kenaikan_pangkat");

    if (user.role === "user_unit") {
      query = query.eq("user_id", user.id);
    } else if (user.role === "admin_unit") {
      query = query.eq("work_unit_id", user.work_unit_id);
    }
    // admin_pusat can see all

    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) {
      toast.error("Gagal memuat data");
      console.error(error);
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
      toast.error("Pilih kategori kenaikan pangkat");
      return;
    }

    if (!selectedMonth || !selectedYear) {
      toast.error("Pilih periode pengajuan");
      return;
    }

    const category = PROMOTION_CATEGORIES.find(c => c.id === selectedCategory);
    if (!category) return;

    // Validate all required documents are filled
    const missingDocs = category.documents.filter(doc => !documentLinks[doc.name] || documentLinks[doc.name].trim() === "");
    if (missingDocs.length > 0) {
      toast.error(`Lengkapi semua dokumen persyaratan (${missingDocs.length} dokumen belum dilengkapi)`);
      return;
    }

    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const description = formData.get("description") as string;

    // Prepare documents array with names and URLs
    const documents = category.documents.map(doc => ({
      name: doc.name,
      url: documentLinks[doc.name],
      note: doc.note
    }));

    const period = `${MONTHS.find(m => m.value === selectedMonth)?.label} ${selectedYear}`;
    const title = `${category.name} - Periode ${period}`;

    const { error } = await supabase.from("services").insert({
      user_id: user!.id,
      work_unit_id: user!.work_unit_id,
      service_type: "kenaikan_pangkat",
      status: "submitted",
      title,
      description: `${description}\n\nKategori: ${category.name}\nPeriode: ${period}`,
      documents,
    });

    if (error) {
      toast.error("Gagal mengajukan usulan");
      console.error(error);
    } else {
      toast.success("Usulan berhasil diajukan");
      setIsDialogOpen(false);
      setSelectedCategory("");
      setSelectedMonth("");
      setSelectedYear("");
      setDocumentLinks({});
      loadServices();
    }

    setIsSubmitting(false);
  };

  const handleDocumentLinkChange = (docName: string, value: string) => {
    setDocumentLinks(prev => ({
      ...prev,
      [docName]: value
    }));
  };

  const selectedCategoryData = PROMOTION_CATEGORIES.find(c => c.id === selectedCategory);

  const isAdmin = user?.role === "admin_unit" || user?.role === "admin_pusat";

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Kenaikan Pangkat</h1>
                <p className="text-muted-foreground mt-1">
                  {user?.role === "user_unit"
                    ? "Kelola usulan kenaikan pangkat Anda"
                    : user?.role === "admin_unit"
                    ? "Review usulan kenaikan pangkat unit Anda"
                    : "Kelola semua usulan kenaikan pangkat"}
                </p>
              </div>
            </div>
          </div>
          {user?.role === "user_unit" && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Ajukan Usulan
                </Button>
              </DialogTrigger>
              <DialogContent className="w-[95vw] sm:max-w-4xl max-h-[90vh] flex flex-col">
                <DialogHeader>
                  <DialogTitle>Ajukan Kenaikan Pangkat</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                  <ScrollArea className="flex-1 pr-4">
                    <div className="space-y-6 pb-4">
                      {/* Category Selection */}
                      <div className="space-y-2">
                        <Label htmlFor="category">Kategori Kenaikan Pangkat *</Label>
                        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih kategori kenaikan pangkat" />
                          </SelectTrigger>
                          <SelectContent>
                            {PROMOTION_CATEGORIES.map(category => (
                              <SelectItem key={category.id} value={category.id}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Period Selection */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="month">Bulan Periode *</Label>
                          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih bulan" />
                            </SelectTrigger>
                            <SelectContent>
                              {MONTHS.map(month => (
                                <SelectItem key={month.value} value={month.value}>
                                  {month.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="year">Tahun Periode *</Label>
                          <Select value={selectedYear} onValueChange={setSelectedYear}>
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih tahun" />
                            </SelectTrigger>
                            <SelectContent>
                              {YEARS.map(year => (
                                <SelectItem key={year.value} value={year.value}>
                                  {year.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Description */}
                      <div className="space-y-2">
                        <Label htmlFor="description">Catatan Tambahan</Label>
                        <Textarea
                          id="description"
                          name="description"
                          placeholder="Tambahkan catatan atau informasi tambahan (opsional)..."
                          rows={3}
                        />
                      </div>

                      {/* Document Requirements */}
                      {selectedCategoryData && (
                        <div className="space-y-4 border-t pt-4">
                          <div className="flex items-start gap-2">
                            <AlertCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                            <div>
                              <h4 className="font-semibold text-sm">Dokumen Persyaratan</h4>
                              <p className="text-sm text-muted-foreground">
                                Masukkan link/URL untuk setiap dokumen yang diperlukan
                              </p>
                            </div>
                          </div>

                          <div className="space-y-4">
                            {selectedCategoryData.documents.map((doc, index) => (
                              <div key={index} className="space-y-2 p-3 border rounded-lg">
                                <Label htmlFor={`doc-${index}`} className="flex items-start">
                                  <span className="font-medium">{index + 1}. {doc.name} *</span>
                                </Label>
                                {doc.note && (
                                  <Alert className="bg-muted/50">
                                    <AlertDescription className="text-xs">
                                      <span className="font-medium">Catatan: </span>
                                      {doc.note}
                                    </AlertDescription>
                                  </Alert>
                                )}
                                <Input
                                  id={`doc-${index}`}
                                  type="url"
                                  placeholder="https://drive.google.com/... atau link lainnya"
                                  value={documentLinks[doc.name] || ""}
                                  onChange={(e) => handleDocumentLinkChange(doc.name, e.target.value)}
                                  required
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {!selectedCategoryData && (
                        <Alert>
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            Pilih kategori kenaikan pangkat untuk melihat daftar dokumen persyaratan
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  </ScrollArea>

                  <div className="flex flex-col sm:flex-row gap-2 justify-end pt-4 border-t mt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsDialogOpen(false);
                        setSelectedCategory("");
                        setSelectedMonth("");
                        setSelectedYear("");
                        setDocumentLinks({});
                      }}
                      className="w-full sm:w-auto"
                    >
                      Batal
                    </Button>
                    <Button type="submit" disabled={isSubmitting || !selectedCategoryData} className="w-full sm:w-auto">
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
