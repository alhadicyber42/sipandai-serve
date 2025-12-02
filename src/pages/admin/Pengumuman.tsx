import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Megaphone, Plus, Edit, Trash2, Pin, PinOff, Clock, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { WORK_UNITS } from "@/lib/constants";
import { toast } from "sonner";

interface Announcement {
  id: string;
  title: string;
  content: string;
  author_id: string;
  work_unit_id: number | null;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
  profiles?: {
    name: string;
  };
}

export default function Pengumuman() {
  const { user } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    workUnitId: user?.role === "admin_pusat" ? "all" : user?.work_unit_id?.toString() || "",
    isPinned: false,
  });

  useEffect(() => {
    loadAnnouncements();
  }, [user]);

  const loadAnnouncements = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      let query = supabase
        .from("announcements")
        .select(`
          *,
          profiles!announcements_author_id_fkey (
            name
          )
        `)
        .order("is_pinned", { ascending: false })
        .order("created_at", { ascending: false });

      // Admin unit can only see their own announcements
      if (user.role === "admin_unit") {
        query = query.eq("work_unit_id", user.work_unit_id);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error loading announcements:", error);
        toast.error("Gagal memuat pengumuman");
      } else {
        setAnnouncements((data || []) as any);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);
    try {
      const workUnitId = formData.workUnitId === "all" ? null : parseInt(formData.workUnitId);

      if (editingId) {
        // Update existing
        const { error } = await supabase
          .from("announcements")
          .update({
            title: formData.title,
            content: formData.content,
            work_unit_id: workUnitId,
            is_pinned: formData.isPinned,
          } as any)
          .eq("id", editingId);

        if (error) throw error;
        toast.success("Pengumuman berhasil diperbarui");
      } else {
        // Create new
        const { error } = await supabase
          .from("announcements")
          .insert({
            title: formData.title,
            content: formData.content,
            author_id: user.id,
            work_unit_id: workUnitId,
            is_pinned: formData.isPinned,
          } as any);

        if (error) throw error;
        toast.success("Pengumuman berhasil dibuat");
      }

      setIsDialogOpen(false);
      resetForm();
      loadAnnouncements();
    } catch (error: any) {
      console.error("Error saving announcement:", error);
      toast.error("Gagal menyimpan pengumuman: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      content: "",
      workUnitId: user?.role === "admin_pusat" ? "all" : user?.work_unit_id?.toString() || "",
      isPinned: false,
    });
    setEditingId(null);
  };

  const handleEdit = (announcement: Announcement) => {
    setEditingId(announcement.id);
    setFormData({
      title: announcement.title,
      content: announcement.content,
      workUnitId: announcement.work_unit_id === null ? "all" : announcement.work_unit_id.toString(),
      isPinned: announcement.is_pinned,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus pengumuman ini?")) return;

    try {
      const { error } = await supabase
        .from("announcements")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Pengumuman berhasil dihapus");
      loadAnnouncements();
    } catch (error: any) {
      console.error("Error deleting announcement:", error);
      toast.error("Gagal menghapus pengumuman: " + error.message);
    }
  };

  const togglePin = async (id: string, currentPinned: boolean) => {
    try {
      const { error } = await supabase
        .from("announcements")
        .update({ is_pinned: !currentPinned } as any)
        .eq("id", id);

      if (error) throw error;
      loadAnnouncements();
    } catch (error: any) {
      console.error("Error toggling pin:", error);
      toast.error("Gagal mengubah status pin");
    }
  };

  const getWorkUnitName = (workUnitId: number | null) => {
    if (workUnitId === null) return "Semua Unit";
    return WORK_UNITS.find(u => u.id === workUnitId)?.name || "Unknown";
  };

  const getAuthorName = (announcement: Announcement) => {
    if (announcement.profiles?.name) {
      return announcement.profiles.name;
    }
    return "Admin";
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 p-4 md:p-6 lg:p-8">
        {/* Enhanced Header with Gradient */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-600 via-orange-500 to-red-400 p-6 md:p-8 text-white shadow-xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-16 -translate-x-16 blur-2xl" />
          
          <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <Megaphone className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white">
                  Kelola Pengumuman
                </h1>
                <p className="text-white/90 mt-1 text-sm md:text-base">
                  Buat dan kelola pengumuman untuk {user?.role === "admin_pusat" ? "semua unit" : "unit Anda"}
                </p>
              </div>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button className="gap-2 bg-white text-orange-600 hover:bg-white/90 shadow-lg">
                  <Plus className="h-4 w-4" />
                  Buat Pengumuman
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <form onSubmit={handleSubmit}>
                  <DialogHeader>
                    <DialogTitle>
                      {editingId ? "Edit Pengumuman" : "Buat Pengumuman Baru"}
                    </DialogTitle>
                    <DialogDescription>
                      Pengumuman akan ditampilkan di dashboard untuk unit yang dipilih.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Judul Pengumuman *</Label>
                      <Input
                        id="title"
                        placeholder="Contoh: Update Sistem SIPANDAI"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="content">Isi Pengumuman *</Label>
                      <Textarea
                        id="content"
                        placeholder="Tulis isi pengumuman..."
                        rows={5}
                        value={formData.content}
                        onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                        required
                      />
                    </div>

                    {user?.role === "admin_pusat" && (
                      <div className="space-y-2">
                        <Label htmlFor="workUnit">Tujuan Pengumuman *</Label>
                        <Select 
                          value={formData.workUnitId}
                          onValueChange={(value) => setFormData({ ...formData, workUnitId: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih unit" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Semua Unit</SelectItem>
                            {WORK_UNITS.map((unit) => (
                              <SelectItem key={unit.id} value={unit.id.toString()}>
                                {unit.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="isPinned"
                        checked={formData.isPinned}
                        onChange={(e) => setFormData({ ...formData, isPinned: e.target.checked })}
                        className="rounded"
                      />
                      <Label htmlFor="isPinned" className="cursor-pointer">
                        Sematkan pengumuman (tampil di atas)
                      </Label>
                    </div>
                  </div>

                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => {
                      setIsDialogOpen(false);
                      resetForm();
                    }}>
                      Batal
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Menyimpan...
                        </>
                      ) : (
                        editingId ? "Simpan Perubahan" : "Buat Pengumuman"
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Announcements List */}
        <Card>
          <CardHeader>
            <CardTitle>Daftar Pengumuman</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : announcements.length === 0 ? (
              <div className="text-center py-12">
                <Megaphone className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">
                  {user?.role === "admin_unit" 
                    ? "Belum ada pengumuman untuk unit Anda" 
                    : "Belum ada pengumuman"}
                </p>
              </div>
            ) : (
              announcements.map((announcement) => (
                <div
                  key={announcement.id}
                  className={`p-4 rounded-lg border transition-all duration-300 ${
                    announcement.is_pinned 
                      ? 'bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950/30 dark:to-red-950/30 border-orange-200 dark:border-orange-800' 
                      : 'bg-muted/20 border-muted-foreground/20'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        {announcement.is_pinned && (
                          <Pin className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                        )}
                        <h3 className="font-semibold text-base">
                          {announcement.title}
                        </h3>
                        {announcement.is_pinned && (
                          <Badge variant="secondary" className="text-xs">
                            Disematkan
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        {announcement.content}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span className="font-medium">{getAuthorName(announcement)}</span>
                        <span>•</span>
                        <span>{getWorkUnitName(announcement.work_unit_id)}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(announcement.created_at).toLocaleDateString("id-ID", {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => togglePin(announcement.id, announcement.is_pinned)}
                        title={announcement.is_pinned ? "Lepas sematan" : "Sematkan"}
                      >
                        {announcement.is_pinned ? (
                          <PinOff className="h-4 w-4" />
                        ) : (
                          <Pin className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEdit(announcement)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(announcement.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
