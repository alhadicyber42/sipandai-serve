import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/DashboardLayout";
import { ServiceList } from "@/components/ServiceList";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, CalendarIcon, Link as LinkIcon, Trash2, AlertCircle, Clock, CalendarX, Info, CalendarCheck } from "lucide-react";
import { format, differenceInDays, getYear } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { LEAVE_LABELS } from "@/lib/constants";
import { z } from "zod";

export default function Cuti() {
  const { user } = useAuth();
  const [services, setServices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [documentLinks, setDocumentLinks] = useState<string[]>([]);
  const [currentLink, setCurrentLink] = useState("");
  const [editingDocuments, setEditingDocuments] = useState<string[]>([]);
  const [savingDocuments, setSavingDocuments] = useState<Set<number>>(new Set());
  const [selectedLeaveType, setSelectedLeaveType] = useState<string>("");

  // Leave Balance State
  const [leaveStats, setLeaveStats] = useState({
    quota: 12, // Default annual quota
    carriedOver: 0, // N-1 quota (mocked for now as 0)
    used: 0,
    pending: 0,
    remaining: 12
  });

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

      const enrichedServices = list.map((s) => ({
        ...s,
        leave_details: byService[s.id] || [],
        profiles: profilesMap.get(s.user_id),
        work_units: workUnitsMap.get(s.work_unit_id),
      }));

      setServices(enrichedServices);

      // Calculate Leave Stats for User
      if (user.role === "user_unit") {
        const currentYear = getYear(new Date());
        let usedDays = 0;
        let pendingDays = 0;

        enrichedServices.forEach(service => {
          const details = service.leave_details[0];
          if (!details) return;

          // Only count Annual Leave (Cuti Tahunan) for the quota
          if (details.leave_type === 'tahunan') {
            const serviceYear = getYear(new Date(details.start_date));
            if (serviceYear === currentYear) {
              if (service.status === 'approved_final') {
                usedDays += details.total_days;
              } else if (['submitted', 'under_review_unit', 'under_review_central', 'approved_by_unit'].includes(service.status)) {
                pendingDays += details.total_days;
              }
            }
          }
        });

        setLeaveStats(prev => ({
          ...prev,
          used: usedDays,
          pending: pendingDays,
          remaining: (prev.quota + prev.carriedOver) - usedDays
        }));
      }

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

  const getLeaveRequirements = (type: string) => {
    switch (type) {
      case "sakit":
        return "Wajib melampirkan Surat Keterangan Dokter untuk cuti sakit lebih dari 1 hari.";
      case "melahirkan":
        return "Wajib melampirkan Surat Keterangan Dokter/Bidan (HPL). Diberikan untuk persalinan anak pertama sampai dengan ketiga.";
      case "alasan_penting":
        return "Wajib melampirkan dokumen pendukung (Surat Kematian, Surat Nikah, dll). Maksimal 1 bulan.";
      case "besar":
        return "Minimal telah bekerja 5 tahun secara terus menerus. Durasi maksimal 3 bulan.";
      case "di_luar_tanggungan_negara":
        return "Minimal telah bekerja 5 tahun secara terus menerus. Alasan mendesak/pribadi. Maksimal 3 tahun.";
      case "tahunan":
        return `Saldo cuti tahunan Anda: ${leaveStats.remaining} hari.`;
      default:
        return "";
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
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

    // Validation Logic
    if (leaveType === 'tahunan') {
      if (totalDays > leaveStats.remaining) {
        toast.error(`Saldo cuti tidak mencukupi. Sisa saldo: ${leaveStats.remaining} hari`);
        setIsSubmitting(false);
        return;
      }
    } else if (leaveType === 'sakit' && totalDays > 1 && documentLinks.length === 0) {
      toast.error("Cuti sakit lebih dari 1 hari wajib melampirkan surat keterangan dokter");
      setIsSubmitting(false);
      return;
    } else if ((leaveType === 'melahirkan' || leaveType === 'alasan_penting') && documentLinks.length === 0) {
      toast.error("Wajib melampirkan dokumen pendukung");
      setIsSubmitting(false);
      return;
    }

    // Auto-generate title
    const leaveLabel = LEAVE_LABELS[leaveType as keyof typeof LEAVE_LABELS];
    const title = `${leaveLabel} - ${user?.name}`;

    // Insert service
    const { data: serviceData, error: serviceError } = await supabase
      .from("services")
      .insert({
        user_id: user!.id,
        work_unit_id: user!.work_unit_id,
        service_type: "cuti",
        status: "submitted",
        title,
        description: `${leaveLabel} - ${totalDays} hari`,
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
      setSelectedLeaveType("");
      loadServices();
    }

    setIsSubmitting(false);
  };

  const handleEditService = (service: any) => {
    setEditingService(service);
    setIsEditDialogOpen(true);

    // Load existing document links
    if (service.documents && Array.isArray(service.documents)) {
      setEditingDocuments(service.documents);
    }
  };

  const handleSaveDocument = async (index: number) => {
    if (!editingService || !editingDocuments[index]?.trim()) {
      toast.error("Masukkan link dokumen terlebih dahulu");
      return;
    }

    // Validate URL
    const urlSchema = z.string().url({ message: "Link tidak valid" });
    const validation = urlSchema.safeParse(editingDocuments[index].trim());

    if (!validation.success) {
      toast.error("Link tidak valid. Pastikan menggunakan format yang benar (https://...)");
      return;
    }

    setSavingDocuments(prev => new Set(prev).add(index));

    try {
      const { error } = await supabase
        .from("services")
        .update({ documents: editingDocuments })
        .eq("id", editingService.id);

      if (error) throw error;

      toast.success("Dokumen berhasil disimpan");
      setEditingService({ ...editingService, documents: editingDocuments });
    } catch (error) {
      console.error(error);
      toast.error("Gagal menyimpan dokumen");
    } finally {
      setSavingDocuments(prev => {
        const newSet = new Set(prev);
        newSet.delete(index);
        return newSet;
      });
    }
  };

  const handleUpdateService = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!editingService) {
      toast.error("Data usulan tidak ditemukan");
      return;
    }

    setIsSubmitting(true);

    const { error } = await supabase
      .from("services")
      .update({
        status: "submitted",
        notes: [
          ...(editingService.notes || []),
          {
            actor: user!.name,
            role: user!.role,
            note: "Usulan telah diperbaiki dan diajukan kembali",
            timestamp: new Date().toISOString(),
          },
        ],
      })
      .eq("id", editingService.id);

    if (error) {
      toast.error("Gagal mengajukan ulang usulan");
      console.error(error);
    } else {
      toast.success("Usulan berhasil diajukan kembali");
      setIsEditDialogOpen(false);
      setEditingService(null);
      setEditingDocuments([]);
      loadServices();
    }

  };

  const isAdmin = user?.role === "admin_unit" || user?.role === "admin_pusat";

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Modern Header with Gradient */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-600 via-green-500 to-emerald-400 p-6 md:p-8 text-white shadow-xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -ml-24 -mb-24"></div>

          <div className="relative z-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 md:p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                    <CalendarCheck className="h-6 w-6 md:h-8 md:w-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl md:text-4xl font-bold text-white">Cuti Pegawai</h1>
                    <p className="text-sm md:text-base text-white/90 mt-1">
                      {user?.role === "user_unit"
                        ? "Kelola permohonan dan saldo cuti Anda"
                        : user?.role === "admin_unit"
                          ? "Review permohonan cuti unit Anda"
                          : "Kelola semua permohonan cuti"}
                    </p>
                  </div>
                </div>
              </div>

              {user?.role === "user_unit" && (
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="lg" className="gap-2 bg-white text-green-600 hover:bg-white/90 shadow-lg border-none">
                      <Plus className="h-5 w-5" />
                      <span className="hidden sm:inline">Ajukan Cuti</span>
                      <span className="sm:hidden">Ajukan</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="w-[95vw] sm:max-w-2xl max-h-[90vh] flex flex-col">
                    <DialogHeader>
                      <DialogTitle>Ajukan Permohonan Cuti</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                      <ScrollArea className="h-[60vh] sm:h-[65vh] pr-4">
                        <div className="space-y-4 pb-4">
                          <div className="space-y-2">
                            <Label htmlFor="leave_type">Jenis Cuti</Label>
                            <Select
                              name="leave_type"
                              required
                              onValueChange={(value) => setSelectedLeaveType(value)}
                            >
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
                            {selectedLeaveType && (
                              <Alert className="bg-blue-50 dark:bg-blue-950 border-blue-200 mt-2">
                                <Info className="h-4 w-4 text-blue-600" />
                                <AlertDescription className="text-xs text-blue-800 dark:text-blue-200">
                                  {getLeaveRequirements(selectedLeaveType)}
                                </AlertDescription>
                              </Alert>
                            )}
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
          </div>
        </div>

        {user?.role === "user_unit" && (
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-900">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  Saldo Cuti Tahunan
                </CardTitle>
                <CalendarCheck className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">{leaveStats.remaining} Hari</div>
                <p className="text-xs text-blue-600 dark:text-blue-300">
                  Dari total {leaveStats.quota + leaveStats.carriedOver} hari
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Cuti Terpakai
                </CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{leaveStats.used} Hari</div>
                <p className="text-xs text-muted-foreground">
                  Tahun {getYear(new Date())}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Menunggu Persetujuan
                </CardTitle>
                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{leaveStats.pending} Hari</div>
                <p className="text-xs text-muted-foreground">
                  Sedang diproses
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Saldo Penangguhan
                </CardTitle>
                <CalendarX className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{leaveStats.carriedOver} Hari</div>
                <p className="text-xs text-muted-foreground">
                  Sisa tahun lalu
                </p>
              </CardContent>
            </Card>
          </div>
        )}

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

        <div className="space-y-4">
          <h2 className="text-xl font-semibold tracking-tight">Riwayat Pengajuan Cuti</h2>
          <ServiceList
            services={services}
            isLoading={isLoading}
            onReload={loadServices}
            showFilters={isAdmin}
            allowActions={isAdmin}
            onEditService={user?.role === "user_unit" ? handleEditService : undefined}
          />
        </div>

        {/* Edit Dialog for Returned Services */}
        {user?.role === "user_unit" && (
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="w-[95vw] sm:max-w-3xl max-h-[90vh] flex flex-col">
              <DialogHeader>
                <DialogTitle>Perbaiki Usulan Cuti</DialogTitle>
              </DialogHeader>

              {editingService && editingService.notes && editingService.notes.length > 0 && (
                <Alert className="bg-orange-50 dark:bg-orange-950 border-orange-200">
                  <AlertCircle className="h-4 w-4 text-orange-600" />
                  <AlertDescription>
                    <p className="font-semibold text-orange-900 dark:text-orange-100 mb-2">
                      Catatan dari Admin:
                    </p>
                    <div className="space-y-2">
                      {editingService.notes.slice(-2).reverse().map((note: any, idx: number) => (
                        <div key={idx} className="text-sm text-orange-800 dark:text-orange-200">
                          <span className="font-medium">{note.actor}: </span>
                          {note.note}
                        </div>
                      ))}
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleUpdateService} className="flex flex-col flex-1 overflow-hidden">
                <ScrollArea className="h-[60vh] sm:h-[65vh] pr-4">
                  <div className="space-y-4 pb-4">
                    <div className="space-y-2">
                      <Label>Dokumen Pendukung</Label>
                      <div className="space-y-3">
                        {editingDocuments.map((link, index) => {
                          const isSaved = editingService?.documents?.[index] === link;
                          const hasChanges = editingService?.documents?.[index] !== link;

                          return (
                            <div key={index} className={`space-y-2 p-3 border rounded-lg ${isSaved ? 'border-green-500 bg-green-50 dark:bg-green-950' : ''}`}>
                              <Label className="flex items-center justify-between">
                                <span>Dokumen {index + 1}</span>
                                {isSaved && (
                                  <Badge variant="outline" className="border-green-500 text-green-700">Tersimpan</Badge>
                                )}
                              </Label>
                              <div className="flex gap-2">
                                <Input
                                  type="url"
                                  placeholder="https://drive.google.com/..."
                                  value={link}
                                  onChange={(e) => {
                                    const newLinks = [...editingDocuments];
                                    newLinks[index] = e.target.value;
                                    setEditingDocuments(newLinks);
                                  }}
                                  className="flex-1"
                                />
                                <Button
                                  type="button"
                                  variant={isSaved ? "outline" : "default"}
                                  size="sm"
                                  onClick={() => handleSaveDocument(index)}
                                  disabled={!hasChanges || savingDocuments.has(index) || !link.trim()}
                                >
                                  {savingDocuments.has(index) ? "Menyimpan..." : isSaved ? "Tersimpan" : "Simpan"}
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </ScrollArea>

                <div className="flex flex-col sm:flex-row gap-2 justify-end pt-4 border-t mt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsEditDialogOpen(false);
                      setEditingService(null);
                      setEditingDocuments([]);
                    }}
                    className="w-full sm:w-auto"
                  >
                    Batal
                  </Button>
                  <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
                    {isSubmitting ? "Mengajukan..." : "Ajukan Ulang"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </DashboardLayout>
  );
}