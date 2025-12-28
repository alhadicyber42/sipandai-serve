import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import { format, getYear, startOfYear, endOfYear, isWeekend, eachDayOfInterval, startOfMonth, endOfMonth, getDay, isSameDay } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Edit, Save, X, Info, Lock, Unlock, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Holiday, getHolidaysForYear } from "@/lib/holiday-utils";

export default function HolidayCalendar() {
  const { user } = useAuth();
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Selected dates in edit mode (dates that will be holidays)
  const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set());
  
  // For naming holiday dialog
  const [namingDialogOpen, setNamingDialogOpen] = useState(false);
  const [pendingDate, setPendingDate] = useState<string | null>(null);
  const [holidayName, setHolidayName] = useState("");

  const currentYear = new Date().getFullYear();
  const availableYears = [currentYear - 1, currentYear, currentYear + 1, currentYear + 2];

  const monthNames = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];

  const dayNames = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

  useEffect(() => {
    loadHolidays();
  }, [selectedYear]);

  const loadHolidays = async () => {
    setIsLoading(true);
    const data = await getHolidaysForYear(selectedYear);
    setHolidays(data);
    // Initialize selected dates from existing holidays
    setSelectedDates(new Set(data.map(h => h.date)));
    setIsLoading(false);
  };

  // Calculate statistics
  const stats = useMemo(() => {
    const yearStart = startOfYear(new Date(selectedYear, 0, 1));
    const yearEnd = endOfYear(new Date(selectedYear, 0, 1));
    const allDaysInYear = eachDayOfInterval({ start: yearStart, end: yearEnd });
    
    const weekendCount = allDaysInYear.filter(d => isWeekend(d)).length;
    const nationalHolidayCount = holidays.length;
    const totalNonWorkingDays = weekendCount + nationalHolidayCount;
    const workingDays = allDaysInYear.length - totalNonWorkingDays;

    return { weekendCount, nationalHolidayCount, totalNonWorkingDays, workingDays };
  }, [selectedYear, holidays]);

  // Get calendar data for a month
  const getMonthCalendar = (monthIndex: number) => {
    const firstDay = startOfMonth(new Date(selectedYear, monthIndex, 1));
    const lastDay = endOfMonth(new Date(selectedYear, monthIndex, 1));
    const days = eachDayOfInterval({ start: firstDay, end: lastDay });
    
    // Get the day of week for the first day (0 = Sunday)
    const startDayOfWeek = getDay(firstDay);
    
    // Create empty slots for days before the first day
    const emptySlots = Array(startDayOfWeek).fill(null);
    
    return { days, emptySlots };
  };

  const handleDateClick = (date: Date) => {
    if (!isEditMode) return;
    if (isWeekend(date)) return; // Ignore weekends
    
    const dateStr = format(date, "yyyy-MM-dd");
    
    if (selectedDates.has(dateStr)) {
      // Remove holiday
      const newSet = new Set(selectedDates);
      newSet.delete(dateStr);
      setSelectedDates(newSet);
    } else {
      // Add holiday - open naming dialog
      setPendingDate(dateStr);
      setHolidayName("");
      setNamingDialogOpen(true);
    }
  };

  const handleConfirmHolidayName = () => {
    if (!pendingDate || !holidayName.trim()) {
      toast.error("Nama hari libur wajib diisi");
      return;
    }
    
    const newSet = new Set(selectedDates);
    newSet.add(pendingDate);
    setSelectedDates(newSet);
    
    // Store name temporarily (we'll save it when saving all)
    setHolidayNames(prev => ({ ...prev, [pendingDate]: holidayName.trim() }));
    
    setNamingDialogOpen(false);
    setPendingDate(null);
    setHolidayName("");
  };

  // Temporary storage for holiday names
  const [holidayNames, setHolidayNames] = useState<Record<string, string>>({});

  // Initialize holiday names from existing holidays
  useEffect(() => {
    const names: Record<string, string> = {};
    holidays.forEach(h => {
      names[h.date] = h.name;
    });
    setHolidayNames(names);
  }, [holidays]);

  const handleSave = async () => {
    if (!user) return;
    
    setIsSaving(true);
    try {
      // Get existing holidays for the year
      const existingDates = new Set(holidays.map(h => h.date));
      
      // Dates to add (in selectedDates but not in existingDates)
      const datesToAdd = Array.from(selectedDates).filter(d => !existingDates.has(d));
      
      // Dates to remove (in existingDates but not in selectedDates)
      const datesToRemove = holidays.filter(h => !selectedDates.has(h.date)).map(h => h.id);
      
      // Delete removed holidays
      if (datesToRemove.length > 0) {
        const { error: deleteError } = await supabase
          .from("holidays")
          .delete()
          .in("id", datesToRemove);
        
        if (deleteError) throw deleteError;
      }
      
      // Add new holidays
      if (datesToAdd.length > 0) {
        const newHolidays = datesToAdd.map(dateStr => ({
          date: dateStr,
          name: holidayNames[dateStr] || `Hari Libur ${format(new Date(dateStr), "d MMMM", { locale: localeId })}`,
          created_by: user.id,
          is_recurring: false
        }));
        
        const { error: insertError } = await supabase
          .from("holidays")
          .insert(newHolidays);
        
        if (insertError) throw insertError;
      }
      
      toast.success("Kalender hari libur berhasil disimpan");
      setIsEditMode(false);
      loadHolidays();
    } catch (error: any) {
      console.error("Error saving holidays:", error);
      toast.error("Gagal menyimpan kalender hari libur");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    // Reset to original holidays
    setSelectedDates(new Set(holidays.map(h => h.date)));
    const names: Record<string, string> = {};
    holidays.forEach(h => {
      names[h.date] = h.name;
    });
    setHolidayNames(names);
    setIsEditMode(false);
  };

  const getDateStatus = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    const isHoliday = selectedDates.has(dateStr);
    const isWeekendDay = isWeekend(date);
    const holidayInfo = holidays.find(h => h.date === dateStr);
    const tempName = holidayNames[dateStr];
    
    return { isHoliday, isWeekendDay, holidayInfo, tempName };
  };

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
              disabled={isEditMode}
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

            {isEditMode ? (
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleCancelEdit} disabled={isSaving}>
                  <X className="h-4 w-4 mr-2" />
                  Batal
                </Button>
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Simpan
                </Button>
              </div>
            ) : (
              <Button onClick={() => setIsEditMode(true)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Kalender
              </Button>
            )}
          </div>
        </div>

        {/* Mode Indicator */}
        <Card className={cn(
          "border transition-colors",
          isEditMode 
            ? "border-amber-500 bg-amber-50/50 dark:bg-amber-950/20" 
            : "border-green-500 bg-green-50/50 dark:bg-green-950/20"
        )}>
          <CardContent className="flex items-center gap-3 p-4">
            {isEditMode ? (
              <>
                <Unlock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                <div className="text-sm">
                  <p className="font-medium text-amber-900 dark:text-amber-100">
                    Mode Edit Aktif
                  </p>
                  <p className="text-amber-800 dark:text-amber-200">
                    Klik tanggal untuk menandai atau menghapus hari libur. Sabtu dan Minggu otomatis dianggap libur.
                  </p>
                </div>
              </>
            ) : (
              <>
                <Lock className="h-5 w-5 text-green-600 dark:text-green-400" />
                <div className="text-sm">
                  <p className="font-medium text-green-900 dark:text-green-100">
                    Kalender Terkunci
                  </p>
                  <p className="text-green-800 dark:text-green-200">
                    Klik tombol "Edit Kalender" untuk mengubah hari libur.
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-primary">{stats.nationalHolidayCount}</div>
              <p className="text-sm text-muted-foreground">Hari Libur Nasional</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-orange-600">{stats.weekendCount}</div>
              <p className="text-sm text-muted-foreground">Hari Sabtu & Minggu</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-red-600">{stats.totalNonWorkingDays}</div>
              <p className="text-sm text-muted-foreground">Total Hari Libur</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">{stats.workingDays}</div>
              <p className="text-sm text-muted-foreground">Hari Kerja</p>
            </CardContent>
          </Card>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-muted border"></div>
            <span className="text-muted-foreground">Sabtu/Minggu (Otomatis Libur)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-destructive"></div>
            <span className="text-muted-foreground">Hari Libur Nasional</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-background border"></div>
            <span className="text-muted-foreground">Hari Kerja</span>
          </div>
        </div>

        {/* 12 Month Calendar Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {monthNames.map((monthName, monthIndex) => {
              const { days, emptySlots } = getMonthCalendar(monthIndex);
              
              return (
                <Card key={monthIndex} className="overflow-hidden">
                  <CardHeader className="py-3 px-4 bg-muted/50">
                    <CardTitle className="text-sm font-semibold text-center">
                      {monthName} {selectedYear}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-2">
                    {/* Day headers */}
                    <div className="grid grid-cols-7 gap-0.5 mb-1">
                      {dayNames.map((day, i) => (
                        <div
                          key={day}
                          className={cn(
                            "text-center text-xs font-medium py-1",
                            i === 0 || i === 6 ? "text-muted-foreground" : "text-foreground"
                          )}
                        >
                          {day}
                        </div>
                      ))}
                    </div>
                    
                    {/* Calendar grid */}
                    <div className="grid grid-cols-7 gap-0.5">
                      {/* Empty slots before first day */}
                      {emptySlots.map((_, i) => (
                        <div key={`empty-${i}`} className="aspect-square" />
                      ))}
                      
                      {/* Days */}
                      {days.map((date) => {
                        const { isHoliday, isWeekendDay, holidayInfo, tempName } = getDateStatus(date);
                        const dayNumber = date.getDate();
                        
                        return (
                          <button
                            key={date.toISOString()}
                            onClick={() => handleDateClick(date)}
                            disabled={!isEditMode || isWeekendDay}
                            title={
                              isWeekendDay 
                                ? "Sabtu/Minggu (Otomatis Libur)" 
                                : isHoliday 
                                  ? (holidayInfo?.name || tempName || "Hari Libur")
                                  : format(date, "d MMMM yyyy", { locale: localeId })
                            }
                            className={cn(
                              "aspect-square flex items-center justify-center text-xs rounded transition-all",
                              isWeekendDay && "bg-muted text-muted-foreground cursor-default",
                              isHoliday && !isWeekendDay && "bg-destructive text-destructive-foreground font-semibold",
                              !isHoliday && !isWeekendDay && "hover:bg-accent",
                              isEditMode && !isWeekendDay && "cursor-pointer hover:ring-2 hover:ring-primary/50",
                              !isEditMode && "cursor-default"
                            )}
                          >
                            {dayNumber}
                          </button>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Holiday Name Dialog */}
        <Dialog open={namingDialogOpen} onOpenChange={setNamingDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nama Hari Libur</DialogTitle>
              <DialogDescription>
                {pendingDate && format(new Date(pendingDate), "EEEE, d MMMM yyyy", { locale: localeId })}
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Input
                placeholder="Contoh: Hari Kemerdekaan RI"
                value={holidayName}
                onChange={(e) => setHolidayName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleConfirmHolidayName();
                  }
                }}
                autoFocus
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setNamingDialogOpen(false)}>
                Batal
              </Button>
              <Button onClick={handleConfirmHolidayName}>
                Tambahkan
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
