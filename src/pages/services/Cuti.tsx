import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { StatusBadge } from "@/components/StatusBadge";
import { ServiceHistory } from "@/components/ServiceHistory";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, FileText, Eye, CheckCircle, XCircle, CalendarIcon, Link as LinkIcon, Trash2, ExternalLink } from "lucide-react";
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
    } else {
      const list = (data as any[]) || [];
      // Ambil leave_details terpisah dan gabungkan ke services
      const ids = list.map((s) => s.id);
      if (ids.length > 0) {
        const { data: details, error: ldError } = await supabase
          .from("leave_details")
          .select("*")
          .in("service_id", ids);
        if (ldError) {
          console.error("Gagal memuat detail cuti:", ldError);
          setServices(list);
        } else {
          const byService: Record<string, any[]> = {};
          (details || []).forEach((d: any) => {
            byService[d.service_id] = [...(byService[d.service_id] || []), d];
          });
          setServices(list.map((s) => ({ ...s, leave_details: byService[s.id] || [] })));
        }
      } else {
        setServices(list);
      }
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

  const handleApprove = async (serviceId: string) => {
    const newStatus = user?.role === "admin_unit" ? "approved_by_unit" : "approved_final";
    const approvedAt = user?.role === "admin_pusat" ? new Date().toISOString() : null;

    // Update service status
    const { error: serviceError } = await supabase
      .from("services")
      .update({
        status: newStatus,
        ...(approvedAt && { approved_at: approvedAt }),
      })
      .eq("id", serviceId);

    if (serviceError) {
      toast.error("Gagal menyetujui cuti");
      return;
    }

    // Add to service history
    const { error: historyError } = await supabase
      .from("service_history")
      .insert({
        service_id: serviceId,
        service_type: "cuti",
        actor_id: user!.id,
        actor_role: user!.role as any,
        action: `Disetujui oleh ${user?.role === "admin_unit" ? "Admin Unit" : "Admin Pusat"}`,
        notes: "Permohonan cuti telah disetujui",
      });

    if (historyError) {
      console.error("Error adding history:", historyError);
    }

    toast.success("Cuti berhasil disetujui");
    setSelectedService(null);
    loadServices();
  };

  const handleReturn = async (serviceId: string, note: string) => {
    const newStatus = user?.role === "admin_unit" ? "returned_to_user" : "returned_to_unit";

    // Update service status
    const { error: serviceError } = await supabase
      .from("services")
      .update({
        status: newStatus,
      })
      .eq("id", serviceId);

    if (serviceError) {
      toast.error("Gagal mengembalikan cuti");
      return;
    }

    // Add to service history
    const { error: historyError } = await supabase
      .from("service_history")
      .insert({
        service_id: serviceId,
        service_type: "cuti",
        actor_id: user!.id,
        actor_role: user!.role as any,
        action: `Dikembalikan oleh ${user?.role === "admin_unit" ? "Admin Unit" : "Admin Pusat"}`,
        notes: note,
      });

    if (historyError) {
      console.error("Error adding history:", historyError);
    }

    toast.success("Cuti dikembalikan untuk revisi");
    setSelectedService(null);
    loadServices();
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
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Ajukan Permohonan Cuti</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
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
                  <div className="grid grid-cols-2 gap-4">
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

                  <div className="flex gap-2 justify-end">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Batal
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? "Mengirim..." : "Ajukan Cuti"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <div className="grid gap-4">
          {isLoading ? (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-4 text-muted-foreground">Memuat data...</p>
              </CardContent>
            </Card>
          ) : services.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">Belum ada permohonan cuti</p>
              </CardContent>
            </Card>
          ) : (
            services.map((service) => {
              const leaveDetail = service.leave_details?.[0];
              return (
                <Card key={service.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{service.title}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          {user?.role !== "user_unit" && `${service.profiles?.name} • `}
                          {leaveDetail && `${format(new Date(leaveDetail.start_date), "dd MMM")} - ${format(new Date(leaveDetail.end_date), "dd MMM yyyy")}`}
                        </p>
                      </div>
                      <StatusBadge status={service.status} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    {leaveDetail && (
                      <div className="space-y-2 mb-4">
                        <p className="text-sm">
                          <span className="font-medium">Jenis: </span>
                          {LEAVE_LABELS[leaveDetail.leave_type as keyof typeof LEAVE_LABELS]}
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">Durasi: </span>
                          {leaveDetail.total_days} hari
                        </p>
                      </div>
                    )}
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" onClick={() => setSelectedService(service)}>
                          <Eye className="mr-2 h-4 w-4" />
                          Detail
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Detail Permohonan Cuti</DialogTitle>
                        </DialogHeader>
                        {selectedService && selectedService.leave_details?.[0] && (
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label>Jenis Cuti</Label>
                                <p className="text-sm mt-1">
                                  {LEAVE_LABELS[selectedService.leave_details[0].leave_type as keyof typeof LEAVE_LABELS]}
                                </p>
                              </div>
                              <div>
                                <Label>Total Hari</Label>
                                <p className="text-sm mt-1">{selectedService.leave_details[0].total_days} hari</p>
                              </div>
                              <div>
                                <Label>Tanggal Mulai</Label>
                                <p className="text-sm mt-1">
                                  {format(new Date(selectedService.leave_details[0].start_date), "dd MMMM yyyy", { locale: localeId })}
                                </p>
                              </div>
                              <div>
                                <Label>Tanggal Selesai</Label>
                                <p className="text-sm mt-1">
                                  {format(new Date(selectedService.leave_details[0].end_date), "dd MMMM yyyy", { locale: localeId })}
                                </p>
                              </div>
                            </div>
                            <div>
                              <Label>Pegawai Pengganti</Label>
                              <p className="text-sm mt-1">{selectedService.leave_details[0].substitute_employee}</p>
                            </div>
                            <div>
                              <Label>Alasan</Label>
                              <p className="text-sm mt-1">{selectedService.leave_details[0].reason}</p>
                            </div>
                            <div>
                              <Label>Kontak Darurat</Label>
                              <p className="text-sm mt-1">{selectedService.leave_details[0].emergency_contact}</p>
                            </div>

                            {selectedService.documents && selectedService.documents.length > 0 && (
                              <div>
                                <Label>Dokumen Pendukung</Label>
                                <div className="space-y-2 mt-2">
                                  {selectedService.documents.map((link: string, index: number) => (
                                    <a
                                      key={index}
                                      href={link}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-2 p-2 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
                                    >
                                      <LinkIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                      <span className="text-sm text-primary hover:underline truncate flex-1">
                                        {link}
                                      </span>
                                      <ExternalLink className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                    </a>
                                  ))}
                                </div>
                              </div>
                            )}

                            <div>
                              <Label>Status</Label>
                              <div className="mt-1">
                                <StatusBadge status={selectedService.status} />
                              </div>
                            </div>

                            <ServiceHistory
                              serviceId={selectedService.id}
                              serviceType="cuti"
                            />

                            {isAdmin && (selectedService.status === "submitted" || selectedService.status === "approved_by_unit") && (
                              <div className="flex gap-2 pt-4 border-t">
                                <Button className="flex-1" onClick={() => handleApprove(selectedService.id)}>
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                  Setujui
                                </Button>
                                <Button
                                  variant="destructive"
                                  className="flex-1"
                                  onClick={() => {
                                    const note = prompt("Alasan pengembalian:");
                                    if (note) handleReturn(selectedService.id, note);
                                  }}
                                >
                                  <XCircle className="mr-2 h-4 w-4" />
                                  Kembalikan
                                </Button>
                              </div>
                            )}
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
