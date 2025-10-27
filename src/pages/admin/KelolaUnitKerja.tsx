import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Building2, Edit, Trash2, Users } from "lucide-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

export default function KelolaUnitKerja() {
  const { user } = useAuth();
  const [workUnits, setWorkUnits] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingUnit, setEditingUnit] = useState<any>(null);

  useEffect(() => {
    loadWorkUnits();
  }, []);

  const loadWorkUnits = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("work_units")
      .select(`
        *,
        profiles(count)
      `)
      .order("name");

    if (error) {
      toast.error("Gagal memuat data unit kerja");
      console.error(error);
    } else {
      setWorkUnits(data || []);
    }
    setIsLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const code = formData.get("code") as string;
    const description = formData.get("description") as string;
    const address = formData.get("address") as string;
    const phone = formData.get("phone") as string;

    if (editingUnit) {
      // Update existing unit
      const { error } = await supabase
        .from("work_units")
        .update({
          name,
          code,
          description,
          address,
          phone,
        })
        .eq("id", editingUnit.id);

      if (error) {
        toast.error("Gagal memperbarui unit kerja");
        console.error(error);
      } else {
        toast.success("Unit kerja berhasil diperbarui");
        setIsDialogOpen(false);
        setEditingUnit(null);
        loadWorkUnits();
      }
    } else {
      // Create new unit
      const { error } = await supabase.from("work_units").insert({
        name,
        code,
        description,
        address,
        phone,
      });

      if (error) {
        toast.error("Gagal menambahkan unit kerja");
        console.error(error);
      } else {
        toast.success("Unit kerja berhasil ditambahkan");
        setIsDialogOpen(false);
        loadWorkUnits();
      }
    }

    setIsSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus unit kerja ini?")) return;

    const { error } = await supabase.from("work_units").delete().eq("id", id);

    if (error) {
      toast.error("Gagal menghapus unit kerja");
      console.error(error);
    } else {
      toast.success("Unit kerja berhasil dihapus");
      loadWorkUnits();
    }
  };

  const handleEdit = (unit: any) => {
    setEditingUnit(unit);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingUnit(null);
  };

  if (user?.role !== "admin_pusat") {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Anda tidak memiliki akses ke halaman ini</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Kelola Unit Kerja</h1>
                <p className="text-muted-foreground mt-1">Manajemen unit kerja di seluruh organisasi</p>
              </div>
            </div>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={handleCloseDialog}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Tambah Unit Kerja
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingUnit ? "Edit Unit Kerja" : "Tambah Unit Kerja Baru"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nama Unit Kerja *</Label>
                    <Input
                      id="name"
                      name="name"
                      placeholder="Contoh: BBPVP Bandung"
                      defaultValue={editingUnit?.name}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="code">Kode Unit *</Label>
                    <Input
                      id="code"
                      name="code"
                      placeholder="Contoh: BBPVP-BDG"
                      defaultValue={editingUnit?.code}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Deskripsi</Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="Deskripsi singkat tentang unit kerja..."
                    rows={3}
                    defaultValue={editingUnit?.description}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Alamat</Label>
                  <Textarea
                    id="address"
                    name="address"
                    placeholder="Alamat lengkap unit kerja..."
                    rows={2}
                    defaultValue={editingUnit?.address}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Nomor Telepon</Label>
                  <Input
                    id="phone"
                    name="phone"
                    placeholder="Contoh: 022-1234567"
                    defaultValue={editingUnit?.phone}
                  />
                </div>
                <div className="flex gap-2 justify-end pt-4 border-t">
                  <Button type="button" variant="outline" onClick={handleCloseDialog}>
                    Batal
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Menyimpan..." : editingUnit ? "Perbarui" : "Tambah"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Statistics */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Building2 className="h-8 w-8 text-primary" />
                <div>
                  <div className="text-2xl font-bold">{workUnits.length}</div>
                  <p className="text-sm text-muted-foreground">Total Unit Kerja</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Users className="h-8 w-8 text-green-600" />
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {workUnits.reduce((acc, unit) => acc + (unit.profiles?.length || 0), 0)}
                  </div>
                  <p className="text-sm text-muted-foreground">Total Pegawai</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Building2 className="h-8 w-8 text-blue-600" />
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    {workUnits.filter((u) => u.profiles && u.profiles.length > 0).length}
                  </div>
                  <p className="text-sm text-muted-foreground">Unit Aktif</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Work Units Table */}
        <Card>
          <CardHeader>
            <CardTitle>Daftar Unit Kerja</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-4 text-muted-foreground">Memuat data...</p>
              </div>
            ) : workUnits.length === 0 ? (
              <div className="text-center py-8">
                <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">Belum ada unit kerja</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nama Unit</TableHead>
                      <TableHead>Kode</TableHead>
                      <TableHead>Deskripsi</TableHead>
                      <TableHead>Jumlah Pegawai</TableHead>
                      <TableHead>Dibuat</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {workUnits.map((unit) => (
                      <TableRow key={unit.id}>
                        <TableCell className="font-medium">{unit.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{unit.code}</Badge>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">{unit.description || "-"}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span>{unit.profiles?.length || 0}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(new Date(unit.created_at), "dd MMM yyyy", { locale: localeId })}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(unit)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(unit.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}