import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";
import { format, getYear, startOfYear, endOfYear, isWeekend, eachDayOfInterval } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Plus, CalendarIcon, Trash2, Edit, Calendar as CalendarLucide, Info, AlertCircle } from "lucide-react";
import { 
  Holiday, 
  getHolidaysForYear, 
  createHoliday, 
  updateHoliday, 
  deleteHoliday 
} from "@/lib/holiday-utils";

export default function HolidayCalendar() {
  const { user } = useAuth();
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState<Holiday | null>(null);
  const [deletingHoliday, setDeletingHoliday] = useState<Holiday | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [holidayDate, setHolidayDate] = useState<Date | undefined>();
  const [holidayName, setHolidayName] = useState("");
  const [holidayDescription, setHolidayDescription] = useState("");

  // Available years for selection (current year ± 2)
  const currentYear = new Date().getFullYear();
  const availableYears = [currentYear - 1, currentYear, currentYear + 1, currentYear + 2];

  useEffect(() => {
    loadHolidays();
  }, [selectedYear]);

  const loadHolidays = async () => {
    setIsLoading(true);
    const data = await getHolidaysForYear(selectedYear);
    setHolidays(data);
    setIsLoading(false);
  };

  const resetForm = () => {
    setHolidayDate(undefined);
    setHolidayName("");
    setHolidayDescription("");
    setEditingHoliday(null);
  };

  const handleOpenDialog = (holiday?: Holiday) => {
    if (holiday) {
      setEditingHoliday(holiday);
      setHolidayDate(new Date(holiday.date));
      setHolidayName(holiday.name);
      setHolidayDescription(holiday.description || "");
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    resetForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!holidayDate || !holidayName.trim()) {
      toast.error("Tanggal dan nama hari libur wajib diisi");
      return;
    }

    if (isWeekend(holidayDate)) {
      toast.error("Sabtu dan Minggu otomatis dianggap libur, tidak perlu ditambahkan");
      return;
    }

    setIsSubmitting(true);

    try {
      if (editingHoliday) {
        const { error } = await updateHoliday(editingHoliday.id, {
          date: format(holidayDate, "yyyy-MM-dd"),
          name: holidayName.trim(),
          description: holidayDescription.trim() || null
        });

        if (error) throw error;
        toast.success("Hari libur berhasil diperbarui");
      } else {
        const { error } = await createHoliday(
          holidayDate,
          holidayName.trim(),
          holidayDescription.trim() || null,
          false,
          user!.id
        );

        if (error) throw error;
        toast.success("Hari libur berhasil ditambahkan");
      }

      handleCloseDialog();
      loadHolidays();
    } catch (error: any) {
      if (error.message?.includes("duplicate key") || error.message?.includes("unique")) {
        toast.error("Tanggal tersebut sudah terdaftar sebagai hari libur");
      } else {
        toast.error(editingHoliday ? "Gagal memperbarui hari libur" : "Gagal menambahkan hari libur");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingHoliday) return;

    try {
      const { error } = await deleteHoliday(deletingHoliday.id);
      if (error) throw error;
      toast.success("Hari libur berhasil dihapus");
      loadHolidays();
    } catch (error) {
      toast.error("Gagal menghapus hari libur");
    } finally {
      setIsDeleteDialogOpen(false);
      setDeletingHoliday(null);
    }
  };

  // Get holiday dates as a Set for quick lookup
  const holidayDatesSet = new Set(holidays.map(h => h.date));

  // Calculate statistics
  const yearStart = startOfYear(new Date(selectedYear, 0, 1));
  const yearEnd = endOfYear(new Date(selectedYear, 0, 1));
  const allDaysInYear = eachDayOfInterval({ start: yearStart, end: yearEnd });
  
  const weekendCount = allDaysInYear.filter(d => isWeekend(d)).length;
  const nationalHolidayCount = holidays.length;
  const totalNonWorkingDays = weekendCount + nationalHolidayCount;
  const workingDays = allDaysInYear.length - totalNonWorkingDays;

  // Group holidays by month
  const holidaysByMonth: Record<number, Holiday[]> = {};
  holidays.forEach(h => {
    const month = new Date(h.date).getMonth();
    if (!holidaysByMonth[month]) {
      holidaysByMonth[month] = [];
    }
    holidaysByMonth[month].push(h);
  });

  const monthNames = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];

  // Access control
  if (user?.role !== "admin_pusat") {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Anda tidak memiliki akses ke halaman ini.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Kalender Hari Libur</h1>
            <p className="text-muted-foreground">
              Kelola hari libur nasional untuk perhitungan cuti pegawai
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Select
              value={selectedYear.toString()}
              onValueChange={(v) => setSelectedYear(parseInt(v))}
            >
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableYears.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Tambah Libur
            </Button>
          </div>
        </div>

        {/* Info Alert */}
        <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/20">
          <CardContent className="flex items-start gap-3 p-4">
            <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-blue-900 dark:text-blue-100">
                Catatan Penting
              </p>
              <p className="text-blue-800 dark:text-blue-200 mt-1">
                Sabtu dan Minggu otomatis dianggap sebagai hari libur dan tidak perlu ditambahkan. 
                Tambahkan hanya hari libur nasional di sini. Sistem akan secara otomatis menghitung 
                jumlah hari kerja yang digunakan saat pegawai mengajukan cuti.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-primary">{nationalHolidayCount}</div>
              <p className="text-sm text-muted-foreground">Hari Libur Nasional</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-orange-600">{weekendCount}</div>
              <p className="text-sm text-muted-foreground">Hari Sabtu & Minggu</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-red-600">{totalNonWorkingDays}</div>
              <p className="text-sm text-muted-foreground">Total Hari Libur</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">{workingDays}</div>
              <p className="text-sm text-muted-foreground">Hari Kerja</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar Preview */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg">Kalender {selectedYear}</CardTitle>
              <CardDescription>Klik tanggal untuk menambahkan hari libur</CardDescription>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={undefined}
                onSelect={(date) => {
                  if (date && !isWeekend(date)) {
                    const dateStr = format(date, "yyyy-MM-dd");
                    const existingHoliday = holidays.find(h => h.date === dateStr);
                    if (existingHoliday) {
                      handleOpenDialog(existingHoliday);
                    } else {
                      setHolidayDate(date);
                      handleOpenDialog();
                    }
                  }
                }}
                defaultMonth={new Date(selectedYear, 0, 1)}
                className="pointer-events-auto"
                modifiers={{
                  holiday: holidays.map(h => new Date(h.date)),
                  weekend: (date) => isWeekend(date)
                }}
                modifiersStyles={{
                  holiday: { backgroundColor: "hsl(var(--destructive))", color: "white", borderRadius: "50%" },
                  weekend: { backgroundColor: "hsl(var(--muted))", color: "hsl(var(--muted-foreground))" }
                }}
                disabled={(date) => getYear(date) !== selectedYear}
              />

              <div className="mt-4 flex flex-wrap gap-2 text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-destructive"></div>
                  <span>Hari Libur Nasional</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-muted"></div>
                  <span>Sabtu/Minggu</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Holiday List */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">Daftar Hari Libur Nasional {selectedYear}</CardTitle>
              <CardDescription>
                {isLoading ? "Memuat..." : `${holidays.length} hari libur terdaftar`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center h-48">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : holidays.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-center">
                  <CalendarLucide className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">Belum ada hari libur untuk tahun {selectedYear}</p>
                  <Button variant="outline" className="mt-4" onClick={() => handleOpenDialog()}>
                    <Plus className="h-4 w-4 mr-2" />
                    Tambah Hari Libur Pertama
                  </Button>
                </div>
              ) : (
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-6">
                    {monthNames.map((monthName, monthIndex) => {
                      const monthHolidays = holidaysByMonth[monthIndex];
                      if (!monthHolidays || monthHolidays.length === 0) return null;

                      return (
                        <div key={monthIndex}>
                          <h3 className="font-semibold text-sm text-muted-foreground mb-2">
                            {monthName}
                          </h3>
                          <div className="space-y-2">
                            {monthHolidays.map((holiday) => (
                              <div
                                key={holiday.id}
                                className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="flex flex-col items-center justify-center w-12 h-12 rounded-lg bg-primary/10 text-primary">
                                    <span className="text-lg font-bold">
                                      {format(new Date(holiday.date), "d")}
                                    </span>
                                    <span className="text-[10px] uppercase">
                                      {format(new Date(holiday.date), "EEE", { locale: localeId })}
                                    </span>
                                  </div>
                                  <div>
                                    <p className="font-medium">{holiday.name}</p>
                                    {holiday.description && (
                                      <p className="text-sm text-muted-foreground">
                                        {holiday.description}
                                      </p>
                                    )}
                                  </div>
                                </div>

                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleOpenDialog(holiday)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-destructive hover:text-destructive"
                                    onClick={() => {
                                      setDeletingHoliday(holiday);
                                      setIsDeleteDialogOpen(true);
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Add/Edit Holiday Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={(open) => !open && handleCloseDialog()}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingHoliday ? "Edit Hari Libur" : "Tambah Hari Libur Baru"}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Tanggal</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !holidayDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {holidayDate
                        ? format(holidayDate, "EEEE, d MMMM yyyy", { locale: localeId })
                        : "Pilih tanggal"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={holidayDate}
                      onSelect={(date) => {
                        if (date && isWeekend(date)) {
                          toast.error("Sabtu dan Minggu otomatis libur, pilih tanggal lain");
                          return;
                        }
                        setHolidayDate(date);
                      }}
                      initialFocus
                      className="pointer-events-auto"
                      disabled={(date) => isWeekend(date)}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Nama Hari Libur</Label>
                <Input
                  id="name"
                  value={holidayName}
                  onChange={(e) => setHolidayName(e.target.value)}
                  placeholder="Contoh: Hari Kemerdekaan RI"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Keterangan (opsional)</Label>
                <Textarea
                  id="description"
                  value={holidayDescription}
                  onChange={(e) => setHolidayDescription(e.target.value)}
                  placeholder="Keterangan tambahan..."
                  rows={2}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleCloseDialog}>
                  Batal
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Menyimpan..." : editingHoliday ? "Simpan Perubahan" : "Tambah"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Hapus Hari Libur?</AlertDialogTitle>
              <AlertDialogDescription>
                Anda akan menghapus <strong>{deletingHoliday?.name}</strong> dari daftar hari libur.
                Tindakan ini tidak dapat dibatalkan.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Batal</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Hapus
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}
