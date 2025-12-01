import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TemplateManagement from "./TemplateManagement";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Settings, User, Plus, Trash2, Users } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { LetterCategory, LetterTemplate } from "@/types/leave-certificate";
import { getTemplatesByWorkUnit } from "@/lib/templateStorage";
import { generateDocument } from "@/lib/docxEngine";
import { toast } from "sonner";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import {
    searchSubmissionsByEmployee,
    mapSubmissionToTemplateData,
    formatSubmissionLabel,
    ApprovedSubmission
} from "@/lib/submissionData";

interface BatchEntry {
    id: string;
    nama_pegawai: string;
    nip_pegawai: string;
    jabatan_pegawai: string;
    unit_kerja: string;
    // Search states per entry
    submissionSearch: string;
    submissionResults: ApprovedSubmission[];
    selectedSubmission: ApprovedSubmission | null;
    isSearching: boolean;
    showManualInput: boolean;
}

export default function LetterGenerator() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState("generator");
    const [generationMode, setGenerationMode] = useState<"individual" | "batch">("individual");
    const [category, setCategory] = useState<LetterCategory | "">("");
    const [templates, setTemplates] = useState<LetterTemplate[]>([]);
    const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");

    // Individual mode states
    const [employeeName, setEmployeeName] = useState("");
    const [employeeNip, setEmployeeNip] = useState("");
    const [employeeJabatan, setEmployeeJabatan] = useState("");
    const [employeeUnit, setEmployeeUnit] = useState("");

    // Submission search states (Individual)
    const [submissionSearch, setSubmissionSearch] = useState("");
    const [submissionResults, setSubmissionResults] = useState<ApprovedSubmission[]>([]);
    const [selectedSubmission, setSelectedSubmission] = useState<ApprovedSubmission | null>(null);
    const [isSearching, setIsSearching] = useState(false);
    const [showManualInput, setShowManualInput] = useState(false);

    // Batch mode states
    const [batchEntries, setBatchEntries] = useState<BatchEntry[]>([
        {
            id: "1",
            nama_pegawai: "",
            nip_pegawai: "",
            jabatan_pegawai: "",
            unit_kerja: "",
            submissionSearch: "",
            submissionResults: [],
            selectedSubmission: null,
            isSearching: false,
            showManualInput: false
        }
    ]);

    useEffect(() => {
        if (user?.work_unit_id && category) {
            const loadedTemplates = getTemplatesByWorkUnit(user.work_unit_id, category as LetterCategory);
            setTemplates(loadedTemplates);
        } else {
            setTemplates([]);
        }
    }, [user, category]);

    // Search submissions when search term changes (Individual)
    useEffect(() => {
        const searchTimer = setTimeout(async () => {
            if (submissionSearch.length >= 2 && category) {
                setIsSearching(true);
                const results = await searchSubmissionsByEmployee(category, submissionSearch);
                setSubmissionResults(results);
                setIsSearching(false);
            } else {
                setSubmissionResults([]);
            }
        }, 300);

        return () => clearTimeout(searchTimer);
    }, [submissionSearch, category]);

    const handleSubmissionSelect = (submission: ApprovedSubmission) => {
        if (category) {
            setSelectedSubmission(submission);
            const mappedData = mapSubmissionToTemplateData(submission, category);
            setEmployeeName(mappedData.nama_pegawai);
            setEmployeeNip(mappedData.nip_pegawai);
            setEmployeeJabatan(mappedData.jabatan_pegawai);
            setEmployeeUnit(mappedData.unit_kerja || "");

            // Clear search results but keep the search term or clear it? 
            // Usually better to clear results to hide the dropdown
            setSubmissionResults([]);
            // Optional: set search term to employee name to show who was selected
            setSubmissionSearch("");
            setShowManualInput(false);
        }
    };

    // Batch functions
    const addBatchEntry = () => {
        const newId = (Math.max(...batchEntries.map(e => parseInt(e.id))) + 1).toString();
        setBatchEntries([...batchEntries, {
            id: newId,
            nama_pegawai: "",
            nip_pegawai: "",
            jabatan_pegawai: "",
            unit_kerja: "",
            submissionSearch: "",
            submissionResults: [],
            selectedSubmission: null,
            isSearching: false,
            showManualInput: false
        }]);
    };

    const removeBatchEntry = (id: string) => {
        if (batchEntries.length > 1) {
            setBatchEntries(batchEntries.filter(e => e.id !== id));
        }
    };

    const updateBatchEntry = (id: string, field: keyof BatchEntry, value: any) => {
        setBatchEntries(batchEntries.map(entry =>
            entry.id === id ? { ...entry, [field]: value } : entry
        ));
    };

    const handleBatchSubmissionSearch = async (entryId: string, searchTerm: string) => {
        updateBatchEntry(entryId, 'submissionSearch', searchTerm);

        if (searchTerm.length >= 2 && category) {
            updateBatchEntry(entryId, 'isSearching', true);
            const results = await searchSubmissionsByEmployee(category, searchTerm);
            updateBatchEntry(entryId, 'submissionResults', results);
            updateBatchEntry(entryId, 'isSearching', false);
        } else {
            updateBatchEntry(entryId, 'submissionResults', []);
        }
    };

    const handleBatchSubmissionSelect = (entryId: string, submission: ApprovedSubmission) => {
        if (category) {
            updateBatchEntry(entryId, 'selectedSubmission', submission);
            const mappedData = mapSubmissionToTemplateData(submission, category);

            // Update all fields at once
            setBatchEntries(prev => prev.map(entry => {
                if (entry.id === entryId) {
                    return {
                        ...entry,
                        nama_pegawai: mappedData.nama_pegawai,
                        nip_pegawai: mappedData.nip_pegawai,
                        jabatan_pegawai: mappedData.jabatan_pegawai,
                        unit_kerja: mappedData.unit_kerja || "",
                        submissionResults: [], // Hide results
                        submissionSearch: mappedData.nama_pegawai, // Show name in search box
                        showManualInput: false // Hide manual input
                    };
                }
                return entry;
            }));
        }
    };

    const handleGenerateIndividual = () => {
        if (!selectedTemplateId) {
            toast.error("Pilih template terlebih dahulu");
            return;
        }
        const template = templates.find(t => t.id === selectedTemplateId);
        if (!template || !template.file_content) {
            toast.error("Template tidak valid atau tidak memiliki file");
            return;
        }

        try {
            const data = {
                nama_pegawai: employeeName || user?.name || "Pegawai",
                nip_pegawai: employeeNip || "123456789",
                jabatan_pegawai: employeeJabatan || "Staf",
                unit_kerja: employeeUnit || "Unit Kerja",
                tanggal_surat: new Date().toLocaleDateString("id-ID"),
                // Add specific fields from selected submission if available
                ...(selectedSubmission ? mapSubmissionToTemplateData(selectedSubmission, category as string) : {})
            };

            generateDocument(
                template.file_content,
                data,
                `Surat_${category}_${employeeName || 'Pegawai'}.docx`
            );
            toast.success("Surat berhasil dibuat");
        } catch (error) {
            console.error(error);
            toast.error("Gagal membuat surat");
        }
    };

    const handleGenerateBatch = async () => {
        if (!selectedTemplateId) {
            toast.error("Pilih template terlebih dahulu");
            return;
        }
        const template = templates.find(t => t.id === selectedTemplateId);
        if (!template || !template.file_content) {
            toast.error("Template tidak valid atau tidak memiliki file");
            return;
        }

        // Validate batch entries
        const validEntries = batchEntries.filter(entry =>
            entry.nama_pegawai.trim() && entry.nip_pegawai.trim()
        );

        if (validEntries.length === 0) {
            toast.error("Minimal isi 1 data pegawai (Nama dan NIP wajib diisi)");
            return;
        }

        try {
            const zip = new JSZip();
            const tanggal_surat = new Date().toLocaleDateString("id-ID");

            // Generate document for each entry
            for (const entry of validEntries) {
                const submissionData = entry.selectedSubmission
                    ? mapSubmissionToTemplateData(entry.selectedSubmission, category as string)
                    : {};

                const data = {
                    nama_pegawai: entry.nama_pegawai,
                    nip_pegawai: entry.nip_pegawai,
                    jabatan_pegawai: entry.jabatan_pegawai || "Staf",
                    unit_kerja: entry.unit_kerja || "Unit Kerja",
                    tanggal_surat,
                    ...submissionData
                };

                // Generate document blob
                const Docxtemplater = (await import("docxtemplater")).default;
                const PizZip = (await import("pizzip")).default;

                const zipFile = new PizZip(atob(template.file_content));
                const doc = new Docxtemplater(zipFile, {
                    paragraphLoop: true,
                    linebreaks: true,
                });

                doc.render(data);
                const blob = doc.getZip().generate({
                    type: "blob",
                    mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                });

                // Add to zip with sanitized filename
                const sanitizedName = entry.nama_pegawai.replace(/[^a-z0-9]/gi, '_');
                zip.file(`Surat_${category}_${sanitizedName}.docx`, blob);
            }

            // Generate and download zip
            const zipBlob = await zip.generateAsync({ type: "blob" });
            saveAs(zipBlob, `Batch_Surat_${category}_${new Date().getTime()}.zip`);

            toast.success(`Berhasil membuat ${validEntries.length} surat`);
        } catch (error) {
            console.error(error);
            toast.error("Gagal membuat surat batch");
        }
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Buat Surat</h1>
                    <p className="text-muted-foreground">
                        Generate berbagai jenis surat dan kelola template
                    </p>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                    <TabsList>
                        <TabsTrigger value="generator" className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            Generator Surat
                        </TabsTrigger>
                        <TabsTrigger value="templates" className="flex items-center gap-2">
                            <Settings className="h-4 w-4" />
                            Manajemen Template
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="generator" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Generator Surat</CardTitle>
                                <CardDescription>
                                    Pilih jenis surat dan masukkan data untuk membuat surat baru.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Template Selection */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Jenis Surat</Label>
                                        <Select value={category} onValueChange={(val) => {
                                            setCategory(val as LetterCategory);
                                            // Reset states when category changes
                                            setSubmissionSearch("");
                                            setSubmissionResults([]);
                                            setSelectedSubmission(null);
                                        }}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Pilih jenis surat" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="cuti">Cuti</SelectItem>
                                                <SelectItem value="kenaikan_pangkat">Kenaikan Pangkat</SelectItem>
                                                <SelectItem value="pensiun">Pensiun</SelectItem>
                                                <SelectItem value="mutasi">Mutasi</SelectItem>
                                                <SelectItem value="lainnya">Lainnya</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Template Surat</Label>
                                        <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId} disabled={!category}>
                                            <SelectTrigger>
                                                <SelectValue placeholder={category ? "Pilih template" : "Pilih jenis surat terlebih dahulu"} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {templates.map(t => (
                                                    <SelectItem key={t.id} value={t.id}>{t.template_name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                {/* Generation Mode Selection */}
                                <div className="space-y-2">
                                    <Label>Mode Pembuatan</Label>
                                    <Tabs value={generationMode} onValueChange={(val) => setGenerationMode(val as "individual" | "batch")}>
                                        <TabsList className="grid w-full grid-cols-2">
                                            <TabsTrigger value="individual" className="flex items-center gap-2">
                                                <User className="h-4 w-4" />
                                                Individual
                                            </TabsTrigger>
                                            <TabsTrigger value="batch" className="flex items-center gap-2">
                                                <Users className="h-4 w-4" />
                                                Batch
                                            </TabsTrigger>
                                        </TabsList>

                                        {/* Individual Mode */}
                                        <TabsContent value="individual" className="space-y-4 mt-4">
                                            {/* Submission Search & Results */}
                                            <div className="space-y-4">
                                                <div className="space-y-2">
                                                    <Label>Cari Pegawai</Label>
                                                    <div className="relative">
                                                        <User className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                                        <Input
                                                            className="pl-9"
                                                            placeholder={category ? "Ketik nama pegawai..." : "Pilih jenis surat terlebih dahulu"}
                                                            value={submissionSearch}
                                                            onChange={(e) => {
                                                                setSubmissionSearch(e.target.value);
                                                                if (selectedSubmission) {
                                                                    setSelectedSubmission(null); // Reset selection when searching again
                                                                    setShowManualInput(false);
                                                                }
                                                            }}
                                                            disabled={!category}
                                                        />
                                                        {isSearching && (
                                                            <div className="absolute right-2.5 top-2.5">
                                                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Results List - Only show if not selected and not manual mode */}
                                                {!selectedSubmission && !showManualInput && submissionResults.length > 0 && (
                                                    <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                                                        <Label className="text-muted-foreground">Pilih Usulan {category ? `(${category})` : ''}:</Label>
                                                        <div className="grid grid-cols-1 gap-3">
                                                            {submissionResults.map((sub) => (
                                                                <Card
                                                                    key={sub.id}
                                                                    className="cursor-pointer hover:bg-muted/50 transition-colors border-primary/20"
                                                                    onClick={() => handleSubmissionSelect(sub)}
                                                                >
                                                                    <CardContent className="p-4 flex justify-between items-center">
                                                                        <div>
                                                                            <div className="font-semibold text-primary">
                                                                                {formatSubmissionLabel(sub, category as string)}
                                                                            </div>
                                                                            <div className="text-sm text-muted-foreground mt-1">
                                                                                {sub.profiles?.name} - NIP: {sub.profiles?.nip}
                                                                            </div>
                                                                        </div>
                                                                        <Button size="sm" variant="secondary">Pilih</Button>
                                                                    </CardContent>
                                                                </Card>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* No Results State */}
                                                {!selectedSubmission && !showManualInput && submissionSearch.length >= 2 && !isSearching && submissionResults.length === 0 && category && (
                                                    <div className="text-center py-8 border rounded-lg bg-muted/20">
                                                        <p className="text-muted-foreground mb-2">
                                                            Tidak ditemukan usulan {category} yang disetujui untuk "{submissionSearch}".
                                                        </p>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => setShowManualInput(true)}
                                                        >
                                                            Isi Data Secara Manual
                                                        </Button>
                                                    </div>
                                                )}

                                                {/* Manual Input Toggle (Always visible if no selection) */}
                                                {!selectedSubmission && !showManualInput && submissionResults.length === 0 && submissionSearch.length < 2 && (
                                                    <div className="text-center pt-2">
                                                        <Button
                                                            variant="link"
                                                            className="text-muted-foreground"
                                                            onClick={() => setShowManualInput(true)}
                                                        >
                                                            Atau isi data secara manual
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Selected Submission Detail Card */}
                                            {selectedSubmission && (
                                                <Card className="bg-muted/50 border-primary/20">
                                                    <CardContent className="p-4 space-y-3">
                                                        <div className="flex justify-between items-start">
                                                            <div>
                                                                <div className="font-semibold text-lg">{employeeName}</div>
                                                                <div className="text-sm text-muted-foreground">NIP: {employeeNip}</div>
                                                            </div>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => {
                                                                    setSelectedSubmission(null);
                                                                    setEmployeeName("");
                                                                    setEmployeeNip("");
                                                                    setEmployeeJabatan("");
                                                                    setEmployeeUnit("");
                                                                    setShowManualInput(true);
                                                                }}
                                                                className="text-muted-foreground hover:text-destructive"
                                                            >
                                                                <Trash2 className="h-4 w-4 mr-1" />
                                                                Hapus
                                                            </Button>
                                                        </div>

                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 text-sm">
                                                            <div>
                                                                <span className="text-muted-foreground">Jabatan:</span>
                                                                <div className="font-medium">{employeeJabatan || "-"}</div>
                                                            </div>
                                                            <div>
                                                                <span className="text-muted-foreground">Unit Kerja:</span>
                                                                <div className="font-medium">{employeeUnit || "-"}</div>
                                                            </div>
                                                            <div className="col-span-1 md:col-span-2 pt-2 border-t mt-1">
                                                                <span className="text-muted-foreground">Detail Pengajuan:</span>
                                                                <div className="font-medium text-primary">
                                                                    {formatSubmissionLabel(selectedSubmission, category as string)}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="w-full text-xs h-8"
                                                            onClick={() => setShowManualInput(!showManualInput)}
                                                        >
                                                            {showManualInput ? "Sembunyikan Edit Manual" : "Edit Data Manual"}
                                                        </Button>
                                                    </CardContent>
                                                </Card>
                                            )}

                                            {/* Manual Input Fields */}
                                            {(showManualInput || !selectedSubmission) && (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                                    <div className="space-y-2">
                                                        <Label className="text-xs text-muted-foreground">Nama Pegawai *</Label>
                                                        <Input
                                                            placeholder="Nama Lengkap"
                                                            value={employeeName}
                                                            onChange={(e) => setEmployeeName(e.target.value)}
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label className="text-xs text-muted-foreground">NIP *</Label>
                                                        <Input
                                                            placeholder="NIP Pegawai"
                                                            value={employeeNip}
                                                            onChange={(e) => setEmployeeNip(e.target.value)}
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label className="text-xs text-muted-foreground">Jabatan</Label>
                                                        <Input
                                                            placeholder="Jabatan"
                                                            value={employeeJabatan}
                                                            onChange={(e) => setEmployeeJabatan(e.target.value)}
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label className="text-xs text-muted-foreground">Unit Kerja</Label>
                                                        <Input
                                                            placeholder="Unit Kerja"
                                                            value={employeeUnit}
                                                            onChange={(e) => setEmployeeUnit(e.target.value)}
                                                        />
                                                    </div>
                                                </div>
                                            )}

                                            <Button onClick={handleGenerateIndividual} className="w-full">
                                                Buat Surat Individual
                                            </Button>
                                        </TabsContent>

                                        {/* Batch Mode */}
                                        <TabsContent value="batch" className="space-y-4 mt-4">
                                            <div className="space-y-4">
                                                {batchEntries.map((entry, index) => (
                                                    <Card key={entry.id} className="relative">
                                                        <CardHeader className="pb-3">
                                                            <div className="flex items-center justify-between">
                                                                <CardTitle className="text-sm">Pegawai #{index + 1}</CardTitle>
                                                                {batchEntries.length > 1 && (
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        onClick={() => removeBatchEntry(entry.id)}
                                                                        className="h-8 w-8"
                                                                    >
                                                                        <Trash2 className="h-4 w-4 text-destructive" />
                                                                    </Button>
                                                                )}
                                                            </div>
                                                        </CardHeader>
                                                        <CardContent className="space-y-4">
                                                            {/* Submission Search */}
                                                            <div className="space-y-2">
                                                                <Label className="text-xs">Cari Pegawai / Pengajuan</Label>
                                                                <div className="relative">
                                                                    <User className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                                                    <Input
                                                                        className="pl-9"
                                                                        placeholder={category ? "Ketik nama pegawai..." : "Pilih jenis surat dulu"}
                                                                        value={entry.submissionSearch}
                                                                        onChange={(e) => handleBatchSubmissionSearch(entry.id, e.target.value)}
                                                                        disabled={!category}
                                                                    />
                                                                    {entry.isSearching && (
                                                                        <div className="absolute right-2.5 top-2.5">
                                                                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                {entry.submissionResults.length > 0 && (
                                                                    <Card className="mt-1 max-h-40 overflow-y-auto">
                                                                        <CardContent className="p-2">
                                                                            {entry.submissionResults.map((sub) => (
                                                                                <Button
                                                                                    key={sub.id}
                                                                                    variant="ghost"
                                                                                    className="w-full justify-start text-left h-auto py-2"
                                                                                    onClick={() => handleBatchSubmissionSelect(entry.id, sub)}
                                                                                >
                                                                                    <div>
                                                                                        <div className="font-medium text-sm">{sub.profiles?.name}</div>
                                                                                        <div className="text-xs text-muted-foreground">
                                                                                            {formatSubmissionLabel(sub, category as string)}
                                                                                        </div>
                                                                                    </div>
                                                                                </Button>
                                                                            ))}
                                                                        </CardContent>
                                                                    </Card>
                                                                )}
                                                            </div>



                                                            {/* Selected Submission Detail Card (Batch) */}
                                                            {entry.selectedSubmission && (
                                                                <Card className="bg-muted/50 border-primary/20">
                                                                    <CardContent className="p-3 space-y-2">
                                                                        <div className="flex justify-between items-start">
                                                                            <div>
                                                                                <div className="font-semibold text-sm">{entry.nama_pegawai}</div>
                                                                                <div className="text-xs text-muted-foreground">NIP: {entry.nip_pegawai}</div>
                                                                            </div>
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="icon"
                                                                                className="h-6 w-6 text-muted-foreground hover:text-destructive"
                                                                                onClick={() => {
                                                                                    updateBatchEntry(entry.id, "selectedSubmission", null);
                                                                                    updateBatchEntry(entry.id, "nama_pegawai", "");
                                                                                    updateBatchEntry(entry.id, "nip_pegawai", "");
                                                                                    updateBatchEntry(entry.id, "jabatan_pegawai", "");
                                                                                    updateBatchEntry(entry.id, "unit_kerja", "");
                                                                                    updateBatchEntry(entry.id, "submissionSearch", "");
                                                                                    updateBatchEntry(entry.id, "showManualInput", true);
                                                                                }}
                                                                            >
                                                                                <Trash2 className="h-3 w-3" />
                                                                            </Button>
                                                                        </div>

                                                                        <div className="text-xs space-y-1">
                                                                            <div className="grid grid-cols-2 gap-2">
                                                                                <div>
                                                                                    <span className="text-muted-foreground">Jabatan:</span>
                                                                                    <div className="font-medium truncate">{entry.jabatan_pegawai || "-"}</div>
                                                                                </div>
                                                                                <div>
                                                                                    <span className="text-muted-foreground">Unit:</span>
                                                                                    <div className="font-medium truncate">{entry.unit_kerja || "-"}</div>
                                                                                </div>
                                                                            </div>
                                                                            <div className="pt-1 border-t mt-1">
                                                                                <span className="text-muted-foreground">Detail:</span>
                                                                                <div className="font-medium text-primary truncate">
                                                                                    {formatSubmissionLabel(entry.selectedSubmission, category as string)}
                                                                                </div>
                                                                            </div>
                                                                        </div>

                                                                        <Button
                                                                            variant="outline"
                                                                            size="sm"
                                                                            className="w-full text-xs h-7"
                                                                            onClick={() => updateBatchEntry(entry.id, "showManualInput", !entry.showManualInput)}
                                                                        >
                                                                            {entry.showManualInput ? "Sembunyikan Edit Manual" : "Edit Data Manual"}
                                                                        </Button>
                                                                    </CardContent>
                                                                </Card>
                                                            )}

                                                            {/* Manual Input Fields */}
                                                            {(entry.showManualInput || !entry.selectedSubmission) && (
                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                                                                    <div className="space-y-1">
                                                                        <Label className="text-xs text-muted-foreground">Nama Pegawai *</Label>
                                                                        <Input
                                                                            placeholder="Nama Lengkap"
                                                                            value={entry.nama_pegawai}
                                                                            onChange={(e) => updateBatchEntry(entry.id, "nama_pegawai", e.target.value)}
                                                                        />
                                                                    </div>
                                                                    <div className="space-y-1">
                                                                        <Label className="text-xs text-muted-foreground">NIP *</Label>
                                                                        <Input
                                                                            placeholder="NIP Pegawai"
                                                                            value={entry.nip_pegawai}
                                                                            onChange={(e) => updateBatchEntry(entry.id, "nip_pegawai", e.target.value)}
                                                                        />
                                                                    </div>
                                                                    <div className="space-y-1">
                                                                        <Label className="text-xs text-muted-foreground">Jabatan</Label>
                                                                        <Input
                                                                            placeholder="Jabatan"
                                                                            value={entry.jabatan_pegawai}
                                                                            onChange={(e) => updateBatchEntry(entry.id, "jabatan_pegawai", e.target.value)}
                                                                        />
                                                                    </div>
                                                                    <div className="space-y-1">
                                                                        <Label className="text-xs text-muted-foreground">Unit Kerja</Label>
                                                                        <Input
                                                                            placeholder="Unit Kerja"
                                                                            value={entry.unit_kerja}
                                                                            onChange={(e) => updateBatchEntry(entry.id, "unit_kerja", e.target.value)}
                                                                        />
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </CardContent>
                                                    </Card>
                                                ))}
                                                <Button
                                                    variant="outline"
                                                    onClick={addBatchEntry}
                                                    className="w-full"
                                                >
                                                    <Plus className="h-4 w-4 mr-2" />
                                                    Tambah Pegawai
                                                </Button>
                                                <Button onClick={handleGenerateBatch} className="w-full">
                                                    Buat Surat Batch (ZIP)
                                                </Button>
                                            </div>
                                        </TabsContent>
                                    </Tabs>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="templates">
                        <TemplateManagement isEmbedded={true} />
                    </TabsContent>
                </Tabs>
            </div>
        </DashboardLayout >
    );
}
