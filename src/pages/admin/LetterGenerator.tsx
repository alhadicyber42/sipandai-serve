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
    searchEmployees,
    getApprovedSubmissions,
    searchSubmissionsByEmployee,
    mapSubmissionToTemplateData,
    formatSubmissionLabel,
    ApprovedSubmission,
    EmployeeSearchResult
} from "@/lib/submissionData";

interface BatchEntry {
    id: string;
    // Employee search (Step 1)
    employeeSearch: string;
    employeeResults: EmployeeSearchResult[];
    selectedEmployee: EmployeeSearchResult | null;
    isSearchingEmployee: boolean;
    // Submission selection (Step 2)
    submissionResults: ApprovedSubmission[];
    selectedSubmission: ApprovedSubmission | null;
    isLoadingSubmissions: boolean;
}

export default function LetterGenerator() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState("generator");
    const [generationMode, setGenerationMode] = useState<"individual" | "batch">("individual");
    const [category, setCategory] = useState<LetterCategory | "">("");
    const [templates, setTemplates] = useState<LetterTemplate[]>([]);
    const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");

    // Individual mode states - Employee Search (Step 1)
    const [employeeSearch, setEmployeeSearch] = useState("");
    const [employeeResults, setEmployeeResults] = useState<EmployeeSearchResult[]>([]);
    const [selectedEmployee, setSelectedEmployee] = useState<EmployeeSearchResult | null>(null);
    const [isSearchingEmployee, setIsSearchingEmployee] = useState(false);

    // Submission selection states (Step 2)
    const [submissionResults, setSubmissionResults] = useState<ApprovedSubmission[]>([]);
    const [selectedSubmission, setSelectedSubmission] = useState<ApprovedSubmission | null>(null);
    const [isLoadingSubmissions, setIsLoadingSubmissions] = useState(false);

    // Batch mode states
    const [batchEntries, setBatchEntries] = useState<BatchEntry[]>([
        {
            id: "1",
            employeeSearch: "",
            employeeResults: [],
            selectedEmployee: null,
            isSearchingEmployee: false,
            submissionResults: [],
            selectedSubmission: null,
            isLoadingSubmissions: false
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


    // Search employees when search term changes (Individual - Step 1)
    useEffect(() => {
        const searchTimer = setTimeout(async () => {
            if (employeeSearch.length >= 2) {
                setIsSearchingEmployee(true);
                const results = await searchEmployees(employeeSearch);
                setEmployeeResults(results);
                setIsSearchingEmployee(false);
            } else {
                setEmployeeResults([]);
            }
        }, 300);

        return () => clearTimeout(searchTimer);
    }, [employeeSearch]);

    // Handle employee selection and fetch their submissions (Step 2)
    const handleEmployeeSelect = async (employee: EmployeeSearchResult) => {
        setSelectedEmployee(employee);
        setEmployeeResults([]); // Hide employee list
        setEmployeeSearch(employee.name); // Show selected name in search box

        if (category) {
            setIsLoadingSubmissions(true);
            const submissions = await getApprovedSubmissions(category, employee.id);
            setSubmissionResults(submissions);
            setIsLoadingSubmissions(false);
        }
    };

    const handleSubmissionSelect = (submission: ApprovedSubmission) => {
        setSelectedSubmission(submission);
        setSubmissionResults([]); // Hide submission list after selection
    };


    // Batch functions
    const addBatchEntry = () => {
        const newId = (Math.max(...batchEntries.map(e => parseInt(e.id))) + 1).toString();
        setBatchEntries([...batchEntries, {
            id: newId,
            employeeSearch: "",
            employeeResults: [],
            selectedEmployee: null,
            isSearchingEmployee: false,
            submissionResults: [],
            selectedSubmission: null,
            isLoadingSubmissions: false
        }]);
    };

    const removeBatchEntry = (id: string) => {
        if (batchEntries.length > 1) {
            setBatchEntries(batchEntries.filter(e => e.id !== id));
        }
    };

    const updateBatchEntry = (id: string, field: keyof BatchEntry, value: any) => {
        setBatchEntries(prev => prev.map(entry =>
            entry.id === id ? { ...entry, [field]: value } : entry
        ));
    };

    // Batch: Employee search handler
    const handleBatchEmployeeSearch = async (entryId: string, searchTerm: string) => {
        updateBatchEntry(entryId, 'employeeSearch', searchTerm);

        if (searchTerm.length >= 2) {
            updateBatchEntry(entryId, 'isSearchingEmployee', true);
            const results = await searchEmployees(searchTerm);
            updateBatchEntry(entryId, 'employeeResults', results);
            updateBatchEntry(entryId, 'isSearchingEmployee', false);
        } else {
            updateBatchEntry(entryId, 'employeeResults', []);
        }
    };

    // Batch: Employee selection handler
    const handleBatchEmployeeSelect = async (entryId: string, employee: EmployeeSearchResult) => {
        setBatchEntries(prev => prev.map(entry => {
            if (entry.id === entryId) {
                return {
                    ...entry,
                    selectedEmployee: employee,
                    employeeResults: [],
                    employeeSearch: employee.name,
                    selectedSubmission: null,
                    submissionResults: [],
                    isLoadingSubmissions: true
                };
            }
            return entry;
        }));

        // Fetch submissions for selected employee
        if (category) {
            const submissions = await getApprovedSubmissions(category, employee.id);
            setBatchEntries(prev => prev.map(entry => {
                if (entry.id === entryId) {
                    return {
                        ...entry,
                        submissionResults: submissions,
                        isLoadingSubmissions: false
                    };
                }
                return entry;
            }));
        }
    };

    // Batch: Submission selection handler
    const handleBatchSubmissionSelect = (entryId: string, submission: ApprovedSubmission) => {
        updateBatchEntry(entryId, 'selectedSubmission', submission);
        updateBatchEntry(entryId, 'submissionResults', []); // Hide results after selection
    };

    const handleGenerateIndividual = () => {
        if (!selectedTemplateId) {
            toast.error("Pilih template terlebih dahulu");
            return;
        }
        if (!selectedEmployee) {
            toast.error("Pilih pegawai terlebih dahulu");
            return;
        }
        if (!selectedSubmission) {
            toast.error("Pilih usulan terlebih dahulu");
            return;
        }

        const template = templates.find(t => t.id === selectedTemplateId);
        if (!template || !template.file_content) {
            toast.error("Template tidak valid atau tidak memiliki file");
            return;
        }

        try {
            // Map submission data to template variables
            const data = mapSubmissionToTemplateData(selectedSubmission, category as string);

            generateDocument(
                template.file_content,
                data,
                `Surat_${category}_${selectedEmployee.name}.docx`
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

        // Validate batch entries - must have both employee and submission selected
        const validEntries = batchEntries.filter(entry =>
            entry.selectedEmployee && entry.selectedSubmission
        );

        if (validEntries.length === 0) {
            toast.error("Minimal pilih 1 pegawai dan usulannya");
            return;
        }

        try {
            const zip = new JSZip();

            // Generate document for each entry
            for (const entry of validEntries) {
                // Map submission data to template variables
                const data = mapSubmissionToTemplateData(entry.selectedSubmission!, category as string);

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
                const employeeName = entry.selectedEmployee?.name || 'Unknown';
                const sanitizedName = employeeName.replace(/[^a-z0-9]/gi, '_');
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
                                            setEmployeeSearch("");
                                            setEmployeeResults([]);
                                            setSelectedEmployee(null);
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
                                            {/* Step 1: Employee Search & Selection */}
                                            <div className="space-y-4">
                                                <div className="space-y-2">
                                                    <Label>Cari Pegawai (Step 1)</Label>
                                                    <div className="relative">
                                                        <User className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                                        <Input
                                                            className="pl-9"
                                                            placeholder={category ? "Ketik nama atau NIP pegawai..." : "Pilih jenis surat terlebih dahulu"}
                                                            value={employeeSearch}
                                                            onChange={(e) => {
                                                                setEmployeeSearch(e.target.value);
                                                                if (selectedEmployee) {
                                                                    // Reset employee and submission selection when searching again
                                                                    setSelectedEmployee(null);
                                                                    setSelectedSubmission(null);
                                                                    setSubmissionResults([]);
                                                                }
                                                            }}
                                                            disabled={!category}
                                                        />
                                                        {isSearchingEmployee && (
                                                            <div className="absolute right-2.5 top-2.5">
                                                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Employee Results List */}
                                                {!selectedEmployee && employeeResults.length > 0 && (
                                                    <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                                                        <Label className="text-muted-foreground">Pilih Pegawai:</Label>
                                                        <div className="grid grid-cols-1 gap-2">
                                                            {employeeResults.map((emp) => (
                                                                <Card
                                                                    key={emp.id}
                                                                    className="cursor-pointer hover:bg-muted/50 transition-colors border-primary/20"
                                                                    onClick={() => handleEmployeeSelect(emp)}
                                                                >
                                                                    <CardContent className="p-3 flex justify-between items-center">
                                                                        <div>
                                                                            <div className="font-semibold">{emp.name}</div>
                                                                            <div className="text-sm text-muted-foreground">NIP: {emp.nip}</div>
                                                                        </div>
                                                                        <Button size="sm" variant="secondary">Pilih</Button>
                                                                    </CardContent>
                                                                </Card>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* No Employee Results */}
                                                {!selectedEmployee && employeeSearch.length >= 2 && !isSearchingEmployee && employeeResults.length === 0 && category && (
                                                    <div className="text-center py-6 border rounded-lg bg-muted/20">
                                                        <p className="text-muted-foreground">
                                                            Tidak ditemukan pegawai dengan nama/NIP "{employeeSearch}".
                                                        </p>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Step 2: Submission Selection (Only shown after employee is selected) */}
                                            {selectedEmployee && (
                                                <div className="space-y-4">
                                                    {/* Selected Employee Card */}
                                                    <Card className="bg-primary/5 border-primary/30">
                                                        <CardContent className="p-3 flex justify-between items-center">
                                                            <div>
                                                                <div className="text-xs text-muted-foreground">Pegawai Terpilih:</div>
                                                                <div className="font-semibold">{selectedEmployee.name}</div>
                                                                <div className="text-sm text-muted-foreground">NIP: {selectedEmployee.nip}</div>
                                                            </div>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => {
                                                                    setSelectedEmployee(null);
                                                                    setSelectedSubmission(null);
                                                                    setSubmissionResults([]);
                                                                    setEmployeeSearch("");
                                                                }}
                                                                className="text-muted-foreground hover:text-destructive"
                                                            >
                                                                <Trash2 className="h-4 w-4 mr-1" />
                                                                Ganti
                                                            </Button>
                                                        </CardContent>
                                                    </Card>

                                                    {/* Loading Submissions */}
                                                    {isLoadingSubmissions && (
                                                        <div className="text-center py-6">
                                                            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                                                            <p className="text-sm text-muted-foreground mt-2">Memuat usulan...</p>
                                                        </div>
                                                    )}

                                                    {/* Submission Results List */}
                                                    {!isLoadingSubmissions && !selectedSubmission && submissionResults.length > 0 && (
                                                        <div className="space-y-2">
                                                            <Label className="text-muted-foreground">Pilih Usulan {category ? `(${category})` : ''} (Step 2):</Label>
                                                            <div className="grid grid-cols-1 gap-3">
                                                                {submissionResults.map((sub) => (
                                                                    <Card
                                                                        key={sub.id}
                                                                        className="cursor-pointer hover:bg-muted/50 transition-colors border-primary/20"
                                                                        onClick={() => handleSubmissionSelect(sub)}
                                                                    >
                                                                        <CardContent className="p-4 flex justify-between items-center">
                                                                            <div className="flex-1">
                                                                                <div className="font-semibold text-primary">
                                                                                    {formatSubmissionLabel(sub, category as string)}
                                                                                </div>
                                                                                <div className="text-xs text-muted-foreground mt-1">
                                                                                    Diajukan: {new Date(sub.created_at).toLocaleDateString('id-ID')}
                                                                                </div>
                                                                            </div>
                                                                            <Button size="sm" variant="secondary">Pilih</Button>
                                                                        </CardContent>
                                                                    </Card>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* No Submissions Found */}
                                                    {!isLoadingSubmissions && submissionResults.length === 0 && (
                                                        <div className="text-center py-6 border rounded-lg bg-muted/20">
                                                            <p className="text-muted-foreground">
                                                                Tidak ada usulan {category} yang disetujui untuk pegawai ini.
                                                            </p>
                                                        </div>
                                                    )}

                                                    {/* Selected Submission Detail */}
                                                    {selectedSubmission && (
                                                        <Card className="bg-muted/50 border-primary/20">
                                                            <CardContent className="p-4 space-y-3">
                                                                <div className="flex justify-between items-start">
                                                                    <div>
                                                                        <div className="text-xs text-muted-foreground">Usulan Terpilih:</div>
                                                                        <div className="font-semibold text-primary mt-1">
                                                                            {formatSubmissionLabel(selectedSubmission, category as string)}
                                                                        </div>
                                                                    </div>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={() => {
                                                                            setSelectedSubmission(null);
                                                                        }}
                                                                        className="text-muted-foreground hover:text-destructive"
                                                                    >
                                                                        <Trash2 className="h-4 w-4 mr-1" />
                                                                        Ganti
                                                                    </Button>
                                                                </div>
                                                            </CardContent>
                                                        </Card>
                                                    )}
                                                </div>
                                            )}

                                            {/* Generate Button - Only shown when both employee and submission are selected */}
                                            {selectedEmployee && selectedSubmission && (
                                                <Button onClick={handleGenerateIndividual} className="w-full">
                                                    Buat Surat Individual
                                                </Button>
                                            )}
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
                                                        <CardContent className="space-y-3">
                                                            {/* Step 1: Employee Search */}
                                                            <div className="space-y-2">
                                                                <Label className="text-xs">Cari Pegawai</Label>
                                                                <div className="relative">
                                                                    <User className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                                                    <Input
                                                                        className="pl-9 text-sm"
                                                                        placeholder={category ? "Ketik nama/NIP..." : "Pilih jenis surat dulu"}
                                                                        value={entry.employeeSearch}
                                                                        onChange={(e) => handleBatchEmployeeSearch(entry.id, e.target.value)}
                                                                        disabled={!category}
                                                                    />
                                                                    {entry.isSearchingEmployee && (
                                                                        <div className="absolute right-2.5 top-2.5">
                                                                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                {/* Employee Results */}
                                                                {!entry.selectedEmployee && entry.employeeResults.length > 0 && (
                                                                    <div className="grid grid-cols-1 gap-1 max-h-32 overflow-y-auto">
                                                                        {entry.employeeResults.map((emp) => (
                                                                            <Button
                                                                                key={emp.id}
                                                                                variant="ghost"
                                                                                size="sm"
                                                                                className="justify-start h-auto py-2 text-left"
                                                                                onClick={() => handleBatchEmployeeSelect(entry.id, emp)}
                                                                            >
                                                                                <div className="text-xs">
                                                                                    <div className="font-medium">{emp.name}</div>
                                                                                    <div className="text-muted-foreground">NIP: {emp.nip}</div>
                                                                                </div>
                                                                            </Button>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {/* Selected Employee & Submission Selection */}
                                                            {entry.selectedEmployee && (
                                                                <div className="space-y-2">
                                                                    {/* Selected Employee Badge */}
                                                                    <div className="flex items-center justify-between p-2 bg-primary/5 rounded text-xs">
                                                                        <div>
                                                                            <div className="font-medium">{entry.selectedEmployee.name}</div>
                                                                            <div className="text-muted-foreground">NIP: {entry.selectedEmployee.nip}</div>
                                                                        </div>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            className="h-6 px-2"
                                                                            onClick={() => {
                                                                                updateBatchEntry(entry.id, 'selectedEmployee', null);
                                                                                updateBatchEntry(entry.id, 'selectedSubmission', null);
                                                                                updateBatchEntry(entry.id, 'submissionResults', []);
                                                                                updateBatchEntry(entry.id, 'employeeSearch', "");
                                                                            }}
                                                                        >
                                                                            <Trash2 className="h-3 w-3" />
                                                                        </Button>
                                                                    </div>

                                                                    {/* Loading Submissions */}
                                                                    {entry.isLoadingSubmissions && (
                                                                        <div className="text-center py-3">
                                                                            <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                                                                        </div>
                                                                    )}

                                                                    {/* Submission Results */}
                                                                    {!entry.isLoadingSubmissions && !entry.selectedSubmission && entry.submissionResults.length > 0 && (
                                                                        <div className="space-y-1">
                                                                            <Label className="text-xs text-muted-foreground">Pilih Usulan:</Label>
                                                                            <div className="grid grid-cols-1 gap-1 max-h-32 overflow-y-auto">
                                                                                {entry.submissionResults.map((sub) => (
                                                                                    <Button
                                                                                        key={sub.id}
                                                                                        variant="ghost"
                                                                                        size="sm"
                                                                                        className="justify-start h-auto py-2 text-left"
                                                                                        onClick={() => handleBatchSubmissionSelect(entry.id, sub)}
                                                                                    >
                                                                                        <div className="text-xs">
                                                                                            <div className="font-medium text-primary">
                                                                                                {formatSubmissionLabel(sub, category as string)}
                                                                                            </div>
                                                                                        </div>
                                                                                    </Button>
                                                                                ))}
                                                                            </div>
                                                                        </div>
                                                                    )}

                                                                    {/* No Submissions */}
                                                                    {!entry.isLoadingSubmissions && entry.submissionResults.length === 0 && (
                                                                        <div className="text-center py-3 text-xs text-muted-foreground">
                                                                            Tidak ada usulan {category} yang disetujui
                                                                        </div>
                                                                    )}

                                                                    {/* Selected Submission Badge */}
                                                                    {entry.selectedSubmission && (
                                                                        <div className="flex items-center justify-between p-2 bg-muted/50 rounded text-xs">
                                                                            <div className="font-medium text-primary">
                                                                                {formatSubmissionLabel(entry.selectedSubmission, category as string)}
                                                                            </div>
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="sm"
                                                                                className="h-6 px-2"
                                                                                onClick={() => updateBatchEntry(entry.id, 'selectedSubmission', null)}
                                                                            >
                                                                                <Trash2 className="h-3 w-3" />
                                                                            </Button>
                                                                        </div>
                                                                    )}
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
        </DashboardLayout>
    );
}
