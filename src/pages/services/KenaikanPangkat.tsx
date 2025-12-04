import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/DashboardLayout";
import { ServiceList } from "@/components/ServiceList";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, TrendingUp, AlertCircle, FileText, CheckCircle2, Clock, XCircle, Sparkles } from "lucide-react";
import { PROMOTION_CATEGORIES, MONTHS, YEARS } from "@/lib/promotion-categories";
import { DocumentSelector } from "@/components/DocumentSelector";
import { getRepositoryId } from "@/lib/document-mapping";
import { StatCardSkeleton } from "@/components/skeletons";

export default function KenaikanPangkat() {
  const { user, updateProfile } = useAuth();
  const [services, setServices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [documentLinks, setDocumentLinks] = useState<Record<string, string>>({});
  const [editingService, setEditingService] = useState<any | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingDocuments, setEditingDocuments] = useState<Record<string, string>>({});
  const [savingDocuments, setSavingDocuments] = useState<Set<string>>(new Set());

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

    // AUTO-SAVE: Sync documents to repository
    const updatedDocs = { ...user!.documents };
    let savedCount = 0;

    category.documents.forEach(doc => {
      const repoId = getRepositoryId('kenaikan_pangkat', doc.name);
      const url = documentLinks[doc.name];

      if (repoId && url) {
        const existing = updatedDocs[repoId];
        const newDoc = { name: doc.name, url };

        if (Array.isArray(existing)) {
          // Check if URL already exists
          const urlExists = existing.some(d =>
            (typeof d === 'string' ? d : d.url) === url
          );
          if (!urlExists) {
            // Normalize array to DocumentItem[]
            const normalized = existing.map(d =>
              typeof d === 'string' ? { name: repoId, url: d } : d
            );
            updatedDocs[repoId] = [...normalized, newDoc];
            savedCount++;
          }
        } else if (existing) {
          // Convert to array if not already
          const existingUrl = typeof existing === 'string' ? existing : existing.url;
          if (existingUrl !== url) {
            updatedDocs[repoId] = [
              typeof existing === 'string' ? { name: repoId, url: existing } : existing,
              newDoc
            ];
            savedCount++;
          }
        } else {
          // New document
          updatedDocs[repoId] = [newDoc];
          savedCount++;
        }
      }
    });

    // Update user profile with new documents
    if (savedCount > 0) {
      await updateProfile({ documents: updatedDocs });
      toast.success(`${savedCount} dokumen baru tersimpan ke Repository`);
    }

    // Prepare documents array with names and URLs
    const documents = category.documents.map(doc => ({
      name: doc.name,
      url: documentLinks[doc.name],
      note: doc.note,
      verification_status: "menunggu_review",
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

  const handleEditService = (service: any) => {
    setEditingService(service);

    // Extract category from description
    const categoryMatch = service.description?.match(/Kategori: (.+)\n/);
    const categoryName = categoryMatch ? categoryMatch[1] : "";
    const category = PROMOTION_CATEGORIES.find(c => c.name === categoryName);

    // Extract period
    const periodMatch = service.description?.match(/Periode: (.+)/);
    const periodStr = periodMatch ? periodMatch[1] : "";
    const monthMatch = MONTHS.find(m => periodStr.includes(m.label));
    const yearMatch = YEARS.find(y => periodStr.includes(y.label));

    setSelectedCategory(category?.id || "");
    setSelectedMonth(monthMatch?.value || "");
    setSelectedYear(yearMatch?.value || "");

    // Set existing document links into editingDocuments
    const existingDocs: Record<string, string> = {};
    (service.documents || []).forEach((doc: any) => {
      existingDocs[doc.name] = doc.url;
    });
    setEditingDocuments(existingDocs);

    setIsEditDialogOpen(true);
  };

  const handleSaveDocument = async (docName: string) => {
    if (!editingService || !editingDocuments[docName]?.trim()) {
      toast.error("Masukkan link dokumen terlebih dahulu");
      return;
    }

    setSavingDocuments(prev => new Set(prev).add(docName));

    try {
      // Update the specific document in the service
      const updatedDocuments = editingService.documents.map((doc: any) => {
        if (doc.name === docName) {
          return {
            ...doc,
            url: editingDocuments[docName],
            verification_status: "menunggu_review",
            verification_note: "",
          };
        }
        return doc;
      });

      const { error } = await supabase
        .from("services")
        .update({ documents: updatedDocuments })
        .eq("id", editingService.id);

      if (error) throw error;

      toast.success("Dokumen berhasil disimpan");
      setEditingService({ ...editingService, documents: updatedDocuments });
    } catch (error) {
      console.error(error);
      toast.error("Gagal menyimpan dokumen");
    } finally {
      setSavingDocuments(prev => {
        const newSet = new Set(prev);
        newSet.delete(docName);
        return newSet;
      });
    }
  };

  const handleUpdateService = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!editingService) {
      toast.error("Data usulan tidak ditemukan");
      return;
    }

    // Check if all documents that need fixing have been saved
    const docsNeedingFix = editingService.documents?.filter((doc: any) =>
      doc.verification_status === "perlu_perbaikan"
    ) || [];

    if (docsNeedingFix.length > 0) {
      toast.error("Masih ada dokumen yang perlu diperbaiki. Simpan semua dokumen terlebih dahulu.");
      return;
    }

    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const description = formData.get("description") as string;

    try {
      // Prepare the new note
      const newNote = {
        actor: user!.name,
        role: user!.role,
        note: "Usulan telah diperbaiki dan diajukan kembali",
        timestamp: new Date().toISOString(),
      };

      // Combine existing notes with new note
      const existingNotes = Array.isArray(editingService.notes) ? editingService.notes : [];
      const updatedNotes = [...existingNotes, newNote];

      const { error } = await supabase
        .from("services")
        .update({
          status: "submitted",
          description: description || editingService.description,
          notes: updatedNotes,
        })
        .eq("id", editingService.id);

      if (error) {
        console.error("Error details:", error);
        toast.error(`Gagal mengajukan ulang usulan: ${error.message}`);
        setIsSubmitting(false);
        return;
      }

      toast.success("Usulan berhasil diajukan kembali");
      setIsEditDialogOpen(false);
      setEditingService(null);
      setSelectedCategory("");
      setSelectedMonth("");
      setSelectedYear("");
      setEditingDocuments({});
      setDocumentLinks({});
      loadServices();
    } catch (error: any) {
      console.error("Unexpected error:", error);
      toast.error(`Terjadi kesalahan: ${error.message || "Unknown error"}`);
    }

    setIsSubmitting(false);
  };

  const selectedCategoryData = PROMOTION_CATEGORIES.find(c => c.id === selectedCategory);
  const isAdmin = user?.role === "admin_unit" || user?.role === "admin_pusat";

  // Calculate statistics
  const stats = {
    total: services.length,
    pending: services.filter(s => s.status === "submitted" || s.status === "approved_by_unit").length,
    approved: services.filter(s => s.status === "approved_final").length,
    returned: services.filter(s => s.status === "returned_to_user" || s.status === "returned_to_unit" || s.status === "rejected").length,
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Modern Header with Gradient */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-600 via-orange-500 to-orange-400 p-6 md:p-8 text-white shadow-xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -ml-24 -mb-24"></div>

          <div className="relative z-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 md:p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                    <TrendingUp className="h-6 w-6 md:h-8 md:w-8" />
                  </div>
                  <div>
                    <h1 className="text-2xl md:text-4xl font-bold">Kenaikan Pangkat</h1>
                    <p className="text-sm md:text-base text-white/80 mt-1">
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
                    <Button size="lg" className="gap-2 bg-white text-orange-600 hover:bg-white/90 shadow-lg">
                      <Plus className="h-5 w-5" />
                      <span className="hidden sm:inline">Ajukan Usulan</span>
                      <span className="sm:hidden">Ajukan</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="w-[95vw] sm:max-w-4xl max-h-[90vh] flex flex-col p-4 sm:p-6">
                    <DialogHeader className="pb-2">
                      <DialogTitle className="text-lg md:text-2xl flex items-center gap-2">
                        <Sparkles className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                        Ajukan Kenaikan Pangkat
                      </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                      <ScrollArea className="h-[60vh] sm:h-[65vh] pr-4">
                        <div className="space-y-4 sm:space-y-6 pb-4 pt-2">
                          {/* Category Selection */}
                          <div className="space-y-2">
                            <Label htmlFor="category" className="text-sm sm:text-base font-semibold">Kategori Kenaikan Pangkat *</Label>
                            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                              <SelectTrigger className="h-10 sm:h-12 text-sm sm:text-base">
                                <SelectValue placeholder="Pilih kategori kenaikan pangkat" />
                              </SelectTrigger>
                              <SelectContent>
                                {PROMOTION_CATEGORIES.map(category => (
                                  <SelectItem key={category.id} value={category.id} className="text-sm sm:text-base">
                                    {category.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Period Selection */}
                          <div className="grid grid-cols-2 gap-3 sm:gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="month" className="text-sm sm:text-base font-semibold">Bulan Periode *</Label>
                              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                                <SelectTrigger className="h-10 sm:h-12 text-sm sm:text-base">
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
                              <Label htmlFor="year" className="text-sm sm:text-base font-semibold">Tahun Periode *</Label>
                              <Select value={selectedYear} onValueChange={setSelectedYear}>
                                <SelectTrigger className="h-10 sm:h-12 text-sm sm:text-base">
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
                            <Label htmlFor="description" className="text-sm sm:text-base font-semibold">Catatan Tambahan</Label>
                            <Textarea
                              id="description"
                              name="description"
                              placeholder="Tambahkan catatan atau informasi tambahan (opsional)..."
                              rows={3}
                              className="resize-none text-sm sm:text-base"
                            />
                          </div>

                          {/* Document Requirements */}
                          {selectedCategoryData && (
                            <div className="space-y-4 border-t pt-4 sm:pt-6">
                              <Alert className="bg-primary/5 border-primary/20">
                                <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                                <AlertDescription className="ml-2 text-xs sm:text-sm">
                                  <h4 className="font-semibold mb-1">Dokumen Persyaratan</h4>
                                  <p className="text-muted-foreground">
                                    Masukkan link/URL untuk setiap dokumen yang diperlukan. Pastikan link dapat diakses oleh admin.
                                  </p>
                                </AlertDescription>
                              </Alert>

                              <div className="space-y-3 sm:space-y-4">
                                {selectedCategoryData.documents.map((doc, index) => (
                                  <Card key={index} className="border hover:border-primary/30 transition-colors shadow-sm">
                                    <CardContent className="p-3 sm:p-4">
                                      <Label htmlFor={`doc-${index}`} className="flex items-start mb-2 sm:mb-3">
                                        <span className="font-semibold text-sm sm:text-base leading-tight">{index + 1}. {doc.name} <span className="text-destructive">*</span></span>
                                      </Label>
                                      {doc.note && (
                                        <p className="text-xs text-muted-foreground mb-2 sm:mb-3 bg-muted/50 p-2 rounded">
                                          <span className="font-medium">Catatan: </span>
                                          {doc.note}
                                        </p>
                                      )}
                                      <DocumentSelector
                                        label=""
                                        repositoryId={getRepositoryId('kenaikan_pangkat', doc.name) || ""}
                                        value={documentLinks[doc.name] || ""}
                                        onChange={(url) => handleDocumentLinkChange(doc.name, url)}
                                        note={undefined}
                                        required={true}
                                      />
                                    </CardContent>
                                  </Card>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </ScrollArea>

                      <div className="flex flex-col sm:flex-row gap-3 justify-end pt-4 border-t mt-auto">
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
                          className="w-full sm:w-auto h-10 sm:h-12 text-sm sm:text-base"
                        >
                          Batal
                        </Button>
                        <Button
                          type="submit"
                          disabled={isSubmitting || !selectedCategoryData}
                          className="w-full sm:w-auto h-10 sm:h-12 gap-2 text-sm sm:text-base"
                        >
                          {isSubmitting ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              Mengirim...
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="h-4 w-4" />
                              Ajukan Usulan
                            </>
                          )}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>
        </div>

        {/* Statistics for Admin - Responsive Grid */}
        {isAdmin && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {isLoading ? (
              <>
                <StatCardSkeleton />
                <StatCardSkeleton />
                <StatCardSkeleton />
                <StatCardSkeleton />
              </>
            ) : (
              <>
                <Card className="relative overflow-hidden border-primary/20 hover:shadow-lg hover:scale-105 transition-all duration-300">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-primary/5 rounded-full blur-2xl"></div>
                  <CardContent className="p-4 md:p-6 relative z-10">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div className="text-2xl md:text-3xl font-bold text-primary">{stats.total}</div>
                    </div>
                    <p className="text-xs md:text-sm text-muted-foreground font-medium">Total Usulan</p>
                  </CardContent>
                </Card>

                <Card className="relative overflow-hidden bg-gradient-to-br from-yellow-50 to-yellow-100/50 dark:from-yellow-950/30 dark:to-yellow-900/30 border-yellow-500/30 hover:shadow-lg hover:scale-105 transition-all duration-300">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-yellow-500/10 rounded-full blur-2xl"></div>
                  <CardContent className="p-4 md:p-6 relative z-10">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-yellow-500/10 rounded-lg">
                        <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                      </div>
                      <div className="text-2xl md:text-3xl font-bold text-yellow-600 dark:text-yellow-400">{stats.pending}</div>
                    </div>
                    <p className="text-xs md:text-sm text-muted-foreground font-medium">Menunggu Review</p>
                  </CardContent>
                </Card>

                <Card className="relative overflow-hidden bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/30 dark:to-green-900/30 border-green-500/30 hover:shadow-lg hover:scale-105 transition-all duration-300">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-green-500/10 rounded-full blur-2xl"></div>
                  <CardContent className="p-4 md:p-6 relative z-10">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-green-500/10 rounded-lg">
                        <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                      </div>
                      <div className="text-2xl md:text-3xl font-bold text-green-600 dark:text-green-400">{stats.approved}</div>
                    </div>
                    <p className="text-xs md:text-sm text-muted-foreground font-medium">Disetujui</p>
                  </CardContent>
                </Card>

                <Card className="relative overflow-hidden bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-950/30 dark:to-red-900/30 border-red-500/30 hover:shadow-lg hover:scale-105 transition-all duration-300">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-red-500/10 rounded-full blur-2xl"></div>
                  <CardContent className="p-4 md:p-6 relative z-10">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-red-500/10 rounded-lg">
                        <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                      </div>
                      <div className="text-2xl md:text-3xl font-bold text-red-600 dark:text-red-400">{stats.returned}</div>
                    </div>
                    <p className="text-xs md:text-sm text-muted-foreground font-medium">Dikembalikan/Ditolak</p>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        )}

        {/* Service List */}
        <ServiceList
          services={services}
          isLoading={isLoading}
          onReload={loadServices}
          showFilters={isAdmin}
          allowActions={isAdmin}
          onEditService={user?.role === "user_unit" ? handleEditService : undefined}
        />

        {/* Edit Dialog - Will be added in next iteration if needed */}
      </div>
    </DashboardLayout>
  );
}
