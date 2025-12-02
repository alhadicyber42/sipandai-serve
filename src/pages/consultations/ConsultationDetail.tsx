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
  MessageSquare,
  Sparkles,
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

  const getPriorityBadge = (priority: string) => {
    const config = {
      high: { label: "Tinggi", className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" },
      medium: { label: "Sedang", className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400" },
      low: { label: "Rendah", className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" },
    };
    const { label, className } = config[priority as keyof typeof config] || config.medium;
    return <Badge className={className}>{label}</Badge>;
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      submitted: "Baru",
      in_progress: "Dalam Proses",
      resolved: "Selesai",
      closed: "Ditutup",
    };
    return labels[status] || status;
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground">Memuat konsultasi...</p>
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
        </div>
      </DashboardLayout>
    );
  }

  const isAdmin = user?.role === "admin_pusat" || user?.role === "admin_unit";
  const canManage = isAdmin;

  return (
    <DashboardLayout>
      <div className="space-y-4 md:space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>

          <div className="flex-1 min-w-0">
            <h1 className="text-xl md:text-2xl font-bold truncate">{consultation.subject}</h1>
            <div className="flex flex-wrap items-center gap-2 mt-1 text-xs md:text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              {format(new Date(consultation.created_at), "d MMMM yyyy HH:mm", {
                locale: localeId,
              })}
            </div>
          </div>

          {/* Admin Actions */}
          {canManage && (
            <div className="flex flex-wrap gap-2 w-full md:w-auto">
              {user?.role === "admin_unit" && !consultation.is_escalated && (
                <Button
                  variant="outline"
                  onClick={handleEscalate}
                  className="gap-2 flex-1 md:flex-none"
                  size="sm"
                >
                  <AlertTriangle className="h-4 w-4" />
                  <span className="hidden sm:inline">Eskalasi ke Pusat</span>
                  <span className="sm:hidden">Eskalasi</span>
                </Button>
              )}

              <Select
                value={consultation.status}
                onValueChange={handleStatusChange}
              >
                <SelectTrigger className="w-full md:w-[180px]">
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          {/* Main Chat Area */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="shadow-lg">
              <CardHeader className="border-b bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-500 text-white">
                <CardTitle className="flex items-center gap-2 text-lg text-white">
                  <MessageSquare className="h-5 w-5 text-white" />
                  Percakapan
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {/* Messages Container */}
                <div className="h-[calc(100vh-350px)] sm:h-[500px] md:h-[600px] overflow-y-auto p-3 md:p-6 space-y-4 bg-slate-50 dark:bg-slate-900/50 scroll-smooth">
                  {/* Initial Message */}
                  <div className="flex gap-2 md:gap-3">
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <User className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="bg-white dark:bg-card rounded-2xl rounded-tl-none p-3 md:p-4 shadow-sm border break-words">
                        <p className="text-sm md:text-base whitespace-pre-wrap">{consultation.description}</p>
                      </div>
                      <p className="text-[10px] md:text-xs text-muted-foreground mt-1 ml-2">
                        {format(new Date(consultation.created_at), "HH:mm", {
                          locale: localeId,
                        })}
                      </p>
                    </div>
                  </div>

                  <Separator className="my-4" />

                  {/* Messages */}
                  {messages.map((message) => {
                    const isOwnMessage = message.sender_id === user?.id;
                    return (
                      <div
                        key={message.id}
                        className={`flex gap-2 md:gap-3 ${isOwnMessage ? "flex-row-reverse" : ""}`}
                      >
                        <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center flex-shrink-0 ${isOwnMessage ? "bg-primary" : "bg-secondary"
                          }`}>
                          <User className={`h-4 w-4 md:h-5 md:w-5 ${isOwnMessage ? "text-primary-foreground" : ""}`} />
                        </div>
                        <div className={`flex-1 max-w-[85%] md:max-w-[75%] ${isOwnMessage ? "items-end" : ""}`}>
                          <div className={`rounded-2xl p-3 md:p-4 shadow-sm break-words ${isOwnMessage
                            ? "bg-primary text-primary-foreground rounded-tr-none"
                            : "bg-white dark:bg-card rounded-tl-none border"
                            }`}>
                            <p className="text-[10px] md:text-xs font-medium mb-1 opacity-90">
                              {message.sender_name}
                            </p>
                            <p className="text-sm md:text-base whitespace-pre-wrap">{message.content}</p>
                          </div>
                          <p className={`text-[10px] md:text-xs text-muted-foreground mt-1 ${isOwnMessage ? "text-right mr-2" : "ml-2"}`}>
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
                  <div className="p-3 md:p-4 border-t bg-background sticky bottom-0 z-10">
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
                        rows={1}
                        className="resize-none min-h-[44px] max-h-[120px] py-3"
                      />
                      <Button
                        onClick={handleSendMessage}
                        isLoading={isSending}
                        disabled={!newMessage.trim()}
                        className="gap-2 shrink-0 h-[44px] w-[44px] md:w-auto px-0 md:px-4"
                        size="lg"
                      >
                        <Send className="h-4 w-4" />
                        <span className="hidden md:inline">Kirim</span>
                      </Button>
                    </div>
                  </div>
                )}

                {consultation.status === "closed" && (
                  <div className="text-center py-6 text-muted-foreground bg-muted/30 border-t">
                    <XCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Konsultasi ini telah ditutup</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Info */}
          <div className="space-y-4">
            <Card className="shadow-lg">
              <CardHeader className="border-b bg-muted/30">
                <CardTitle className="text-base md:text-lg">Informasi Ticket</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-4 md:p-6">
                <div>
                  <p className="text-sm font-medium mb-2">Status</p>
                  <Badge
                    variant={
                      consultation.status === "resolved" ? "outline" : "default"
                    }
                    className="text-sm"
                  >
                    {getStatusLabel(consultation.status)}
                  </Badge>
                </div>

                <Separator />

                <div>
                  <p className="text-sm font-medium mb-2">Prioritas</p>
                  {getPriorityBadge(consultation.priority)}
                </div>

                <Separator />

                <div>
                  <p className="text-sm font-medium mb-2">Ditujukan Kepada</p>
                  <div className="flex items-center gap-2">
                    {consultation.is_escalated ? (
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
                    {consultation.is_escalated
                      ? "Bagian SDM Aparatur Setditjen Binalavotas"
                      : "Pimpinan Unit Kerja"}
                  </p>
                </div>

                {consultation.is_escalated && (
                  <>
                    <Separator />
                    <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
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
              <Card className="shadow-lg border-primary/20">
                <CardHeader className="border-b bg-primary/5">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    Tindakan Cepat
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 p-4">
                  {consultation.status !== "resolved" && (
                    <Button
                      variant="outline"
                      className="w-full gap-2 justify-start"
                      onClick={() => handleStatusChange("resolved")}
                    >
                      <CheckCircle className="h-4 w-4" />
                      Tandai Selesai
                    </Button>
                  )}

                  {consultation.status === "resolved" && (
                    <Button
                      variant="outline"
                      className="w-full gap-2 justify-start"
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
