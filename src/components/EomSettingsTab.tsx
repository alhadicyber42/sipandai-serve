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
    <div className="space-y-6">
      <Tabs defaultValue="timeline" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="timeline" className="gap-2">
            <CalendarClock className="h-4 w-4" />
            Timeline Periode
          </TabsTrigger>
          <TabsTrigger value="units" className="gap-2">
            <Building2 className="h-4 w-4" />
            Unit Kerja Peserta
          </TabsTrigger>
        </TabsList>

        {/* Timeline Settings */}
        <TabsContent value="timeline" className="space-y-6">
          {/* Form for adding/editing period settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings2 className="h-5 w-5" />
                {editingSettingsId ? "Edit Pengaturan Periode" : "Tambah Pengaturan Periode Baru"}
              </CardTitle>
              <CardDescription>
                Atur timeline untuk setiap periode penilaian Employee of the Year
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Period Selection */}
              <div className="space-y-2">
                <Label>Periode Penilaian</Label>
                <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                  <SelectTrigger>
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
              <div className="p-4 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800 space-y-4">
                <div className="flex items-center gap-2 text-green-700 dark:text-green-300 font-medium">
                  <CalendarClock className="h-4 w-4" />
                  Rentang Periode Aktif
                </div>
                <p className="text-sm text-green-600 dark:text-green-400">
                  Selama periode ini, semua aktivitas (penilaian, evaluasi, verifikasi) dapat dilakukan bersamaan.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tanggal Mulai</Label>
                    <Input 
                      type="date" 
                      value={periodStartDate}
                      onChange={e => setPeriodStartDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tanggal Akhir</Label>
                    <Input 
                      type="date" 
                      value={periodEndDate}
                      onChange={e => setPeriodEndDate(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleSaveSettings} disabled={isSaving} className="gap-2">
                  <Save className="h-4 w-4" />
                  {isSaving ? "Menyimpan..." : editingSettingsId ? "Perbarui" : "Simpan"}
                </Button>
                {editingSettingsId && (
                  <Button variant="outline" onClick={resetForm}>
                    Batal
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* List of existing period settings */}
          <Card>
            <CardHeader>
              <CardTitle>Daftar Pengaturan Periode</CardTitle>
              <CardDescription>
                Timeline yang sudah dikonfigurasi untuk setiap periode
              </CardDescription>
            </CardHeader>
            <CardContent>
              {settings.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Belum ada pengaturan periode</p>
                  <p className="text-sm">Tambahkan pengaturan periode di atas</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Periode</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="hidden md:table-cell">Tanggal Aktif</TableHead>
                        <TableHead className="text-right">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {settings.map(setting => {
                        const phase = getCurrentPhase(setting);
                        return (
                          <TableRow key={setting.id}>
                            <TableCell className="font-medium">
                              {formatPeriodDisplay(setting.period)}
                            </TableCell>
                            <TableCell>
                              <Badge className={`${phase.color} gap-1`}>
                                {phase.icon}
                                {phase.phase}
                              </Badge>
                            </TableCell>
                            <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                              {format(parseISO(setting.rating_start_date), "d MMM yyyy", { locale: localeId })} - {format(parseISO(setting.rating_end_date), "d MMM yyyy", { locale: localeId })}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleEditSettings(setting)}
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
        <TabsContent value="units" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Unit Kerja Peserta
              </CardTitle>
              <CardDescription>
                Pilih unit kerja yang dapat mengikuti penilaian Employee of the Year
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 p-3 bg-muted rounded-lg flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Total unit kerja aktif:
                </span>
                <Badge variant="secondary" className="text-lg px-3">
                  {activeUnitsCount} / {WORK_UNITS.length}
                </Badge>
              </div>
              
              <div className="space-y-2">
                {participatingUnits.map(unit => {
                  const workUnit = WORK_UNITS.find(u => u.id === unit.work_unit_id);
                  return (
                    <div 
                      key={unit.work_unit_id}
                      className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                        unit.is_active 
                          ? 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800' 
                          : 'bg-muted/30 border-border'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Building2 className={`h-4 w-4 ${unit.is_active ? 'text-green-600' : 'text-muted-foreground'}`} />
                        <span className={unit.is_active ? 'font-medium' : 'text-muted-foreground'}>
                          {workUnit?.name || `Unit ${unit.work_unit_id}`}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        {unit.is_active && (
                          <Badge variant="outline" className="border-green-500 text-green-600 hidden sm:flex">
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
