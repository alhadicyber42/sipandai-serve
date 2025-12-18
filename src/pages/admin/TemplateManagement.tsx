import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { FileText, Plus, Trash2, Edit, Eye, Check, Star } from "lucide-react";
import {
    createTemplate,
    updateTemplate,
    deleteTemplate,
    setDefaultTemplate,
    getTemplatesByCreator
} from "@/lib/templateStorage";
import { LetterTemplate, LetterCategory } from "@/types/leave-certificate";
import { TemplateUploader } from "@/components/leave-certificate/TemplateUploader";
import { generateDocument } from "@/lib/docxEngine";
import { getSampleTemplateData } from "@/lib/templateEngine";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

// Mock work units for admin_pusat
const workUnits = [
    { id: 1, name: "BBPVP Bekasi" },
    { id: 2, name: "BBPVP Bandung" },
    { id: 3, name: "BBPVP Semarang" },
    { id: 4, name: "BBPVP Medan" },
    { id: 5, name: "BBPVP Makassar" },
];

const LETTER_CATEGORIES: { value: LetterCategory; label: string }[] = [
    { value: "cuti", label: "Surat Cuti" },
    { value: "kenaikan_pangkat", label: "Kenaikan Pangkat" },
    { value: "pensiun", label: "Pensiun" },
    { value: "mutasi", label: "Mutasi" },
    { value: "lainnya", label: "Lainnya" },
];

export default function TemplateManagement({ isEmbedded = false }: { isEmbedded?: boolean }) {
    const { user } = useAuth();
    const [templates, setTemplates] = useState<LetterTemplate[]>([]);
    const [selectedWorkUnitId, setSelectedWorkUnitId] = useState<number>(user?.work_unit_id || 1);
    const [selectedCategory, setSelectedCategory] = useState<LetterCategory>("cuti");
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<LetterTemplate | null>(null);
    const [deletingTemplateId, setDeletingTemplateId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Form states - separated to prevent re-renders affecting templates list
    const [formData, setFormData] = useState({
        templateName: "",
        templateCategory: "cuti" as LetterCategory,
        templateFile: null as { file: File; base64: string } | null
    });

    const isAdminPusat = user?.role === "admin_pusat";

    useEffect(() => {
        if (user?.work_unit_id) {
            setSelectedWorkUnitId(user.work_unit_id);
        }
    }, [user]);

    const loadTemplates = useCallback(async () => {
        if (user?.id) {
            setIsLoading(true);
            try {
                const data = await getTemplatesByCreator(user.id, selectedCategory);
                setTemplates(data);
            } catch (error) {
                console.error("Error loading templates:", error);
                toast.error("Gagal memuat template");
            } finally {
                setIsLoading(false);
            }
        } else {
            setTemplates([]);
        }
    }, [user?.id, selectedCategory]);

    useEffect(() => {
        loadTemplates();
    }, [loadTemplates]);

    const handleEdit = useCallback((template: LetterTemplate) => {
        setEditingTemplate(template);
        setFormData({
            templateName: template.template_name,
            templateCategory: template.category,
            templateFile: null
        });
        setIsCreateDialogOpen(true);
    }, []);

    const handleDelete = useCallback((id: string) => {
        setDeletingTemplateId(id);
    }, []);

    const confirmDelete = useCallback(async () => {
        if (deletingTemplateId) {
            try {
                await deleteTemplate(deletingTemplateId);
                toast.success("Template berhasil dihapus");
                setDeletingTemplateId(null);
                loadTemplates();
            } catch (error) {
                console.error("Error deleting template:", error);
                toast.error("Gagal menghapus template");
            }
        }
    }, [deletingTemplateId, loadTemplates]);

    const handleSetDefault = useCallback(async (id: string) => {
        try {
            await setDefaultTemplate(id);
            toast.success("Template default berhasil diubah");
            loadTemplates();
        } catch (error) {
            console.error("Error setting default template:", error);
            toast.error("Gagal mengubah template default");
        }
    }, [loadTemplates]);

    const handleOpenCreateDialog = useCallback(() => {
        setEditingTemplate(null);
        setFormData({
            templateName: "",
            templateCategory: selectedCategory,
            templateFile: null
        });
        setIsCreateDialogOpen(true);
    }, [selectedCategory]);

    const handleCloseDialog = useCallback(() => {
        setIsCreateDialogOpen(false);
        setEditingTemplate(null);
        setFormData({
            templateName: "",
            templateCategory: "cuti",
            templateFile: null
        });
    }, []);

    const handleSaveTemplate = useCallback(async () => {
        if (!formData.templateName.trim()) {
            toast.error("Nama template harus diisi");
            return;
        }

        if (!editingTemplate && !formData.templateFile) {
            toast.error("File template harus diupload");
            return;
        }

        try {
            if (editingTemplate) {
                await updateTemplate(editingTemplate.id, {
                    template_name: formData.templateName,
                    category: formData.templateCategory,
                    file_content: formData.templateFile?.base64,
                    file_name: formData.templateFile?.file.name,
                });
                toast.success("Template berhasil diperbarui");
            } else {
                await createTemplate({
                    work_unit_id: selectedWorkUnitId,
                    template_name: formData.templateName,
                    category: formData.templateCategory,
                    file_content: formData.templateFile?.base64,
                    file_name: formData.templateFile?.file.name,
                    is_default: false
                }, user?.id || "system");
                toast.success("Template berhasil dibuat");
            }

            handleCloseDialog();
            loadTemplates();
        } catch (error) {
            console.error("Error saving template:", error);
            toast.error("Gagal menyimpan template");
        }
    }, [formData, editingTemplate, selectedWorkUnitId, user?.id, handleCloseDialog, loadTemplates]);

    const handlePreview = useCallback((template: LetterTemplate) => {
        if (!template.file_content) {
            toast.error("Template ini tidak memiliki file dokumen (format lama)");
            return;
        }

        try {
            const sampleData = getSampleTemplateData();
            generateDocument(
                template.file_content,
                sampleData,
                `PREVIEW-${template.template_name}.docx`
            );
            toast.success("Preview template berhasil didownload");
        } catch (error) {
            console.error("Error generating preview:", error);
            toast.error("Gagal membuat preview template");
        }
    }, []);

    const handleTemplateNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, templateName: e.target.value }));
    }, []);

    const handleTemplateCategoryChange = useCallback((val: string) => {
        setFormData(prev => ({ ...prev, templateCategory: val as LetterCategory }));
    }, []);

    const handleFileSelect = useCallback((file: File, base64: string) => {
        setFormData(prev => ({ ...prev, templateFile: { file, base64 } }));
    }, []);

    const content = (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Manajemen Template Surat</h1>
                    <p className="text-muted-foreground">
                        Kelola template surat untuk berbagai keperluan unit kerja
                    </p>
                </div>
                <Button onClick={handleOpenCreateDialog}>
                    <Plus className="h-4 w-4 mr-2" />
                    Buat Template Baru
                </Button>
            </div>

            <div className="flex flex-col md:flex-row gap-4">
                {isAdminPusat && (
                    <Card className="flex-1">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base font-medium">Unit Kerja</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Select
                                value={selectedWorkUnitId.toString()}
                                onValueChange={(val) => setSelectedWorkUnitId(parseInt(val))}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Pilih Unit Kerja" />
                                </SelectTrigger>
                                <SelectContent>
                                    {workUnits.map((unit) => (
                                        <SelectItem key={unit.id} value={unit.id.toString()}>
                                            {unit.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </CardContent>
                    </Card>
                )}

                <Card className="flex-1">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base font-medium">Jenis Surat</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Select
                            value={selectedCategory}
                            onValueChange={(val) => setSelectedCategory(val as LetterCategory)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Pilih Jenis Surat" />
                            </SelectTrigger>
                            <SelectContent>
                                {LETTER_CATEGORIES.map((cat) => (
                                    <SelectItem key={cat.value} value={cat.value}>
                                        {cat.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {isLoading ? (
                    <div className="col-span-full flex items-center justify-center p-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                ) : templates.length === 0 ? (
                    <div className="col-span-full flex flex-col items-center justify-center p-8 border border-dashed rounded-lg bg-muted/50 text-center">
                        <FileText className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
                        <p className="text-lg font-medium text-muted-foreground">Belum ada template</p>
                        <p className="text-sm text-muted-foreground mb-4 max-w-xs mx-auto">
                            Buat template baru untuk kategori ini
                        </p>
                    </div>
                ) : (
                    templates.map((template) => (
                        <Card key={template.id} className="flex flex-col h-full shadow-sm hover:shadow-md transition-shadow">
                            <CardHeader className="pb-3">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                                            <CardTitle className="text-base md:text-lg truncate max-w-full" title={template.template_name}>
                                                {template.template_name}
                                            </CardTitle>
                                            {template.is_default && (
                                                <Badge variant="default" className="text-[10px] h-5 shrink-0">
                                                    <Star className="h-3 w-3 mr-1" />
                                                    Default
                                                </Badge>
                                            )}
                                        </div>
                                        <CardDescription>
                                            <Badge variant="outline" className="text-[10px] sm:text-xs font-normal">
                                                {LETTER_CATEGORIES.find(c => c.value === template.category)?.label || template.category}
                                            </Badge>
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="flex-1 pb-3">
                                <div className="text-xs sm:text-sm text-muted-foreground space-y-1.5">
                                    <p className="truncate">Unit: {workUnits.find(u => u.id === template.work_unit_id)?.name}</p>
                                    <p>Dibuat: {new Date(template.created_at).toLocaleDateString('id-ID')}</p>
                                    {template.file_name && (
                                        <p className="truncate flex items-center gap-1" title={template.file_name}>
                                            <FileText className="h-3 w-3" />
                                            {template.file_name}
                                        </p>
                                    )}
                                </div>
                            </CardContent>
                            <CardFooter className="flex flex-wrap gap-2 pt-0">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handlePreview(template)}
                                    className="flex-1 h-8 text-xs"
                                >
                                    <Eye className="h-3.5 w-3.5 mr-1.5" />
                                    Preview
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleEdit(template)}
                                    className="flex-1 h-8 text-xs"
                                >
                                    <Edit className="h-3.5 w-3.5 mr-1.5" />
                                    Edit
                                </Button>
                                {!template.is_default && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleSetDefault(template.id)}
                                        className="h-8 w-8 p-0 shrink-0"
                                        title="Set Default"
                                    >
                                        <Check className="h-4 w-4" />
                                    </Button>
                                )}
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => handleDelete(template.id)}
                                    className="h-8 w-8 p-0 shrink-0"
                                    title="Hapus"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </CardFooter>
                        </Card>
                    ))
                )}
            </div>

            {/* Create/Edit Dialog */}
            <Dialog open={isCreateDialogOpen} onOpenChange={(open) => !open && handleCloseDialog()}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            {editingTemplate ? "Edit Template" : "Buat Template Baru"}
                        </DialogTitle>
                        <DialogDescription>
                            {editingTemplate
                                ? "Perbarui informasi template surat"
                                : "Buat template surat baru dengan upload file .docx"}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="template-name">Nama Template</Label>
                            <Input
                                id="template-name"
                                value={formData.templateName}
                                onChange={handleTemplateNameChange}
                                placeholder="Contoh: Template Surat Cuti Tahunan"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="template-category">Jenis Surat</Label>
                            <Select
                                value={formData.templateCategory}
                                onValueChange={handleTemplateCategoryChange}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Pilih Jenis Surat" />
                                </SelectTrigger>
                                <SelectContent>
                                    {LETTER_CATEGORIES.map((cat) => (
                                        <SelectItem key={cat.value} value={cat.value}>
                                            {cat.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Upload Template (.docx)</Label>
                            <TemplateUploader
                                onFileSelect={handleFileSelect}
                                currentFileName={formData.templateFile?.file.name}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={handleCloseDialog}>
                            Batal
                        </Button>
                        <Button onClick={handleSaveTemplate}>
                            Simpan Template
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <AlertDialog open={!!deletingTemplateId} onOpenChange={(open) => !open && setDeletingTemplateId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Apakah Anda yakin?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tindakan ini tidak dapat dibatalkan. Template akan dihapus secara permanen.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Hapus
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );

    if (isEmbedded) {
        return content;
    }

    return (
        <DashboardLayout>
            {content}
        </DashboardLayout>
    );
}
