import { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TemplateManagement from "./TemplateManagement";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Settings, User, Plus, Trash2, Users, ClipboardList, Database } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { LetterCategory, LetterTemplate } from "@/types/leave-certificate";
import { getTemplatesByCreator } from "@/lib/templateStorage";
import { generateDocument } from "@/lib/docxEngine";
import { toast } from "sonner";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import {
    searchEmployees,
    getApprovedSubmissions,
    mapSubmissionToTemplateData,
    formatSubmissionLabel,
    ApprovedSubmission,
    EmployeeSearchResult
} from "@/lib/submissionData";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

interface BatchEntry {
    id: string;
    employeeSearch: string;
    employeeResults: EmployeeSearchResult[];
    selectedEmployee: EmployeeSearchResult | null;
    isSearchingEmployee: boolean;
    submissionResults: ApprovedSubmission[];
    selectedSubmission: ApprovedSubmission | null;
    isLoadingSubmissions: boolean;
}

interface ProfileData {
    id: string;
    name: string;
    nip: string;
    jabatan: string | null;
    pangkat_golongan: string | null;
    work_unit_id: number | null;
    email: string | null;
    phone: string | null;
    tmt_pns: string | null;
    tmt_pensiun: string | null;
    work_units?: { name: string } | null;
}

export default function LetterGenerator() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState("generator");
    const [generationMode, setGenerationMode] = useState<"individual" | "batch">("individual");
    const [category, setCategory] = useState<LetterCategory | "">("");
    const [templates, setTemplates] = useState<LetterTemplate[]>([]);
    const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");

    // Individual mode states
    const [employeeSearch, setEmployeeSearch] = useState("");
    const [employeeResults, setEmployeeResults] = useState<EmployeeSearchResult[]>([]);
    const [selectedEmployee, setSelectedEmployee] = useState<EmployeeSearchResult | null>(null);
    const [isSearchingEmployee, setIsSearchingEmployee] = useState(false);
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

    // Data Usulan tab states
    const [usulanCategory, setUsulanCategory] = useState<string>("cuti");
    const [usulanList, setUsulanList] = useState<ApprovedSubmission[]>([]);
    const [isLoadingUsulan, setIsLoadingUsulan] = useState(false);

    // Data Pegawai tab states
    const [pegawaiSearch, setPegawaiSearch] = useState("");
    const [pegawaiList, setPegawaiList] = useState<ProfileData[]>([]);
    const [isLoadingPegawai, setIsLoadingPegawai] = useState(false);

    // Load templates when category changes
    useEffect(() => {
        const loadTemplates = async () => {
            if (user?.id && category) {
                const loadedTemplates = await getTemplatesByCreator(user.id, category as LetterCategory);
                setTemplates(loadedTemplates);
            } else {
                setTemplates([]);
            }
        };
        loadTemplates();
    }, [user, category]);

    // Search employees for Individual mode
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

    // Load approved submissions for Data Usulan tab
    useEffect(() => {
        const loadUsulan = async () => {
            if (activeTab === "data-usulan" && usulanCategory) {
                setIsLoadingUsulan(true);
                const data = await getApprovedSubmissions(usulanCategory);
                setUsulanList(data);
                setIsLoadingUsulan(false);
            }
        };
        loadUsulan();
    }, [activeTab, usulanCategory]);

    // Search employees for Data Pegawai tab
    useEffect(() => {
        const searchTimer = setTimeout(async () => {
            if (activeTab === "data-pegawai") {
                setIsLoadingPegawai(true);
                let query = supabase
                    .from('profiles')
                    .select('id, name, nip, jabatan, pangkat_golongan, work_unit_id, email, phone, tmt_pns, tmt_pensiun, work_units(name)')
                    .eq('role', 'user_unit')
                    .order('name');

                if (pegawaiSearch.length >= 2) {
                    query = query.or(`name.ilike.%${pegawaiSearch}%,nip.ilike.%${pegawaiSearch}%`);
                }

                const { data, error } = await query.limit(50);
                if (!error && data) {
                    setPegawaiList(data as any[]);
                }
                setIsLoadingPegawai(false);
            }
        }, 300);
        return () => clearTimeout(searchTimer);
    }, [activeTab, pegawaiSearch]);

    const handleEmployeeSelect = useCallback(async (employee: EmployeeSearchResult) => {
        setSelectedEmployee(employee);
        setEmployeeResults([]);
        setEmployeeSearch(employee.name);

        if (category) {
            setIsLoadingSubmissions(true);
            const submissions = await getApprovedSubmissions(category, employee.id);
            setSubmissionResults(submissions);
            setIsLoadingSubmissions(false);
        }
    }, [category]);

    const handleSubmissionSelect = useCallback((submission: ApprovedSubmission) => {
        setSelectedSubmission(submission);
        setSubmissionResults([]);
    }, []);

    const handleCategoryChange = useCallback((val: string) => {
        setCategory(val as LetterCategory);
        setEmployeeSearch("");
        setEmployeeResults([]);
        setSelectedEmployee(null);
        setSubmissionResults([]);
        setSelectedSubmission(null);
        setSelectedTemplateId("");
    }, []);

    // Batch functions
    const addBatchEntry = useCallback(() => {
        const newId = (Math.max(...batchEntries.map(e => parseInt(e.id))) + 1).toString();
        setBatchEntries(prev => [...prev, {
            id: newId,
            employeeSearch: "",
            employeeResults: [],
            selectedEmployee: null,
            isSearchingEmployee: false,
            submissionResults: [],
            selectedSubmission: null,
            isLoadingSubmissions: false
        }]);
    }, [batchEntries]);

    const removeBatchEntry = useCallback((id: string) => {
        setBatchEntries(prev => prev.length > 1 ? prev.filter(e => e.id !== id) : prev);
    }, []);

    const updateBatchEntry = useCallback((id: string, field: keyof BatchEntry, value: any) => {
        setBatchEntries(prev => prev.map(entry =>
            entry.id === id ? { ...entry, [field]: value } : entry
        ));
    }, []);

    const handleBatchEmployeeSearch = useCallback(async (entryId: string, searchTerm: string) => {
        updateBatchEntry(entryId, 'employeeSearch', searchTerm);

        if (searchTerm.length >= 2) {
            updateBatchEntry(entryId, 'isSearchingEmployee', true);
            const results = await searchEmployees(searchTerm);
            updateBatchEntry(entryId, 'employeeResults', results);
            updateBatchEntry(entryId, 'isSearchingEmployee', false);
        } else {
            updateBatchEntry(entryId, 'employeeResults', []);
        }
    }, [updateBatchEntry]);

    const handleBatchEmployeeSelect = useCallback(async (entryId: string, employee: EmployeeSearchResult) => {
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
    }, [category]);

    const handleBatchSubmissionSelect = useCallback((entryId: string, submission: ApprovedSubmission) => {
        updateBatchEntry(entryId, 'selectedSubmission', submission);
        updateBatchEntry(entryId, 'submissionResults', []);
    }, [updateBatchEntry]);

    const handleGenerateIndividual = useCallback(() => {
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
    }, [selectedTemplateId, selectedEmployee, selectedSubmission, templates, category]);

    const handleGenerateBatch = useCallback(async () => {
        if (!selectedTemplateId) {
            toast.error("Pilih template terlebih dahulu");
            return;
        }
        const template = templates.find(t => t.id === selectedTemplateId);
        if (!template || !template.file_content) {
            toast.error("Template tidak valid atau tidak memiliki file");
            return;
        }

        const validEntries = batchEntries.filter(entry =>
            entry.selectedEmployee && entry.selectedSubmission
        );

        if (validEntries.length === 0) {
            toast.error("Minimal pilih 1 pegawai dan usulannya");
            return;
        }

        try {
            const zip = new JSZip();

            for (const entry of validEntries) {
                const data = mapSubmissionToTemplateData(entry.selectedSubmission!, category as string);
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

                const employeeName = entry.selectedEmployee?.name || 'Unknown';
                const sanitizedName = employeeName.replace(/[^a-z0-9]/gi, '_');
                zip.file(`Surat_${category}_${sanitizedName}.docx`, blob);
            }

            const zipBlob = await zip.generateAsync({ type: "blob" });
            saveAs(zipBlob, `Batch_Surat_${category}_${new Date().getTime()}.zip`);

            toast.success(`Berhasil membuat ${validEntries.length} surat`);
        } catch (error) {
            console.error(error);
            toast.error("Gagal membuat surat batch");
        }
    }, [selectedTemplateId, templates, batchEntries, category]);

    const getServiceTypeLabel = (type: string) => {
        const labels: Record<string, string> = {
            cuti: "Cuti",
            kenaikan_pangkat: "Kenaikan Pangkat",
            pensiun: "Pensiun",
            mutasi: "Mutasi"
        };
        return labels[type] || type;
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
                    <TabsList className="flex flex-wrap h-auto gap-1">
                        <TabsTrigger value="generator" className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            Generator Surat
                        </TabsTrigger>
                        <TabsTrigger value="data-usulan" className="flex items-center gap-2">
                            <ClipboardList className="h-4 w-4" />
                            Data Usulan
                        </TabsTrigger>
                        <TabsTrigger value="data-pegawai" className="flex items-center gap-2">
                            <Database className="h-4 w-4" />
                            Data Pegawai
                        </TabsTrigger>
                        <TabsTrigger value="templates" className="flex items-center gap-2">
                            <Settings className="h-4 w-4" />
                            Manajemen Template
                        </TabsTrigger>
                    </TabsList>

                    {/* Generator Surat Tab */}
                    <TabsContent value="generator" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Generator Surat</CardTitle>
                                <CardDescription>
                                    Pilih jenis surat, template, dan data usulan untuk membuat surat.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Jenis Surat</Label>
                                        <Select value={category} onValueChange={handleCategoryChange}>
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
                                                {templates.length === 0 ? (
                                                    <SelectItem value="none" disabled>Belum ada template</SelectItem>
                                                ) : (
                                                    templates.map(t => (
                                                        <SelectItem key={t.id} value={t.id}>{t.template_name}</SelectItem>
                                                    ))
                                                )}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                {/* Mode Selection */}
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
                                            <div className="space-y-4">
                                                <div className="space-y-2">
                                                    <Label>Cari Pegawai</Label>
                                                    <div className="relative">
                                                        <User className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                                        <Input
                                                            className="pl-9"
                                                            placeholder={category ? "Ketik nama atau NIP pegawai..." : "Pilih jenis surat terlebih dahulu"}
                                                            value={employeeSearch}
                                                            onChange={(e) => {
                                                                setEmployeeSearch(e.target.value);
                                                                if (selectedEmployee) {
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

                                                {/* Employee Results */}
                                                {!selectedEmployee && employeeResults.length > 0 && (
                                                    <div className="space-y-2">
                                                        <Label className="text-muted-foreground">Pilih Pegawai:</Label>
                                                        <div className="grid grid-cols-1 gap-2">
                                                            {employeeResults.map((emp) => (
                                                                <Card
                                                                    key={emp.id}
                                                                    className="cursor-pointer hover:bg-muted/50 transition-colors"
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

                                                {/* Selected Employee */}
                                                {selectedEmployee && (
                                                    <div className="space-y-4">
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
                                                                >
                                                                    <Trash2 className="h-4 w-4 mr-1" />
                                                                    Ganti
                                                                </Button>
                                                            </CardContent>
                                                        </Card>

                                                        {isLoadingSubmissions && (
                                                            <div className="text-center py-6">
                                                                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                                                                <p className="text-sm text-muted-foreground mt-2">Memuat usulan...</p>
                                                            </div>
                                                        )}

                                                        {!isLoadingSubmissions && !selectedSubmission && submissionResults.length > 0 && (
                                                            <div className="space-y-2">
                                                                <Label className="text-muted-foreground">Pilih Usulan yang Disetujui:</Label>
                                                                <div className="grid grid-cols-1 gap-2">
                                                                    {submissionResults.map((sub) => (
                                                                        <Card
                                                                            key={sub.id}
                                                                            className="cursor-pointer hover:bg-muted/50 transition-colors"
                                                                            onClick={() => handleSubmissionSelect(sub)}
                                                                        >
                                                                            <CardContent className="p-3 flex justify-between items-center">
                                                                                <div>
                                                                                    <div className="font-semibold text-primary">
                                                                                        {formatSubmissionLabel(sub, category as string)}
                                                                                    </div>
                                                                                    <div className="text-xs text-muted-foreground">
                                                                                        Diajukan: {format(new Date(sub.created_at), 'dd MMM yyyy', { locale: localeId })}
                                                                                    </div>
                                                                                </div>
                                                                                <Button size="sm" variant="secondary">Pilih</Button>
                                                                            </CardContent>
                                                                        </Card>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {!isLoadingSubmissions && submissionResults.length === 0 && !selectedSubmission && (
                                                            <div className="text-center py-6 border rounded-lg bg-muted/20">
                                                                <p className="text-muted-foreground">
                                                                    Tidak ada usulan {getServiceTypeLabel(category as string)} yang disetujui untuk pegawai ini.
                                                                </p>
                                                            </div>
                                                        )}

                                                        {selectedSubmission && (
                                                            <Card className="bg-muted/50">
                                                                <CardContent className="p-3 flex justify-between items-center">
                                                                    <div>
                                                                        <div className="text-xs text-muted-foreground">Usulan Terpilih:</div>
                                                                        <div className="font-semibold text-primary">
                                                                            {formatSubmissionLabel(selectedSubmission, category as string)}
                                                                        </div>
                                                                    </div>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={() => setSelectedSubmission(null)}
                                                                    >
                                                                        <Trash2 className="h-4 w-4 mr-1" />
                                                                        Ganti
                                                                    </Button>
                                                                </CardContent>
                                                            </Card>
                                                        )}
                                                    </div>
                                                )}

                                                {selectedEmployee && selectedSubmission && (
                                                    <Button onClick={handleGenerateIndividual} className="w-full">
                                                        Buat Surat Individual
                                                    </Button>
                                                )}
                                            </div>
                                        </TabsContent>

                                        {/* Batch Mode */}
                                        <TabsContent value="batch" className="space-y-4 mt-4">
                                            <div className="space-y-4">
                                                {batchEntries.map((entry, index) => (
                                                    <Card key={entry.id}>
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
                                                                </div>

                                                                {!entry.selectedEmployee && entry.employeeResults.length > 0 && (
                                                                    <div className="grid grid-cols-1 gap-1 max-h-32 overflow-y-auto">
                                                                        {entry.employeeResults.map((emp) => (
                                                                            <Button
                                                                                key={emp.id}
                                                                                variant="ghost"
                                                                                className="justify-start h-auto py-2 text-left"
                                                                                onClick={() => handleBatchEmployeeSelect(entry.id, emp)}
                                                                            >
                                                                                <div>
                                                                                    <div className="font-medium text-sm">{emp.name}</div>
                                                                                    <div className="text-xs text-muted-foreground">NIP: {emp.nip}</div>
                                                                                </div>
                                                                            </Button>
                                                                        ))}
                                                                    </div>
                                                                )}

                                                                {entry.selectedEmployee && (
                                                                    <Badge variant="secondary" className="w-fit">
                                                                        {entry.selectedEmployee.name}
                                                                    </Badge>
                                                                )}
                                                            </div>

                                                            {entry.selectedEmployee && (
                                                                <div className="space-y-2">
                                                                    <Label className="text-xs">Pilih Usulan</Label>
                                                                    {entry.isLoadingSubmissions ? (
                                                                        <div className="text-sm text-muted-foreground">Memuat...</div>
                                                                    ) : entry.submissionResults.length > 0 ? (
                                                                        <div className="grid grid-cols-1 gap-1 max-h-32 overflow-y-auto">
                                                                            {entry.submissionResults.map((sub) => (
                                                                                <Button
                                                                                    key={sub.id}
                                                                                    variant="ghost"
                                                                                    className="justify-start h-auto py-2 text-left"
                                                                                    onClick={() => handleBatchSubmissionSelect(entry.id, sub)}
                                                                                >
                                                                                    <div className="text-sm">
                                                                                        {formatSubmissionLabel(sub, category as string)}
                                                                                    </div>
                                                                                </Button>
                                                                            ))}
                                                                        </div>
                                                                    ) : (
                                                                        <div className="text-sm text-muted-foreground">Tidak ada usulan disetujui</div>
                                                                    )}

                                                                    {entry.selectedSubmission && (
                                                                        <Badge variant="outline" className="w-fit">
                                                                            {formatSubmissionLabel(entry.selectedSubmission, category as string)}
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </CardContent>
                                                    </Card>
                                                ))}

                                                <Button variant="outline" onClick={addBatchEntry} className="w-full">
                                                    <Plus className="h-4 w-4 mr-2" />
                                                    Tambah Pegawai
                                                </Button>

                                                <Button
                                                    onClick={handleGenerateBatch}
                                                    className="w-full"
                                                    disabled={!batchEntries.some(e => e.selectedEmployee && e.selectedSubmission)}
                                                >
                                                    Buat Surat Batch ({batchEntries.filter(e => e.selectedEmployee && e.selectedSubmission).length} surat)
                                                </Button>
                                            </div>
                                        </TabsContent>
                                    </Tabs>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Data Usulan Tab */}
                    <TabsContent value="data-usulan" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <ClipboardList className="h-5 w-5" />
                                    Data Usulan yang Disetujui
                                </CardTitle>
                                <CardDescription>
                                    Daftar usulan layanan yang telah disetujui dan siap dibuatkan surat.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Filter Jenis Layanan</Label>
                                    <Select value={usulanCategory} onValueChange={setUsulanCategory}>
                                        <SelectTrigger className="w-full md:w-[250px]">
                                            <SelectValue placeholder="Pilih jenis layanan" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="cuti">Cuti</SelectItem>
                                            <SelectItem value="kenaikan_pangkat">Kenaikan Pangkat</SelectItem>
                                            <SelectItem value="pensiun">Pensiun</SelectItem>
                                            <SelectItem value="mutasi">Mutasi</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {isLoadingUsulan ? (
                                    <div className="text-center py-8">
                                        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                                        <p className="text-sm text-muted-foreground mt-2">Memuat data...</p>
                                    </div>
                                ) : usulanList.length === 0 ? (
                                    <div className="text-center py-8 border rounded-lg bg-muted/20">
                                        <ClipboardList className="h-12 w-12 mx-auto text-muted-foreground/50 mb-2" />
                                        <p className="text-muted-foreground">
                                            Belum ada usulan {getServiceTypeLabel(usulanCategory)} yang disetujui.
                                        </p>
                                    </div>
                                ) : (
                                    <ScrollArea className="h-[400px]">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>No</TableHead>
                                                    <TableHead>Nama Pegawai</TableHead>
                                                    <TableHead>NIP</TableHead>
                                                    <TableHead>Detail Usulan</TableHead>
                                                    <TableHead>Tanggal Disetujui</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {usulanList.map((usulan, index) => (
                                                    <TableRow key={usulan.id}>
                                                        <TableCell>{index + 1}</TableCell>
                                                        <TableCell className="font-medium">{usulan.profiles?.name || '-'}</TableCell>
                                                        <TableCell>{usulan.profiles?.nip || '-'}</TableCell>
                                                        <TableCell>
                                                            <Badge variant="outline">
                                                                {formatSubmissionLabel(usulan, usulanCategory)}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell>
                                                            {format(new Date(usulan.created_at), 'dd MMM yyyy', { locale: localeId })}
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </ScrollArea>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Data Pegawai Tab */}
                    <TabsContent value="data-pegawai" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Database className="h-5 w-5" />
                                    Data Pegawai
                                </CardTitle>
                                <CardDescription>
                                    Daftar data profil pegawai yang dapat digunakan untuk mengisi variabel template surat.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Cari Pegawai</Label>
                                    <div className="relative w-full md:w-[300px]">
                                        <User className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            className="pl-9"
                                            placeholder="Ketik nama atau NIP..."
                                            value={pegawaiSearch}
                                            onChange={(e) => setPegawaiSearch(e.target.value)}
                                        />
                                    </div>
                                </div>

                                {isLoadingPegawai ? (
                                    <div className="text-center py-8">
                                        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                                        <p className="text-sm text-muted-foreground mt-2">Memuat data...</p>
                                    </div>
                                ) : pegawaiList.length === 0 ? (
                                    <div className="text-center py-8 border rounded-lg bg-muted/20">
                                        <User className="h-12 w-12 mx-auto text-muted-foreground/50 mb-2" />
                                        <p className="text-muted-foreground">
                                            {pegawaiSearch ? `Tidak ditemukan pegawai dengan kata kunci "${pegawaiSearch}"` : "Tidak ada data pegawai."}
                                        </p>
                                    </div>
                                ) : (
                                    <ScrollArea className="h-[400px]">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>No</TableHead>
                                                    <TableHead>Nama</TableHead>
                                                    <TableHead>NIP</TableHead>
                                                    <TableHead>Jabatan</TableHead>
                                                    <TableHead>Pangkat/Golongan</TableHead>
                                                    <TableHead>Unit Kerja</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {pegawaiList.map((pegawai, index) => (
                                                    <TableRow key={pegawai.id}>
                                                        <TableCell>{index + 1}</TableCell>
                                                        <TableCell className="font-medium">{pegawai.name}</TableCell>
                                                        <TableCell>{pegawai.nip || '-'}</TableCell>
                                                        <TableCell>{pegawai.jabatan || '-'}</TableCell>
                                                        <TableCell>{pegawai.pangkat_golongan || '-'}</TableCell>
                                                        <TableCell>{pegawai.work_units?.name || '-'}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </ScrollArea>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Template Management Tab */}
                    <TabsContent value="templates">
                        <TemplateManagement />
                    </TabsContent>
                </Tabs>
            </div>
        </DashboardLayout>
    );
}
