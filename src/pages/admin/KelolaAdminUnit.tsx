import { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ResponsiveTableWrapper } from "@/components/ui/responsive-table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Users, Search, UserCog, Filter, ChevronsLeft, ChevronsRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { TableSkeleton, StatCardSkeleton } from "@/components/skeletons";
import { NoDataState, SearchState } from "@/components/EmptyState";
import { useDebounce } from "@/hooks/useDebounce";
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
interface Stats {
  total: number;
  admin_pusat: number;
  admin_unit: number;
  user_unit: number;
  user_pimpinan: number;
}
const ITEMS_PER_PAGE = 50;
export default function KelolaAdminUnit() {
  const {
    user
  } = useAuth();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [workUnits, setWorkUnits] = useState<WorkUnit[]>([]);
  const [stats, setStats] = useState<Stats>({
    total: 0,
    admin_pusat: 0,
    admin_unit: 0,
    user_unit: 0,
    user_pimpinan: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isStatsLoading, setIsStatsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [workUnitFilter, setWorkUnitFilter] = useState<string>("all");
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithRole | null>(null);
  const [newRole, setNewRole] = useState<string>("");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const debouncedSearch = useDebounce(searchQuery, 300);
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  // Load work units once
  useEffect(() => {
    if (user?.role === "admin_pusat") {
      loadWorkUnits();
      loadStats();
    }
  }, [user]);

  // Load users when filters or page changes
  useEffect(() => {
    if (user?.role === "admin_pusat") {
      loadUsers();
    }
  }, [user, debouncedSearch, roleFilter, workUnitFilter, currentPage]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, roleFilter, workUnitFilter]);
  const loadWorkUnits = async () => {
    try {
      const {
        data: units
      } = await supabase.from("work_units").select("id, name, code").order("name");
      if (units) setWorkUnits(units);
    } catch (error) {
      console.error("Error loading work units:", error);
    }
  };
  const loadStats = async () => {
    setIsStatsLoading(true);
    try {
      // Get counts by role using separate queries for accuracy
      const [totalRes, adminPusatRes, adminUnitRes, userUnitRes, userPimpinanRes] = await Promise.all([supabase.from("profiles").select("id", {
        count: "exact",
        head: true
      }), supabase.from("user_roles").select("id", {
        count: "exact",
        head: true
      }).eq("role", "admin_pusat"), supabase.from("user_roles").select("id", {
        count: "exact",
        head: true
      }).eq("role", "admin_unit"), supabase.from("user_roles").select("id", {
        count: "exact",
        head: true
      }).eq("role", "user_unit"), supabase.from("user_roles").select("id", {
        count: "exact",
        head: true
      }).eq("role", "user_pimpinan")]);
      setStats({
        total: totalRes.count || 0,
        admin_pusat: adminPusatRes.count || 0,
        admin_unit: adminUnitRes.count || 0,
        user_unit: userUnitRes.count || 0,
        user_pimpinan: userPimpinanRes.count || 0
      });
    } catch (error) {
      console.error("Error loading stats:", error);
    } finally {
      setIsStatsLoading(false);
    }
  };
  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      // Build query for profiles with pagination
      let query = supabase.from("profiles").select(`
          id,
          name,
          nip,
          email,
          phone,
          work_unit_id,
          role,
          work_units (name)
        `, {
        count: "exact"
      });

      // Apply filters
      if (debouncedSearch) {
        query = query.or(`name.ilike.%${debouncedSearch}%,nip.ilike.%${debouncedSearch}%,email.ilike.%${debouncedSearch}%`);
      }
      if (roleFilter !== "all") {
        query = query.eq("role", roleFilter as "admin_pusat" | "admin_unit" | "user_unit");
      }
      if (workUnitFilter !== "all") {
        query = query.eq("work_unit_id", parseInt(workUnitFilter));
      }

      // Apply pagination
      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;
      const {
        data: profiles,
        count,
        error
      } = await query.order("name").range(from, to);
      if (error) throw error;
      setTotalCount(count || 0);
      if (profiles && profiles.length > 0) {
        // Batch fetch all roles in one query
        const userIds = profiles.map(p => p.id);
        const {
          data: rolesData
        } = await supabase.from("user_roles").select("user_id, role").in("user_id", userIds);

        // Create a map of user_id to role
        const rolesMap = new Map<string, string>();
        rolesData?.forEach(r => {
          rolesMap.set(r.user_id, r.role);
        });
        const userList: UserWithRole[] = profiles.map(profile => ({
          id: profile.id,
          name: profile.name,
          nip: profile.nip,
          phone: profile.phone,
          work_unit_id: profile.work_unit_id,
          work_unit_name: (profile.work_units as any)?.name || "-",
          email: profile.email || "-",
          role: rolesMap.get(profile.id) || (profile as any).role || "user_unit"
        }));
        setUsers(userList);
      } else {
        setUsers([]);
      }
    } catch (error: any) {
      console.error("Error loading users:", error);
      toast.error("Gagal memuat data pengguna");
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, roleFilter, workUnitFilter, currentPage]);
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
      await supabase.from("user_roles").delete().eq("user_id", selectedUser.id);

      // Insert new role
      const {
        error
      } = await supabase.from("user_roles").insert({
        user_id: selectedUser.id,
        role: newRole as any
      });
      if (error) throw error;

      // Update profile role for backward compatibility
      await supabase.from("profiles").update({
        role: newRole as any
      }).eq("id", selectedUser.id);
      toast.success(`Role berhasil diubah menjadi ${getRoleName(newRole)}`);
      setIsRoleDialogOpen(false);
      loadUsers();
      loadStats();
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
      user_pimpinan: "Pimpinan"
    };
    return roleNames[role] || role;
  };
  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "admin_pusat":
        return "default";
      case "admin_unit":
        return "secondary";
      case "user_pimpinan":
        return "destructive";
      default:
        return "outline";
    }
  };
  const getPageNumbers = () => {
    const pages: number[] = [];
    const maxVisiblePages = 5;
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push(-1); // ellipsis
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push(-1);
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push(-1);
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push(-2);
        pages.push(totalPages);
      }
    }
    return pages;
  };
  if (user?.role !== "admin_pusat") {
    return <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            Anda tidak memiliki akses ke halaman ini.
          </p>
        </div>
      </DashboardLayout>;
  }
  return <DashboardLayout>
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
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {isStatsLoading ? <>
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
            </> : <>
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
                  <div className="text-2xl font-bold text-primary">
                    {stats.admin_unit}
                  </div>
                  <p className="text-sm text-muted-foreground">Admin Unit</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-destructive">
                    {stats.user_pimpinan}
                  </div>
                  <p className="text-sm text-muted-foreground">Pimpinan</p>
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
            </>}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Daftar Semua Pengguna
              {!isLoading && <span className="text-sm font-normal text-muted-foreground ml-2">
                  ({totalCount} pengguna)
                </span>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Cari nama, NIP, atau email..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10" />
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
                  <SelectItem value="user_pimpinan">Pimpinan</SelectItem>
                  <SelectItem value="user_unit">User Unit</SelectItem>
                </SelectContent>
              </Select>

              <Select value={workUnitFilter} onValueChange={setWorkUnitFilter}>
                <SelectTrigger>
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter Unit Kerja" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Unit</SelectItem>
                  {workUnits.map(unit => <SelectItem key={unit.id} value={unit.id.toString()}>
                      {unit.name}
                    </SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {isLoading ? <div className="py-4">
                <TableSkeleton rows={5} />
              </div> : <>
                <ResponsiveTableWrapper>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nama</TableHead>
                        <TableHead className="hidden md:table-cell">NIP</TableHead>
                        <TableHead className="hidden lg:table-cell">Email</TableHead>
                        <TableHead className="hidden xl:table-cell">Telepon</TableHead>
                        <TableHead className="hidden sm:table-cell">Unit Kerja</TableHead>
                        <TableHead className="hidden sm:table-cell">Role</TableHead>
                        <TableHead className="text-right">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.length === 0 ? <TableRow>
                          <TableCell colSpan={7} className="p-0 border-none">
                            <div className="py-12">
                              {searchQuery || roleFilter !== "all" || workUnitFilter !== "all" ? <SearchState message="Tidak ada pengguna yang sesuai dengan filter pencarian" /> : <NoDataState message="Belum ada data pengguna" />}
                            </div>
                          </TableCell>
                        </TableRow> : users.map(u => <TableRow key={u.id}>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="font-medium text-sm sm:text-base">{u.name}</span>
                                <span className="text-xs text-muted-foreground md:hidden">{u.nip}</span>
                                <span className="text-[10px] text-muted-foreground sm:hidden line-clamp-1 mt-0.5">{u.work_unit_name}</span>
                                <div className="mt-1 sm:hidden">
                                  <Badge variant={getRoleBadgeVariant(u.role)} className="text-[10px] px-1.5 py-0 h-5">
                                    {getRoleName(u.role)}
                                  </Badge>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="hidden md:table-cell">{u.nip}</TableCell>
                            <TableCell className="hidden lg:table-cell">{u.email}</TableCell>
                            <TableCell className="hidden xl:table-cell">{u.phone || "-"}</TableCell>
                            <TableCell className="hidden sm:table-cell">{u.work_unit_name}</TableCell>
                            <TableCell className="hidden sm:table-cell">
                              <Badge variant={getRoleBadgeVariant(u.role)}>
                                {getRoleName(u.role)}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="sm" onClick={() => handleOpenRoleDialog(u)} className="gap-2 h-8 px-2 md:h-9 md:px-4">
                                <UserCog className="h-4 w-4" />
                                <span className="hidden md:inline">Ubah Role</span>
                              </Button>
                            </TableCell>
                          </TableRow>)}
                    </TableBody>
                  </Table>
                </ResponsiveTableWrapper>

                {/* Pagination */}
                {totalPages > 1 && <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-sm text-muted-foreground">
                      Menampilkan {(currentPage - 1) * ITEMS_PER_PAGE + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, totalCount)} dari {totalCount} pengguna
                    </p>
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <Button variant="ghost" size="sm" onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="h-8 w-8 p-0">
                            <ChevronsLeft className="h-4 w-4" />
                          </Button>
                        </PaginationItem>
                        <PaginationItem>
                          <PaginationPrevious onClick={() => setCurrentPage(p => Math.max(1, p - 1))} className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"} />
                        </PaginationItem>
                        
                        {getPageNumbers().map((page, index) => <PaginationItem key={index} className="hidden sm:inline-flex">
                            {page < 0 ? <span className="px-2">...</span> : <PaginationLink onClick={() => setCurrentPage(page)} isActive={currentPage === page} className="cursor-pointer">
                                {page}
                              </PaginationLink>}
                          </PaginationItem>)}
                        
                        <PaginationItem className="sm:hidden">
                          <span className="px-2 text-sm">
                            {currentPage} / {totalPages}
                          </span>
                        </PaginationItem>

                        <PaginationItem>
                          <PaginationNext onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"} />
                        </PaginationItem>
                        <PaginationItem>
                          <Button variant="ghost" size="sm" onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} className="h-8 w-8 p-0">
                            <ChevronsRight className="h-4 w-4" />
                          </Button>
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>}
              </>}
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
                  <SelectItem value="user_pimpinan">Pimpinan</SelectItem>
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
            <Button variant="outline" onClick={() => setIsRoleDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleChangeRole} disabled={isLoading || !newRole}>
              {isLoading ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>;
}