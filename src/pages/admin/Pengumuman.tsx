import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Megaphone, Plus, Edit, Trash2, Pin, PinOff, Clock } from "lucide-react";
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

export default function Pengumuman() {
  const { user } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Dummy data - will be replaced with real data from database later
  const [announcements, setAnnouncements] = useState([
    {
      id: 1,
      title: "Update Sistem SIPANDAI",
      content: "Sistem SIPANDAI akan mengalami maintenance pada tanggal 30 November 2025 pukul 22:00 - 24:00 WIB. Mohon maaf atas ketidaknyamanannya.",
      author: "Admin Pusat",
      date: "2025-11-25",
      isPinned: true,
      workUnitId: null, // null = all units
    },
    {
      id: 2,
      title: "Pengumpulan Dokumen Kenaikan Pangkat",
      content: "Batas akhir pengumpulan dokumen untuk kenaikan pangkat periode April 2026 adalah tanggal 15 Desember 2025.",
      author: "Admin Unit - Setditjen Binalavotas",
      date: "2025-11-24",
      isPinned: false,
      workUnitId: 1,
    },
    {
      id: 3,
      title: "Libur Nasional & Cuti Bersama 2026",
      content: "Telah ditetapkan jadwal libur nasional dan cuti bersama tahun 2026. Silakan ajukan cuti Anda lebih awal untuk perencanaan yang lebih baik.",
      author: "Admin Pusat",
      date: "2025-11-23",
      isPinned: false,
      workUnitId: null,
    },
  ]);

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    workUnitId: user?.role === "admin_pusat" ? "all" : user?.work_unit_id?.toString() || "",
    isPinned: false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Save to database
    console.log("Saving announcement:", formData);
    
    if (editingId) {
      // Update existing
      setAnnouncements(announcements.map(a => 
        a.id === editingId 
          ? { 
              ...a, 
              title: formData.title,
              content: formData.content,
              workUnitId: formData.workUnitId === "all" ? null : parseInt(formData.workUnitId),
              isPinned: formData.isPinned,
            }
          : a
      ));
    } else {
      // Create new
      const newAnnouncement = {
        id: Date.now(),
        title: formData.title,
        content: formData.content,
        author: user?.role === "admin_pusat" ? "Admin Pusat" : `Admin Unit - ${WORK_UNITS.find(u => u.id === user?.work_unit_id)?.name}`,
        date: new Date().toISOString().split('T')[0],
        isPinned: formData.isPinned,
        workUnitId: formData.workUnitId === "all" ? null : parseInt(formData.workUnitId),
      };
      setAnnouncements([newAnnouncement, ...announcements]);
    }

    setIsDialogOpen(false);
    setFormData({
      title: "",
      content: "",
      workUnitId: user?.role === "admin_pusat" ? "all" : user?.work_unit_id?.toString() || "",
      isPinned: false,
    });
    setEditingId(null);
  };

  const handleEdit = (announcement: any) => {
    setEditingId(announcement.id);
    setFormData({
      title: announcement.title,
      content: announcement.content,
      workUnitId: announcement.workUnitId === null ? "all" : announcement.workUnitId.toString(),
      isPinned: announcement.isPinned,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Apakah Anda yakin ingin menghapus pengumuman ini?")) {
      setAnnouncements(announcements.filter(a => a.id !== id));
    }
  };

  const togglePin = (id: number) => {
    setAnnouncements(announcements.map(a => 
      a.id === id ? { ...a, isPinned: !a.isPinned } : a
    ));
  };

  const getWorkUnitName = (workUnitId: number | null) => {
    if (workUnitId === null) return "Semua Unit";
    return WORK_UNITS.find(u => u.id === workUnitId)?.name || "Unknown";
  };

  // Filter announcements based on user role and work unit
  const filteredAnnouncements = announcements.filter((announcement) => {
    // Admin Pusat can see and manage all announcements
    if (user?.role === "admin_pusat") {
      return true;
    }
    
    // Admin Unit can only see and manage announcements for their unit
    if (user?.role === "admin_unit") {
      return announcement.workUnitId === user?.work_unit_id;
    }

    return false;
  });

  return (
    <DashboardLayout>
      <div className="space-y-6 p-4 md:p-6 lg:p-8">
        {/* Header */}
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

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
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
                    setEditingId(null);
                    setFormData({
                      title: "",
                      content: "",
                      workUnitId: user?.role === "admin_pusat" ? "all" : user?.work_unit_id?.toString() || "",
                      isPinned: false,
                    });
                  }}>
                    Batal
                  </Button>
                  <Button type="submit">
                    {editingId ? "Simpan Perubahan" : "Buat Pengumuman"}
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
            {filteredAnnouncements.length === 0 ? (
              <div className="text-center py-12">
                <Megaphone className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">
                  {user?.role === "admin_unit" 
                    ? "Belum ada pengumuman untuk unit Anda" 
                    : "Belum ada pengumuman"}
                </p>
              </div>
            ) : (
              filteredAnnouncements
                .sort((a, b) => {
                  if (a.isPinned && !b.isPinned) return -1;
                  if (!a.isPinned && b.isPinned) return 1;
                  return new Date(b.date).getTime() - new Date(a.date).getTime();
                })
                .map((announcement) => (
                  <div
                    key={announcement.id}
                    className={`p-4 rounded-lg border transition-all duration-300 ${
                      announcement.isPinned 
                        ? 'bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950/30 dark:to-red-950/30 border-orange-200 dark:border-orange-800' 
                        : 'bg-muted/20 border-muted-foreground/20'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          {announcement.isPinned && (
                            <Pin className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                          )}
                          <h3 className="font-semibold text-base">
                            {announcement.title}
                          </h3>
                          {announcement.isPinned && (
                            <Badge variant="secondary" className="text-xs">
                              Disematkan
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          {announcement.content}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <span className="font-medium">{announcement.author}</span>
                          <span>•</span>
                          <span>{getWorkUnitName(announcement.workUnitId)}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(announcement.date).toLocaleDateString("id-ID", {
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
                          onClick={() => togglePin(announcement.id)}
                          title={announcement.isPinned ? "Lepas sematan" : "Sematkan"}
                        >
                          {announcement.isPinned ? (
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
