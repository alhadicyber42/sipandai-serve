import { useState, useEffect, useCallback, useMemo } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TemplateManagement from "./TemplateManagement";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Settings, User, Plus, Trash2, Users, ClipboardList, Database, Search } from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";

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

// Map profile data to template variables
function mapProfileToTemplateData(profile: ProfileData): Record<string, string> {
    return {
        nama_pegawai: profile.name || '',
        nip: profile.nip || '',
        jabatan: profile.jabatan || '',
        pangkat_golongan: profile.pangkat_golongan || '',
        pangkat: profile.pangkat_golongan || '',
        unit_kerja: profile.work_units?.name || '',
        email: profile.email || '',
        phone: profile.phone || '',
        tmt_pns: profile.tmt_pns ? format(new Date(profile.tmt_pns), 'dd MMMM yyyy', { locale: localeId }) : '',
        tmt_pensiun: profile.tmt_pensiun ? format(new Date(profile.tmt_pensiun), 'dd MMMM yyyy', { locale: localeId }) : '',
        tanggal_surat: format(new Date(), 'dd MMMM yyyy', { locale: localeId }),
        tahun: format(new Date(), 'yyyy'),
        bulan: format(new Date(), 'MMMM', { locale: localeId }),
    };
}

export default function LetterGenerator() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState("generator");

    // Generator Surat States
    const [dataSourceTab, setDataSourceTab] = useState<"data-usulan" | "data-pegawai">("data-usulan");
    const [generationMode, setGenerationMode] = useState<"individual" | "batch">("individual");

    // Template states
    const [category, setCategory] = useState<LetterCategory | "">("");
    const [templates, setTemplates] = useState<LetterTemplate[]>([]);
    const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");

    // ===== DATA USULAN STATES =====
    const [usulanServiceType, setUsulanServiceType] = useState<string>("cuti");
    const [usulanList, setUsulanList] = useState<ApprovedSubmission[]>([]);
    const [isLoadingUsulan, setIsLoadingUsulan] = useState(false);
    const [usulanSearch, setUsulanSearch] = useState("");

    // Individual mode - Data Usulan
    const [selectedUsulan, setSelectedUsulan] = useState<ApprovedSubmission | null>(null);

    // Batch mode - Data Usulan
    const [selectedUsulanBatch, setSelectedUsulanBatch] = useState<string[]>([]);

    // ===== DATA PEGAWAI STATES =====
    const [pegawaiList, setPegawaiList] = useState<ProfileData[]>([]);
    const [isLoadingPegawai, setIsLoadingPegawai] = useState(false);
    const [pegawaiSearch, setPegawaiSearch] = useState("");

    // Individual mode - Data Pegawai
    const [selectedPegawai, setSelectedPegawai] = useState<ProfileData | null>(null);

    // Batch mode - Data Pegawai
    const [selectedPegawaiBatch, setSelectedPegawaiBatch] = useState<string[]>([]);

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

    // Load Data Usulan
    useEffect(() => {
        const loadUsulan = async () => {
            if (dataSourceTab === "data-usulan" && usulanServiceType) {
                setIsLoadingUsulan(true);
                const data = await getApprovedSubmissions(usulanServiceType);
                setUsulanList(data);
                setIsLoadingUsulan(false);
            }
        };
        loadUsulan();
    }, [dataSourceTab, usulanServiceType]);

    // Load Data Pegawai
    useEffect(() => {
        const searchTimer = setTimeout(async () => {
            if (dataSourceTab === "data-pegawai") {
                setIsLoadingPegawai(true);
                let query = supabase
                    .from('profiles')
                    .select('id, name, nip, jabatan, pangkat_golongan, work_unit_id, email, phone, tmt_pns, tmt_pensiun, work_units(name)')
                    .eq('role', 'user_unit')
                    .order('name');

                if (pegawaiSearch.length >= 2) {
                    query = query.or(`name.ilike.%${pegawaiSearch}%,nip.ilike.%${pegawaiSearch}%`);
                }

                const { data, error } = await query.limit(100);
                if (!error && data) {
                    setPegawaiList(data as any[]);
                }
                setIsLoadingPegawai(false);
            }
        }, 300);
        return () => clearTimeout(searchTimer);
    }, [dataSourceTab, pegawaiSearch]);

    // Filtered usulan list
    const filteredUsulanList = useMemo(() => {
        if (!usulanSearch) return usulanList;
        const search = usulanSearch.toLowerCase();
        return usulanList.filter(u =>
            u.profiles?.name?.toLowerCase().includes(search) ||
            u.profiles?.nip?.toLowerCase().includes(search)
        );
    }, [usulanList, usulanSearch]);

    // Handle category change
    const handleCategoryChange = useCallback((val: string) => {
        setCategory(val as LetterCategory);
        setSelectedTemplateId("");
    }, []);

    // Handle data source tab change
    const handleDataSourceChange = useCallback((val: string) => {
        setDataSourceTab(val as "data-usulan" | "data-pegawai");
        // Reset selections
        setSelectedUsulan(null);
        setSelectedUsulanBatch([]);
        setSelectedPegawai(null);
        setSelectedPegawaiBatch([]);
    }, []);

    // Handle usulan service type change
    const handleUsulanServiceTypeChange = useCallback((val: string) => {
        setUsulanServiceType(val);
        setSelectedUsulan(null);
        setSelectedUsulanBatch([]);
    }, []);

    // Select usulan for individual mode
    const handleSelectUsulan = useCallback((usulan: ApprovedSubmission) => {
        setSelectedUsulan(usulan);
    }, []);

    // Toggle usulan for batch mode
    const handleToggleUsulanBatch = useCallback((id: string) => {
        setSelectedUsulanBatch(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    }, []);

    // Select all usulan for batch mode
    const handleSelectAllUsulan = useCallback(() => {
        if (selectedUsulanBatch.length === filteredUsulanList.length) {
            setSelectedUsulanBatch([]);
        } else {
            setSelectedUsulanBatch(filteredUsulanList.map(u => u.id));
        }
    }, [filteredUsulanList, selectedUsulanBatch.length]);

    // Select pegawai for individual mode
    const handleSelectPegawai = useCallback((pegawai: ProfileData) => {
        setSelectedPegawai(pegawai);
    }, []);

    // Toggle pegawai for batch mode
    const handleTogglePegawaiBatch = useCallback((id: string) => {
        setSelectedPegawaiBatch(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    }, []);

    // Select all pegawai for batch mode
    const handleSelectAllPegawai = useCallback(() => {
        if (selectedPegawaiBatch.length === pegawaiList.length) {
            setSelectedPegawaiBatch([]);
        } else {
            setSelectedPegawaiBatch(pegawaiList.map(p => p.id));
        }
    }, [pegawaiList, selectedPegawaiBatch.length]);

    // Generate Individual Letter - Data Usulan
    const handleGenerateUsulanIndividual = useCallback(() => {
        if (!selectedTemplateId) {
            toast.error("Pilih template terlebih dahulu");
            return;
        }
        if (!selectedUsulan) {
            toast.error("Pilih usulan terlebih dahulu");
            return;
        }

        const template = templates.find(t => t.id === selectedTemplateId);
        if (!template || !template.file_content) {
            toast.error("Template tidak valid atau tidak memiliki file");
            return;
        }

        try {
            const data = mapSubmissionToTemplateData(selectedUsulan, usulanServiceType);
            const employeeName = selectedUsulan.profiles?.name || 'Unknown';
            generateDocument(
                template.file_content,
                data,
                `Surat_${usulanServiceType}_${employeeName}.docx`
            );
            toast.success("Surat berhasil dibuat");
        } catch (error) {
            console.error(error);
            toast.error("Gagal membuat surat");
        }
    }, [selectedTemplateId, selectedUsulan, templates, usulanServiceType]);

    // Generate Batch Letters - Data Usulan
    const handleGenerateUsulanBatch = useCallback(async () => {
        if (!selectedTemplateId) {
            toast.error("Pilih template terlebih dahulu");
            return;
        }
        if (selectedUsulanBatch.length === 0) {
            toast.error("Pilih minimal 1 usulan");
            return;
        }

        const template = templates.find(t => t.id === selectedTemplateId);
        if (!template || !template.file_content) {
            toast.error("Template tidak valid atau tidak memiliki file");
            return;
        }

        try {
            const zip = new JSZip();
            const selectedItems = usulanList.filter(u => selectedUsulanBatch.includes(u.id));

            for (const item of selectedItems) {
                const data = mapSubmissionToTemplateData(item, usulanServiceType);
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

                const employeeName = item.profiles?.name || 'Unknown';
                const sanitizedName = employeeName.replace(/[^a-z0-9]/gi, '_');
                zip.file(`Surat_${usulanServiceType}_${sanitizedName}.docx`, blob);
            }

            const zipBlob = await zip.generateAsync({ type: "blob" });
            saveAs(zipBlob, `Batch_Surat_${usulanServiceType}_${new Date().getTime()}.zip`);

            toast.success(`Berhasil membuat ${selectedItems.length} surat`);
        } catch (error) {
            console.error(error);
            toast.error("Gagal membuat surat batch");
        }
    }, [selectedTemplateId, selectedUsulanBatch, usulanList, templates, usulanServiceType]);

    // Generate Individual Letter - Data Pegawai
    const handleGeneratePegawaiIndividual = useCallback(() => {
        if (!selectedTemplateId) {
            toast.error("Pilih template terlebih dahulu");
            return;
        }
        if (!selectedPegawai) {
            toast.error("Pilih pegawai terlebih dahulu");
            return;
        }

        const template = templates.find(t => t.id === selectedTemplateId);
        if (!template || !template.file_content) {
            toast.error("Template tidak valid atau tidak memiliki file");
            return;
        }

        try {
            const data = mapProfileToTemplateData(selectedPegawai);
            generateDocument(
                template.file_content,
                data,
                `Surat_${category}_${selectedPegawai.name}.docx`
            );
            toast.success("Surat berhasil dibuat");
        } catch (error) {
            console.error(error);
            toast.error("Gagal membuat surat");
        }
    }, [selectedTemplateId, selectedPegawai, templates, category]);

    // Generate Batch Letters - Data Pegawai
    const handleGeneratePegawaiBatch = useCallback(async () => {
        if (!selectedTemplateId) {
            toast.error("Pilih template terlebih dahulu");
            return;
        }
        if (selectedPegawaiBatch.length === 0) {
            toast.error("Pilih minimal 1 pegawai");
            return;
        }

        const template = templates.find(t => t.id === selectedTemplateId);
        if (!template || !template.file_content) {
            toast.error("Template tidak valid atau tidak memiliki file");
            return;
        }

        try {
            const zip = new JSZip();
            const selectedItems = pegawaiList.filter(p => selectedPegawaiBatch.includes(p.id));

            for (const item of selectedItems) {
                const data = mapProfileToTemplateData(item);
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

                const sanitizedName = item.name.replace(/[^a-z0-9]/gi, '_');
                zip.file(`Surat_${category}_${sanitizedName}.docx`, blob);
            }

            const zipBlob = await zip.generateAsync({ type: "blob" });
            saveAs(zipBlob, `Batch_Surat_${category}_${new Date().getTime()}.zip`);

            toast.success(`Berhasil membuat ${selectedItems.length} surat`);
        } catch (error) {
            console.error(error);
            toast.error("Gagal membuat surat batch");
        }
    }, [selectedTemplateId, selectedPegawaiBatch, pegawaiList, templates, category]);

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
                                    Pilih sumber data dan template untuk membuat surat secara otomatis
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Template Selection */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg border">
                                    <div className="space-y-2">
                                        <Label>Kategori Surat</Label>
                                        <Select value={category} onValueChange={handleCategoryChange}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Pilih kategori surat" />
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
                                                <SelectValue placeholder={category ? "Pilih template" : "Pilih kategori terlebih dahulu"} />
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

                                {/* Data Source Tabs */}
                                <div className="space-y-4">
                                    <Label className="text-base font-semibold">Sumber Data</Label>
                                    <Tabs value={dataSourceTab} onValueChange={handleDataSourceChange}>
                                        <TabsList className="grid w-full grid-cols-2">
                                            <TabsTrigger value="data-usulan" className="flex items-center gap-2">
                                                <ClipboardList className="h-4 w-4" />
                                                Data Usulan
                                            </TabsTrigger>
                                            <TabsTrigger value="data-pegawai" className="flex items-center gap-2">
                                                <Database className="h-4 w-4" />
                                                Data Pegawai
                                            </TabsTrigger>
                                        </TabsList>

                                        {/* Data Usulan Content */}
                                        <TabsContent value="data-usulan" className="space-y-4 mt-4">
                                            <p className="text-sm text-muted-foreground">
                                                Generate surat dari data usulan yang sudah disetujui. Data variabel akan otomatis terisi dari data usulan.
                                            </p>

                                            {/* Service Type Filter */}
                                            <div className="flex flex-wrap gap-4 items-end">
                                                <div className="space-y-2 flex-1 min-w-[200px]">
                                                    <Label>Jenis Layanan</Label>
                                                    <Select value={usulanServiceType} onValueChange={handleUsulanServiceTypeChange}>
                                                        <SelectTrigger>
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="cuti">Cuti</SelectItem>
                                                            <SelectItem value="kenaikan_pangkat">Kenaikan Pangkat</SelectItem>
                                                            <SelectItem value="pensiun">Pensiun</SelectItem>
                                                            <SelectItem value="mutasi">Mutasi</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="space-y-2 flex-1 min-w-[200px]">
                                                    <Label>Cari Pegawai</Label>
                                                    <div className="relative">
                                                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                                        <Input
                                                            className="pl-9"
                                                            placeholder="Cari nama atau NIP..."
                                                            value={usulanSearch}
                                                            onChange={(e) => setUsulanSearch(e.target.value)}
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Mode Selection for Data Usulan */}
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

                                                {/* Individual Mode - Data Usulan */}
                                                <TabsContent value="individual" className="space-y-4 mt-4">
                                                    {isLoadingUsulan ? (
                                                        <div className="text-center py-8">
                                                            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                                                            <p className="text-sm text-muted-foreground mt-2">Memuat data usulan...</p>
                                                        </div>
                                                    ) : filteredUsulanList.length === 0 ? (
                                                        <div className="text-center py-8 border rounded-lg bg-muted/20">
                                                            <ClipboardList className="h-12 w-12 mx-auto text-muted-foreground/50" />
                                                            <p className="text-muted-foreground mt-2">
                                                                Tidak ada usulan {getServiceTypeLabel(usulanServiceType)} yang disetujui
                                                            </p>
                                                        </div>
                                                    ) : (
                                                        <ScrollArea className="h-[300px] border rounded-lg">
                                                            <div className="p-2 space-y-2">
                                                                {filteredUsulanList.map((usulan) => (
                                                                    <Card
                                                                        key={usulan.id}
                                                                        className={`cursor-pointer transition-colors ${selectedUsulan?.id === usulan.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'}`}
                                                                        onClick={() => handleSelectUsulan(usulan)}
                                                                    >
                                                                        <CardContent className="p-3">
                                                                            <div className="flex justify-between items-start">
                                                                                <div>
                                                                                    <div className="font-semibold">{usulan.profiles?.name}</div>
                                                                                    <div className="text-sm text-muted-foreground">NIP: {usulan.profiles?.nip}</div>
                                                                                    <div className="text-sm text-primary mt-1">
                                                                                        {formatSubmissionLabel(usulan, usulanServiceType)}
                                                                                    </div>
                                                                                </div>
                                                                                {selectedUsulan?.id === usulan.id && (
                                                                                    <Badge variant="default">Terpilih</Badge>
                                                                                )}
                                                                            </div>
                                                                        </CardContent>
                                                                    </Card>
                                                                ))}
                                                            </div>
                                                        </ScrollArea>
                                                    )}

                                                    {selectedUsulan && (
                                                        <Button onClick={handleGenerateUsulanIndividual} className="w-full" disabled={!selectedTemplateId}>
                                                            <FileText className="h-4 w-4 mr-2" />
                                                            Buat Surat untuk {selectedUsulan.profiles?.name}
                                                        </Button>
                                                    )}
                                                </TabsContent>

                                                {/* Batch Mode - Data Usulan */}
                                                <TabsContent value="batch" className="space-y-4 mt-4">
                                                    {isLoadingUsulan ? (
                                                        <div className="text-center py-8">
                                                            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                                                            <p className="text-sm text-muted-foreground mt-2">Memuat data usulan...</p>
                                                        </div>
                                                    ) : filteredUsulanList.length === 0 ? (
                                                        <div className="text-center py-8 border rounded-lg bg-muted/20">
                                                            <ClipboardList className="h-12 w-12 mx-auto text-muted-foreground/50" />
                                                            <p className="text-muted-foreground mt-2">
                                                                Tidak ada usulan {getServiceTypeLabel(usulanServiceType)} yang disetujui
                                                            </p>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-center gap-2">
                                                                    <Checkbox
                                                                        checked={selectedUsulanBatch.length === filteredUsulanList.length && filteredUsulanList.length > 0}
                                                                        onCheckedChange={handleSelectAllUsulan}
                                                                    />
                                                                    <span className="text-sm">Pilih Semua</span>
                                                                </div>
                                                                <Badge variant="secondary">
                                                                    {selectedUsulanBatch.length} dipilih
                                                                </Badge>
                                                            </div>
                                                            <ScrollArea className="h-[300px] border rounded-lg">
                                                                <Table>
                                                                    <TableHeader>
                                                                        <TableRow>
                                                                            <TableHead className="w-12"></TableHead>
                                                                            <TableHead>Nama</TableHead>
                                                                            <TableHead>NIP</TableHead>
                                                                            <TableHead>Detail</TableHead>
                                                                        </TableRow>
                                                                    </TableHeader>
                                                                    <TableBody>
                                                                        {filteredUsulanList.map((usulan) => (
                                                                            <TableRow key={usulan.id} className="cursor-pointer" onClick={() => handleToggleUsulanBatch(usulan.id)}>
                                                                                <TableCell>
                                                                                    <Checkbox
                                                                                        checked={selectedUsulanBatch.includes(usulan.id)}
                                                                                        onCheckedChange={() => handleToggleUsulanBatch(usulan.id)}
                                                                                    />
                                                                                </TableCell>
                                                                                <TableCell className="font-medium">{usulan.profiles?.name}</TableCell>
                                                                                <TableCell>{usulan.profiles?.nip}</TableCell>
                                                                                <TableCell className="text-primary">
                                                                                    {formatSubmissionLabel(usulan, usulanServiceType)}
                                                                                </TableCell>
                                                                            </TableRow>
                                                                        ))}
                                                                    </TableBody>
                                                                </Table>
                                                            </ScrollArea>
                                                        </>
                                                    )}

                                                    {selectedUsulanBatch.length > 0 && (
                                                        <Button onClick={handleGenerateUsulanBatch} className="w-full" disabled={!selectedTemplateId}>
                                                            <FileText className="h-4 w-4 mr-2" />
                                                            Buat {selectedUsulanBatch.length} Surat (ZIP)
                                                        </Button>
                                                    )}
                                                </TabsContent>
                                            </Tabs>
                                        </TabsContent>

                                        {/* Data Pegawai Content */}
                                        <TabsContent value="data-pegawai" className="space-y-4 mt-4">
                                            <p className="text-sm text-muted-foreground">
                                                Generate surat custom menggunakan data pegawai. Data variabel akan terisi dari profil pegawai.
                                            </p>

                                            {/* Search Filter */}
                                            <div className="space-y-2">
                                                <Label>Cari Pegawai</Label>
                                                <div className="relative">
                                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                                    <Input
                                                        className="pl-9"
                                                        placeholder="Cari nama atau NIP..."
                                                        value={pegawaiSearch}
                                                        onChange={(e) => setPegawaiSearch(e.target.value)}
                                                    />
                                                </div>
                                            </div>

                                            {/* Mode Selection for Data Pegawai */}
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

                                                {/* Individual Mode - Data Pegawai */}
                                                <TabsContent value="individual" className="space-y-4 mt-4">
                                                    {isLoadingPegawai ? (
                                                        <div className="text-center py-8">
                                                            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                                                            <p className="text-sm text-muted-foreground mt-2">Memuat data pegawai...</p>
                                                        </div>
                                                    ) : pegawaiList.length === 0 ? (
                                                        <div className="text-center py-8 border rounded-lg bg-muted/20">
                                                            <Database className="h-12 w-12 mx-auto text-muted-foreground/50" />
                                                            <p className="text-muted-foreground mt-2">
                                                                Tidak ada data pegawai ditemukan
                                                            </p>
                                                        </div>
                                                    ) : (
                                                        <ScrollArea className="h-[300px] border rounded-lg">
                                                            <div className="p-2 space-y-2">
                                                                {pegawaiList.map((pegawai) => (
                                                                    <Card
                                                                        key={pegawai.id}
                                                                        className={`cursor-pointer transition-colors ${selectedPegawai?.id === pegawai.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'}`}
                                                                        onClick={() => handleSelectPegawai(pegawai)}
                                                                    >
                                                                        <CardContent className="p-3">
                                                                            <div className="flex justify-between items-start">
                                                                                <div>
                                                                                    <div className="font-semibold">{pegawai.name}</div>
                                                                                    <div className="text-sm text-muted-foreground">NIP: {pegawai.nip}</div>
                                                                                    <div className="text-xs text-muted-foreground mt-1">
                                                                                        {pegawai.jabatan || '-'} • {pegawai.work_units?.name || '-'}
                                                                                    </div>
                                                                                </div>
                                                                                {selectedPegawai?.id === pegawai.id && (
                                                                                    <Badge variant="default">Terpilih</Badge>
                                                                                )}
                                                                            </div>
                                                                        </CardContent>
                                                                    </Card>
                                                                ))}
                                                            </div>
                                                        </ScrollArea>
                                                    )}

                                                    {selectedPegawai && (
                                                        <Button onClick={handleGeneratePegawaiIndividual} className="w-full" disabled={!selectedTemplateId}>
                                                            <FileText className="h-4 w-4 mr-2" />
                                                            Buat Surat untuk {selectedPegawai.name}
                                                        </Button>
                                                    )}
                                                </TabsContent>

                                                {/* Batch Mode - Data Pegawai */}
                                                <TabsContent value="batch" className="space-y-4 mt-4">
                                                    {isLoadingPegawai ? (
                                                        <div className="text-center py-8">
                                                            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                                                            <p className="text-sm text-muted-foreground mt-2">Memuat data pegawai...</p>
                                                        </div>
                                                    ) : pegawaiList.length === 0 ? (
                                                        <div className="text-center py-8 border rounded-lg bg-muted/20">
                                                            <Database className="h-12 w-12 mx-auto text-muted-foreground/50" />
                                                            <p className="text-muted-foreground mt-2">
                                                                Tidak ada data pegawai ditemukan
                                                            </p>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-center gap-2">
                                                                    <Checkbox
                                                                        checked={selectedPegawaiBatch.length === pegawaiList.length && pegawaiList.length > 0}
                                                                        onCheckedChange={handleSelectAllPegawai}
                                                                    />
                                                                    <span className="text-sm">Pilih Semua</span>
                                                                </div>
                                                                <Badge variant="secondary">
                                                                    {selectedPegawaiBatch.length} dipilih
                                                                </Badge>
                                                            </div>
                                                            <ScrollArea className="h-[300px] border rounded-lg">
                                                                <Table>
                                                                    <TableHeader>
                                                                        <TableRow>
                                                                            <TableHead className="w-12"></TableHead>
                                                                            <TableHead>Nama</TableHead>
                                                                            <TableHead>NIP</TableHead>
                                                                            <TableHead>Jabatan</TableHead>
                                                                            <TableHead>Unit Kerja</TableHead>
                                                                        </TableRow>
                                                                    </TableHeader>
                                                                    <TableBody>
                                                                        {pegawaiList.map((pegawai) => (
                                                                            <TableRow key={pegawai.id} className="cursor-pointer" onClick={() => handleTogglePegawaiBatch(pegawai.id)}>
                                                                                <TableCell>
                                                                                    <Checkbox
                                                                                        checked={selectedPegawaiBatch.includes(pegawai.id)}
                                                                                        onCheckedChange={() => handleTogglePegawaiBatch(pegawai.id)}
                                                                                    />
                                                                                </TableCell>
                                                                                <TableCell className="font-medium">{pegawai.name}</TableCell>
                                                                                <TableCell>{pegawai.nip}</TableCell>
                                                                                <TableCell>{pegawai.jabatan || '-'}</TableCell>
                                                                                <TableCell>{pegawai.work_units?.name || '-'}</TableCell>
                                                                            </TableRow>
                                                                        ))}
                                                                    </TableBody>
                                                                </Table>
                                                            </ScrollArea>
                                                        </>
                                                    )}

                                                    {selectedPegawaiBatch.length > 0 && (
                                                        <Button onClick={handleGeneratePegawaiBatch} className="w-full" disabled={!selectedTemplateId}>
                                                            <FileText className="h-4 w-4 mr-2" />
                                                            Buat {selectedPegawaiBatch.length} Surat (ZIP)
                                                        </Button>
                                                    )}
                                                </TabsContent>
                                            </Tabs>
                                        </TabsContent>
                                    </Tabs>
                                </div>
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
