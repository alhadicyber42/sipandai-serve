import { useState, useEffect, useRef } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Send,
  Clock,
  User,
  Users,
  Building2,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

interface Message {
  id: string;
  content: string;
  sender_id: string;
  sender_role: string;
  message_type: string;
  created_at: string;
  is_from_admin_pusat: boolean;
  sender_name?: string;
}

interface Consultation {
  id: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
  category: string | null;
  is_escalated: boolean;
  created_at: string;
  user_id: string;
  work_unit_id: number;
  current_handler_id: string | null;
}

export default function ConsultationDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [consultation, setConsultation] = useState<Consultation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (id) {
      loadConsultation();
      loadMessages();

      // Subscribe to real-time messages
      const channel = supabase
        .channel(`consultation-${id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'consultation_messages',
            filter: `consultation_id=eq.${id}`
          },
          () => {
            loadMessages();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadConsultation = async () => {
    try {
      const { data, error } = await supabase
        .from("consultations")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      setConsultation(data);
    } catch (error: any) {
      console.error("Error loading consultation:", error);
      toast.error("Gagal memuat data konsultasi");
    } finally {
      setIsLoading(false);
    }
  };

  const loadMessages = async () => {
    try {
      // Fetch messages without join
      const { data: messagesData, error } = await supabase
        .from("consultation_messages")
        .select("*")
        .eq("consultation_id", id)
        .order("created_at", { ascending: true });

      if (error) throw error;

      // If we have messages, fetch sender names separately
      if (messagesData && messagesData.length > 0) {
        const senderIds = [...new Set(messagesData.map(m => m.sender_id))];

        const { data: profilesData } = await supabase
          .from("profiles")
          .select("id, name")
          .in("id", senderIds);

        // Map profiles to messages
        const enrichedMessages = messagesData.map((msg: any) => ({
          ...msg,
          sender_name: profilesData?.find(p => p.id === msg.sender_id)?.name || "Unknown",
        }));

        setMessages(enrichedMessages);
      } else {
        setMessages([]);
      }
    } catch (error: any) {
      console.error("Error loading messages:", error);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user) return;

    setIsSending(true);
    try {
      const { error } = await supabase
        .from("consultation_messages")
        .insert({
          consultation_id: id,
          sender_id: user.id,
          sender_role: user.role as any,
          content: newMessage.trim(),
          message_type: "answer" as any,
          is_from_admin_pusat: user.role === "admin_pusat",
        });

      if (error) throw error;

      // Update consultation status to in_progress if it's submitted
      if (consultation?.status === "submitted") {
        await supabase
          .from("consultations")
          .update({ status: "in_progress" as any })
          .eq("id", id);
      }

      setNewMessage("");
      toast.success("Pesan terkirim");
    } catch (error: any) {
      console.error("Error sending message:", error);
      toast.error("Gagal mengirim pesan");
    } finally {
      setIsSending(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      const updateData: any = { status: newStatus };

      if (newStatus === "resolved") {
        updateData.resolved_at = new Date().toISOString();
      } else if (newStatus === "closed") {
        updateData.closed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from("consultations")
        .update(updateData)
        .eq("id", id);

      if (error) throw error;

      toast.success("Status konsultasi diperbarui");
      loadConsultation();
    } catch (error: any) {
      console.error("Error updating status:", error);
      toast.error("Gagal memperbarui status");
    }
  };

  const handleEscalate = async () => {
    try {
      const { error } = await supabase
        .from("consultations")
        .update({
          is_escalated: true,
          current_handler_id: user?.id
        })
        .eq("id", id);

      if (error) throw error;

      toast.success("Konsultasi berhasil dieskalasi ke pusat");
      loadConsultation();
    } catch (error: any) {
      console.error("Error escalating:", error);
      toast.error("Gagal melakukan eskalasi");
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Memuat...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!consultation) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Konsultasi tidak ditemukan</p>
        </div>
      </DashboardLayout>
    );
  }

  const isAdmin = user?.role === "admin_pusat" || user?.role === "admin_unit";
  const canManage = isAdmin;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{consultation.subject}</h1>
            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              {format(new Date(consultation.created_at), "d MMMM yyyy HH:mm", {
                locale: localeId,
              })}
            </div>
          </div>

          {/* Admin Actions */}
          {canManage && (
            <div className="flex gap-2">
              {user?.role === "admin_unit" && !consultation.is_escalated && (
                <Button
                  variant="outline"
                  onClick={handleEscalate}
                  className="gap-2"
                >
                  <AlertTriangle className="h-4 w-4" />
                  Eskalasi ke Pusat
                </Button>
              )}

              <Select
                value={consultation.status}
                onValueChange={handleStatusChange}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="submitted">Baru</SelectItem>
                  <SelectItem value="in_progress">Dalam Proses</SelectItem>
                  <SelectItem value="resolved">Selesai</SelectItem>
                  <SelectItem value="closed">Ditutup</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Chat Area */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Percakapan</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 mb-4 max-h-[500px] overflow-y-auto">
                  {/* Initial Message */}
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="bg-muted rounded-lg p-4">
                        <p className="text-sm">{consultation.description}</p>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(consultation.created_at), "HH:mm", {
                          locale: localeId,
                        })}
                      </p>
                    </div>
                  </div>

                  <Separator />

                  {/* Messages */}
                  {messages.map((message) => {
                    const isOwnMessage = message.sender_id === user?.id;
                    return (
                      <div
                        key={message.id}
                        className={`flex gap-3 ${isOwnMessage ? "flex-row-reverse" : ""}`}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isOwnMessage ? "bg-primary" : "bg-secondary"
                          }`}>
                          <User className={`h-4 w-4 ${isOwnMessage ? "text-primary-foreground" : ""}`} />
                        </div>
                        <div className={`flex-1 ${isOwnMessage ? "items-end" : ""}`}>
                          <div className={`rounded-lg p-4 ${isOwnMessage ? "bg-primary text-primary-foreground" : "bg-muted"
                            }`}>
                            <p className="text-sm font-medium mb-1">
                              {message.sender_name}
                            </p>
                            <p className="text-sm">{message.content}</p>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(new Date(message.created_at), "HH:mm", {
                              locale: localeId,
                            })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                {consultation.status !== "closed" && (
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
                      className="resize-none"
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={isSending || !newMessage.trim()}
                      className="gap-2"
                    >
                      <Send className="h-4 w-4" />
                      Kirim
                    </Button>
                  </div>
                )}

                {consultation.status === "closed" && (
                  <div className="text-center py-4 text-muted-foreground">
                    Konsultasi ini telah ditutup
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Info */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Informasi Ticket</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium mb-1">Status</p>
                  <Badge
                    variant={
                      consultation.status === "resolved" ? "outline" : "default"
                    }
                  >
                    {consultation.status === "submitted" && "Baru"}
                    {consultation.status === "in_progress" && "Dalam Proses"}
                    {consultation.status === "resolved" && "Selesai"}
                    {consultation.status === "closed" && "Ditutup"}
                  </Badge>
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
                    {consultation.priority === "high" && "Tinggi"}
                    {consultation.priority === "medium" && "Sedang"}
                    {consultation.priority === "low" && "Rendah"}
                  </Badge>
                </div>

                <Separator />

                <div>
                  <p className="text-sm font-medium mb-2">Ditujukan Kepada</p>
                  <div className="flex items-center gap-2">
                    {consultation.is_escalated || consultation.status === "escalated" ? (
                      <>
                        <Users className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-600">
                          Admin Pusat
                        </span>
                      </>
                    ) : (
                      <>
                        <Building2 className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium text-green-600">
                          Admin Unit
                        </span>
                      </>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {consultation.is_escalated || consultation.status === "escalated"
                      ? "Bagian SDM Aparatur Setditjen Binalavotas"
                      : "Pimpinan Unit Kerja"}
                  </p>
                </div>

                {consultation.is_escalated && (
                  <>
                    <Separator />
                    <div className="flex items-center gap-2 text-sm text-destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="font-medium">Tereskalasi ke Pusat</span>
                    </div>
                  </>
                )}

                <Separator />

                <div>
                  <p className="text-sm font-medium mb-2">Kategori</p>
                  <p className="text-sm text-muted-foreground capitalize">
                    {consultation.category || "Umum"}
                  </p>
                </div>

                <Separator />

                <div>
                  <p className="text-sm font-medium mb-2">Dibuat</p>
                  <p className="text-sm text-muted-foreground">
                    {format(
                      new Date(consultation.created_at),
                      "d MMMM yyyy HH:mm",
                      { locale: localeId }
                    )}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions for Admin */}
            {canManage && consultation.status !== "closed" && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Tindakan Cepat</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {consultation.status !== "resolved" && (
                    <Button
                      variant="outline"
                      className="w-full gap-2"
                      onClick={() => handleStatusChange("resolved")}
                    >
                      <CheckCircle className="h-4 w-4" />
                      Tandai Selesai
                    </Button>
                  )}

                  {consultation.status === "resolved" && (
                    <Button
                      variant="outline"
                      className="w-full gap-2"
                      onClick={() => handleStatusChange("closed")}
                    >
                      <XCircle className="h-4 w-4" />
                      Tutup Ticket
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
