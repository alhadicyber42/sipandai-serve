import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, CalendarX, Edit, Trash2, AlertCircle, Link as LinkIcon, Check, X } from "lucide-react";
import { z } from "zod";
import { getYear } from "date-fns";

interface LeaveDeferral {
    id: string;
    user_id: string;
    deferral_year: number;
    days_deferred: number;
    approval_document: string;
    status: "active" | "used" | "expired" | "pending" | "rejected";
    created_at: string;
    created_by: string;
    profiles?: {
        name: string;
        nip: string;
    };
}

interface Employee {
    id: string;
    name: string;
    nip: string;
}

export default function LeaveDeferralManagement() {
    const { user } = useAuth();
    const [deferrals, setDeferrals] = useState<LeaveDeferral[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editingDeferral, setEditingDeferral] = useState<LeaveDeferral | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form state
    const [selectedUserId, setSelectedUserId] = useState("");
    const [deferralYear, setDeferralYear] = useState("");
    const [daysDeferred, setDaysDeferred] = useState("");
    const [approvalDocument, setApprovalDocument] = useState("");

    useEffect(() => {
        loadDeferrals();
        loadEmployees();
    }, []);

    const loadDeferrals = async () => {
        setIsLoading(true);
        const { data, error } = await supabase
            .from("leave_deferrals")
            .select(`
        *,
        profiles:user_id (
          name,
          nip
        )
      `)
            .order("created_at", { ascending: false });

        if (error) {
            toast.error("Gagal memuat data penangguhan cuti");
            console.error(error);
        } else {
            setDeferrals(data as any);
        }
        setIsLoading(false);
    };

    const loadEmployees = async () => {
        const { data, error } = await supabase
            .from("profiles")
            .select("id, name, nip")
            .eq("role", "user_unit")
            .order("name");

        if (error) {
            toast.error("Gagal memuat data pegawai");
            console.error(error);
        } else {
            setEmployees(data as Employee[]);
        }
    };

    const resetForm = () => {
        setSelectedUserId("");
        setDeferralYear("");
        setDaysDeferred("");
        setApprovalDocument("");
        setIsEditMode(false);
        setEditingDeferral(null);
    };

    const handleOpenDialog = (deferral?: LeaveDeferral) => {
        if (deferral) {
            setIsEditMode(true);
            setEditingDeferral(deferral);
            setSelectedUserId(deferral.user_id);
            setDeferralYear(deferral.deferral_year.toString());
            setDaysDeferred(deferral.days_deferred.toString());
            setApprovalDocument(deferral.approval_document);
        } else {
            resetForm();
        }
        setIsDialogOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (!selectedUserId || !deferralYear || !daysDeferred || !approvalDocument) {
            toast.error("Semua field harus diisi");
            return;
        }

        const yearNum = parseInt(deferralYear);
        const daysNum = parseInt(daysDeferred);
        const currentYear = getYear(new Date());

        if (yearNum > currentYear) {
            toast.error("Tahun penangguhan tidak boleh di masa depan");
            return;
        }

        if (yearNum < 2000) {
            toast.error("Tahun penangguhan tidak valid");
            return;
        }

        if (daysNum <= 0) {
            toast.error("Jumlah hari harus lebih dari 0");
            return;
        }

        if (daysNum > 12) {
            toast.error("Jumlah hari penangguhan tidak boleh lebih dari 12 hari");
            return;
        }

        // Validate URL
        const urlSchema = z.string().url({ message: "Link tidak valid" });
        const validation = urlSchema.safeParse(approvalDocument.trim());

        if (!validation.success) {
            toast.error("Link dokumen tidak valid. Pastikan menggunakan format yang benar (https://...)");
            return;
        }

        setIsSubmitting(true);

        try {
            if (isEditMode && editingDeferral) {
                // Update existing deferral
                const { error } = await supabase
                    .from("leave_deferrals")
                    .update({
                        deferral_year: yearNum,
                        days_deferred: daysNum,
                        approval_document: approvalDocument.trim(),
                    })
                    .eq("id", editingDeferral.id);

                if (error) throw error;
                toast.success("Data penangguhan cuti berhasil diperbarui");
            } else {
                // Insert new deferral
                const { error } = await supabase
                    .from("leave_deferrals")
                    .insert({
                        user_id: selectedUserId,
                        deferral_year: yearNum,
                        days_deferred: daysNum,
                        approval_document: approvalDocument.trim(),
                        created_by: user!.id,
                        status: "active",
                    });

                if (error) {
                    if (error.code === "23505") {
                        toast.error("Penangguhan untuk pegawai dan tahun ini sudah ada");
                    } else {
                        throw error;
                    }
                    setIsSubmitting(false);
                    return;
                }
                toast.success("Data penangguhan cuti berhasil ditambahkan");
            }

            setIsDialogOpen(false);
            resetForm();
            loadDeferrals();
        } catch (error) {
            console.error(error);
            toast.error("Gagal menyimpan data penangguhan cuti");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Apakah Anda yakin ingin menghapus data ini?")) return;

        try {
            const { error } = await supabase
                .from("leave_deferrals")
                .delete()
                .eq("id", id);

            if (error) throw error;

            toast.success("Data berhasil dihapus");
            loadDeferrals();
        } catch (error) {
            console.error("Error deleting deferral:", error);
            toast.error("Gagal menghapus data");
        }
    };

    const handleApprove = async (id: string) => {
        try {
            const { error } = await supabase
                .from("leave_deferrals")
                .update({ status: "active" })
                .eq("id", id);

            if (error) throw error;

            toast.success("Pengajuan disetujui");
            loadDeferrals();
        } catch (error) {
            console.error("Error approving deferral:", error);
            toast.error("Gagal menyetujui pengajuan");
        }
    };

    const handleReject = async (id: string) => {
        if (!confirm("Apakah Anda yakin ingin menolak pengajuan ini?")) return;

        try {
            const { error } = await supabase
                .from("leave_deferrals")
                .update({ status: "rejected" })
                .eq("id", id);

            if (error) throw error;

            toast.success("Pengajuan ditolak");
            loadDeferrals();
        } catch (error) {
            console.error("Error rejecting deferral:", error);
            toast.error("Gagal menolak pengajuan");
        }
    };

    const handleStatusChange = async (id: string, newStatus: "active" | "used" | "expired") => {
        const { error } = await supabase
            .from("leave_deferrals")
            .update({ status: newStatus })
            .eq("id", id);

        if (error) {
            toast.error("Gagal mengubah status");
            console.error(error);
        } else {
            toast.success("Status berhasil diubah");
            loadDeferrals();
        }
    };

    const pendingDeferrals = deferrals.filter(d => d.status === "pending");
    const activeDeferrals = deferrals.filter(d => d.status !== "pending");

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-600 via-purple-500 to-indigo-400 p-6 md:p-8 text-white shadow-xl">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -ml-24 -mb-24"></div>

                    <div className="relative z-10">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 md:p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                                        <CalendarX className="h-6 w-6 md:h-8 md:w-8 text-white" />
                                    </div>
                                    <div>
                                        <h1 className="text-2xl md:text-4xl font-bold text-white">Penangguhan Cuti</h1>
                                        <p className="text-sm md:text-base text-white/90 mt-1">
                                            Kelola saldo penangguhan cuti pegawai
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button
                                        size="lg"
                                        className="gap-2 bg-white text-purple-600 hover:bg-white/90 shadow-lg border-none"
                                        onClick={() => handleOpenDialog()}
                                    >
                                        <Plus className="h-5 w-5" />
                                        <span className="hidden sm:inline">Tambah Penangguhan</span>
                                        <span className="sm:hidden">Tambah</span>
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="w-[95vw] sm:max-w-md">
                                    <DialogHeader>
                                        <DialogTitle>
                                            {isEditMode ? "Edit Penangguhan Cuti" : "Tambah Penangguhan Cuti"}
                                        </DialogTitle>
                                    </DialogHeader>
                                    <form onSubmit={handleSubmit} className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="employee">Pegawai</Label>
                                            <Select
                                                value={selectedUserId}
                                                onValueChange={setSelectedUserId}
                                                disabled={isEditMode}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Pilih pegawai" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {employees.map((emp) => (
                                                        <SelectItem key={emp.id} value={emp.id}>
                                                            {emp.name} - {emp.nip}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            {isEditMode && (
                                                <p className="text-xs text-muted-foreground">
                                                    Pegawai tidak dapat diubah saat edit
                                                </p>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="year">Tahun Penangguhan</Label>
                                            <Input
                                                id="year"
                                                type="number"
                                                placeholder="2024"
                                                value={deferralYear}
                                                onChange={(e) => setDeferralYear(e.target.value)}
                                                min="2000"
                                                max={getYear(new Date())}
                                                required
                                            />
                                            <p className="text-xs text-muted-foreground">
                                                Tahun asal cuti yang ditangguhkan
                                            </p>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="days">Jumlah Hari</Label>
                                            <Input
                                                id="days"
                                                type="number"
                                                placeholder="5"
                                                value={daysDeferred}
                                                onChange={(e) => setDaysDeferred(e.target.value)}
                                                min="1"
                                                max="12"
                                                required
                                            />
                                            <p className="text-xs text-muted-foreground">
                                                Maksimal 12 hari
                                            </p>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="document">Link Dokumen Persetujuan</Label>
                                            <Input
                                                id="document"
                                                type="url"
                                                placeholder="https://drive.google.com/..."
                                                value={approvalDocument}
                                                onChange={(e) => setApprovalDocument(e.target.value)}
                                                required
                                            />
                                            <p className="text-xs text-muted-foreground">
                                                Link ke dokumen persetujuan penangguhan cuti
                                            </p>
                                        </div>

                                        <div className="flex gap-2 justify-end pt-4">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => {
                                                    setIsDialogOpen(false);
                                                    resetForm();
                                                }}
                                            >
                                                Batal
                                            </Button>
                                            <Button type="submit" disabled={isSubmitting}>
                                                {isSubmitting ? "Menyimpan..." : isEditMode ? "Update" : "Simpan"}
                                            </Button>
                                        </div>
                                    </form>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </div>
                </div>

                <Tabs defaultValue="list" className="w-full">
                    <TabsList>
                        <TabsTrigger value="list">Daftar Penangguhan</TabsTrigger>
                        <TabsTrigger value="approvals" className="relative">
                            Perlu Persetujuan
                            {pendingDeferrals.length > 0 && (
                                <span className="ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
                                    {pendingDeferrals.length}
                                </span>
                            )}
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="list" className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-3">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">
                                        Total Penangguhan
                                    </CardTitle>
                                    <CalendarX className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{activeDeferrals.length}</div>
                                    <p className="text-xs text-muted-foreground">
                                        Total data tersimpan
                                    </p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">
                                        Status Aktif
                                    </CardTitle>
                                    <AlertCircle className="h-4 w-4 text-green-600" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">
                                        {activeDeferrals.filter(d => d.status === "active").length}
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Penangguhan aktif
                                    </p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">
                                        Total Hari
                                    </CardTitle>
                                    <CalendarX className="h-4 w-4 text-blue-600" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">
                                        {activeDeferrals.filter(d => d.status === "active").reduce((sum, d) => sum + d.days_deferred, 0)}
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Total hari ditangguhkan
                                    </p>
                                </CardContent>
                            </Card>
                        </div>

                        <Card>
                            <CardHeader>
                                <CardTitle>Daftar Penangguhan Cuti</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Pegawai</TableHead>
                                            <TableHead>NIP</TableHead>
                                            <TableHead>Tahun</TableHead>
                                            <TableHead>Jumlah Hari</TableHead>
                                            <TableHead>Dokumen</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Aksi</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {activeDeferrals.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                                    Belum ada data penangguhan cuti
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            activeDeferrals.map((deferral) => (
                                                <TableRow key={deferral.id}>
                                                    <TableCell className="font-medium">{deferral.profiles?.name || "-"}</TableCell>
                                                    <TableCell>{deferral.profiles?.nip || "-"}</TableCell>
                                                    <TableCell>{deferral.deferral_year}</TableCell>
                                                    <TableCell>{deferral.days_deferred} Hari</TableCell>
                                                    <TableCell>
                                                        <a
                                                            href={deferral.approval_document}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="flex items-center text-blue-600 hover:underline"
                                                        >
                                                            <LinkIcon className="h-3 w-3 mr-1" />
                                                            Lihat Dokumen
                                                        </a>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Select
                                                            defaultValue={deferral.status}
                                                            onValueChange={(value) => handleStatusChange(deferral.id, value as any)}
                                                        >
                                                            <SelectTrigger className="w-[130px] h-8">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="active">Aktif</SelectItem>
                                                                <SelectItem value="used">Terpakai</SelectItem>
                                                                <SelectItem value="expired">Kadaluarsa</SelectItem>
                                                                <SelectItem value="rejected">Ditolak</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8"
                                                                onClick={() => handleOpenDialog(deferral)}
                                                            >
                                                                <Edit className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-red-500 hover:text-red-600"
                                                                onClick={() => handleDelete(deferral.id)}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="approvals">
                        <Card>
                            <CardHeader>
                                <CardTitle>Menunggu Persetujuan</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Pegawai</TableHead>
                                            <TableHead>NIP</TableHead>
                                            <TableHead>Tahun</TableHead>
                                            <TableHead>Jumlah Hari</TableHead>
                                            <TableHead>Dokumen</TableHead>
                                            <TableHead>Tanggal Pengajuan</TableHead>
                                            <TableHead>Aksi</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {pendingDeferrals.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                                    Tidak ada pengajuan yang menunggu persetujuan
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            pendingDeferrals.map((deferral) => (
                                                <TableRow key={deferral.id}>
                                                    <TableCell className="font-medium">{deferral.profiles?.name || "-"}</TableCell>
                                                    <TableCell>{deferral.profiles?.nip || "-"}</TableCell>
                                                    <TableCell>{deferral.deferral_year}</TableCell>
                                                    <TableCell>{deferral.days_deferred} Hari</TableCell>
                                                    <TableCell>
                                                        <a
                                                            href={deferral.approval_document}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="flex items-center text-blue-600 hover:underline"
                                                        >
                                                            <LinkIcon className="h-3 w-3 mr-1" />
                                                            Lihat Dokumen
                                                        </a>
                                                    </TableCell>
                                                    <TableCell>
                                                        {new Date(deferral.created_at).toLocaleDateString("id-ID")}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            <Button
                                                                size="sm"
                                                                className="h-8 bg-green-600 hover:bg-green-700"
                                                                onClick={() => handleApprove(deferral.id)}
                                                            >
                                                                <Check className="h-4 w-4 mr-1" />
                                                                Setujui
                                                            </Button>
                                                            <Button
                                                                variant="destructive"
                                                                size="sm"
                                                                className="h-8"
                                                                onClick={() => handleReject(deferral.id)}
                                                            >
                                                                <X className="h-4 w-4 mr-1" />
                                                                Tolak
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </DashboardLayout>
    );
}
