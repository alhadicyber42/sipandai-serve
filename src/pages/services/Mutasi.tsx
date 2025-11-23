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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Users, AlertCircle } from "lucide-react";
import { TRANSFER_CATEGORIES, type TransferCategory } from "@/lib/transfer-categories";
import { DocumentSelector } from "@/components/DocumentSelector";
import { getRepositoryId } from "@/lib/document-mapping";
import { StatCardSkeleton } from "@/components/skeletons";

export default function Mutasi() {
    const { user, updateProfile } = useAuth();
    const [services, setServices] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [editingService, setEditingService] = useState<any>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<TransferCategory | null>(null);
    const [documentLinks, setDocumentLinks] = useState<Record<string, string>>({});
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

        // AUTO-SAVE: Sync documents to repository
        const updatedDocs = { ...user!.documents };
        let savedCount = 0;

        selectedCategory.documents.forEach(doc => {
            const repoId = getRepositoryId('mutasi', doc.name);
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

    const handleEditService = (service: any) => {
        setEditingService(service);
        setIsEditDialogOpen(true);

        const category = TRANSFER_CATEGORIES.find(c => c.name === service.title);
        setSelectedCategory(category || null);

        // Load existing document links
        const existingDocs: Record<string, string> = {};
        (service.documents || []).forEach((doc: any) => {
            existingDocs[doc.name] = doc.url;
        });
        setEditingDocuments(existingDocs);
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

        const { error } = await supabase
            .from("services")
            .update({
                status: "submitted",
                notes: [
                    ...(editingService.notes || []),
                    {
                        actor: user!.name,
                        role: user!.role,
                        note: "Usulan telah diperbaiki dan diajukan kembali",
                        timestamp: new Date().toISOString(),
                    },
                ],
            })
            .eq("id", editingService.id);

        if (error) {
            toast.error("Gagal mengajukan ulang usulan");
            console.error(error);
        } else {
            toast.success("Usulan berhasil diajukan kembali");
            setIsEditDialogOpen(false);
            setEditingService(null);
            setSelectedCategory(null);
            setEditingDocuments({});
            loadServices();
        }

        setIsSubmitting(false);
    };

    const isAdmin = user?.role === "admin_unit" || user?.role === "admin_pusat";

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Modern Header with Gradient */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-teal-600 via-teal-500 to-teal-400 p-6 md:p-8 text-white shadow-xl">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -ml-24 -mb-24"></div>

                    <div className="relative z-10">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 md:p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                                    <Users className="h-6 w-6 md:h-8 md:w-8" />
                                </div>
                                <div>
                                    <h1 className="text-2xl md:text-4xl font-bold">Mutasi Pegawai</h1>
                                    <p className="text-sm md:text-base text-white/80 mt-1">
                                        {user?.role === "user_unit"
                                            ? "Kelola usulan mutasi Anda"
                                            : user?.role === "admin_unit"
                                                ? "Review usulan mutasi unit Anda"
                                                : "Kelola semua usulan mutasi pegawai"}
                                    </p>
                                </div>
                            </div>

                            {user?.role === "user_unit" && (
                                <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
                                    <DialogTrigger asChild>
                                        <Button size="lg" className="gap-2 bg-white text-teal-600 hover:bg-white/90 shadow-lg">
                                            <Plus className="h-5 w-5" />
                                            <span className="hidden sm:inline">Ajukan Mutasi</span>
                                            <span className="sm:hidden">Ajukan</span>
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="w-[95vw] sm:max-w-3xl max-h-[90vh] flex flex-col">
                                        <DialogHeader>
                                            <DialogTitle>Ajukan Mutasi Pegawai</DialogTitle>
                                        </DialogHeader>
                                        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                                            <ScrollArea className="h-[60vh] sm:h-[65vh] pr-4">
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
                                                                            <DocumentSelector
                                                                                label=""
                                                                                repositoryId={getRepositoryId('mutasi', doc.name) || ""}
                                                                                value={documentLinks[doc.name] || ""}
                                                                                onChange={(url) => handleDocumentLinkChange(doc.name, url)}
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
                    </div>
                </div>

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

                {/* Edit Dialog */}
                {user?.role === "user_unit" && (
                    <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                        <DialogContent className="w-[95vw] sm:max-w-3xl max-h-[90vh] flex flex-col">
                            <DialogHeader>
                                <DialogTitle>Perbaiki Usulan Mutasi</DialogTitle>
                            </DialogHeader>

                            {editingService && editingService.notes && editingService.notes.length > 0 && (
                                <Alert className="bg-orange-50 dark:bg-orange-950 border-orange-200">
                                    <AlertCircle className="h-4 w-4 text-orange-600" />
                                    <AlertDescription>
                                        <p className="font-semibold text-orange-900 dark:text-orange-100 mb-2">Catatan dari Admin:</p>
                                        <div className="space-y-2">
                                            {editingService.notes.slice(-2).reverse().map((note: any, idx: number) => (
                                                <div key={idx} className="text-sm text-orange-800 dark:text-orange-200">
                                                    <span className="font-medium">{note.actor}: </span>{note.note}
                                                </div>
                                            ))}
                                        </div>
                                    </AlertDescription>
                                </Alert>
                            )}

                            <form onSubmit={handleUpdateService} className="flex flex-col flex-1 overflow-hidden">
                                <ScrollArea className="h-[60vh] sm:h-[65vh] pr-4">
                                    <div className="space-y-4 pb-4">
                                        {selectedCategory && selectedCategory.documents.map((doc, index) => {
                                            const existingDoc = editingService?.documents?.find((d: any) => d.name === doc.name);
                                            const needsRevision = existingDoc?.verification_status === "perlu_perbaikan";
                                            const isSaved = existingDoc?.verification_status === "menunggu_review" && existingDoc?.url === editingDocuments[doc.name];
                                            const hasChanges = editingDocuments[doc.name] !== existingDoc?.url;

                                            return (
                                                <div key={index} className={`space-y-2 p-3 border rounded-lg ${needsRevision ? 'border-orange-500 bg-orange-50 dark:bg-orange-950' : isSaved ? 'border-green-500 bg-green-50 dark:bg-green-950' : ''}`}>
                                                    <Label className="flex items-center justify-between">
                                                        <span>{index + 1}. {doc.name}</span>
                                                        <div className="flex gap-2">
                                                            {isSaved && <Badge variant="outline" className="border-green-500 text-green-700">Tersimpan</Badge>}
                                                            {needsRevision && !isSaved && <Badge variant="destructive">Perlu Perbaikan</Badge>}
                                                        </div>
                                                    </Label>
                                                    {existingDoc?.verification_note && needsRevision && (
                                                        <Alert className="bg-orange-100 dark:bg-orange-900">
                                                            <AlertDescription className="text-xs text-orange-900 dark:text-orange-100">
                                                                <span className="font-medium">Catatan Admin: </span>{existingDoc.verification_note}
                                                            </AlertDescription>
                                                        </Alert>
                                                    )}
                                                    <div className="flex gap-2">
                                                        <Input
                                                            type="url"
                                                            placeholder="https://..."
                                                            value={editingDocuments[doc.name] || ""}
                                                            onChange={(e) => setEditingDocuments(prev => ({ ...prev, [doc.name]: e.target.value }))}
                                                            className="flex-1"
                                                        />
                                                        <Button
                                                            type="button"
                                                            variant={isSaved ? "outline" : "default"}
                                                            size="sm"
                                                            onClick={() => handleSaveDocument(doc.name)}
                                                            disabled={!hasChanges || savingDocuments.has(doc.name) || !editingDocuments[doc.name]?.trim()}
                                                        >
                                                            {savingDocuments.has(doc.name) ? "Menyimpan..." : isSaved ? "Tersimpan" : "Simpan"}
                                                        </Button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </ScrollArea>

                                <div className="flex flex-col sm:flex-row gap-2 justify-end pt-4 border-t mt-4">
                                    <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)} className="w-full sm:w-auto">
                                        Batal
                                    </Button>
                                    <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
                                        {isSubmitting ? "Mengajukan..." : "Ajukan Ulang"}
                                    </Button>
                                </div>
                            </form>
                        </DialogContent>
                    </Dialog>
                )}
            </div>
        </DashboardLayout>
    );
}
