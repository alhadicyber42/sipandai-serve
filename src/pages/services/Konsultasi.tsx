import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, MessageSquare, Eye, FileText, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

const CATEGORY_LABELS = {
  kepegawaian: "Kepegawaian",
  administrasi: "Administrasi",
  teknis: "Teknis",
  lainnya: "Lainnya",
};

const PRIORITY_LABELS = {
  low: "Rendah",
  medium: "Sedang",
  high: "Tinggi",
};

const STATUS_LABELS = {
  submitted: "Diajukan",
  under_review: "Sedang Ditinjau",
  responded: "Sudah Dibalas",
  escalated: "Dieskalasi ke Pusat",
  escalated_responded: "Dibalas oleh Pusat",
  follow_up_requested: "Perlu Tindak Lanjut",
  resolved: "Selesai",
  closed: "Ditutup",
};

export default function Konsultasi() {
  const { user } = useAuth();
  const [consultations, setConsultations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedConsultation, setSelectedConsultation] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadConsultations();
  }, [user]);

  const loadConsultations = async () => {
    if (!user) return;

    setIsLoading(true);
    let query = supabase
      .from("consultations")
      .select(`
        *,
        profiles!consultations_user_id_fkey(name, nip),
        work_units(name)
      `);

    if (user.role === "user_unit") {
      query = query.eq("user_id", user.id);
    } else if (user.role === "admin_unit") {
      query = query.eq("work_unit_id", user.work_unit_id).eq("is_escalated", false);
    } else if (user.role === "admin_pusat") {
      query = query.eq("is_escalated", true);
    }

    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) {
      toast.error("Gagal memuat data konsultasi");
      console.error(error);
    } else {
      setConsultations(data || []);
    }
    setIsLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const subject = formData.get("subject") as string;
    const description = formData.get("description") as string;
    const category = formData.get("category") as string;
    const priority = formData.get("priority") as string;

    const { error } = await supabase.from("consultations").insert({
      user_id: user!.id,
      work_unit_id: user!.work_unit_id!,
      subject,
      description,
      category: category as any,
      priority: priority as any,
      status: "submitted",
    });

    if (error) {
      toast.error("Gagal mengajukan konsultasi");
      console.error(error);
    } else {
      toast.success("Konsultasi berhasil diajukan");
      setIsDialogOpen(false);
      loadConsultations();
    }

    setIsSubmitting(false);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      submitted: "secondary",
      under_review: "default",
      responded: "default",
      escalated: "outline",
      escalated_responded: "default",
      follow_up_requested: "secondary",
      resolved: "outline",
      closed: "outline",
    };

    return (
      <Badge variant={variants[status] || "default"}>
        {STATUS_LABELS[status as keyof typeof STATUS_LABELS] || status}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const colors: Record<string, string> = {
      low: "bg-blue-100 text-blue-800",
      medium: "bg-yellow-100 text-yellow-800",
      high: "bg-red-100 text-red-800",
    };

    return (
      <Badge className={colors[priority] || ""}>
        {PRIORITY_LABELS[priority as keyof typeof PRIORITY_LABELS] || priority}
      </Badge>
    );
  };

  const isAdmin = user?.role === "admin_unit" || user?.role === "admin_pusat";

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <MessageSquare className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Konsultasi</h1>
                <p className="text-muted-foreground mt-1">
                  {user?.role === "user_unit"
                    ? "Ajukan pertanyaan dan konsultasi kepegawaian"
                    : user?.role === "admin_unit"
                    ? "Kelola konsultasi dari unit Anda"
                    : "Kelola konsultasi yang dieskalasi"}
                </p>
              </div>
            </div>
          </div>
          {user?.role === "user_unit" && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Ajukan Konsultasi
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Ajukan Konsultasi Baru</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="subject">Subjek *</Label>
                    <Input
                      id="subject"
                      name="subject"
                      placeholder="Contoh: Pertanyaan tentang proses kenaikan pangkat"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Kategori *</Label>
                    <Select name="category" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih kategori" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                          <SelectItem key={key} value={key}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="priority">Prioritas *</Label>
                    <Select name="priority" defaultValue="medium" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih prioritas" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(PRIORITY_LABELS).map(([key, label]) => (
                          <SelectItem key={key} value={key}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Deskripsi *</Label>
                    <Textarea
                      id="description"
                      name="description"
                      placeholder="Jelaskan pertanyaan atau masalah Anda secara detail..."
                      rows={6}
                      required
                    />
                  </div>
                  <div className="flex gap-2 justify-end pt-4 border-t">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Batal
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? "Mengirim..." : "Ajukan Konsultasi"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Statistics for Admin */}
        {isAdmin && (
          <div className="grid md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <MessageSquare className="h-8 w-8 text-primary" />
                  <div>
                    <div className="text-2xl font-bold">{consultations.length}</div>
                    <p className="text-sm text-muted-foreground">Total Konsultasi</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Clock className="h-8 w-8 text-yellow-600" />
                  <div>
                    <div className="text-2xl font-bold text-yellow-600">
                      {consultations.filter((c) => c.status === "submitted" || c.status === "under_review").length}
                    </div>
                    <p className="text-sm text-muted-foreground">Menunggu</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-8 w-8 text-red-600" />
                  <div>
                    <div className="text-2xl font-bold text-red-600">
                      {consultations.filter((c) => c.priority === "high").length}
                    </div>
                    <p className="text-sm text-muted-foreground">Prioritas Tinggi</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                  <div>
                    <div className="text-2xl font-bold text-green-600">
                      {consultations.filter((c) => c.status === "resolved" || c.status === "closed").length}
                    </div>
                    <p className="text-sm text-muted-foreground">Selesai</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Consultations List */}
        <div className="grid gap-4">
          {isLoading ? (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-4 text-muted-foreground">Memuat data...</p>
              </CardContent>
            </Card>
          ) : consultations.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">Belum ada konsultasi</p>
              </CardContent>
            </Card>
          ) : (
            consultations.map((consultation) => (
              <Card key={consultation.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{consultation.subject}</CardTitle>
                      <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                        {user?.role !== "user_unit" && (
                          <>
                            <span>{consultation.profiles?.name}</span>
                            <span>•</span>
                          </>
                        )}
                        <span>{CATEGORY_LABELS[consultation.category as keyof typeof CATEGORY_LABELS]}</span>
                        <span>•</span>
                        <span>{format(new Date(consultation.created_at), "dd MMM yyyy", { locale: localeId })}</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 items-end">
                      {getStatusBadge(consultation.status)}
                      {getPriorityBadge(consultation.priority)}
                      {consultation.is_escalated && (
                        <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                          Dieskalasi
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{consultation.description}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedConsultation(consultation);
                      // Navigate to detail page (will be created next)
                      window.location.href = `/konsultasi/${consultation.id}`;
                    }}
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    Lihat Detail & Chat
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
