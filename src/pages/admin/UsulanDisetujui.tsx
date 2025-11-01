import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ServiceHistory } from "@/components/ServiceHistory";
import { CheckCircle, Search, Eye, FileText } from "lucide-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { toast } from "sonner";

interface Service {
  id: string;
  title: string;
  service_type: string;
  status: string;
  created_at: string;
  approved_at: string | null;
  user_id: string;
  profiles: {
    name: string;
  };
}

export default function UsulanDisetujui() {
  const { user } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  useEffect(() => {
    if (user?.role === "admin_unit") {
      loadServices();
    }
  }, [user]);

  const loadServices = async () => {
    try {
      const { data, error } = await supabase
        .from("services")
        .select(`
          *,
          profiles!services_user_id_fkey (name)
        `)
        .eq("work_unit_id", user?.work_unit_id)
        .in("status", ["approved_by_unit", "approved_final"])
        .order("approved_at", { ascending: false });

      if (error) throw error;
      setServices(data as any || []);
    } catch (error: any) {
      console.error("Error loading services:", error);
      toast.error("Gagal memuat data usulan");
    } finally {
      setIsLoading(false);
    }
  };

  const getServiceTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      kenaikan_pangkat: "Kenaikan Pangkat",
      mutasi: "Mutasi",
      pensiun: "Pensiun",
      cuti: "Cuti",
    };
    return labels[type] || type;
  };

  const getStatusBadge = (status: string) => {
    if (status === "approved_final") {
      return (
        <Badge className="bg-green-100 text-green-800 gap-1">
          <CheckCircle className="h-3 w-3" />
          Disetujui Final
        </Badge>
      );
    }
    return (
      <Badge className="bg-blue-100 text-blue-800 gap-1">
        <CheckCircle className="h-3 w-3" />
        Disetujui Unit
      </Badge>
    );
  };

  const filteredServices = services.filter((service) => {
    const matchesSearch =
      service.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.profiles.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === "all" || service.service_type === typeFilter;

    return matchesSearch && matchesType;
  });

  const stats = {
    total: services.length,
    approved_by_unit: services.filter((s) => s.status === "approved_by_unit").length,
    approved_final: services.filter((s) => s.status === "approved_final").length,
  };

  if (user?.role !== "admin_unit") {
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
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Usulan Disetujui</h1>
          <p className="text-muted-foreground mt-1">
            Daftar usulan yang telah disetujui oleh unit Anda
          </p>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-sm text-muted-foreground">Total Usulan Disetujui</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-blue-600">
                {stats.approved_by_unit}
              </div>
              <p className="text-sm text-muted-foreground">Menunggu Pusat</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-green-600">
                {stats.approved_final}
              </div>
              <p className="text-sm text-muted-foreground">Disetujui Final</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Daftar Usulan</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari usulan atau nama pegawai..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter Jenis Layanan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Jenis</SelectItem>
                  <SelectItem value="kenaikan_pangkat">Kenaikan Pangkat</SelectItem>
                  <SelectItem value="mutasi">Mutasi</SelectItem>
                  <SelectItem value="pensiun">Pensiun</SelectItem>
                  <SelectItem value="cuti">Cuti</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-sm text-muted-foreground">Memuat data...</p>
              </div>
            ) : filteredServices.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Tidak ada usulan yang disetujui</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredServices.map((service) => (
                  <Card
                    key={service.id}
                    className="hover:shadow-md transition-shadow"
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <h3 className="font-semibold text-lg">{service.title}</h3>
                          <div className="flex flex-wrap items-center gap-2 text-sm">
                            <Badge variant="outline">
                              {getServiceTypeLabel(service.service_type)}
                            </Badge>
                            <span className="text-muted-foreground">
                              {service.profiles.name}
                            </span>
                            {service.approved_at && (
                              <>
                                <span className="text-muted-foreground">•</span>
                                <span className="text-muted-foreground">
                                  Disetujui:{" "}
                                  {format(
                                    new Date(service.approved_at),
                                    "d MMM yyyy",
                                    { locale: localeId }
                                  )}
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {getStatusBadge(service.status)}
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedService(service)}
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                Detail
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>Detail Usulan</DialogTitle>
                              </DialogHeader>
                              {selectedService && (
                                <div className="space-y-6">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <Label>Judul</Label>
                                      <p className="text-sm mt-1">{selectedService.title}</p>
                                    </div>
                                    <div>
                                      <Label>Jenis Layanan</Label>
                                      <p className="text-sm mt-1">
                                        {getServiceTypeLabel(selectedService.service_type)}
                                      </p>
                                    </div>
                                    <div>
                                      <Label>Nama Pegawai</Label>
                                      <p className="text-sm mt-1">
                                        {selectedService.profiles.name}
                                      </p>
                                    </div>
                                    <div>
                                      <Label>Status</Label>
                                      <div className="mt-1">
                                        {getStatusBadge(selectedService.status)}
                                      </div>
                                    </div>
                                  </div>

                                  <ServiceHistory
                                    serviceId={selectedService.id}
                                    serviceType={selectedService.service_type}
                                  />
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
