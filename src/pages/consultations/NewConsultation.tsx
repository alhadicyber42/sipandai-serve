import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Send, Building2, Users, MessageSquarePlus } from "lucide-react";

export default function NewConsultation() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    subject: "",
    description: "",
    priority: "medium",
    category: "kepegawaian",
    recipient: "admin_unit", // admin_unit or admin_pusat
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Security: Sanitize and validate inputs
    const sanitizedSubject = formData.subject.trim().substring(0, 500);
    const sanitizedDescription = formData.description.trim().substring(0, 5000);

    if (!sanitizedSubject || !sanitizedDescription) {
      toast.error("Mohon lengkapi semua field yang wajib diisi");
      return;
    }

    // Security: Validate subject length
    if (sanitizedSubject.length < 5) {
      toast.error("Subjek konsultasi minimal 5 karakter");
      return;
    }

    // Security: Validate description length
    if (sanitizedDescription.length < 10) {
      toast.error("Deskripsi konsultasi minimal 10 karakter");
      return;
    }

    setIsLoading(true);
    try {
      // Security: Validate recipient value
      const validRecipients = ['admin_unit', 'admin_pusat'];
      const recipient = validRecipients.includes(formData.recipient) 
        ? formData.recipient 
        : 'admin_unit';

      // Determine if consultation should be escalated to admin_pusat
      const isEscalated = recipient === "admin_pusat";

      // Security: Validate priority and category
      const validPriorities = ['low', 'medium', 'high'];
      const validCategories = ['kepegawaian', 'administrasi', 'lainnya'];
      const priority = validPriorities.includes(formData.priority) 
        ? formData.priority 
        : 'medium';
      const category = validCategories.includes(formData.category) 
        ? formData.category 
        : 'kepegawaian';

      const { data, error } = await supabase
        .from("consultations")
        .insert({
          user_id: user?.id,
          work_unit_id: user?.work_unit_id,
          subject: sanitizedSubject,
          description: sanitizedDescription,
          priority: priority as any,
          category: category as any,
          status: isEscalated ? "escalated" : "submitted" as any,
          is_escalated: isEscalated,
        })
        .select()
        .single();

      if (error) throw error;

      const recipientText = recipient === "admin_unit"
        ? "Admin Unit (Pimpinan Unit Kerja)"
        : "Admin Pusat (Bagian SDM Aparatur Setditjen Binalavotas)";

      toast.success(`Konsultasi berhasil dikirim ke ${recipientText}`);
      navigate(`/konsultasi/${data.id}`);
    } catch (error: any) {
      console.error("Error creating consultation:", error);
      const isDevelopment = process.env.NODE_ENV === 'development';
      toast.error(isDevelopment ? error.message : "Gagal membuat konsultasi. Silakan coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Modern Header with Gradient */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-500 to-indigo-400 p-6 md:p-8 text-white shadow-xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -ml-24 -mb-24"></div>

          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/konsultasi/riwayat")}
                className="bg-white/20 hover:bg-white/30 text-white"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-3">
                <div className="p-2 md:p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <MessageSquarePlus className="h-6 w-6 md:h-8 md:w-8" />
                </div>
                <div>
                  <h1 className="text-2xl md:text-4xl font-bold">Konsultasi Baru</h1>
                  <p className="text-sm md:text-base text-white/80 mt-1">
                    Ajukan konsultasi kepada admin unit atau admin pusat
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Form Card */}
        <Card className="shadow-lg">
          <CardContent className="p-6 md:p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Recipient Selection */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">
                  Tujuan Konsultasi <span className="text-destructive">*</span>
                </Label>
                <RadioGroup
                  value={formData.recipient}
                  onValueChange={(value) =>
                    setFormData({ ...formData, recipient: value })
                  }
                  className="grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                  <div className="md:col-span-1">
                    <RadioGroupItem
                      value="admin_unit"
                      id="admin_unit"
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor="admin_unit"
                      className="flex flex-col items-center justify-between rounded-xl border-2 border-muted bg-card p-4 md:p-6 hover:bg-accent/50 hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 [&:has([data-state=checked])]:border-primary cursor-pointer transition-all h-full"
                    >
                      <div className="p-3 md:p-4 bg-blue-100 dark:bg-blue-950 rounded-full mb-3 md:mb-4">
                        <Building2 className="h-6 w-6 md:h-8 md:w-8 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="space-y-1 md:space-y-2 text-center">
                        <p className="text-sm md:text-base font-bold leading-none">
                          Admin Unit
                        </p>
                        <p className="text-xs text-muted-foreground leading-snug">
                          Pimpinan Unit Kerja Anda
                        </p>
                      </div>
                    </Label>
                  </div>
                  <div className="md:col-span-1">
                    <RadioGroupItem
                      value="admin_pusat"
                      id="admin_pusat"
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor="admin_pusat"
                      className="flex flex-col items-center justify-between rounded-xl border-2 border-muted bg-card p-4 md:p-6 hover:bg-accent/50 hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 [&:has([data-state=checked])]:border-primary cursor-pointer transition-all h-full"
                    >
                      <div className="p-3 md:p-4 bg-purple-100 dark:bg-purple-950 rounded-full mb-3 md:mb-4">
                        <Users className="h-6 w-6 md:h-8 md:w-8 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div className="space-y-1 md:space-y-2 text-center">
                        <p className="text-sm md:text-base font-bold leading-none">
                          Admin Pusat
                        </p>
                        <p className="text-xs text-muted-foreground leading-snug">
                          Bagian SDM Aparatur Setditjen Binalavotas
                        </p>
                      </div>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="subject" className="text-base font-semibold">
                    Judul Konsultasi <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="subject"
                    placeholder="Masukkan judul konsultasi"
                    value={formData.subject}
                    onChange={(e) =>
                      setFormData({ ...formData, subject: e.target.value })
                    }
                    required
                    className="h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category" className="text-base font-semibold">Kategori</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) =>
                      setFormData({ ...formData, category: value })
                    }
                  >
                    <SelectTrigger className="h-12">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kepegawaian">Kepegawaian</SelectItem>
                      <SelectItem value="administrasi">Administrasi</SelectItem>
                      <SelectItem value="teknis">Teknis Aplikasi</SelectItem>
                      <SelectItem value="lainnya">Lainnya</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority" className="text-base font-semibold">Prioritas</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value) =>
                      setFormData({ ...formData, priority: value })
                    }
                  >
                    <SelectTrigger className="h-12">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Rendah</SelectItem>
                      <SelectItem value="medium">Sedang</SelectItem>
                      <SelectItem value="high">Tinggi</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-base font-semibold">
                  Deskripsi <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="description"
                  placeholder="Jelaskan permasalahan atau pertanyaan Anda secara detail"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={8}
                  required
                  className="resize-none"
                />
                <p className="text-sm text-muted-foreground">
                  Jelaskan permasalahan Anda sejelas mungkin agar admin dapat
                  memberikan bantuan yang tepat
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/konsultasi/riwayat")}
                  disabled={isLoading}
                  className="w-full sm:w-auto h-12"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full sm:w-auto h-12 gap-2"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Mengirim...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Kirim Konsultasi
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
