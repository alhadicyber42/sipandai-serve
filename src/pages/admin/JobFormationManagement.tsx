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
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Edit, Trash2, Building2, Briefcase } from "lucide-react";

interface JobFormation {
    id: string;
    work_unit_id: number;
    position_name: string;
    quota: number;
    created_at: string;
}

interface WorkUnit {
    id: number;
    name: string;
}

export default function JobFormationManagement() {
    const { user } = useAuth();
    const [formations, setFormations] = useState<JobFormation[]>([]);
    const [workUnits, setWorkUnits] = useState<WorkUnit[]>([]);
    const [selectedUnitId, setSelectedUnitId] = useState<string>("");
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form state
    const [positionName, setPositionName] = useState("");
    const [quota, setQuota] = useState("1");

    const isAdminPusat = user?.role === "admin_pusat";

    useEffect(() => {
        loadWorkUnits();
    }, []);

    useEffect(() => {
        if (user?.role === "admin_unit" && user.work_unit_id) {
            setSelectedUnitId(user.work_unit_id.toString());
        }
    }, [user]);

    useEffect(() => {
        if (selectedUnitId) {
            loadFormations(selectedUnitId);
        } else {
            setFormations([]);
        }
    }, [selectedUnitId]);

    const loadWorkUnits = async () => {
        const { data, error } = await supabase
            .from("work_units")
            .select("id, name")
            .order("name");

        if (error) {
            toast.error("Gagal memuat data unit kerja");
            console.error(error);
        } else {
            setWorkUnits(data || []);
        }
    };

    const loadFormations = async (unitId: string) => {
        setIsLoading(true);
        const { data, error } = await supabase
            .from("job_formations")
            .select("*")
            .eq("work_unit_id", parseInt(unitId))
            .order("position_name");

        if (error) {
            toast.error("Gagal memuat data formasi jabatan");
            console.error(error);
        } else {
            setFormations(data || []);
        }
        setIsLoading(false);
    };

    const resetForm = () => {
        setPositionName("");
        setQuota("1");
        setIsEditMode(false);
        setEditingId(null);
    };

    const handleOpenDialog = (formation?: JobFormation) => {
        if (formation) {
            setIsEditMode(true);
            setEditingId(formation.id);
            setPositionName(formation.position_name);
            setQuota(formation.quota.toString());
        } else {
            resetForm();
        }
        setIsDialogOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedUnitId) {
            toast.error("Pilih unit kerja terlebih dahulu");
            return;
        }

        if (!positionName || !quota) {
            toast.error("Semua field harus diisi");
            return;
        }

        setIsSubmitting(true);

        try {
            if (isEditMode && editingId) {
                const { error } = await supabase
                    .from("job_formations")
                    .update({
                        position_name: positionName,
                        quota: parseInt(quota),
                    })
                    .eq("id", editingId);

                if (error) throw error;
                toast.success("Formasi jabatan berhasil diperbarui");
            } else {
                const { error } = await supabase
                    .from("job_formations")
                    .insert({
                        work_unit_id: parseInt(selectedUnitId),
                        position_name: positionName,
                        quota: parseInt(quota),
                    });

                if (error) throw error;
                toast.success("Formasi jabatan berhasil ditambahkan");
            }

            setIsDialogOpen(false);
            resetForm();
            loadFormations(selectedUnitId);
        } catch (error) {
            console.error(error);
            toast.error("Gagal menyimpan data");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Apakah Anda yakin ingin menghapus formasi ini?")) return;

        try {
            const { error } = await supabase
                .from("job_formations")
                .delete()
                .eq("id", id);

            if (error) throw error;

            toast.success("Formasi berhasil dihapus");
            loadFormations(selectedUnitId);
        } catch (error) {
            console.error("Error deleting formation:", error);
            toast.error("Gagal menghapus data");
        }
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold">Formasi Jabatan</h1>
                        <p className="text-muted-foreground">
                            Kelola formasi jabatan untuk setiap unit kerja
                        </p>
                    </div>

                    {selectedUnitId && (
                        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                            <DialogTrigger asChild>
                                <Button onClick={() => handleOpenDialog()}>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Tambah Formasi
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>
                                        {isEditMode ? "Edit Formasi Jabatan" : "Tambah Formasi Jabatan"}
                                    </DialogTitle>
                                </DialogHeader>
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Nama Jabatan</Label>
                                        <Input
                                            value={positionName}
                                            onChange={(e) => setPositionName(e.target.value)}
                                            placeholder="Contoh: Analis Kepegawaian"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Kuota</Label>
                                        <Input
                                            type="number"
                                            min="1"
                                            value={quota}
                                            onChange={(e) => setQuota(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="flex justify-end gap-2 pt-4">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => setIsDialogOpen(false)}
                                        >
                                            Batal
                                        </Button>
                                        <Button type="submit" disabled={isSubmitting}>
                                            {isSubmitting ? "Menyimpan..." : "Simpan"}
                                        </Button>
                                    </div>
                                </form>
                            </DialogContent>
                        </Dialog>
                    )}
                </div>

                {isAdminPusat && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Pilih Unit Kerja</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Select
                                value={selectedUnitId}
                                onValueChange={setSelectedUnitId}
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

                {selectedUnitId ? (
                    <Card>
                        <CardHeader>
                            <CardTitle>Daftar Formasi Jabatan</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0 sm:p-6">
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="pl-4 w-[60%] sm:w-auto">Nama Jabatan</TableHead>
                                            <TableHead className="text-center w-[20%] sm:w-auto">Kuota</TableHead>
                                            <TableHead className="w-[20%] sm:w-[100px] text-right pr-4">Aksi</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {formations.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                                                    Belum ada data formasi jabatan
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            formations.map((formation) => (
                                                <TableRow key={formation.id}>
                                                    <TableCell className="font-medium pl-4">
                                                        <div className="flex items-start sm:items-center gap-2">
                                                            <Briefcase className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5 sm:mt-0" />
                                                            <span className="line-clamp-2 text-sm sm:text-base">{formation.position_name}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <span className="inline-flex items-center justify-center min-w-[2rem] h-8 rounded-full bg-secondary text-sm font-medium">
                                                            {formation.quota}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="text-right pr-4">
                                                        <div className="flex items-center justify-end gap-1">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8"
                                                                onClick={() => handleOpenDialog(formation)}
                                                            >
                                                                <Edit className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-red-500 hover:text-red-600"
                                                                onClick={() => handleDelete(formation.id)}
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
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                        <Building2 className="h-12 w-12 mb-4 opacity-20" />
                        <p>Pilih unit kerja untuk melihat formasi jabatan</p>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
