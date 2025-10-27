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
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Shield, Edit, Trash2, UserCog, Building2 } from "lucide-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

const ROLE_LABELS = {
  admin_unit: "Admin Unit",
  admin_pusat: "Admin Pusat",
};

export default function KelolaAdminUnit() {
  const { user } = useAuth();
  const [admins, setAdmins] = useState<any[]>([]);
  const [workUnits, setWorkUnits] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);

    // Load admins
    const { data: adminsData, error: adminsError } = await supabase
      .from("profiles")
      .select(`
        *,
        work_units(name, code)
      `)
      .in("role", ["admin_unit", "admin_pusat"])
      .order("created_at", { ascending: false });

    if (adminsError) {
      toast.error("Gagal memuat data admin");
      console.error(adminsError);
    } else {
      setAdmins(adminsData || []);
    }

    // Load work units
    const { data: unitsData, error: unitsError } = await supabase
      .from("work_units")
      .select("*")
      .order("name");

    if (unitsError) {
      console.error(unitsError);
    } else {
      setWorkUnits(unitsData || []);
    }

    setIsLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const name = formData.get("name") as string;
    const nip = formData.get("nip") as string;
    const phone = formData.get("phone") as string;
    const role = formData.get("role") as string;
    const workUnitId = formData.get("work_unit_id") as string;

    if (editingAdmin) {
      // Update existing admin
      const { error } = await supabase
        .from("profiles")
        .update({
          name,
          nip,
          phone,
          role: role as any,
          work_unit_id: role === "admin_unit" ? workUnitId : null,
        })
        .eq("id", editingAdmin.id);

      if (error) {
        toast.error("Gagal memperbarui admin");
        console.error(error);
      } else {
        toast.success("Admin berhasil diperbarui");
        setIsDialogOpen(false);
        setEditingAdmin(null);
        loadData();
      }
    } else {
      // Create new admin via Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            nip,
            phone,
            role,
            work_unit_id: role === "admin_unit" ? workUnitId : null,
          },
        },
      });

      if (authError) {
        toast.error("Gagal menambahkan admin: " + authError.message);
        console.error(authError);
      } else {
        toast.success("Admin berhasil ditambahkan");
        setIsDialogOpen(false);
        loadData();
      }
    }

    setIsSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus admin ini?")) return;

    const { error } = await supabase.from("profiles").delete().eq("id", id);

    if (error) {
      toast.error("Gagal menghapus admin");
      console.error(error);
    } else {
      toast.success("Admin berhasil dihapus");
      loadData();
    }
  };

  const handleEdit = (admin: any) => {
    setEditingAdmin(admin);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingAdmin(null);
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
                <UserCog className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Kelola Admin</h1>
                <p className="text-muted-foreground mt-1">Manajemen admin unit dan admin pusat</p>
              </div>
            </div>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={handleCloseDialog}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Tambah Admin
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingAdmin ? "Edit Admin" : "Tambah Admin Baru"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nama Lengkap *</Label>
                    <Input
                      id="name"
                      name="name"
                      placeholder="Nama lengkap admin"
                      defaultValue={editingAdmin?.name}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nip">NIP *</Label>
                    <Input
                      id="nip"
                      name="nip"
                      placeholder="Nomor Induk Pegawai"
                      defaultValue={editingAdmin?.nip}
                      required
                    />
                  </div>
                </div>

                {!editingAdmin && (
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="email@example.com"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Password *</Label>
                      <Input
                        id="password"
                        name="password"
                        type="password"
                        placeholder="Minimal 6 karakter"
                        minLength={6}
                        required
                      />
                    </div>
                  </div>
                )}

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Nomor Telepon</Label>
                    <Input
                      id="phone"
                      name="phone"
                      placeholder="08xxxxxxxxxx"
                      defaultValue={editingAdmin?.phone}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Role *</Label>
                    <Select name="role" defaultValue={editingAdmin?.role || "admin_unit"} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih role" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(ROLE_LABELS).map(([key, label]) => (
                          <SelectItem key={key} value={key}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="work_unit_id">Unit Kerja (untuk Admin Unit)</Label>
                  <Select name="work_unit_id" defaultValue={editingAdmin?.work_unit_id}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih unit kerja" />
                    </SelectTrigger>
                    <SelectContent>
                      {workUnits.map((unit) => (
                        <SelectItem key={unit.id} value={unit.id}>
                          {unit.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Kosongkan jika role adalah Admin Pusat
                  </p>
                </div>

                <div className="flex gap-2 justify-end pt-4 border-t">
                  <Button type="button" variant="outline" onClick={handleCloseDialog}>
                    Batal
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Menyimpan..." : editingAdmin ? "Perbarui" : "Tambah"}
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
                <Shield className="h-8 w-8 text-primary" />
                <div>
                  <div className="text-2xl font-bold">{admins.length}</div>
                  <p className="text-sm text-muted-foreground">Total Admin</p>
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
                    {admins.filter((a) => a.role === "admin_unit").length}
                  </div>
                  <p className="text-sm text-muted-foreground">Admin Unit</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Shield className="h-8 w-8 text-purple-600" />
                <div>
                  <div className="text-2xl font-bold text-purple-600">
                    {admins.filter((a) => a.role === "admin_pusat").length}
                  </div>
                  <p className="text-sm text-muted-foreground">Admin Pusat</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Admins Table */}
        <Card>
          <CardHeader>
            <CardTitle>Daftar Admin</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-4 text-muted-foreground">Memuat data...</p>
              </div>
            ) : admins.length === 0 ? (
              <div className="text-center py-8">
                <UserCog className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">Belum ada admin</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Admin</TableHead>
                      <TableHead>NIP</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Unit Kerja</TableHead>
                      <TableHead>Dibuat</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {admins.map((admin) => (
                      <TableRow key={admin.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${admin.email}`} />
                              <AvatarFallback>{admin.name?.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{admin.name}</p>
                              <p className="text-xs text-muted-foreground">{admin.phone || "-"}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{admin.nip}</Badge>
                        </TableCell>
                        <TableCell className="text-sm">{admin.email}</TableCell>
                        <TableCell>
                          <Badge variant={admin.role === "admin_pusat" ? "default" : "secondary"}>
                            {ROLE_LABELS[admin.role as keyof typeof ROLE_LABELS]}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {admin.work_units?.name || "-"}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(new Date(admin.created_at), "dd MMM yyyy", { locale: localeId })}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(admin)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(admin.id)}
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