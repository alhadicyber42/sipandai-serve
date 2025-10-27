import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Send, AlertTriangle, CheckCircle2, ArrowUpCircle } from "lucide-react";
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

export default function KonsultasiDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [consultation, setConsultation] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadConsultation();
    loadMessages();
    
    // Subscribe to new messages
    const channel = supabase
      .channel(`consultation-${id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "consultation_messages",
          filter: `consultation_id=eq.${id}`,
        },
        () => {
          loadMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadConsultation = async () => {
    const { data, error } = await supabase
      .from("consultations")
      .select(`
        *,
        profiles!consultations_user_id_fkey(name, nip, role),
        work_units(name)
      `)
      .eq("id", id)
      .single();

    if (error) {
      toast.error("Gagal memuat data konsultasi");
      console.error(error);
    } else {
      setConsultation(data);
    }
    setIsLoading(false);
  };

  const loadMessages = async () => {
    const { data, error } = await supabase
      .from("consultation_messages")
      .select(`
        *,
        profiles!consultation_messages_sender_id_fkey(name, role)
      `)
      .eq("consultation_id", id)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error loading messages:", error);
    } else {
      setMessages(data || []);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    setIsSending(true);

    const isAdmin = user?.role === "admin_unit" || user?.role === "admin_pusat";
    const messageType = isAdmin ? "answer" : "question";

    const { error } = await supabase.from("consultation_messages").insert({
      consultation_id: id!,
      sender_id: user!.id,
      sender_role: user!.role,
      content: newMessage,
      message_type: messageType,
      is_from_admin_pusat: user?.role === "admin_pusat",
    });

    if (error) {
      toast.error("Gagal mengirim pesan");
      console.error(error);
    } else {
      // Update consultation status
      let newStatus = consultation.status;
      if (isAdmin && consultation.status === "submitted") {
        newStatus = "under_review";
      } else if (isAdmin) {
        newStatus = consultation.is_escalated ? "escalated_responded" : "responded";
      } else if (consultation.status === "responded" || consultation.status === "escalated_responded") {
        newStatus = "follow_up_requested";
      }

      await supabase
        .from("consultations")
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
          current_handler_id: isAdmin ? user!.id : consultation.current_handler_id,
        })
        .eq("id", id);

      setNewMessage("");
      loadConsultation();
    }

    setIsSending(false);
  };

  const handleEscalate = async () => {
    const { error } = await supabase
      .from("consultations")
      .update({
        is_escalated: true,
        status: "escalated",
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      toast.error("Gagal eskalasi konsultasi");
    } else {
      toast.success("Konsultasi berhasil dieskalasi ke Admin Pusat");
      loadConsultation();
    }
  };

  const handleResolve = async () => {
    const { error } = await supabase
      .from("consultations")
      .update({
        status: "resolved",
        resolved_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      toast.error("Gagal menandai sebagai selesai");
    } else {
      toast.success("Konsultasi ditandai sebagai selesai");
      loadConsultation();
    }
  };

  const isAdmin = user?.role === "admin_unit" || user?.role === "admin_pusat";
  const canEscalate = user?.role === "admin_unit" && !consultation?.is_escalated;
  const canResolve = isAdmin && consultation?.status !== "resolved" && consultation?.status !== "closed";

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Memuat...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!consultation) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Konsultasi tidak ditemukan</p>
          <Button className="mt-4" onClick={() => navigate("/konsultasi")}>
            Kembali
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/konsultasi")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{consultation.subject}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {consultation.profiles?.name} • {CATEGORY_LABELS[consultation.category as keyof typeof CATEGORY_LABELS]} •{" "}
              {format(new Date(consultation.created_at), "dd MMMM yyyy HH:mm", { locale: localeId })}
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Chat Area */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Percakapan</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-[500px] overflow-y-auto mb-4 pr-2">
                  {/* Initial Question */}
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-xs font-medium">{consultation.profiles?.name?.charAt(0)}</span>
                    </div>
                    <div className="flex-1">
                      <div className="bg-muted p-3 rounded-lg">
                        <p className="text-sm font-medium mb-1">{consultation.profiles?.name}</p>
                        <p className="text-sm">{consultation.description}</p>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(consultation.created_at), "HH:mm", { locale: localeId })}
                      </p>
                    </div>
                  </div>

                  {/* Messages */}
                  {messages.map((message) => {
                    const isOwnMessage = message.sender_id === user?.id;
                    const isAdminMessage = message.sender_role === "admin_unit" || message.sender_role === "admin_pusat";

                    return (
                      <div key={message.id} className={`flex gap-3 ${isOwnMessage ? "flex-row-reverse" : ""}`}>
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-xs font-medium">{message.profiles?.name?.charAt(0)}</span>
                        </div>
                        <div className="flex-1">
                          <div
                            className={`p-3 rounded-lg ${
                              isOwnMessage ? "bg-primary text-primary-foreground" : "bg-muted"
                            }`}
                          >
                            <p className="text-sm font-medium mb-1">
                              {message.profiles?.name}
                              {message.is_from_admin_pusat && (
                                <Badge variant="outline" className="ml-2 text-xs">
                                  Admin Pusat
                                </Badge>
                              )}
                            </p>
                            <p className="text-sm">{message.content}</p>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(new Date(message.created_at), "HH:mm", { locale: localeId })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {consultation.status !== "resolved" && consultation.status !== "closed" && (
                  <div className="flex gap-2">
                    <Textarea
                      placeholder="Ketik pesan Anda..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      rows={3}
                    />
                    <Button onClick={handleSendMessage} disabled={isSending || !newMessage.trim()} size="icon">
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Informasi</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium mb-1">Status</p>
                  <Badge>{STATUS_LABELS[consultation.status as keyof typeof STATUS_LABELS]}</Badge>
                </div>
                <Separator />
                <div>
                  <p className="text-sm font-medium mb-1">Prioritas</p>
                  <Badge
                    className={
                      consultation.priority === "high"
                        ? "bg-red-100 text-red-800"
                        : consultation.priority === "medium"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-blue-100 text-blue-800"
                    }
                  >
                    {PRIORITY_LABELS[consultation.priority as keyof typeof PRIORITY_LABELS]}
                  </Badge>
                </div>
                <Separator />
                <div>
                  <p className="text-sm font-medium mb-1">Kategori</p>
                  <p className="text-sm">{CATEGORY_LABELS[consultation.category as keyof typeof CATEGORY_LABELS]}</p>
                </div>
                <Separator />
                <div>
                  <p className="text-sm font-medium mb-1">Unit Kerja</p>
                  <p className="text-sm">{consultation.work_units?.name}</p>
                </div>
                {consultation.is_escalated && (
                  <>
                    <Separator />
                    <div className="p-3 bg-purple-50 rounded-lg">
                      <div className="flex items-center gap-2 text-purple-700">
                        <AlertTriangle className="h-4 w-4" />
                        <p className="text-sm font-medium">Dieskalasi ke Admin Pusat</p>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Admin Actions */}
            {isAdmin && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Aksi</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {canEscalate && (
                    <Button variant="outline" className="w-full" onClick={handleEscalate}>
                      <ArrowUpCircle className="mr-2 h-4 w-4" />
                      Eskalasi ke Pusat
                    </Button>
                  )}
                  {canResolve && (
                    <Button variant="default" className="w-full" onClick={handleResolve}>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Tandai Selesai
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
