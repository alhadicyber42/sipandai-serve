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
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Users, Plus, Pencil, Trash2, Search } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface Admin {
  id: string;
  name: string;
  nip: string;
  email: string;
  phone: string | null;
  work_unit_id: number | null;
  work_unit_name?: string;
}

interface WorkUnit {
  id: number;
  name: string;
  code: string;
}

export default function KelolaAdminUnit() {
  const { user } = useAuth();
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [workUnits, setWorkUnits] = useState<WorkUnit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    nip: "",
    email: "",
    phone: "",
    password: "",
    work_unit_id: "",
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
      const { data: units } = await supabase
        .from("work_units")
        .select("*")
        .order("name");
      
      if (units) setWorkUnits(units);

      // Load admin units with their work unit info
      const { data: profiles } = await supabase
        .from("profiles")
        .select(`
          id,
          name,
          nip,
          phone,
          work_unit_id,
          work_units (
            name
          )
        `)
        .eq("role", "admin_unit")
        .order("name");

      if (profiles) {
        // Get emails from auth.users via RPC or separate query
        const adminIds = profiles.map(p => p.id);
        const adminList: Admin[] = [];

        for (const profile of profiles) {
          // Get user email from metadata or auth
          const { data: authUser } = await supabase.auth.admin.getUserById(profile.id);
          
          adminList.push({
            id: profile.id,
            name: profile.name,
            nip: profile.nip,
            phone: profile.phone,
            work_unit_id: profile.work_unit_id,
            work_unit_name: (profile.work_units as any)?.name || "-",
            email: authUser?.user?.email || "-",
          });
        }

        setAdmins(adminList);
      }
    } catch (error: any) {
      console.error("Error loading data:", error);
      toast.error("Gagal memuat data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenDialog = (admin?: Admin) => {
    if (admin) {
      setSelectedAdmin(admin);
      setFormData({
        name: admin.name,
        nip: admin.nip,
        email: admin.email,
        phone: admin.phone || "",
        password: "",
        work_unit_id: admin.work_unit_id?.toString() || "",
      });
    } else {
      setSelectedAdmin(null);
      setFormData({
        name: "",
        nip: "",
        email: "",
        phone: "",
        password: "",
        work_unit_id: "",
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.nip || !formData.email || !formData.work_unit_id) {
      toast.error("Mohon lengkapi semua field yang wajib diisi");
      return;
    }

    if (!selectedAdmin && !formData.password) {
      toast.error("Password wajib diisi untuk admin baru");
      return;
    }

    setIsLoading(true);
    try {
      if (selectedAdmin) {
        // Update existing admin
        const { error: profileError } = await supabase
          .from("profiles")
          .update({
            name: formData.name,
            nip: formData.nip,
            phone: formData.phone || null,
            work_unit_id: parseInt(formData.work_unit_id),
          })
          .eq("id", selectedAdmin.id);

        if (profileError) throw profileError;
        
        toast.success("Admin unit berhasil diperbarui");
      } else {
        // Create new admin
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              name: formData.name,
              role: "admin_unit",
              work_unit_id: parseInt(formData.work_unit_id),
              nip: formData.nip,
              phone: formData.phone || null,
            },
          },
        });

        if (authError) throw authError;
        
        toast.success("Admin unit berhasil dibuat");
      }

      setIsDialogOpen(false);
      loadData();
    } catch (error: any) {
      console.error("Error saving admin:", error);
      toast.error(error.message || "Gagal menyimpan data admin");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedAdmin) return;

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.admin.deleteUser(selectedAdmin.id);
      
      if (error) throw error;
      
      toast.success("Admin unit berhasil dihapus");
      setIsDeleteDialogOpen(false);
      setSelectedAdmin(null);
      loadData();
    } catch (error: any) {
      console.error("Error deleting admin:", error);
      toast.error("Gagal menghapus admin unit");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredAdmins = admins.filter(
    (admin) =>
      admin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      admin.nip.includes(searchQuery) ||
      admin.email.toLowerCase().includes(searchQuery.toLowerCase())
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Kelola Admin Unit</h1>
            <p className="text-muted-foreground mt-1">
              Kelola data administrator unit kerja
            </p>
          </div>
          <Button onClick={() => handleOpenDialog()} className="gap-2">
            <Plus className="h-4 w-4" />
            Tambah Admin Unit
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Daftar Admin Unit
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari berdasarkan nama, NIP, atau email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-sm text-muted-foreground">Memuat data...</p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nama</TableHead>
                      <TableHead>NIP</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Telepon</TableHead>
                      <TableHead>Unit Kerja</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAdmins.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          Tidak ada data admin unit
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredAdmins.map((admin) => (
                        <TableRow key={admin.id}>
                          <TableCell className="font-medium">{admin.name}</TableCell>
                          <TableCell>{admin.nip}</TableCell>
                          <TableCell>{admin.email}</TableCell>
                          <TableCell>{admin.phone || "-"}</TableCell>
                          <TableCell>{admin.work_unit_name}</TableCell>
                          <TableCell className="text-right space-x-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenDialog(admin)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setSelectedAdmin(admin);
                                setIsDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedAdmin ? "Edit Admin Unit" : "Tambah Admin Unit Baru"}
            </DialogTitle>
            <DialogDescription>
              {selectedAdmin
                ? "Perbarui informasi admin unit"
                : "Buat akun admin unit baru"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Nama Lengkap *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Masukkan nama lengkap"
              />
            </div>

            <div>
              <Label htmlFor="nip">NIP *</Label>
              <Input
                id="nip"
                value={formData.nip}
                onChange={(e) => setFormData({ ...formData, nip: e.target.value })}
                placeholder="Masukkan NIP"
              />
            </div>

            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Masukkan email"
                disabled={!!selectedAdmin}
              />
            </div>

            {!selectedAdmin && (
              <div>
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Masukkan password"
                />
              </div>
            )}

            <div>
              <Label htmlFor="phone">Telepon</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="Masukkan nomor telepon"
              />
            </div>

            <div>
              <Label htmlFor="work_unit">Unit Kerja *</Label>
              <Select
                value={formData.work_unit_id}
                onValueChange={(value) =>
                  setFormData({ ...formData, work_unit_id: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih unit kerja" />
                </SelectTrigger>
                <SelectContent>
                  {workUnits.map((unit) => (
                    <SelectItem key={unit.id} value={unit.id.toString()}>
                      {unit.name}
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
              Apakah Anda yakin ingin menghapus admin unit{" "}
              <strong>{selectedAdmin?.name}</strong>? Tindakan ini tidak dapat dibatalkan.
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
    </DashboardLayout>
  );
}
