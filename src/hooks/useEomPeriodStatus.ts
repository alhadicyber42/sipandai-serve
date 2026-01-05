import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface EomSettings {
  id: string;
  period: string;
  rating_start_date: string;
  rating_end_date: string;
  evaluation_start_date: string;
  evaluation_end_date: string;
  verification_start_date: string;
  verification_end_date: string;
}

export type PeriodPhase = 'not_started' | 'active' | 'completed' | 'no_settings';

interface PeriodStatus {
  phase: PeriodPhase;
  canRate: boolean;
  canEvaluate: boolean;
  canVerify: boolean;
  settings: EomSettings | null;
  message: string;
  activePeriod: string | null;
}

export function useEomPeriodStatus(period?: string, workUnitId?: number) {
  const [status, setStatus] = useState<PeriodStatus>({
    phase: 'no_settings',
    canRate: false,
    canEvaluate: false,
    canVerify: false,
    settings: null,
    message: "",
    activePeriod: null
  });
  const [isUnitParticipating, setIsUnitParticipating] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPeriodStatus();
  }, [period, workUnitId]);

  const loadPeriodStatus = async () => {
    setIsLoading(true);
    try {
      // Check if work unit is participating
      if (workUnitId) {
        const { data: unitData } = await supabase
          .from("eom_participating_units")
          .select("*")
          .eq("work_unit_id", workUnitId)
          .maybeSingle();
        
        const { count } = await supabase
          .from("eom_participating_units")
          .select("*", { count: 'exact', head: true });
        
        if (count && count > 0) {
          setIsUnitParticipating(unitData?.is_active ?? false);
        } else {
          setIsUnitParticipating(true);
        }
      }

      const now = new Date();
      let settings: EomSettings | null = null;
      
      if (period) {
        const { data } = await supabase
          .from("eom_settings")
          .select("*")
          .eq("period", period)
          .maybeSingle();
        settings = data;
      } else {
        // Find currently active period based on rating dates (all phases run concurrently)
        const { data: allSettings } = await supabase
          .from("eom_settings")
          .select("*")
          .order("rating_start_date", { ascending: false });
        
        if (allSettings && allSettings.length > 0) {
          for (const s of allSettings) {
            const periodStart = new Date(s.rating_start_date);
            const periodEnd = new Date(s.rating_end_date);
            periodEnd.setHours(23, 59, 59, 999);
            
            // Check if now is within the period range
            if (now >= periodStart && now <= periodEnd) {
              settings = s;
              break;
            }
          }
          
          // If no active period found, check for upcoming period
          if (!settings) {
            for (const s of allSettings) {
              const periodStart = new Date(s.rating_start_date);
              if (now < periodStart) {
                settings = s;
                break;
              }
            }
          }
        }
      }

      if (!settings) {
        setStatus({
          phase: 'no_settings',
          canRate: false,
          canEvaluate: false,
          canVerify: false,
          settings: null,
          message: "Tidak ada periode penilaian yang aktif saat ini.",
          activePeriod: null
        });
        return;
      }

      const periodStart = new Date(settings.rating_start_date);
      const periodEnd = new Date(settings.rating_end_date);
      periodEnd.setHours(23, 59, 59, 999);

      let phase: PeriodPhase;
      let canRate = false;
      let canEvaluate = false;
      let canVerify = false;
      let message = "";

      if (now < periodStart) {
        phase = 'not_started';
        message = `Periode penilaian ${settings.period} akan dimulai pada ${formatDate(periodStart)}`;
      } else if (now >= periodStart && now <= periodEnd) {
        phase = 'active';
        // All phases run concurrently
        canRate = true;
        canEvaluate = true;
        canVerify = true;
        message = `Periode penilaian ${settings.period} aktif sampai ${formatDate(periodEnd)}`;
      } else {
        phase = 'completed';
        message = `Periode ${settings.period} sudah selesai.`;
      }

      setStatus({
        phase,
        canRate,
        canEvaluate,
        canVerify,
        settings,
        message,
        activePeriod: settings.period
      });
    } catch (error) {
      console.error("Error loading period status:", error);
      setStatus({
        phase: 'no_settings',
        canRate: false,
        canEvaluate: false,
        canVerify: false,
        settings: null,
        message: "Terjadi kesalahan memuat periode penilaian.",
        activePeriod: null
      });
    } finally {
      setIsLoading(false);
    }
  };

  return { ...status, isUnitParticipating, isLoading, refresh: loadPeriodStatus };
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('id-ID', { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  });
}
