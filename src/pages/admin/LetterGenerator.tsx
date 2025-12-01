import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TemplateManagement from "./TemplateManagement";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { FileText, Settings, Download, User, File } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { LetterCategory, LetterTemplate } from "@/types/leave-certificate";
import { getTemplatesByWorkUnit } from "@/lib/templateStorage";
import { generateDocument } from "@/lib/docxEngine";
import { toast } from "sonner";

export default function LetterGenerator() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState("generator");
    const [category, setCategory] = useState<LetterCategory | "">("");
    const [templates, setTemplates] = useState<LetterTemplate[]>([]);
    const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
    const [employeeName, setEmployeeName] = useState("");
    const [employeeNip, setEmployeeNip] = useState("");

    useEffect(() => {
        if (user?.work_unit_id && category) {
            const loadedTemplates = getTemplatesByWorkUnit(user.work_unit_id, category as LetterCategory);
            setTemplates(loadedTemplates);
        } else {
            setTemplates([]);
        }
    }, [user, category]);

    const handleGenerate = () => {
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
            // Mock data for generation - in a real app this would come from a selected employee's profile
            const data = {
                nama_pegawai: employeeName || user?.name || "Pegawai",
                nip_pegawai: employeeNip || "123456789",
                jabatan_pegawai: "Staf",
                unit_kerja: "Unit Kerja Demo",
                tanggal_surat: new Date().toLocaleDateString("id-ID"),
                // Add more mock data as needed for the specific template variables
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

                                <div className="space-y-2">
                                    <Label>Data Pegawai</Label>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-xs text-muted-foreground">Nama Pegawai</Label>
                                            <div className="relative">
                                                <User className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                                <Input
                                                    className="pl-9"
                                                    placeholder="Nama Lengkap"
                                                    value={employeeName}
                                                    onChange={(e) => setEmployeeName(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs text-muted-foreground">NIP</Label>
                                            <div className="relative">
                                                <File className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                                <Input
                                                    className="pl-9"
                                                    placeholder="NIP Pegawai"
                                                    value={employeeNip}
                                                    onChange={(e) => setEmployeeNip(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button onClick={handleGenerate} disabled={!selectedTemplateId} className="ml-auto">
                                    <Download className="mr-2 h-4 w-4" />
                                    Generate Surat
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
