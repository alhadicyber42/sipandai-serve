import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import { ArrowLeft, Send, Building2, Users } from "lucide-react";

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

    if (!formData.subject || !formData.description) {
      toast.error("Mohon lengkapi semua field yang wajib diisi");
      return;
    }

    setIsLoading(true);
    try {
      // Determine if consultation should be escalated to admin_pusat
      const isEscalated = formData.recipient === "admin_pusat";

      const { data, error } = await supabase
        .from("consultations")
        .insert({
          user_id: user?.id,
          work_unit_id: user?.work_unit_id,
          subject: formData.subject,
          description: formData.description,
          priority: formData.priority as any,
          category: formData.category as any,
          status: isEscalated ? "escalated" : "submitted" as any,
          is_escalated: isEscalated,
        })
        .select()
        .single();

      if (error) throw error;

      const recipientText = formData.recipient === "admin_unit"
        ? "Admin Unit (Pimpinan Unit Kerja)"
        : "Admin Pusat (Bagian SDM Aparatur Setditjen Binalavotas)";

      toast.success(`Konsultasi berhasil dikirim ke ${recipientText}`);
      navigate(`/konsultasi/${data.id}`);
    } catch (error: any) {
      console.error("Error creating consultation:", error);
      toast.error("Gagal membuat konsultasi");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/konsultasi/riwayat")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Konsultasi Baru
            </h1>
            <p className="text-muted-foreground mt-1">
              Ajukan konsultasi kepada admin unit atau admin pusat
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Form Konsultasi</CardTitle>
            <CardDescription>
              Pilih tujuan konsultasi dan isi detail pertanyaan Anda
            </CardDescription>
          </CardHeader>
          <CardContent>
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
                  <div>
                    <RadioGroupItem
                      value="admin_unit"
                      id="admin_unit"
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor="admin_unit"
                      className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                    >
                      <Building2 className="mb-3 h-6 w-6" />
                      <div className="space-y-1 text-center">
                        <p className="text-sm font-medium leading-none">
                          Admin Unit
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Pimpinan Unit Kerja Anda
                        </p>
                      </div>
                    </Label>
                  </div>
                  <div>
                    <RadioGroupItem
                      value="admin_pusat"
                      id="admin_pusat"
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor="admin_pusat"
                      className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                    >
                      <Users className="mb-3 h-6 w-6" />
                      <div className="space-y-1 text-center">
                        <p className="text-sm font-medium leading-none">
                          Admin Pusat
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Bagian SDM Aparatur Setditjen Binalavotas
                        </p>
                      </div>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">
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
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Kategori</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) =>
                    setFormData({ ...formData, category: value })
                  }
                >
                  <SelectTrigger>
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
                <Label htmlFor="priority">Prioritas</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) =>
                    setFormData({ ...formData, priority: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Rendah</SelectItem>
                    <SelectItem value="medium">Sedang</SelectItem>
                    <SelectItem value="high">Tinggi</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">
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
                />
                <p className="text-sm text-muted-foreground">
                  Jelaskan permasalahan Anda sejelas mungkin agar admin dapat
                  memberikan bantuan yang tepat
                </p>
              </div>

              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/konsultasi/riwayat")}
                  disabled={isLoading}
                >
                  Batal
                </Button>
                <Button type="submit" disabled={isLoading} className="gap-2">
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
