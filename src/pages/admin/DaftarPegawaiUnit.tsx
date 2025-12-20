import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
import { Users, Search, Filter, Eye, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { TableSkeleton } from "@/components/skeletons";
import { NoDataState, SearchState } from "@/components/EmptyState";

interface Employee {
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

const PAGE_SIZE = 100;

export default function DaftarPegawaiUnit() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [workUnits, setWorkUnits] = useState<WorkUnit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [workUnitFilter, setWorkUnitFilter] = useState<string>("all");
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1); // Reset to first page on search
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [workUnitFilter]);

  // Load work units once
  useEffect(() => {
    const loadWorkUnits = async () => {
      const { data: units } = await supabase
        .from("work_units")
        .select("*")
        .order("name");
      if (units) setWorkUnits(units);
    };
    loadWorkUnits();
  }, []);

  // Load employees with pagination
  const loadEmployees = useCallback(async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const from = (currentPage - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      // Build base query for counting
      let countQuery = supabase
        .from("profiles")
        .select("id", { count: "exact", head: true });

      // Build data query
      let dataQuery = supabase
        .from("profiles")
        .select(`
          id,
          name,
          nip,
          email,
          phone,
          work_unit_id,
          role,
          work_units (name)
        `)
        .order("name")
        .range(from, to);

      // Apply work unit filter for admin_unit
      if (user.role === "admin_unit" && user.work_unit_id) {
        countQuery = countQuery.eq("work_unit_id", user.work_unit_id);
        dataQuery = dataQuery.eq("work_unit_id", user.work_unit_id);
      }

      // Apply work unit filter from dropdown
      if (workUnitFilter !== "all") {
        countQuery = countQuery.eq("work_unit_id", parseInt(workUnitFilter));
        dataQuery = dataQuery.eq("work_unit_id", parseInt(workUnitFilter));
      }

      // Apply search filter
      if (debouncedSearch.length >= 2) {
        const searchFilter = `name.ilike.%${debouncedSearch}%,nip.ilike.%${debouncedSearch}%,email.ilike.%${debouncedSearch}%`;
        countQuery = countQuery.or(searchFilter);
        dataQuery = dataQuery.or(searchFilter);
      }

      // Execute queries in parallel
      const [countResult, dataResult] = await Promise.all([
        countQuery,
        dataQuery
      ]);

      if (countResult.error) {
        throw countResult.error;
      }

      if (dataResult.error) {
        throw dataResult.error;
      }

      setTotalCount(countResult.count || 0);

      if (dataResult.data) {
        // Get user roles in a single batch query
        const userIds = dataResult.data.map(p => p.id);
        const { data: rolesData } = await supabase
          .from("user_roles")
          .select("user_id, role")
          .in("user_id", userIds);

        const rolesMap = new Map(rolesData?.map(r => [r.user_id, r.role]) || []);

        const employeeList: Employee[] = dataResult.data.map((profile) => ({
          id: profile.id,
          name: profile.name,
          nip: profile.nip,
          phone: profile.phone,
          work_unit_id: profile.work_unit_id,
          work_unit_name: (profile.work_units as any)?.name || "-",
          email: profile.email || "-",
          role: rolesMap.get(profile.id) || profile.role || "user_unit",
        }));

        setEmployees(employeeList);
      }
    } catch (error: any) {
      console.error("Error loading data:", error);
      toast.error("Gagal memuat data pegawai");
    } finally {
      setIsLoading(false);
    }
  }, [user, currentPage, workUnitFilter, debouncedSearch]);

  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

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

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push("...");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push("...");
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push("...");
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push("...");
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Enhanced Header with Gradient */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-400 p-6 md:p-8 text-white shadow-xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-16 -translate-x-16 blur-2xl" />
          
          <div className="relative flex items-start gap-4">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <Users className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">
                Daftar Pegawai Unit
              </h1>
              <p className="text-white/90 mt-1 text-sm md:text-base">
                {user?.role === "admin_pusat"
                  ? "Daftar semua pegawai di seluruh unit kerja"
                  : "Daftar pegawai di unit kerja Anda"}
              </p>
            </div>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Data Pegawai
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari nama, NIP, atau email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {user?.role === "admin_pusat" && (
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
              )}
            </div>

            {isLoading ? (
              <div className="py-4">
                <TableSkeleton rows={10} />
              </div>
            ) : (
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
                    {employees.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={7}
                          className="p-0 border-none"
                        >
                          <div className="py-12">
                            {searchQuery || workUnitFilter !== "all" ? (
                              <SearchState message="Tidak ada pegawai yang sesuai dengan filter pencarian" />
                            ) : (
                              <NoDataState message="Belum ada data pegawai" />
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      employees.map((emp) => (
                        <TableRow key={emp.id}>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium text-sm sm:text-base">{emp.name}</span>
                              <span className="text-xs text-muted-foreground md:hidden">{emp.nip}</span>
                              <span className="text-[10px] text-muted-foreground sm:hidden line-clamp-1 mt-0.5">{emp.work_unit_name}</span>
                              <div className="mt-1 sm:hidden">
                                <Badge variant={getRoleBadgeVariant(emp.role)} className="text-[10px] px-1.5 py-0 h-5">
                                  {getRoleName(emp.role)}
                                </Badge>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">{emp.nip}</TableCell>
                          <TableCell className="hidden lg:table-cell">{emp.email}</TableCell>
                          <TableCell className="hidden xl:table-cell">{emp.phone || "-"}</TableCell>
                          <TableCell className="hidden sm:table-cell">{emp.work_unit_name}</TableCell>
                          <TableCell className="hidden sm:table-cell">
                            <Badge variant={getRoleBadgeVariant(emp.role)}>
                              {getRoleName(emp.role)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/admin/employee/${emp.id}`)}
                              className="h-8 w-8 p-0 md:w-auto md:h-9 md:px-4 md:py-2"
                            >
                              <Eye className="h-4 w-4 md:mr-2" />
                              <span className="hidden md:inline">Lihat Detail</span>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </ResponsiveTableWrapper>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t">
                <p className="text-sm text-muted-foreground order-2 sm:order-1">
                  Menampilkan {((currentPage - 1) * PAGE_SIZE) + 1} - {Math.min(currentPage * PAGE_SIZE, totalCount)} dari {totalCount} pegawai
                </p>
                
                <div className="flex items-center gap-1 order-1 sm:order-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handlePageChange(1)}
                    disabled={currentPage === 1 || isLoading}
                  >
                    <ChevronsLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1 || isLoading}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  
                  <div className="flex items-center gap-1">
                    {getPageNumbers().map((page, index) => (
                      typeof page === "number" ? (
                        <Button
                          key={index}
                          variant={currentPage === page ? "default" : "outline"}
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handlePageChange(page)}
                          disabled={isLoading}
                        >
                          {page}
                        </Button>
                      ) : (
                        <span key={index} className="px-2 text-muted-foreground">
                          {page}
                        </span>
                      )
                    ))}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages || isLoading}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handlePageChange(totalPages)}
                    disabled={currentPage === totalPages || isLoading}
                  >
                    <ChevronsRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">
            <strong>Total Pegawai:</strong> {totalCount} orang
            {totalPages > 1 && ` • Halaman ${currentPage} dari ${totalPages}`}
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}