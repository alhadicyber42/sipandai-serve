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
import { Users, Search, UserCog, Filter } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { TableSkeleton, StatCardSkeleton } from "@/components/skeletons";
import { NoDataState, SearchState } from "@/components/EmptyState";

interface UserWithRole {
  id: string;
  name: string;
  nip: string;
  email: string;
  phone: string | null;
  work_unit_id: number | null;
  work_unit_name?: string;
  role: string;
}

interface WorkUnit {
  id: number;
  name: string;
  code: string;
}

export default function KelolaAdminUnit() {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [workUnits, setWorkUnits] = useState<WorkUnit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [workUnitFilter, setWorkUnitFilter] = useState<string>("all");
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithRole | null>(null);
  const [newRole, setNewRole] = useState<string>("");

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

      // Load all users with their profiles and roles
      const { data: profiles } = await supabase
        .from("profiles")
        .select(`
          id,
          name,
          nip,
          phone,
          work_unit_id,
          role,
          work_units (
            name
          )
        `)
        .order("name");

      if (profiles) {
        const userList: UserWithRole[] = [];

        for (const profile of profiles) {
          // Get user email from metadata since admin API requires service role
          // We'll use a simpler approach by creating an edge function later
          // For now, we get from profiles which should have all data

          // Get user role from user_roles table, fallback to profiles.role
          const { data: roleData, error: roleError } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", profile.id)
            .maybeSingle();

          userList.push({
            id: profile.id,
            name: profile.name,
            nip: profile.nip,
            phone: profile.phone,
            work_unit_id: profile.work_unit_id,
            work_unit_name: (profile.work_units as any)?.name || "-",
            email: "-", // Will be populated via edge function in future
            role: roleError ? (profile as any).role : (roleData?.role || (profile as any).role || "user_unit"),
          });
        }

        setUsers(userList);
      }
    } catch (error: any) {
      console.error("Error loading data:", error);
      toast.error("Gagal memuat data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenRoleDialog = (user: UserWithRole) => {
    setSelectedUser(user);
    setNewRole(user.role);
    setIsRoleDialogOpen(true);
  };

  const handleChangeRole = async () => {
    if (!selectedUser || !newRole) return;

    setIsLoading(true);
    try {
      // Delete old role
      await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", selectedUser.id);

      // Insert new role
      const { error } = await supabase
        .from("user_roles")
        .insert({
          user_id: selectedUser.id,
          role: newRole as any,
        });

      if (error) throw error;

      // Update profile role for backward compatibility
      await supabase
        .from("profiles")
        .update({ role: newRole as any })
        .eq("id", selectedUser.id);

      toast.success(`Role berhasil diubah menjadi ${getRoleName(newRole)}`);
      setIsRoleDialogOpen(false);
      loadData();
    } catch (error: any) {
      console.error("Error changing role:", error);
      toast.error("Gagal mengubah role");
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleName = (role: string) => {
    const roleNames: Record<string, string> = {
      user_unit: "User Unit",
      admin_unit: "Admin Unit",
      admin_pusat: "Admin Pusat",
    };
    return roleNames[role] || role;
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "admin_pusat":
        return "default";
      case "admin_unit":
        return "secondary";
      default:
        return "outline";
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.nip.includes(searchQuery) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    const matchesWorkUnit =
      workUnitFilter === "all" ||
      user.work_unit_id?.toString() === workUnitFilter;

    return matchesSearch && matchesRole && matchesWorkUnit;
  });

  // Statistics
  const stats = {
    total: users.length,
    admin_pusat: users.filter((u) => u.role === "admin_pusat").length,
    admin_unit: users.filter((u) => u.role === "admin_unit").length,
    user_unit: users.filter((u) => u.role === "user_unit").length,
  };

  if (user?.role !== "admin_pusat") {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            Anda tidak memiliki akses ke halaman ini.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Enhanced Header with Gradient */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-600 via-purple-500 to-pink-400 p-6 md:p-8 text-white shadow-xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-16 -translate-x-16 blur-2xl" />
          
          <div className="relative flex items-start gap-4">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <UserCog className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">
                Kelola Admin Unit
              </h1>
              <p className="text-white/90 mt-1 text-sm md:text-base">
                Kelola pengguna dan ubah role administrator
              </p>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {isLoading ? (
            <>
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
            </>
          ) : (
            <>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">{stats.total}</div>
                  <p className="text-sm text-muted-foreground">Total Pengguna</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-primary">
                    {stats.admin_pusat}
                  </div>
                  <p className="text-sm text-muted-foreground">Admin Pusat</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-secondary">
                    {stats.admin_unit}
                  </div>
                  <p className="text-sm text-muted-foreground">Admin Unit</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-muted-foreground">
                    {stats.user_unit}
                  </div>
                  <p className="text-sm text-muted-foreground">User Unit</p>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Daftar Semua Pengguna
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari nama, NIP, atau email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger>
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Role</SelectItem>
                  <SelectItem value="admin_pusat">Admin Pusat</SelectItem>
                  <SelectItem value="admin_unit">Admin Unit</SelectItem>
                  <SelectItem value="user_unit">User Unit</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={workUnitFilter}
                onValueChange={setWorkUnitFilter}
              >
                <SelectTrigger>
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter Unit Kerja" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Unit</SelectItem>
                  {workUnits.map((unit) => (
                    <SelectItem key={unit.id} value={unit.id.toString()}>
                      {unit.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                      <TableHead>Nama</TableHead>
                      <TableHead>NIP</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Telepon</TableHead>
                      <TableHead>Unit Kerja</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={7}
                          className="p-0 border-none"
                        >
                          <div className="py-12">
                            {searchQuery || roleFilter !== "all" || workUnitFilter !== "all" ? (
                              <SearchState message="Tidak ada pengguna yang sesuai dengan filter pencarian" />
                            ) : (
                              <NoDataState message="Belum ada data pengguna" />
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">
                            {user.name}
                          </TableCell>
                          <TableCell>{user.nip}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>{user.phone || "-"}</TableCell>
                          <TableCell>{user.work_unit_name}</TableCell>
                          <TableCell>
                            <Badge variant={getRoleBadgeVariant(user.role)}>
                              {getRoleName(user.role)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenRoleDialog(user)}
                              className="gap-2"
                            >
                              <UserCog className="h-4 w-4" />
                              Ubah Role
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

      {/* Change Role Dialog */}
      <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ubah Role Pengguna</DialogTitle>
            <DialogDescription>
              Ubah role untuk <strong>{selectedUser?.name}</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Role Saat Ini</Label>
              <div className="mt-2">
                <Badge variant={getRoleBadgeVariant(selectedUser?.role || "")}>
                  {getRoleName(selectedUser?.role || "")}
                </Badge>
              </div>
            </div>

            <div>
              <Label htmlFor="new_role">Role Baru *</Label>
              <Select value={newRole} onValueChange={setNewRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih role baru" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user_unit">User Unit</SelectItem>
                  <SelectItem value="admin_unit">Admin Unit</SelectItem>
                  <SelectItem value="admin_pusat">Admin Pusat</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground mt-2">
                Role akan langsung berubah setelah disimpan
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsRoleDialogOpen(false)}
            >
              Batal
            </Button>
            <Button onClick={handleChangeRole} disabled={isLoading || !newRole}>
              {isLoading ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout >
  );
}
