import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/DashboardLayout";
import { ServiceList } from "@/components/ServiceList";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, CalendarIcon, Link as LinkIcon, Trash2, CheckCircle, XCircle } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { LEAVE_LABELS } from "@/lib/constants";
import { z } from "zod";

export default function Cuti() {
  const { user } = useAuth();
  const [services, setServices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [documentLinks, setDocumentLinks] = useState<string[]>([]);
  const [currentLink, setCurrentLink] = useState("");

  useEffect(() => {
    loadServices();
  }, [user]);

  const loadServices = async () => {
    if (!user) return;

    setIsLoading(true);
    let query = supabase
      .from("services")
      .select("*")
      .eq("service_type", "cuti");

    if (user.role === "user_unit") {
      query = query.eq("user_id", user.id);
    } else if (user.role === "admin_unit") {
      query = query.eq("work_unit_id", user.work_unit_id);
    }

    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) {
      toast.error("Gagal memuat data");
      setServices([]);
      setIsLoading(false);
      return;
    }

    const list = (data as any[]) || [];
    
    if (list.length > 0) {
      // Load leave_details
      const ids = list.map((s) => s.id);
      const { data: details } = await supabase
        .from("leave_details")
        .select("*")
        .in("service_id", ids);

      const byService: Record<string, any[]> = {};
      (details || []).forEach((d: any) => {
        byService[d.service_id] = [...(byService[d.service_id] || []), d];
      });

      // Load profiles and work_units
      const userIds = [...new Set(list.map(s => s.user_id))];
      const workUnitIds = [...new Set(list.map(s => s.work_unit_id))];

      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, name")
        .in("id", userIds);

      const { data: workUnitsData } = await supabase
        .from("work_units")
        .select("id, name")
        .in("id", workUnitIds);

      const profilesMap = new Map((profilesData || []).map(p => [p.id, p]));
      const workUnitsMap = new Map((workUnitsData || []).map(w => [w.id, w]));

      setServices(list.map((s) => ({
        ...s,
        leave_details: byService[s.id] || [],
        profiles: profilesMap.get(s.user_id),
        work_units: workUnitsMap.get(s.work_unit_id),
      })));
    } else {
      setServices([]);
    }
    
    setIsLoading(false);
  };

  const addDocumentLink = () => {
    if (!currentLink.trim()) {
      toast.error("Masukkan link dokumen");
      return;
    }

    // Validate URL
    const urlSchema = z.string().url({ message: "Link tidak valid" });
    const validation = urlSchema.safeParse(currentLink.trim());

    if (!validation.success) {
      toast.error("Link tidak valid. Pastikan menggunakan format yang benar (https://...)");
      return;
    }

    setDocumentLinks([...documentLinks, currentLink.trim()]);
    setCurrentLink("");
    toast.success("Link dokumen ditambahkan");
  };

  const removeDocumentLink = (index: number) => {
    setDocumentLinks(documentLinks.filter((_, i) => i !== index));
    toast.success("Link dokumen dihapus");
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const title = formData.get("title") as string;
    const leaveType = formData.get("leave_type") as string;
    const reason = formData.get("reason") as string;
    const substituteEmployee = formData.get("substitute_employee") as string;
    const emergencyContact = formData.get("emergency_contact") as string;

    if (!startDate || !endDate) {
      toast.error("Pilih tanggal mulai dan selesai");
      setIsSubmitting(false);
      return;
    }

    const totalDays = differenceInDays(endDate, startDate) + 1;

    // Insert service
    const { data: serviceData, error: serviceError } = await supabase
      .from("services")
      .insert({
        user_id: user!.id,
        work_unit_id: user!.work_unit_id,
        service_type: "cuti",
        status: "submitted",
        title,
        description: `${LEAVE_LABELS[leaveType as keyof typeof LEAVE_LABELS]} - ${totalDays} hari`,
        documents: documentLinks,
      })
      .select()
      .single();

    if (serviceError) {
      toast.error("Gagal mengajukan cuti");
      setIsSubmitting(false);
      return;
    }

    // Insert leave details
    const { error: leaveError } = await supabase.from("leave_details").insert({
      service_id: serviceData.id,
      leave_type: leaveType as any,
      start_date: format(startDate, "yyyy-MM-dd"),
      end_date: format(endDate, "yyyy-MM-dd"),
      total_days: totalDays,
      substitute_employee: substituteEmployee,
      reason,
      emergency_contact: emergencyContact,
    });

    if (leaveError) {
      toast.error("Gagal menyimpan detail cuti");
    } else {
      toast.success("Permohonan cuti berhasil diajukan");
      setIsDialogOpen(false);
      setStartDate(undefined);
      setEndDate(undefined);
      setDocumentLinks([]);
      setCurrentLink("");
      loadServices();
    }

    setIsSubmitting(false);
  };

  const isAdmin = user?.role === "admin_unit" || user?.role === "admin_pusat";

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Cuti Pegawai</h1>
            <p className="text-muted-foreground mt-1">
              {user?.role === "user_unit" ? "Kelola permohonan cuti Anda" : "Review permohonan cuti"}
            </p>
          </div>
          {user?.role === "user_unit" && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Ajukan Cuti
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
                <DialogHeader>
                  <DialogTitle>Ajukan Permohonan Cuti</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                  <ScrollArea className="flex-1 pr-4">
                    <div className="space-y-4 pb-4">
                      <div className="space-y-2">
                        <Label htmlFor="title">Judul Permohonan</Label>
                        <Input id="title" name="title" placeholder="Contoh: Cuti Tahunan Bulan Februari" required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="leave_type">Jenis Cuti</Label>
                        <Select name="leave_type" required>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih jenis cuti" />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(LEAVE_LABELS).map(([key, label]) => (
                              <SelectItem key={key} value={key}>
                                {label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Tanggal Mulai</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className={cn("w-full justify-start text-left font-normal", !startDate && "text-muted-foreground")}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {startDate ? format(startDate, "PPP", { locale: localeId }) : "Pilih tanggal"}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus className="pointer-events-auto" />
                            </PopoverContent>
                          </Popover>
                        </div>
                        <div className="space-y-2">
                          <Label>Tanggal Selesai</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className={cn("w-full justify-start text-left font-normal", !endDate && "text-muted-foreground")}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {endDate ? format(endDate, "PPP", { locale: localeId }) : "Pilih tanggal"}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <Calendar mode="single" selected={endDate} onSelect={setEndDate} disabled={(date) => startDate ? date < startDate : false} initialFocus className="pointer-events-auto" />
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>
                      {startDate && endDate && (
                        <div className="p-3 bg-primary/10 rounded-lg">
                          <p className="text-sm font-medium">Total: {differenceInDays(endDate, startDate) + 1} hari</p>
                        </div>
                      )}
                      <div className="space-y-2">
                        <Label htmlFor="substitute_employee">Pegawai Pengganti</Label>
                        <Input id="substitute_employee" name="substitute_employee" placeholder="Nama pegawai pengganti" required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="reason">Alasan Cuti</Label>
                        <Textarea id="reason" name="reason" placeholder="Jelaskan alasan permohonan cuti..." rows={3} required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="emergency_contact">Kontak Darurat</Label>
                        <Input id="emergency_contact" name="emergency_contact" placeholder="Nomor telepon yang dapat dihubungi" required />
                      </div>

                      <div className="space-y-2">
                        <Label>Dokumen Pendukung (Link)</Label>
                        <div className="flex gap-2">
                          <div className="flex-1">
                            <Input
                              placeholder="https://drive.google.com/... atau https://www.dropbox.com/..."
                              value={currentLink}
                              onChange={(e) => setCurrentLink(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  addDocumentLink();
                                }
                              }}
                            />
                          </div>
                          <Button type="button" onClick={addDocumentLink} variant="outline" size="icon">
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        {documentLinks.length > 0 && (
                          <div className="space-y-2 mt-2">
                            {documentLinks.map((link, index) => (
                              <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                                <LinkIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                <a
                                  href={link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm text-primary hover:underline truncate flex-1"
                                >
                                  {link}
                                </a>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeDocumentLink(index)}
                                  className="h-8 w-8 flex-shrink-0"
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Tambahkan link ke dokumen pendukung (Google Drive, Dropbox, OneDrive, dll)
                        </p>
                      </div>
                    </div>
                  </ScrollArea>

                  <div className="flex flex-col sm:flex-row gap-2 justify-end pt-4 border-t mt-4">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="w-full sm:w-auto">
                      Batal
                    </Button>
                    <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
                      {isSubmitting ? "Mengirim..." : "Ajukan Cuti"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {isAdmin && (
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{services.length}</div>
                <p className="text-sm text-muted-foreground">Total Usulan</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-warning">
                  {services.filter((s) => s.status === "submitted" || s.status === "approved_by_unit").length}
                </div>
                <p className="text-sm text-muted-foreground">Diproses</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-success">
                  {services.filter((s) => s.status === "approved_final").length}
                </div>
                <p className="text-sm text-muted-foreground">Disetujui</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-destructive">
                  {
                    services.filter(
                      (s) => s.status === "returned_to_user" || s.status === "returned_to_unit"
                    ).length
                  }
                </div>
                <p className="text-sm text-muted-foreground">Dikembalikan/Ditolak</p>
              </CardContent>
            </Card>
          </div>
        )}

        <ServiceList
          services={services}
          isLoading={isLoading}
          onReload={loadServices}
          showFilters={isAdmin}
          allowActions={isAdmin}
        />
      </div>
    </DashboardLayout>
  );
}
