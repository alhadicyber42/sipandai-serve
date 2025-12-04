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
import { DocumentSelector } from "@/components/DocumentSelector";
import { getRepositoryId } from "@/lib/document-mapping";
import { StatCardSkeleton } from "@/components/skeletons";

export default function Pensiun() {
    const { user, updateProfile } = useAuth();
    const [services, setServices] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<string>("");
    const [documentLinks, setDocumentLinks] = useState<Record<string, string>>({});
    
    // Edit service states
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

        // AUTO-SAVE: Sync documents to repository
        const updatedDocs = { ...user!.documents };
        let savedCount = 0;

        category.documents.forEach(doc => {
            const repoId = getRepositoryId('pensiun', doc.name);
            const url = documentLinks[doc.name];

            if (repoId && url) {
                const existing = updatedDocs[repoId];
                const newDoc = { name: doc.name, url };

                if (Array.isArray(existing)) {
                    const urlExists = existing.some(d =>
                        (typeof d === 'string' ? d : d.url) === url
                    );
                    if (!urlExists) {
                        const normalized = existing.map(d =>
                            typeof d === 'string' ? { name: repoId, url: d } : d
                        );
                        updatedDocs[repoId] = [...normalized, newDoc];
                        savedCount++;
                    }
                } else if (existing) {
                    const existingUrl = typeof existing === 'string' ? existing : existing.url;
                    if (existingUrl !== url) {
                        updatedDocs[repoId] = [
                            typeof existing === 'string' ? { name: repoId, url: existing } : existing,
                            newDoc
                        ];
                        savedCount++;
                    }
                } else {
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

    const handleEditService = (service: any) => {
        setEditingService(service);
        
        // Extract category from description
        const categoryMatch = service.description?.match(/Kategori: (.+)/);
        const categoryName = categoryMatch ? categoryMatch[1] : "";
        const category = RETIREMENT_CATEGORIES.find(c => c.name === categoryName);
        
        setSelectedCategory(category?.id || "");
        
        // Set existing document links
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

        const docsNeedingFix = editingService.documents?.filter((doc: any) =>
            doc.verification_status === "perlu_perbaikan"
        ) || [];

        if (docsNeedingFix.length > 0) {
            toast.error("Masih ada dokumen yang perlu diperbaiki. Simpan semua dokumen terlebih dahulu.");
            return;
        }

        setIsSubmitting(true);

        try {
            const newNote = {
                actor: user!.name,
                role: user!.role,
                note: "Usulan telah diperbaiki dan diajukan kembali",
                timestamp: new Date().toISOString(),
            };

            const existingNotes = Array.isArray(editingService.notes) ? editingService.notes : [];

            const { error } = await supabase
                .from("services")
                .update({
                    status: "submitted",
                    notes: [...existingNotes, newNote],
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
            setEditingDocuments({});
            loadServices();
        } catch (error: any) {
            console.error("Unexpected error:", error);
            toast.error(`Terjadi kesalahan: ${error.message || "Unknown error"}`);
        }

        setIsSubmitting(false);
    };

    const selectedCategoryData = RETIREMENT_CATEGORIES.find(c => c.id === selectedCategory);

    const isAdmin = user?.role === "admin_unit" || user?.role === "admin_pusat";

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Modern Header with Gradient */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-600 via-purple-500 to-violet-400 p-6 md:p-8 text-white shadow-xl">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -ml-24 -mb-24"></div>

                    <div className="relative z-10">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 md:p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                                    <UserX className="h-6 w-6 md:h-8 md:w-8" />
                                </div>
                                <div>
                                    <h1 className="text-2xl md:text-4xl font-bold">Pensiun</h1>
                                    <p className="text-sm md:text-base text-white/90 mt-1">
                                        {user?.role === "user_unit"
                                            ? "Kelola usulan pensiun Anda"
                                            : user?.role === "admin_unit"
                                                ? "Review usulan pensiun unit Anda"
                                                : "Kelola semua usulan pensiun"}
                                    </p>
                                </div>
                            </div>

                            {user?.role === "user_unit" && (
                                <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
                                    <DialogTrigger asChild>
                                        <Button size="lg" className="gap-2 bg-white text-purple-600 hover:bg-white/90 shadow-lg border-none">
                                            <Plus className="h-5 w-5" />
                                            <span className="hidden sm:inline">Ajukan Pensiun</span>
                                            <span className="sm:hidden">Ajukan</span>
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="w-[95vw] sm:max-w-3xl max-h-[90vh] flex flex-col p-4 sm:p-6">
                                        <DialogHeader className="pb-2">
                                            <DialogTitle className="text-lg md:text-2xl">Ajukan Usulan Pensiun</DialogTitle>
                                        </DialogHeader>
                                        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                                            <ScrollArea className="h-[60vh] sm:h-[65vh] pr-4">
                                                <div className="space-y-4 sm:space-y-6 pb-4 pt-2">
                                                    <div className="space-y-2">
                                                        <Label htmlFor="category" className="text-sm sm:text-base font-semibold">Kategori Pensiun *</Label>
                                                        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                                                            <SelectTrigger className="h-10 sm:h-12 text-sm sm:text-base">
                                                                <SelectValue placeholder="Pilih kategori pensiun" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {RETIREMENT_CATEGORIES.map((category) => (
                                                                    <SelectItem key={category.id} value={category.id} className="text-sm sm:text-base">
                                                                        {category.name}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>

                                                    {selectedCategoryData && (
                                                        <div className="space-y-4">
                                                            <div className="bg-muted/50 p-3 sm:p-4 rounded-lg">
                                                                <h3 className="font-semibold mb-2 sm:mb-3 text-sm sm:text-base">Dokumen Persyaratan</h3>
                                                                <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">
                                                                    Masukkan link/URL untuk setiap dokumen yang diperlukan
                                                                </p>
                                                                <div className="space-y-3 sm:space-y-4">
                                                                    {selectedCategoryData.documents.map((doc, index) => (
                                                                        <div key={index} className="space-y-2 p-3 border rounded-lg bg-background">
                                                                            <Label htmlFor={`doc-${index}`} className="flex items-start gap-2 text-sm font-medium">
                                                                                <span className="flex-1 leading-tight">
                                                                                    {index + 1}. {doc.name}
                                                                                </span>
                                                                            </Label>
                                                                            {doc.note && (
                                                                                <div className="flex items-start gap-2 text-xs text-muted-foreground mb-2 bg-muted/50 p-1.5 rounded">
                                                                                    <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                                                                                    <span>{doc.note}</span>
                                                                                </div>
                                                                            )}
                                                                            <DocumentSelector
                                                                                label=""
                                                                                repositoryId={getRepositoryId('pensiun', doc.name) || ""}
                                                                                value={documentLinks[doc.name] || ""}
                                                                                onChange={(url) =>
                                                                                    setDocumentLinks({
                                                                                        ...documentLinks,
                                                                                        [doc.name]: url,
                                                                                    })
                                                                                }
                                                                                note={undefined}
                                                                                required={true}
                                                                            />
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </ScrollArea>

                                            <div className="flex flex-col sm:flex-row gap-2 justify-end pt-4 border-t mt-auto">
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    onClick={() => handleDialogOpenChange(false)}
                                                    className="w-full sm:w-auto h-10 sm:h-11 text-sm"
                                                >
                                                    Batal
                                                </Button>
                                                <Button type="submit" disabled={isSubmitting || !selectedCategory} className="w-full sm:w-auto h-10 sm:h-11 text-sm">
                                                    {isSubmitting ? "Mengirim..." : "Ajukan Usulan"}
                                                </Button>
                                            </div>
                                        </form>
                                    </DialogContent>
                                </Dialog>
                            )}
                        </div>
                    </div>
                </div>

                {/* Statistics for Admin */}
                {isAdmin && (
                    <div className="grid md:grid-cols-4 gap-4">
                        {isLoading ? (
                            <>
                                <StatCardSkeleton />
                                <StatCardSkeleton />
                                <StatCardSkeleton />
                                <StatCardSkeleton />
                            </>
                        ) : (
                            <>
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
                            </>
                        )}
                    </div>
                )}

                <ServiceList
                    services={services}
                    isLoading={isLoading}
                    onReload={loadServices}
                    showFilters={isAdmin}
                    allowActions={isAdmin}
                    onEditService={user?.role === "user_unit" ? handleEditService : undefined}
                />

                {/* Edit Dialog for Returned Submissions */}
                {user?.role === "user_unit" && (
                    <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                        <DialogContent className="w-[95vw] sm:max-w-3xl max-h-[90vh] flex flex-col p-4 sm:p-6">
                            <DialogHeader className="pb-2">
                                <DialogTitle className="text-lg md:text-2xl">Perbaiki Usulan Pensiun</DialogTitle>
                            </DialogHeader>

                            {editingService && editingService.notes && editingService.notes.length > 0 && (
                                <div className="bg-orange-50 dark:bg-orange-950 border border-orange-200 rounded-lg p-3">
                                    <div className="flex gap-2">
                                        <AlertCircle className="h-4 w-4 text-orange-600 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <p className="font-semibold text-orange-900 dark:text-orange-100 mb-2 text-sm">Catatan dari Admin:</p>
                                            <div className="space-y-2">
                                                {editingService.notes.slice(-2).reverse().map((note: any, idx: number) => (
                                                    <div key={idx} className="text-sm text-orange-800 dark:text-orange-200">
                                                        <span className="font-medium">{note.actor}: </span>{note.note}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {editingService && (
                                <form onSubmit={handleUpdateService} className="flex flex-col flex-1 overflow-hidden">
                                    <ScrollArea className="h-[60vh] sm:h-[65vh] pr-4">
                                        <div className="space-y-4 pb-4 pt-2">
                                            <div className="space-y-2">
                                                <Label className="text-sm sm:text-base font-semibold">Kategori</Label>
                                                <p className="text-sm text-muted-foreground">
                                                    {RETIREMENT_CATEGORIES.find(c => c.id === selectedCategory)?.name || "Tidak diketahui"}
                                                </p>
                                            </div>

                                            <div className="space-y-4">
                                                <Label className="text-sm sm:text-base font-semibold">Dokumen yang Perlu Diperbaiki</Label>
                                                
                                                {editingService.documents?.map((doc: any, index: number) => {
                                                    const needsRevision = doc.verification_status === "perlu_perbaikan";
                                                    const isApproved = doc.verification_status === "sudah_sesuai";
                                                    
                                                    return (
                                                        <div 
                                                            key={index} 
                                                            className={`p-3 sm:p-4 border rounded-lg space-y-2 ${
                                                                needsRevision 
                                                                    ? "border-red-300 bg-red-50 dark:bg-red-950/20" 
                                                                    : isApproved
                                                                    ? "border-green-300 bg-green-50 dark:bg-green-950/20"
                                                                    : "border-muted"
                                                            }`}
                                                        >
                                                            <div className="flex items-center justify-between gap-2">
                                                                <span className="text-sm font-medium">{doc.name}</span>
                                                                <span className={`text-xs px-2 py-1 rounded ${
                                                                    needsRevision ? "bg-red-500 text-white" :
                                                                    isApproved ? "bg-green-500 text-white" : "bg-muted"
                                                                }`}>
                                                                    {needsRevision ? "Perlu Perbaikan" :
                                                                     isApproved ? "Sudah Sesuai" : "Menunggu Review"}
                                                                </span>
                                                            </div>

                                                            {doc.verification_note && (
                                                                <p className="text-xs text-muted-foreground italic">
                                                                    Catatan: {doc.verification_note}
                                                                </p>
                                                            )}

                                                            {needsRevision && (
                                                                <div className="flex flex-col sm:flex-row gap-2">
                                                                    <Input
                                                                        placeholder="Link dokumen perbaikan..."
                                                                        value={editingDocuments[doc.name] || ""}
                                                                        onChange={(e) => setEditingDocuments(prev => ({
                                                                            ...prev,
                                                                            [doc.name]: e.target.value
                                                                        }))}
                                                                        className="flex-1"
                                                                    />
                                                                    <Button
                                                                        type="button"
                                                                        size="sm"
                                                                        onClick={() => handleSaveDocument(doc.name)}
                                                                        disabled={savingDocuments.has(doc.name) || !editingDocuments[doc.name]?.trim()}
                                                                        className="w-full sm:w-auto"
                                                                    >
                                                                        {savingDocuments.has(doc.name) ? "Menyimpan..." : "Simpan"}
                                                                    </Button>
                                                                </div>
                                                            )}

                                                            {!needsRevision && doc.url && (
                                                                <a 
                                                                    href={doc.url} 
                                                                    target="_blank" 
                                                                    rel="noopener noreferrer"
                                                                    className="text-xs text-primary hover:underline break-all"
                                                                >
                                                                    {doc.url}
                                                                </a>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </ScrollArea>

                                    <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-4 pt-4 border-t mt-4">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => {
                                                setIsEditDialogOpen(false);
                                                setEditingService(null);
                                                setEditingDocuments({});
                                            }}
                                            className="w-full sm:w-auto"
                                        >
                                            Batal
                                        </Button>
                                        <Button
                                            type="submit"
                                            disabled={isSubmitting || editingService.documents?.some((doc: any) => doc.verification_status === "perlu_perbaikan")}
                                            className="w-full sm:w-auto"
                                        >
                                            {isSubmitting ? "Mengajukan..." : "Ajukan Ulang"}
                                        </Button>
                                    </div>
                                </form>
                            )}
                        </DialogContent>
                    </Dialog>
                )}
            </div>
        </DashboardLayout>
    );
}
