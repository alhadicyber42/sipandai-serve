import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Building2, Clock, Save, Settings2, CheckCircle2, CalendarClock, Users, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { WORK_UNITS } from "@/lib/constants";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { format, parseISO } from "date-fns";
import { id as localeId } from "date-fns/locale";

interface EomSettings {
  id?: string;
  period: string;
  rating_start_date: string;
  rating_end_date: string;
  evaluation_start_date: string;
  evaluation_end_date: string;
  verification_start_date: string;
  verification_end_date: string;
}

interface ParticipatingUnit {
  id?: string;
  work_unit_id: number;
  is_active: boolean;
}

export function EomSettingsTab() {
  const { user } = useAuth();
  const [participatingUnits, setParticipatingUnits] = useState<ParticipatingUnit[]>([]);
  const [settings, setSettings] = useState<EomSettings[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Simplified form state - only start and end date (all phases run concurrently)
  const [selectedPeriod, setSelectedPeriod] = useState<string>("");
  const [periodStartDate, setPeriodStartDate] = useState<string>("");
  const [periodEndDate, setPeriodEndDate] = useState<string>("");
  const [editingSettingsId, setEditingSettingsId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Load participating units
      const { data: unitsData, error: unitsError } = await supabase
        .from("eom_participating_units")
        .select("*");
      
      if (unitsError) throw unitsError;
      
      // Initialize all work units with their participation status
      const allUnits = WORK_UNITS.map(unit => {
        const existing = unitsData?.find(u => u.work_unit_id === unit.id);
        return {
          id: existing?.id,
          work_unit_id: unit.id,
          is_active: existing?.is_active ?? false
        };
      });
      setParticipatingUnits(allUnits);

      // Load settings
      const { data: settingsData, error: settingsError } = await supabase
        .from("eom_settings")
        .select("*")
        .order("period", { ascending: false });
      
      if (settingsError) throw settingsError;
      setSettings(settingsData || []);
    } catch (error) {
      console.error("Error loading EoM settings:", error);
      toast.error("Gagal memuat pengaturan");
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleUnit = async (unitId: number, currentStatus: boolean) => {
    try {
      const existingUnit = participatingUnits.find(u => u.work_unit_id === unitId);
      
      if (existingUnit?.id) {
        // Update existing
        const { error } = await supabase
          .from("eom_participating_units")
          .update({ is_active: !currentStatus })
          .eq("id", existingUnit.id);
        
        if (error) throw error;
      } else {
        // Insert new
        const { error } = await supabase
          .from("eom_participating_units")
          .insert({
            work_unit_id: unitId,
            is_active: !currentStatus
          });
        
        if (error) throw error;
      }

      setParticipatingUnits(prev => 
        prev.map(u => 
          u.work_unit_id === unitId 
            ? { ...u, is_active: !currentStatus } 
            : u
        )
      );
      
      toast.success(`Unit kerja ${!currentStatus ? 'diaktifkan' : 'dinonaktifkan'}`);
    } catch (error) {
      console.error("Error toggling unit:", error);
      toast.error("Gagal mengubah status unit kerja");
    }
  };

  const generatePeriodOptions = () => {
    const options = [];
    const now = new Date();
    const currentYear = now.getFullYear();
    
    // Generate 12 months back and 12 months forward
    for (let y = currentYear - 1; y <= currentYear + 1; y++) {
      for (let m = 1; m <= 12; m++) {
        const period = `${y}-${m.toString().padStart(2, '0')}`;
        options.push(period);
      }
    }
    return options;
  };

  const formatPeriodDisplay = (period: string) => {
    const [year, month] = period.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    return format(date, "MMMM yyyy", { locale: localeId });
  };

  const handleSaveSettings = async () => {
    if (!selectedPeriod || !periodStartDate || !periodEndDate) {
      toast.error("Mohon lengkapi semua field");
      return;
    }

    // Validate date range
    const pStart = new Date(periodStartDate);
    const pEnd = new Date(periodEndDate);

    if (pStart > pEnd) {
      toast.error("Tanggal akhir harus setelah tanggal mulai");
      return;
    }

    setIsSaving(true);
    try {
      // All phases use the same date range (concurrent)
      const settingsData = {
        period: selectedPeriod,
        rating_start_date: periodStartDate,
        rating_end_date: periodEndDate,
        evaluation_start_date: periodStartDate,
        evaluation_end_date: periodEndDate,
        verification_start_date: periodStartDate,
        verification_end_date: periodEndDate,
        created_by: user?.id
      };

      if (editingSettingsId) {
        const { error } = await supabase
          .from("eom_settings")
          .update(settingsData)
          .eq("id", editingSettingsId);
        
        if (error) throw error;
        toast.success("Pengaturan periode berhasil diperbarui");
      } else {
        const { error } = await supabase
          .from("eom_settings")
          .insert(settingsData);
        
        if (error) {
          if (error.code === '23505') {
            toast.error("Pengaturan untuk periode ini sudah ada");
            return;
          }
          throw error;
        }
        toast.success("Pengaturan periode berhasil disimpan");
      }

      // Reset form and reload
      resetForm();
      loadData();
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Gagal menyimpan pengaturan");
    } finally {
      setIsSaving(false);
    }
  };

  const resetForm = () => {
    setSelectedPeriod("");
    setPeriodStartDate("");
    setPeriodEndDate("");
    setEditingSettingsId(null);
  };

  const handleEditSettings = (setting: EomSettings) => {
    setEditingSettingsId(setting.id || null);
    setSelectedPeriod(setting.period);
    setPeriodStartDate(setting.rating_start_date);
    setPeriodEndDate(setting.rating_end_date);
  };

  const getCurrentPhase = (setting: EomSettings): { phase: string; color: string; icon: React.ReactNode } => {
    const now = new Date();
    const periodStart = new Date(setting.rating_start_date);
    const periodEnd = new Date(setting.rating_end_date);
    periodEnd.setHours(23, 59, 59, 999);

    if (now < periodStart) {
      return { phase: "Belum Dimulai", color: "bg-gray-100 text-gray-700", icon: <Clock className="h-3 w-3" /> };
    } else if (now >= periodStart && now <= periodEnd) {
      return { phase: "Aktif", color: "bg-green-100 text-green-700", icon: <CheckCircle2 className="h-3 w-3" /> };
    } else {
      return { phase: "Selesai", color: "bg-blue-100 text-blue-700", icon: <Star className="h-3 w-3" /> };
    }
  };

  const activeUnitsCount = participatingUnits.filter(u => u.is_active).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <Tabs defaultValue="timeline" className="w-full">
        <TabsList className="grid w-full grid-cols-2 h-9 sm:h-10">
          <TabsTrigger value="timeline" className="gap-1 sm:gap-2 text-xs sm:text-sm">
            <CalendarClock className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Timeline Periode</span>
            <span className="sm:hidden">Timeline</span>
          </TabsTrigger>
          <TabsTrigger value="units" className="gap-1 sm:gap-2 text-xs sm:text-sm">
            <Building2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Unit Kerja Peserta</span>
            <span className="sm:hidden">Unit Kerja</span>
          </TabsTrigger>
        </TabsList>

        {/* Timeline Settings */}
        <TabsContent value="timeline" className="space-y-4 sm:space-y-6 mt-4">
          {/* Form for adding/editing period settings */}
          <Card>
            <CardHeader className="p-4 sm:p-6 pb-3 sm:pb-4">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Settings2 className="h-4 w-4 sm:h-5 sm:w-5" />
                {editingSettingsId ? "Edit Periode" : "Tambah Periode Baru"}
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Atur timeline untuk setiap periode penilaian
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0 space-y-4 sm:space-y-6">
              {/* Period Selection */}
              <div className="space-y-2">
                <Label className="text-sm">Periode Penilaian</Label>
                <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Pilih periode (bulan)" />
                  </SelectTrigger>
                  <SelectContent>
                    {generatePeriodOptions().map(period => (
                      <SelectItem key={period} value={period}>
                        {formatPeriodDisplay(period)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Unified Period - All phases run concurrently */}
              <div className="p-3 sm:p-4 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800 space-y-3 sm:space-y-4">
                <div className="flex items-center gap-2 text-green-700 dark:text-green-300 font-medium text-sm">
                  <CalendarClock className="h-4 w-4" />
                  Rentang Periode Aktif
                </div>
                <p className="text-xs sm:text-sm text-green-600 dark:text-green-400">
                  Selama periode ini, semua aktivitas (penilaian, evaluasi, verifikasi) dapat dilakukan bersamaan.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label className="text-sm">Tanggal Mulai</Label>
                    <Input 
                      type="date" 
                      value={periodStartDate}
                      onChange={e => setPeriodStartDate(e.target.value)}
                      className="text-sm"
                    />
                  </div>
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label className="text-sm">Tanggal Akhir</Label>
                    <Input 
                      type="date" 
                      value={periodEndDate}
                      onChange={e => setPeriodEndDate(e.target.value)}
                      className="text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <Button onClick={handleSaveSettings} disabled={isSaving} className="gap-2 text-sm w-full sm:w-auto">
                  <Save className="h-4 w-4" />
                  {isSaving ? "Menyimpan..." : editingSettingsId ? "Perbarui" : "Simpan"}
                </Button>
                {editingSettingsId && (
                  <Button variant="outline" onClick={resetForm} className="w-full sm:w-auto">
                    Batal
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* List of existing period settings */}
          <Card>
            <CardHeader className="p-4 sm:p-6 pb-3 sm:pb-4">
              <CardTitle className="text-base sm:text-lg">Daftar Pengaturan Periode</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Timeline yang sudah dikonfigurasi
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 sm:p-4 sm:pt-0">
              {settings.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground px-4">
                  <Calendar className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">Belum ada pengaturan periode</p>
                  <p className="text-xs">Tambahkan pengaturan periode di atas</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs sm:text-sm">Periode</TableHead>
                        <TableHead className="text-xs sm:text-sm">Status</TableHead>
                        <TableHead className="hidden sm:table-cell text-xs sm:text-sm">Tanggal Aktif</TableHead>
                        <TableHead className="text-right text-xs sm:text-sm">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {settings.map(setting => {
                        const phase = getCurrentPhase(setting);
                        return (
                          <TableRow key={setting.id}>
                            <TableCell className="font-medium text-xs sm:text-sm py-2 sm:py-4">
                              <div>
                                <span className="block">{formatPeriodDisplay(setting.period)}</span>
                                <span className="text-[10px] text-muted-foreground sm:hidden block mt-0.5">
                                  {format(parseISO(setting.rating_start_date), "d MMM", { locale: localeId })} - {format(parseISO(setting.rating_end_date), "d MMM", { locale: localeId })}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="py-2 sm:py-4">
                              <Badge className={`${phase.color} gap-0.5 sm:gap-1 text-[10px] sm:text-xs px-1.5 sm:px-2`}>
                                {phase.icon}
                                <span className="hidden sm:inline">{phase.phase}</span>
                                <span className="sm:hidden">{phase.phase === "Belum Dimulai" ? "Pending" : phase.phase}</span>
                              </Badge>
                            </TableCell>
                            <TableCell className="hidden sm:table-cell text-xs sm:text-sm text-muted-foreground py-2 sm:py-4">
                              {format(parseISO(setting.rating_start_date), "d MMM yyyy", { locale: localeId })} - {format(parseISO(setting.rating_end_date), "d MMM yyyy", { locale: localeId })}
                            </TableCell>
                            <TableCell className="text-right py-2 sm:py-4">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleEditSettings(setting)}
                                className="h-7 sm:h-8 text-xs px-2 sm:px-3"
                              >
                                Edit
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Participating Units */}
        <TabsContent value="units" className="space-y-4 sm:space-y-6 mt-4">
          <Card>
            <CardHeader className="p-4 sm:p-6 pb-3 sm:pb-4">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Users className="h-4 w-4 sm:h-5 sm:w-5" />
                Unit Kerja Peserta
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Pilih unit kerja yang dapat mengikuti penilaian
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <div className="mb-4 p-2 sm:p-3 bg-muted rounded-lg flex items-center justify-between">
                <span className="text-xs sm:text-sm text-muted-foreground">
                  Total unit aktif:
                </span>
                <Badge variant="secondary" className="text-sm sm:text-lg px-2 sm:px-3">
                  {activeUnitsCount} / {WORK_UNITS.length}
                </Badge>
              </div>
              
              <div className="space-y-1.5 sm:space-y-2">
                {participatingUnits.map(unit => {
                  const workUnit = WORK_UNITS.find(u => u.id === unit.work_unit_id);
                  return (
                    <div 
                      key={unit.work_unit_id}
                      className={`flex items-center justify-between p-2 sm:p-3 rounded-lg border transition-colors ${
                        unit.is_active 
                          ? 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800' 
                          : 'bg-muted/30 border-border'
                      }`}
                    >
                      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                        <Building2 className={`h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0 ${unit.is_active ? 'text-green-600' : 'text-muted-foreground'}`} />
                        <span className={`text-xs sm:text-sm truncate ${unit.is_active ? 'font-medium' : 'text-muted-foreground'}`}>
                          {workUnit?.name || `Unit ${unit.work_unit_id}`}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                        {unit.is_active && (
                          <Badge variant="outline" className="border-green-500 text-green-600 hidden sm:flex text-xs">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Aktif
                          </Badge>
                        )}
                        <Switch
                          checked={unit.is_active}
                          onCheckedChange={() => handleToggleUnit(unit.work_unit_id, unit.is_active)}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
