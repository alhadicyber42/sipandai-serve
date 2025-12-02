import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ResponsiveTableWrapper } from "@/components/ui/responsive-table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Building2, Plus, Pencil, Trash2, Search } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { TableSkeleton } from "@/components/skeletons";
import { NoDataState, SearchState } from "@/components/EmptyState";

interface WorkUnit {
  id: number;
  name: string;
  code: string;
  admin_unit_id: string | null;
  admin_name?: string;
  created_at: string;
}

interface Admin {
  id: string;
  name: string;
  work_unit_id: number | null;
}

export default function KelolaUnitKerja() {
  const { user } = useAuth();
  const [workUnits, setWorkUnits] = useState<WorkUnit[]>([]);
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<WorkUnit | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    admin_unit_id: "",
  });

  useEffect(() => {
    if (user?.role === "admin_pusat") {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Load work units
      const { data: units, error: unitsError } = await supabase
        .from("work_units")
        .select("*")
        .order("name");

      if (unitsError) throw unitsError;

      // Load all admin units
      const { data: adminProfiles, error: adminsError } = await supabase
        .from("profiles")
        .select("id, name, work_unit_id")
        .eq("role", "admin_unit")
        .order("name");

      if (adminsError) throw adminsError;

      if (adminProfiles) setAdmins(adminProfiles);

      // Enrich units with admin names
      if (units) {
        const enrichedUnits = units.map((unit) => {
          const admin = adminProfiles?.find((a) => a.id === unit.admin_unit_id);
          return {
            ...unit,
            admin_name: admin?.name || undefined,
          };
        });
        setWorkUnits(enrichedUnits);
      }
    } catch (error: any) {
      console.error("Error loading data:", error);
      toast.error("Gagal memuat data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenDialog = (unit?: WorkUnit) => {
    if (unit) {
      setSelectedUnit(unit);
      setFormData({
        name: unit.name,
        code: unit.code,
        admin_unit_id: unit.admin_unit_id || "",
      });
    } else {
      setSelectedUnit(null);
      setFormData({
        name: "",
        code: "",
        admin_unit_id: "",
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.code) {
      toast.error("Nama dan kode unit kerja wajib diisi");
      return;
    }

    setIsLoading(true);
    try {
      if (selectedUnit) {
        // Update existing unit
        const { error } = await supabase
          .from("work_units")
          .update({
            name: formData.name,
            code: formData.code,
            admin_unit_id: formData.admin_unit_id || null,
          })
          .eq("id", selectedUnit.id);

        if (error) throw error;

        // Update admin's work_unit_id if assigned
        if (formData.admin_unit_id) {
          await supabase
            .from("profiles")
            .update({ work_unit_id: selectedUnit.id })
            .eq("id", formData.admin_unit_id);
        }

        toast.success("Unit kerja berhasil diperbarui");
      } else {
        // Create new unit
        const { data: newUnit, error } = await supabase
          .from("work_units")
          .insert({
            name: formData.name,
            code: formData.code,
            admin_unit_id: formData.admin_unit_id || null,
          })
          .select()
          .single();

        if (error) throw error;

        // Update admin's work_unit_id if assigned
        if (formData.admin_unit_id && newUnit) {
          await supabase
            .from("profiles")
            .update({ work_unit_id: newUnit.id })
            .eq("id", formData.admin_unit_id);
        }

        toast.success("Unit kerja berhasil ditambahkan");
      }

      setIsDialogOpen(false);
      loadData();
    } catch (error: any) {
      console.error("Error saving unit:", error);
      toast.error(error.message || "Gagal menyimpan data unit kerja");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedUnit) return;

    setIsLoading(true);
    try {
      // Check if unit has any admins or services
      const { count: adminCount } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("work_unit_id", selectedUnit.id);

      const { count: serviceCount } = await supabase
        .from("services")
        .select("*", { count: "exact", head: true })
        .eq("work_unit_id", selectedUnit.id);

      if ((adminCount || 0) > 0 || (serviceCount || 0) > 0) {
        toast.error(
          "Unit kerja tidak dapat dihapus karena masih memiliki admin atau layanan terkait"
        );
        setIsLoading(false);
        return;
      }

      const { error } = await supabase
        .from("work_units")
        .delete()
        .eq("id", selectedUnit.id);

      if (error) throw error;

      toast.success("Unit kerja berhasil dihapus");
      setIsDeleteDialogOpen(false);
      setSelectedUnit(null);
      loadData();
    } catch (error: any) {
      console.error("Error deleting unit:", error);
      toast.error("Gagal menghapus unit kerja");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredUnits = workUnits.filter(
    (unit) =>
      unit.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      unit.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get available admins (not yet assigned to this unit)
  const availableAdmins = admins.filter(
    (admin) => !admin.work_unit_id || admin.work_unit_id === selectedUnit?.id
  );

  if (user?.role !== "admin_pusat") {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Anda tidak memiliki akses ke halaman ini.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Enhanced Header with Gradient */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-500 to-blue-400 p-6 md:p-8 text-white shadow-xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-16 -translate-x-16 blur-2xl" />
          
          <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <Building2 className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white">
                  Kelola Unit Kerja
                </h1>
                <p className="text-white/90 mt-1 text-sm md:text-base">
                  Kelola data unit kerja dan administrator
                </p>
              </div>
            </div>

            <Button onClick={() => handleOpenDialog()} className="gap-2 bg-white text-indigo-600 hover:bg-white/90 shadow-lg">
              <Plus className="h-4 w-4" />
              Tambah Unit Kerja
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Daftar Unit Kerja
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari berdasarkan nama atau kode unit..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {isLoading ? (
              <div className="py-4">
                <TableSkeleton rows={5} />
              </div>
            ) : (
              <ResponsiveTableWrapper>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Kode</TableHead>
                      <TableHead>Nama Unit</TableHead>
                      <TableHead className="hidden md:table-cell">Administrator</TableHead>
                      <TableHead className="hidden sm:table-cell">Status</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUnits.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="p-0 border-none">
                          <div className="py-12">
                            {searchQuery ? (
                              <SearchState message="Tidak ada unit kerja yang sesuai dengan pencarian" />
                            ) : (
                              <NoDataState message="Belum ada data unit kerja" />
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredUnits.map((unit) => (
                        <TableRow key={unit.id}>
                          <TableCell className="font-mono font-medium text-xs sm:text-sm">{unit.code}</TableCell>
                          <TableCell>
                            <div className="font-medium text-sm sm:text-base">{unit.name}</div>
                            <div className="md:hidden text-xs text-muted-foreground mt-1">
                              Admin: {unit.admin_name || "Belum ada"}
                            </div>
                            <div className="sm:hidden mt-1">
                              {unit.admin_unit_id ? (
                                <Badge variant="default" className="text-[10px] px-1.5 py-0">Aktif</Badge>
                              ) : (
                                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Belum Ada Admin</Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            {unit.admin_name || (
                              <span className="text-muted-foreground">Belum ditentukan</span>
                            )}
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            {unit.admin_unit_id ? (
                              <Badge variant="default">Aktif</Badge>
                            ) : (
                              <Badge variant="secondary">Belum Ada Admin</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right space-x-1 sm:space-x-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenDialog(unit)}
                              className="h-8 w-8"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setSelectedUnit(unit);
                                setIsDeleteDialogOpen(true);
                              }}
                              className="h-8 w-8"
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </ResponsiveTableWrapper>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedUnit ? "Edit Unit Kerja" : "Tambah Unit Kerja Baru"}
            </DialogTitle>
            <DialogDescription>
              {selectedUnit
                ? "Perbarui informasi unit kerja"
                : "Buat unit kerja baru dan tetapkan administrator"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="code">Kode Unit *</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="Contoh: UNIT001"
              />
            </div>

            <div>
              <Label htmlFor="name">Nama Unit *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Masukkan nama unit kerja"
              />
            </div>

            <div>
              <Label htmlFor="admin">Administrator</Label>
              <Select
                value={formData.admin_unit_id}
                onValueChange={(value) =>
                  setFormData({ ...formData, admin_unit_id: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih administrator (opsional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Tidak ada</SelectItem>
                  {availableAdmins.map((admin) => (
                    <SelectItem key={admin.id} value={admin.id}>
                      {admin.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleSubmit} disabled={isLoading}>
              {isLoading ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Konfirmasi Hapus</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus unit kerja{" "}
              <strong>{selectedUnit?.name}</strong>? Tindakan ini tidak dapat dibatalkan
              dan hanya dapat dilakukan jika unit tidak memiliki admin atau layanan
              terkait.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Batal
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isLoading}>
              {isLoading ? "Menghapus..." : "Hapus"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout >
  );
}
