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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, CalendarIcon, Link as LinkIcon, Trash2, AlertCircle, Clock, CalendarX, Info, CalendarCheck, Check, X, ExternalLink, FileText, PauseCircle } from "lucide-react";
import { format, differenceInDays, getYear } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { LEAVE_LABELS } from "@/lib/constants";
import { z } from "zod";
import { StatCardSkeleton } from "@/components/skeletons";
import { extractTemplateData } from "@/lib/templateEngine";
import { getDefaultTemplate } from "@/lib/templateStorage";
import { generateDocument } from "@/lib/docxEngine";
import { LetterTemplate } from "@/types/leave-certificate";
import { Database } from "@/integrations/supabase/types";
import { Service } from "@/components/ServiceList";
import { requiresCentralApproval, canGenerateLeaveCertificate } from "@/lib/leave-workflow";

type LeaveDetail = Database['public']['Tables']['leave_details']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];
type WorkUnit = Database['public']['Tables']['work_units']['Row'];

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
  const [editingDocuments, setEditingDocuments] = useState<Array<{name: string; url: string; verification_status?: string; verification_note?: string}>>([]);
  const [savingDocuments, setSavingDocuments] = useState<Set<number>>(new Set());
  const [selectedLeaveType, setSelectedLeaveType] = useState<string>("");

  // Deferral State
  const [isDeferralDialogOpen, setIsDeferralDialogOpen] = useState(false);
  const [deferralYear, setDeferralYear] = useState<string>(new Date().getFullYear().toString());
  const [deferralDays, setDeferralDays] = useState<string>("");
  const [deferralDoc, setDeferralDoc] = useState<string>("");
  const [deferralReason, setDeferralReason] = useState<string>("");
  const [pendingDeferrals, setPendingDeferrals] = useState<any[]>([]);
  const [userDeferrals, setUserDeferrals] = useState<any[]>([]);
  
  // Admin deferral management
  const [adminDeferralList, setAdminDeferralList] = useState<any[]>([]);
  const [processingDeferralId, setProcessingDeferralId] = useState<string | null>(null);
  const [adminDeferralTab, setAdminDeferralTab] = useState<string>("pending");
  
  // User tabs
  const [userSubmissionTab, setUserSubmissionTab] = useState<string>("cuti");

  // Leave Balance State
  const [leaveStats, setLeaveStats] = useState({
    quota: 12, // Default annual quota (12 hari kerja/tahun)
    carriedOver: 0, // Loaded from leave_deferrals table
    used: 0,
    pending: 0,
    remaining: 12,
    maxAllowedTotal: 18, // Default maks 18 hari (12 + 6 sisa tahun lalu)
    hasDeferred: false, // Apakah ada penangguhan karena dinas
    unusedYears: 0 // Berapa tahun tidak digunakan
  });
  const [deferralDetails, setDeferralDetails] = useState<Array<{ year: number, days: number, isDeferred?: boolean }>>([]);

  // Certificate Generation State
  const [isCertificateDialogOpen, setIsCertificateDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<LetterTemplate | null>(null);
  const [certificateData, setCertificateData] = useState<any>(null);

  useEffect(() => {
    loadServices();
    if (user?.role === 'admin_unit' || user?.role === 'admin_pusat') {
      loadAdminDeferrals();
    }
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
    } else if (user.role === "admin_pusat") {
      // Admin pusat only sees leave requests from units 1-7 that require central approval
      query = query.in("work_unit_id", [1, 2, 3, 4, 5, 6, 7]);
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

        // Load deferral balances
        const { data: deferrals } = await supabase
          .from("leave_deferrals")
          .select("id, deferral_year, days_deferred, status, notes, created_at, approval_document")
          .eq("user_id", user.id)
          .in("status", ["active", "pending", "rejected"])
          .order("created_at", { ascending: false });

        const activeDeferrals = (deferrals || []).filter(d => d.status === "active");
        const pending = (deferrals || []).filter(d => d.status === "pending");

        // Hitung total cuti yang dibawa dari tahun sebelumnya
        const totalCarriedOver = activeDeferrals.reduce((sum, d) => sum + d.days_deferred, 0);
        
        // Cek apakah ada penangguhan karena kepentingan dinas (notes mengandung "dinas")
        const hasOfficialDeferral = activeDeferrals.some(d => 
          d.notes?.toLowerCase().includes('dinas') || d.notes?.toLowerCase().includes('penangguhan')
        );
        
        // Hitung berapa tahun berturut-turut tidak menggunakan cuti
        const deferralYears = activeDeferrals.map(d => d.deferral_year).sort();
        let consecutiveUnusedYears = 0;
        
        if (deferralYears.length >= 2) {
          // Cek apakah 2 tahun berturut-turut tidak digunakan
          for (let i = 0; i < deferralYears.length - 1; i++) {
            if (deferralYears[i + 1] - deferralYears[i] === 1) {
              consecutiveUnusedYears = 2;
              break;
            }
          }
        }

        // Tentukan maksimal cuti sesuai peraturan:
        // - Normal: max 18 hari (12 tahun ini + 6 sisa tahun lalu)
        // - Jika tidak digunakan 2+ tahun atau ada penangguhan dinas: max 24 hari
        let maxAllowedTotal = 18; // Default
        if (consecutiveUnusedYears >= 2 || hasOfficialDeferral) {
          maxAllowedTotal = 24;
        }

        // Batasi carried over sesuai peraturan (max 6 hari normal, atau 12 hari jika ada penangguhan/2 tahun)
        const maxCarryOver = hasOfficialDeferral || consecutiveUnusedYears >= 2 ? 12 : 6;
        const effectiveCarriedOver = Math.min(totalCarriedOver, maxCarryOver);

        const deferralList = activeDeferrals.map(d => ({ 
          year: d.deferral_year, 
          days: d.days_deferred,
          isDeferred: d.notes?.toLowerCase().includes('dinas') || d.notes?.toLowerCase().includes('penangguhan')
        }));

        setDeferralDetails(deferralList);
        setPendingDeferrals(pending);
        setUserDeferrals(deferrals || []);
        setLeaveStats(prev => ({
          ...prev,
          carriedOver: effectiveCarriedOver,
          used: usedDays,
          pending: pendingDays,
          remaining: Math.min((prev.quota + effectiveCarriedOver) - usedDays, maxAllowedTotal - usedDays),
          maxAllowedTotal,
          hasDeferred: hasOfficialDeferral,
          unusedYears: consecutiveUnusedYears
        }));
      }

    } else {
      setServices([]);
    }

    setIsLoading(false);
  };

  // Load deferral requests for admin
  const loadAdminDeferrals = async () => {
    if (!user || (user.role !== 'admin_unit' && user.role !== 'admin_pusat')) return;

    let query = supabase
      .from("leave_deferrals")
      .select("*")
      .order("created_at", { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error("Error loading admin deferrals:", error);
      return;
    }

    // Enrich with user profiles
    if (data && data.length > 0) {
      const userIds = [...new Set(data.map(d => d.user_id))];
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, name, nip, work_unit_id")
        .in("id", userIds);

      const { data: workUnitsData } = await supabase
        .from("work_units")
        .select("id, name");

      const profilesMap = new Map((profilesData || []).map(p => [p.id, p]));
      const workUnitsMap = new Map((workUnitsData || []).map(w => [w.id, w]));

      const enrichedDeferrals = data.map(d => {
        const profile = profilesMap.get(d.user_id);
        return {
          ...d,
          profile,
          work_unit: profile?.work_unit_id ? workUnitsMap.get(profile.work_unit_id) : null
        };
      });

      setAdminDeferralList(enrichedDeferrals);
    } else {
      setAdminDeferralList([]);
    }
  };

  // Handle deferral approval/rejection by admin
  const handleDeferralAction = async (deferralId: string, action: 'approve' | 'reject') => {
    if (!user) return;

    setProcessingDeferralId(deferralId);

    try {
      const newStatus = action === 'approve' ? 'active' : 'rejected';
      
      const { error } = await supabase
        .from("leave_deferrals")
        .update({ 
          status: newStatus,
          notes: adminDeferralList.find(d => d.id === deferralId)?.notes + 
            ` | ${action === 'approve' ? 'Disetujui' : 'Ditolak'} oleh ${user.name} pada ${format(new Date(), 'dd MMM yyyy', { locale: localeId })}`
        })
        .eq("id", deferralId);

      if (error) throw error;

      toast.success(`Pengajuan penangguhan ${action === 'approve' ? 'disetujui' : 'ditolak'}`);
      loadAdminDeferrals();
    } catch (error: any) {
      console.error("Error processing deferral:", error);
      toast.error(error.message || `Gagal ${action === 'approve' ? 'menyetujui' : 'menolak'} pengajuan`);
    } finally {
      setProcessingDeferralId(null);
    }
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

    // Debug: Log document links before submit
    console.log("Document links before submit:", documentLinks);
    console.log("Number of documents:", documentLinks.length);

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

    // Format documents as proper objects for DocumentVerification component
    const formattedDocuments = documentLinks.map((link, index) => ({
      name: `Dokumen Pendukung ${index + 1}`,
      url: link,
      verification_status: "menunggu_review",
      verification_note: ""
    }));

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
        documents: formattedDocuments,
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

  const handleDeferralSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!deferralYear || !deferralDays || !deferralDoc || !deferralReason) {
      toast.error("Mohon lengkapi semua field");
      return;
    }

    const days = parseInt(deferralDays);
    const year = parseInt(deferralYear);
    
    // Validasi jumlah hari tidak melebihi sisa cuti
    if (days > leaveStats.remaining) {
      toast.error(`Jumlah hari tidak boleh melebihi sisa cuti (${leaveStats.remaining} hari)`);
      return;
    }

    // Validasi jumlah hari minimal 1
    if (days < 1) {
      toast.error("Jumlah hari minimal 1");
      return;
    }

    // Map alasan ke notes
    const reasonLabels: Record<string, string> = {
      kepentingan_dinas: "Penangguhan karena kepentingan dinas mendesak",
      tugas_khusus: "Penangguhan karena tugas khusus/proyek penting",
      kekurangan_personel: "Penangguhan karena kekurangan personel",
      lainnya: "Penangguhan cuti tahunan"
    };

    try {
      setIsSubmitting(true);

      // Check if deferral already exists for this user and year
      const { data: existingDeferral } = await supabase
        .from("leave_deferrals")
        .select("id, status")
        .eq("user_id", user.id)
        .eq("deferral_year", year)
        .maybeSingle();

      if (existingDeferral) {
        const statusLabels: Record<string, string> = {
          pending: "menunggu persetujuan",
          active: "sudah disetujui",
          rejected: "sudah ditolak"
        };
        toast.error(`Anda sudah memiliki pengajuan penangguhan untuk tahun ${year} (${statusLabels[existingDeferral.status] || existingDeferral.status})`);
        setIsSubmitting(false);
        return;
      }

      const { error } = await supabase
        .from("leave_deferrals")
        .insert({
          user_id: user.id,
          deferral_year: year,
          days_deferred: days,
          approval_document: deferralDoc,
          status: "pending",
          notes: reasonLabels[deferralReason] || "Penangguhan cuti tahunan",
          created_by: user.id
        });

      if (error) throw error;

      toast.success("Pengajuan penangguhan berhasil dikirim. Menunggu persetujuan Admin.");
      setIsDeferralDialogOpen(false);
      setDeferralYear(new Date().getFullYear().toString());
      setDeferralDays("");
      setDeferralDoc("");
      setDeferralReason("");
      loadServices(); // Reload to show pending status
    } catch (error: any) {
      console.error("Error submitting deferral:", error);
      if (error.code === "23505") {
        toast.error(`Anda sudah memiliki pengajuan penangguhan untuk tahun ${year}`);
      } else {
        toast.error(error.message || "Gagal mengajukan penangguhan");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditService = (service: any) => {
    setEditingService(service);
    setIsEditDialogOpen(true);

    // Load existing documents and normalize to proper format
    if (service.documents && Array.isArray(service.documents)) {
      const normalizedDocs = service.documents.map((doc: any, index: number) => {
        // If it's already an object with url property
        if (typeof doc === 'object' && doc.url) {
          return {
            name: doc.name || `Dokumen ${index + 1}`,
            url: doc.url,
            verification_status: doc.verification_status || 'menunggu_review',
            verification_note: doc.verification_note || ''
          };
        }
        // If it's a string (legacy format)
        if (typeof doc === 'string') {
          return {
            name: `Dokumen Pendukung ${index + 1}`,
            url: doc,
            verification_status: 'menunggu_review',
            verification_note: ''
          };
        }
        return doc;
      });
      setEditingDocuments(normalizedDocs);
    }
  };

  const handleSaveDocument = async (index: number) => {
    if (!editingService || !editingDocuments[index]?.url?.trim()) {
      toast.error("Masukkan link dokumen terlebih dahulu");
      return;
    }

    // Validate URL
    const urlSchema = z.string().url({ message: "Link tidak valid" });
    const validation = urlSchema.safeParse(editingDocuments[index].url.trim());

    if (!validation.success) {
      toast.error("Link tidak valid. Pastikan menggunakan format yang benar (https://...)");
      return;
    }

    setSavingDocuments(prev => new Set(prev).add(index));

    try {
      // Reset verification status when document is updated
      const updatedDocs = editingDocuments.map((doc, i) => 
        i === index 
          ? { ...doc, verification_status: 'menunggu_review', verification_note: '' }
          : doc
      );
      
      const { error } = await supabase
        .from("services")
        .update({ documents: updatedDocs })
        .eq("id", editingService.id);

      if (error) throw error;

      toast.success("Dokumen berhasil disimpan");
      setEditingDocuments(updatedDocs);
      setEditingService({ ...editingService, documents: updatedDocs });
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
        status: "resubmitted",
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

  const handleGenerateCertificate = async (service: Service) => {
    // 1. Get default template for this user's unit
    // In real app, we should get unit from service.user_id -> profile -> work_unit_id
    // For now, we use current user's unit or default 1
    const workUnitId = user?.work_unit_id || 1;
    const template = await getDefaultTemplate(workUnitId, 'cuti');

    if (!template) {
      toast.error("Template surat keterangan belum tersedia untuk unit kerja ini.");
      return;
    }

    if (!template.file_content) {
      toast.error("Template ini menggunakan format lama (text). Harap update ke format Word (.docx).");
      return;
    }

    try {
      // 2. Extract data
      // Mock data for now since we need full profile and unit info
      // In production, we would fetch this data properly
      const data = extractTemplateData(
        service as any,
        (service as any).leave_details?.[0] || {} as any,
        (service as any).profiles || {} as any,
        (service as any).work_units || { name: "BBPVP Bekasi" } as any
      );

      // 3. Generate Document
      generateDocument(
        template.file_content,
        data,
        `Surat_Keterangan_Cuti_${user?.name || 'Pegawai'}.docx`
      );

      toast.success("Surat keterangan berhasil didownload");
    } catch (error) {
      console.error(error);
      toast.error("Gagal membuat surat keterangan");
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
                <Dialog open={isDialogOpen} onOpenChange={(open) => {
                  setIsDialogOpen(open);
                  if (open) {
                    // Reset form state when dialog opens
                    setStartDate(undefined);
                    setEndDate(undefined);
                    setDocumentLinks([]);
                    setCurrentLink("");
                    setSelectedLeaveType("");
                  }
                }}>
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
                                    className={cn("w-full justify-start text-left font-normal h-10", !startDate && "text-muted-foreground")}
                                  >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {startDate ? format(startDate, "PPP", { locale: localeId }) : "Pilih tanggal"}
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
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
                                    className={cn("w-full justify-start text-left font-normal h-10", !endDate && "text-muted-foreground")}
                                  >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {endDate ? format(endDate, "PPP", { locale: localeId }) : "Pilih tanggal"}
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
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
                            <div className="flex items-center justify-between">
                              <Label>Dokumen Pendukung (Link)</Label>
                              {documentLinks.length > 0 && (
                                <Badge variant="secondary" className="text-xs">
                                  {documentLinks.length} dokumen
                                </Badge>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <div className="flex-1">
                                <Input
                                  placeholder="Paste link dokumen di sini..."
                                  value={currentLink}
                                  onChange={(e) => setCurrentLink(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      e.preventDefault();
                                      addDocumentLink();
                                    }
                                  }}
                                  className="h-10"
                                />
                              </div>
                              <Button 
                                type="button" 
                                onClick={addDocumentLink} 
                                variant="default"
                                className="h-10 px-4 shrink-0 gap-1"
                              >
                                <Plus className="h-4 w-4" />
                                <span className="hidden sm:inline">Tambah</span>
                              </Button>
                            </div>
                            <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                              ⚠️ Setelah paste link, tekan tombol "Tambah" untuk menyimpan dokumen
                            </p>
                            {documentLinks.length > 0 && (
                              <div className="space-y-2 mt-2">
                                {documentLinks.map((link, index) => (
                                  <div key={index} className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
                                    <LinkIcon className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
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
                                      className="h-8 w-8 flex-shrink-0 hover:bg-destructive/10 hover:text-destructive"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            )}
                            <p className="text-xs text-muted-foreground">
                              Gunakan link dari Google Drive, Dropbox, OneDrive, dll
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
            {isLoading ? (
              <>
                <StatCardSkeleton />
                <StatCardSkeleton />
                <StatCardSkeleton />
                <StatCardSkeleton />
              </>
            ) : (
              <>
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
                    {deferralDetails.length > 0 && (
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="link" size="sm" className="h-auto p-0 text-xs mt-1">
                            <Info className="h-3 w-3 mr-1" />
                            Lihat detail
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-64">
                          <div className="space-y-2">
                            <h4 className="font-medium text-sm">Detail Penangguhan</h4>
                            {deferralDetails.map((d, idx) => (
                              <div key={idx} className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Tahun {d.year}:</span>
                                <span className="font-medium">{d.days} hari</span>
                              </div>
                            ))}
                            <div className="border-t pt-2 flex justify-between text-sm font-semibold">
                              <span>Total:</span>
                              <span>{leaveStats.carriedOver} hari</span>
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                    )}

                    <div className="mt-2 flex flex-col gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-xs h-8"
                        onClick={() => setIsDeferralDialogOpen(true)}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Ajukan Penangguhan
                      </Button>

                      {pendingDeferrals.length > 0 && (
                        <Alert className="py-2 px-3 bg-yellow-50 border-yellow-200">
                          <Clock className="h-3 w-3 text-yellow-600" />
                          <AlertDescription className="text-[10px] text-yellow-700 ml-2">
                            {pendingDeferrals.length} pengajuan menunggu persetujuan
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>

                    <Dialog open={isDeferralDialogOpen} onOpenChange={setIsDeferralDialogOpen}>
                      <DialogContent className="max-w-lg">
                        <DialogHeader>
                          <DialogTitle>Ajukan Penangguhan Cuti Tahunan</DialogTitle>
                        </DialogHeader>
                        
                        {/* Info Peraturan */}
                        <Alert className="bg-blue-50 dark:bg-blue-950 border-blue-200">
                          <Info className="h-4 w-4 text-blue-600" />
                          <AlertDescription className="text-xs text-blue-800 dark:text-blue-200 ml-2">
                            <strong>Ketentuan Penangguhan Cuti:</strong>
                            <ul className="list-disc list-inside mt-1 space-y-0.5">
                              <li>Penangguhan dapat dilakukan oleh Pejabat yang berwenang karena <strong>kepentingan dinas mendesak</strong></li>
                              <li>Cuti yang ditangguhkan dapat digunakan tahun berikutnya <strong>maksimal 24 hari kerja</strong> (termasuk cuti tahun berjalan)</li>
                              <li>Sisa cuti tahun sebelumnya yang tidak ditangguhkan maksimal <strong>6 hari</strong> dapat dibawa ke tahun berikutnya</li>
                            </ul>
                          </AlertDescription>
                        </Alert>

                        <form onSubmit={handleDeferralSubmit} className="space-y-4">
                          <div className="space-y-2">
                            <Label>Tahun Asal Cuti <span className="text-destructive">*</span></Label>
                            <Input
                              type="number"
                              min={2000}
                              max={new Date().getFullYear()}
                              value={deferralYear}
                              onChange={(e) => setDeferralYear(e.target.value)}
                              placeholder="Contoh: 2024"
                              required
                            />
                            <p className="text-xs text-muted-foreground">
                              Tahun dari mana sisa cuti yang akan ditangguhkan berasal
                            </p>
                          </div>

                          <div className="space-y-2">
                            <Label>Jumlah Hari yang Ditangguhkan <span className="text-destructive">*</span></Label>
                            <Input
                              type="number"
                              min={1}
                              max={Math.max(1, leaveStats.remaining)}
                              value={deferralDays}
                              onChange={(e) => {
                                const val = parseInt(e.target.value);
                                if (val > leaveStats.remaining) {
                                  toast.error(`Maksimal ${leaveStats.remaining} hari sesuai sisa cuti Anda`);
                                  setDeferralDays(leaveStats.remaining.toString());
                                } else {
                                  setDeferralDays(e.target.value);
                                }
                              }}
                              placeholder={`Maksimal ${leaveStats.remaining} hari`}
                              required
                            />
                            <p className="text-xs text-muted-foreground">
                              Sisa cuti tahunan Anda: <strong>{leaveStats.remaining} hari</strong>. Cuti yang ditangguhkan akan dapat digunakan tahun berikutnya.
                            </p>
                          </div>

                          <div className="space-y-2">
                            <Label>Alasan Penangguhan <span className="text-destructive">*</span></Label>
                            <Select 
                              value={deferralReason} 
                              onValueChange={setDeferralReason}
                              required
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Pilih alasan penangguhan" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="kepentingan_dinas">Kepentingan Dinas Mendesak</SelectItem>
                                <SelectItem value="tugas_khusus">Tugas Khusus/Proyek Penting</SelectItem>
                                <SelectItem value="kekurangan_personel">Kekurangan Personel</SelectItem>
                                <SelectItem value="lainnya">Alasan Lainnya</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label>Dokumen Persetujuan Atasan (Link) <span className="text-destructive">*</span></Label>
                            <Input
                              value={deferralDoc}
                              onChange={(e) => setDeferralDoc(e.target.value)}
                              placeholder="https://drive.google.com/..."
                              required
                            />
                            <p className="text-xs text-muted-foreground">
                              Lampirkan surat persetujuan penangguhan dari Pejabat yang Berwenang
                            </p>
                          </div>

                          {/* Preview dampak penangguhan */}
                          {deferralDays && parseInt(deferralDays) > 0 && (
                            <Alert className="bg-green-50 dark:bg-green-950 border-green-200">
                              <CalendarCheck className="h-4 w-4 text-green-600" />
                              <AlertDescription className="text-xs text-green-800 dark:text-green-200 ml-2">
                                <strong>Dampak Penangguhan:</strong><br />
                                Jika disetujui, cuti tahun berikutnya Anda menjadi maksimal <strong>24 hari kerja</strong> (termasuk {parseInt(deferralDays)} hari yang ditangguhkan + 12 hari kuota baru).
                              </AlertDescription>
                            </Alert>
                          )}

                          <div className="flex justify-end gap-2 pt-2">
                            <Button type="button" variant="outline" onClick={() => setIsDeferralDialogOpen(false)}>
                              Batal
                            </Button>
                            <Button 
                              type="submit" 
                              disabled={isSubmitting || !deferralDays || parseInt(deferralDays) < 1}
                            >
                              {isSubmitting ? "Mengirim..." : "Kirim Pengajuan"}
                            </Button>
                          </div>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        )}

        {isAdmin && (
          <div className="space-y-4">
            {/* Info about workflow */}
            <Alert className="bg-blue-50 dark:bg-blue-950 border-blue-200">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-sm text-blue-800 dark:text-blue-200">
                {user?.role === "admin_pusat" ? (
                  <>
                    <strong>Alur Persetujuan:</strong> Anda menangani persetujuan cuti untuk Unit Kerja 1-7 (BBPVP). 
                    Cuti dari unit ini memerlukan persetujuan Admin Pusat setelah disetujui Admin Unit.
                  </>
                ) : (
                  <>
                    <strong>Alur Persetujuan:</strong> {" "}
                    {user?.work_unit_id && user.work_unit_id >= 1 && user.work_unit_id <= 7 ? (
                      "Unit kerja Anda memerlukan persetujuan Admin Pusat untuk cuti. Setelah Anda setujui, usulan akan diteruskan ke Admin Pusat."
                    ) : (
                      "Unit kerja Anda tidak memerlukan persetujuan Admin Pusat. Anda dapat langsung menerbitkan surat keterangan cuti."
                    )}
                  </>
                )}
              </AlertDescription>
            </Alert>

            <div className="grid gap-4 md:grid-cols-4">
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
                      <div className="text-2xl font-bold">{services.length}</div>
                      <p className="text-sm text-muted-foreground">Total Usulan</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold text-warning">
                        {services.filter((s) => 
                          s.status === "submitted" || 
                          s.status === "resubmitted" || 
                          (user?.role === "admin_pusat" && s.status === "approved_by_unit")
                        ).length}
                      </div>
                      <p className="text-sm text-muted-foreground">Menunggu Review</p>
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
                </>
              )}
            </div>
          </div>
        )}

        {/* Admin Deferral Management Section with Tabs */}
        {isAdmin && adminDeferralList.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <PauseCircle className="h-5 w-5 text-primary" />
                Riwayat Penangguhan Cuti
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={adminDeferralTab} onValueChange={setAdminDeferralTab}>
                <TabsList className="mb-4">
                  <TabsTrigger value="pending" className="gap-2">
                    <Clock className="h-4 w-4" />
                    Baru Masuk
                    {adminDeferralList.filter(d => d.status === 'pending').length > 0 && (
                      <Badge variant="secondary" className="ml-1">
                        {adminDeferralList.filter(d => d.status === 'pending').length}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="active" className="gap-2">
                    <Check className="h-4 w-4" />
                    Disetujui
                  </TabsTrigger>
                  <TabsTrigger value="rejected" className="gap-2">
                    <X className="h-4 w-4" />
                    Ditolak
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="pending">
                  {adminDeferralList.filter(d => d.status === 'pending').length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Tidak ada pengajuan penangguhan yang menunggu persetujuan
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {adminDeferralList
                        .filter(d => d.status === 'pending')
                        .map((deferral) => (
                          <div 
                            key={deferral.id} 
                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-orange-50/50 dark:bg-orange-950/20 rounded-lg border border-orange-200"
                          >
                            <div className="flex-1 space-y-1">
                              <div className="font-medium">
                                {deferral.profile?.name || 'Unknown'}
                                <span className="text-muted-foreground text-sm ml-2">
                                  ({deferral.profile?.nip || '-'})
                                </span>
                              </div>
                              <div className="text-sm text-muted-foreground">
                                Unit: {deferral.work_unit?.name || '-'}
                              </div>
                              <div className="text-sm">
                                <strong>{deferral.days_deferred} hari</strong> dari tahun {deferral.deferral_year}
                              </div>
                              {deferral.notes && (
                                <div className="text-xs text-muted-foreground italic">
                                  {deferral.notes}
                                </div>
                              )}
                              {deferral.approval_document && (
                                <a 
                                  href={deferral.approval_document} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-xs text-primary hover:underline flex items-center gap-1"
                                >
                                  <ExternalLink className="h-3 w-3" />
                                  Lihat Dokumen
                                </a>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                                onClick={() => handleDeferralAction(deferral.id, 'reject')}
                                disabled={processingDeferralId === deferral.id}
                              >
                                <X className="h-4 w-4 mr-1" />
                                Tolak
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleDeferralAction(deferral.id, 'approve')}
                                disabled={processingDeferralId === deferral.id}
                              >
                                <Check className="h-4 w-4 mr-1" />
                                Setujui
                              </Button>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="active">
                  {adminDeferralList.filter(d => d.status === 'active').length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Belum ada penangguhan yang disetujui
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {adminDeferralList
                        .filter(d => d.status === 'active')
                        .map((deferral) => (
                          <div 
                            key={deferral.id} 
                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-green-50/50 dark:bg-green-950/20 rounded-lg border border-green-200"
                          >
                            <div className="flex-1 space-y-1">
                              <div className="font-medium">
                                {deferral.profile?.name || 'Unknown'}
                                <span className="text-muted-foreground text-sm ml-2">
                                  ({deferral.profile?.nip || '-'})
                                </span>
                              </div>
                              <div className="text-sm text-muted-foreground">
                                Unit: {deferral.work_unit?.name || '-'}
                              </div>
                              <div className="text-sm">
                                <strong>{deferral.days_deferred} hari</strong> dari tahun {deferral.deferral_year}
                              </div>
                              {deferral.notes && (
                                <div className="text-xs text-muted-foreground italic">
                                  {deferral.notes}
                                </div>
                              )}
                              <Badge variant="outline" className="border-green-500 text-green-700 text-xs">
                                <Check className="h-3 w-3 mr-1" />
                                Disetujui
                              </Badge>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="rejected">
                  {adminDeferralList.filter(d => d.status === 'rejected').length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Belum ada penangguhan yang ditolak
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {adminDeferralList
                        .filter(d => d.status === 'rejected')
                        .map((deferral) => (
                          <div 
                            key={deferral.id} 
                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-red-50/50 dark:bg-red-950/20 rounded-lg border border-red-200"
                          >
                            <div className="flex-1 space-y-1">
                              <div className="font-medium">
                                {deferral.profile?.name || 'Unknown'}
                                <span className="text-muted-foreground text-sm ml-2">
                                  ({deferral.profile?.nip || '-'})
                                </span>
                              </div>
                              <div className="text-sm text-muted-foreground">
                                Unit: {deferral.work_unit?.name || '-'}
                              </div>
                              <div className="text-sm">
                                <strong>{deferral.days_deferred} hari</strong> dari tahun {deferral.deferral_year}
                              </div>
                              {deferral.notes && (
                                <div className="text-xs text-muted-foreground italic">
                                  {deferral.notes}
                                </div>
                              )}
                              <Badge variant="outline" className="border-red-500 text-red-700 text-xs">
                                <X className="h-3 w-3 mr-1" />
                                Ditolak
                              </Badge>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}

        {/* User Submission Tabs - Cuti & Penangguhan */}
        {user?.role === "user_unit" ? (
          <Tabs value={userSubmissionTab} onValueChange={setUserSubmissionTab} className="space-y-4">
            <TabsList>
              <TabsTrigger value="cuti" className="gap-2">
                <FileText className="h-4 w-4" />
                Cuti
              </TabsTrigger>
              <TabsTrigger value="penangguhan" className="gap-2">
                <PauseCircle className="h-4 w-4" />
                Penangguhan
                {pendingDeferrals.length > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {pendingDeferrals.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="cuti" className="space-y-4">
              <h2 className="text-xl font-semibold tracking-tight">Riwayat Pengajuan Cuti</h2>
              <ServiceList
                services={services}
                isLoading={isLoading}
                onReload={loadServices}
                showFilters={false}
                allowActions={false}
                onEditService={handleEditService}
                onGenerateCertificate={handleGenerateCertificate}
              />
            </TabsContent>

            <TabsContent value="penangguhan" className="space-y-4">
              <h2 className="text-xl font-semibold tracking-tight">Riwayat Pengajuan Penangguhan Cuti</h2>
              {userDeferrals.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    Anda belum pernah mengajukan penangguhan cuti
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {userDeferrals.map((deferral: any) => {
                    const statusConfig = {
                      pending: {
                        border: "border-orange-200",
                        bg: "bg-orange-50/50 dark:bg-orange-950/20",
                        badgeClass: "border-orange-500 text-orange-700",
                        icon: <Clock className="h-3 w-3 mr-1" />,
                        label: "Menunggu Persetujuan"
                      },
                      active: {
                        border: "border-green-200",
                        bg: "bg-green-50/50 dark:bg-green-950/20",
                        badgeClass: "border-green-500 text-green-700",
                        icon: <Check className="h-3 w-3 mr-1" />,
                        label: "Disetujui"
                      },
                      rejected: {
                        border: "border-red-200",
                        bg: "bg-red-50/50 dark:bg-red-950/20",
                        badgeClass: "border-red-500 text-red-700",
                        icon: <X className="h-3 w-3 mr-1" />,
                        label: "Ditolak"
                      }
                    };
                    const config = statusConfig[deferral.status as keyof typeof statusConfig] || statusConfig.pending;

                    return (
                      <Card key={deferral.id} className={`${config.border} ${config.bg}`}>
                        <CardContent className="p-4">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="space-y-1">
                              <div className="font-medium">
                                Penangguhan {deferral.days_deferred} hari dari tahun {deferral.deferral_year}
                              </div>
                              {deferral.notes && (
                                <div className="text-sm text-muted-foreground">
                                  {deferral.notes}
                                </div>
                              )}
                              {deferral.approval_document && (
                                <a 
                                  href={deferral.approval_document} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-xs text-primary hover:underline flex items-center gap-1"
                                >
                                  <ExternalLink className="h-3 w-3" />
                                  Lihat Dokumen Pendukung
                                </a>
                              )}
                              <div className="text-xs text-muted-foreground">
                                Diajukan: {format(new Date(deferral.created_at), 'dd MMM yyyy', { locale: localeId })}
                              </div>
                            </div>
                            <Badge variant="outline" className={config.badgeClass}>
                              {config.icon}
                              {config.label}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>
        ) : (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold tracking-tight">Riwayat Pengajuan Cuti</h2>
            <ServiceList
              services={services}
              isLoading={isLoading}
              onReload={loadServices}
              showFilters={isAdmin}
              allowActions={isAdmin}
              onEditService={handleEditService}
              onGenerateCertificate={handleGenerateCertificate}
            />
          </div>
        )}
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
                        {editingDocuments.map((doc, index) => {
                          const originalDoc = editingService?.documents?.[index];
                          const isSaved = originalDoc?.url === doc.url;
                          const hasChanges = originalDoc?.url !== doc.url;

                          return (
                            <div key={index} className={`space-y-2 p-3 border rounded-lg ${isSaved ? 'border-green-500 bg-green-50 dark:bg-green-950' : ''}`}>
                              <Label className="flex items-center justify-between">
                                <span>{doc.name || `Dokumen ${index + 1}`}</span>
                                {isSaved && (
                                  <Badge variant="outline" className="border-green-500 text-green-700">Tersimpan</Badge>
                                )}
                              </Label>
                              <div className="flex gap-2">
                                <Input
                                  type="url"
                                  placeholder="https://drive.google.com/..."
                                  value={doc.url}
                                  onChange={(e) => {
                                    const newDocs = [...editingDocuments];
                                    newDocs[index] = { ...doc, url: e.target.value };
                                    setEditingDocuments(newDocs);
                                  }}
                                  className="flex-1"
                                />
                                <Button
                                  type="button"
                                  variant={isSaved ? "outline" : "default"}
                                  size="sm"
                                  onClick={() => handleSaveDocument(index)}
                                  disabled={!hasChanges || savingDocuments.has(index) || !doc.url.trim()}
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