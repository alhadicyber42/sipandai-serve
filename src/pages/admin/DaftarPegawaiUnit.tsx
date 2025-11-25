import { useState, useEffect } from "react";
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
import { Users, Search, Filter, Eye } from "lucide-react";
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

export default function DaftarPegawaiUnit() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [workUnits, setWorkUnits] = useState<WorkUnit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [workUnitFilter, setWorkUnitFilter] = useState<string>("all");

  useEffect(() => {
    if (user) {
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

      // Load employees based on user role
      let query = supabase
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

      // If user is admin_unit, only show users from their unit
      if (user?.role === "admin_unit" && user?.work_unit_id) {
        query = query.eq("work_unit_id", user.work_unit_id);
      }

      const { data: profiles } = await query;

      if (profiles) {
        const employeeList: Employee[] = [];

        for (const profile of profiles) {
          // Get user role from user_roles table, fallback to profiles.role
          const { data: roleData, error: roleError } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", profile.id)
            .maybeSingle();

          employeeList.push({
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

        setEmployees(employeeList);
      }
    } catch (error: any) {
      console.error("Error loading data:", error);
      toast.error("Gagal memuat data pegawai");
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

  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.nip.includes(searchQuery) ||
      emp.email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesWorkUnit =
      workUnitFilter === "all" ||
      emp.work_unit_id?.toString() === workUnitFilter;

    return matchesSearch && matchesWorkUnit;
  });

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
                    {filteredEmployees.length === 0 ? (
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
                      filteredEmployees.map((emp) => (
                        <TableRow key={emp.id}>
                          <TableCell className="font-medium">
                            {emp.name}
                          </TableCell>
                          <TableCell>{emp.nip}</TableCell>
                          <TableCell>{emp.email}</TableCell>
                          <TableCell>{emp.phone || "-"}</TableCell>
                          <TableCell>{emp.work_unit_name}</TableCell>
                          <TableCell>
                            <Badge variant={getRoleBadgeVariant(emp.role)}>
                              {getRoleName(emp.role)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/admin/employee/${emp.id}`)}
                              className="gap-2"
                            >
                              <Eye className="h-4 w-4" />
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
          </CardContent>
        </Card>

        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">
            <strong>Total Pegawai:</strong> {filteredEmployees.length} orang
          </p>
        </div>
      </div>
    </DashboardLayout >
  );
}
