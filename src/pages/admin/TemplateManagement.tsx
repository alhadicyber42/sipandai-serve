import { useState, useEffect } from "react";
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
    initializeDefaultTemplate,
    getTemplatesByWorkUnit
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

    // Form states
    const [newTemplateName, setNewTemplateName] = useState("");
    const [newTemplateCategory, setNewTemplateCategory] = useState<LetterCategory>("cuti");
    const [newTemplateFile, setNewTemplateFile] = useState<{ file: File, base64: string } | null>(null);

    const isAdminPusat = user?.role === "admin_pusat";

    useEffect(() => {
        if (user?.work_unit_id) {
            setSelectedWorkUnitId(user.work_unit_id);
            initializeDefaultTemplate(user.work_unit_id, "Unit Kerja", user.id);
        }
        loadTemplates();
    }, [user, selectedWorkUnitId, selectedCategory]);

    const loadTemplates = () => {
        const data = getTemplatesByWorkUnit(selectedWorkUnitId, selectedCategory);
        setTemplates(data);
    };

    const handleEdit = (template: LetterTemplate) => {
        setEditingTemplate(template);
        setNewTemplateName(template.template_name);
        setNewTemplateCategory(template.category);
        setNewTemplateFile(null);
        setIsCreateDialogOpen(true);
    };

    const handleDelete = (id: string) => {
        setDeletingTemplateId(id);
    };

    const confirmDelete = () => {
        if (deletingTemplateId) {
            deleteTemplate(deletingTemplateId);
            toast.success("Template berhasil dihapus");
            setDeletingTemplateId(null);
            loadTemplates();
        }
    };

    const handleSetDefault = (id: string) => {
        setDefaultTemplate(id);
        toast.success("Template default berhasil diubah");
        loadTemplates();
    };

    const handleSaveTemplate = () => {
        if (!newTemplateName.trim()) {
            toast.error("Nama template harus diisi");
            return;
        }

        if (!editingTemplate && !newTemplateFile) {
            toast.error("File template harus diupload");
            return;
        }

        try {
            if (editingTemplate) {
                updateTemplate(editingTemplate.id, {
                    template_name: newTemplateName,
                    category: newTemplateCategory,
                    file_content: newTemplateFile?.base64,
                    file_name: newTemplateFile?.file.name,
                });
                toast.success("Template berhasil diperbarui");
            } else {
                createTemplate({
                    work_unit_id: selectedWorkUnitId,
                    template_name: newTemplateName,
                    category: newTemplateCategory,
                    file_content: newTemplateFile?.base64,
                    file_name: newTemplateFile?.file.name,
                    is_default: false
                }, user?.id || "system");
                toast.success("Template berhasil dibuat");
            }

            setIsCreateDialogOpen(false);
            setEditingTemplate(null);
            setNewTemplateName("");
            setNewTemplateCategory("cuti");
            setNewTemplateFile(null);
            loadTemplates();
        } catch (error) {
            console.error(error);
            toast.error("Gagal menyimpan template");
        }
    };

    const handlePreview = (template: LetterTemplate) => {
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
            console.error(error);
            toast.error("Gagal membuat preview template");
        }
    };

    const Content = () => (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Manajemen Template Surat</h1>
                    <p className="text-muted-foreground">
                        Kelola template surat untuk berbagai keperluan unit kerja
                    </p>
                </div>
                <Button onClick={() => {
                    setEditingTemplate(null);
                    setNewTemplateName("");
                    setNewTemplateCategory(selectedCategory);
                    setNewTemplateFile(null);
                    setIsCreateDialogOpen(true);
                }}>
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
                {templates.length === 0 ? (
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
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
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
                                value={newTemplateName}
                                onChange={(e) => setNewTemplateName(e.target.value)}
                                placeholder="Contoh: Template Surat Cuti Tahunan"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="template-category">Jenis Surat</Label>
                            <Select
                                value={newTemplateCategory}
                                onValueChange={(val) => setNewTemplateCategory(val as LetterCategory)}
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
                                onFileSelect={(file, base64) => setNewTemplateFile({ file, base64 })}
                                currentFileName={newTemplateFile?.file.name}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
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
        return <Content />;
    }

    return (
        <DashboardLayout>
            <Content />
        </DashboardLayout>
    );
}
