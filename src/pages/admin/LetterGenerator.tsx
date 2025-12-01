import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TemplateManagement from "./TemplateManagement";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { FileText, Settings, Download, User, File, Plus, Trash2, Users } from "lucide-react";
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
import { searchEmployees, getApprovedSubmissions, mapSubmissionToTemplateData, formatSubmissionLabel, EmployeeSearchResult, ApprovedSubmission } from "@/lib/submissionData";

interface BatchEntry {
    id: string;
    nama_pegawai: string;
    nip_pegawai: string;
    jabatan_pegawai: string;
    unit_kerja: string;
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

    // Employee search states
    const [employeeSearch, setEmployeeSearch] = useState("");
    const [employeeResults, setEmployeeResults] = useState<EmployeeSearchResult[]>([]);
    const [selectedEmployee, setSelectedEmployee] = useState<EmployeeSearchResult | null>(null);
    const [isSearching, setIsSearching] = useState(false);

    // Submission states
    const [submissions, setSubmissions] = useState<ApprovedSubmission[]>([]);
    const [selectedSubmission, setSelectedSubmission] = useState<ApprovedSubmission | null>(null);
    const [isLoadingSubmissions, setIsLoadingSubmissions] = useState(false);

    // Batch mode states
    const [batchEntries, setBatchEntries] = useState<BatchEntry[]>([
        { id: "1", nama_pegawai: "", nip_pegawai: "", jabatan_pegawai: "", unit_kerja: "" }
    ]);

    useEffect(() => {
        if (user?.work_unit_id && category) {
            const loadedTemplates = getTemplatesByWorkUnit(user.work_unit_id, category as LetterCategory);
            setTemplates(loadedTemplates);
        } else {
            setTemplates([]);
        }
    }, [user, category]);

    // Search employees when search term changes
    useEffect(() => {
        const searchTimer = setTimeout(async () => {
            if (employeeSearch.length >= 2) {
                setIsSearching(true);
                const results = await searchEmployees(employeeSearch);
                setEmployeeResults(results);
                setIsSearching(false);
            } else {
                setEmployeeResults([]);
            }
        }, 300);

        return () => clearTimeout(searchTimer);
    }, [employeeSearch]);

    // Load submissions when employee and category are selected
    useEffect(() => {
        const loadSubmissions = async () => {
            if (selectedEmployee && category) {
                setIsLoadingSubmissions(true);
                const data = await getApprovedSubmissions(category, selectedEmployee.id);
                setSubmissions(data);
                setIsLoadingSubmissions(false);
            } else {
                setSubmissions([]);
                setSelectedSubmission(null);
            }
        };

        loadSubmissions();
    }, [selectedEmployee, category]);

    const addBatchEntry = () => {
        const newId = (Math.max(...batchEntries.map(e => parseInt(e.id))) + 1).toString();
        setBatchEntries([...batchEntries, {
            id: newId,
            nama_pegawai: "",
            nip_pegawai: "",
            jabatan_pegawai: "",
            unit_kerja: ""
        }]);
    };

    const removeBatchEntry = (id: string) => {
        if (batchEntries.length > 1) {
            setBatchEntries(batchEntries.filter(e => e.id !== id));
        }
    };

    const updateBatchEntry = (id: string, field: keyof BatchEntry, value: string) => {
        setBatchEntries(batchEntries.map(entry =>
            entry.id === id ? { ...entry, [field]: value } : entry
        ));
    };

    const handleEmployeeSelect = (employee: EmployeeSearchResult) => {
        setSelectedEmployee(employee);
        setEmployeeName(employee.name);
        setEmployeeNip(employee.nip);
        setEmployeeSearch(employee.name);
        setEmployeeResults([]);
    };

    const handleSubmissionSelect = (submissionId: string) => {
        const submission = submissions.find(s => s.id.toString() === submissionId);
        if (submission && category) {
            setSelectedSubmission(submission);
            const mappedData = mapSubmissionToTemplateData(submission, category);
            setEmployeeName(mappedData.nama_pegawai);
            setEmployeeNip(mappedData.nip_pegawai);
            setEmployeeJabatan(mappedData.jabatan_pegawai);
            setEmployeeUnit(mappedData.unit_kerja || "");
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
                const data = {
                    nama_pegawai: entry.nama_pegawai,
                    nip_pegawai: entry.nip_pegawai,
                    jabatan_pegawai: entry.jabatan_pegawai || "Staf",
                    unit_kerja: entry.unit_kerja || "Unit Kerja",
                    tanggal_surat,
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
                                        <Select value={category} onValueChange={(val) => setCategory(val as LetterCategory)}>
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
                                            {/* Employee Search */}
                                            <div className="space-y-2">
                                                <Label>Cari Pegawai</Label>
                                                <div className="relative">
                                                    <User className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                                    <Input
                                                        className="pl-9"
                                                        placeholder="Ketik nama atau NIP pegawai..."
                                                        value={employeeSearch}
                                                        onChange={(e) => setEmployeeSearch(e.target.value)}
                                                    />
                                                    {isSearching && (
                                                        <div className="absolute right-2.5 top-2.5">
                                                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                                                        </div>
                                                    )}
                                                </div>
                                                {employeeResults.length > 0 && (
                                                    <Card className="mt-1">
                                                        <CardContent className="p-2">
                                                            {employeeResults.map((emp) => (
                                                                <Button
                                                                    key={emp.id}
                                                                    variant="ghost"
                                                                    className="w-full justify-start text-left"
                                                                    onClick={() => handleEmployeeSelect(emp)}
                                                                >
                                                                    <div>
                                                                        <div className="font-medium">{emp.name}</div>
                                                                        <div className="text-xs text-muted-foreground">NIP: {emp.nip}</div>
                                                                    </div>
                                                                </Button>
                                                            ))}
                                                        </CardContent>
                                                    </Card>
                                                )}
                                            </div>

                                            {/* Submission Selector */}
                                            {selectedEmployee && category && (
                                                <div className="space-y-2">
                                                    <Label>Pilih Pengajuan</Label>
                                                    <Select
                                                        value={selectedSubmission?.id.toString() || ""}
                                                        onValueChange={handleSubmissionSelect}
                                                        disabled={isLoadingSubmissions || submissions.length === 0}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue placeholder={
                                                                isLoadingSubmissions
                                                                    ? "Memuat pengajuan..."
                                                                    : submissions.length === 0
                                                                        ? "Tidak ada pengajuan yang disetujui"
                                                                        : "Pilih pengajuan"
                                                            } />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {submissions.map((sub) => (
                                                                <SelectItem key={sub.id} value={sub.id.toString()}>
                                                                    {formatSubmissionLabel(sub, category)}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    {submissions.length === 0 && !isLoadingSubmissions && (
                                                        <p className="text-xs text-muted-foreground">
                                                            Pegawai ini belum memiliki pengajuan {category} yang disetujui. Anda masih bisa input manual di bawah.
                                                        </p>
                                                    )}
                                                </div>
                                            )}

                                            {/* Manual Input Fields */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                                        <CardContent>
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                                            </div>
                                        </TabsContent>
                                    </Tabs>
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button
                                    onClick={generationMode === "individual" ? handleGenerateIndividual : handleGenerateBatch}
                                    disabled={!selectedTemplateId}
                                    className="ml-auto"
                                >
                                    <Download className="mr-2 h-4 w-4" />
                                    {generationMode === "individual" ? "Generate Surat" : `Generate ${batchEntries.filter(e => e.nama_pegawai && e.nip_pegawai).length} Surat`}
                                </Button>
                            </CardFooter>
                        </Card>
                    </TabsContent>

                    <TabsContent value="templates" className="space-y-4">
                        <TemplateManagement isEmbedded={true} />
                    </TabsContent>
                </Tabs>
            </div>
        </DashboardLayout>
    );
}

