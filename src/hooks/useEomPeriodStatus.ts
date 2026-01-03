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

interface ParticipatingUnit {
  work_unit_id: number;
  is_active: boolean;
}

export type PeriodPhase = 'not_started' | 'rating' | 'evaluation' | 'verification' | 'completed' | 'no_settings';

interface PeriodStatus {
  phase: PeriodPhase;
  canRate: boolean;
  canEvaluate: boolean;
  canVerify: boolean;
  settings: EomSettings | null;
  message: string;
  activePeriod: string | null; // The period from active settings
}

export function useEomPeriodStatus(period?: string, workUnitId?: number) {
  const [status, setStatus] = useState<PeriodStatus>({
    phase: 'no_settings',
    canRate: false, // Default to NOT allow if no settings - changed from true
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
        
        // If no entry exists or is_active is false, unit is not participating
        // If no entries exist at all in the table, assume all units participate (backward compatibility)
        const { count } = await supabase
          .from("eom_participating_units")
          .select("*", { count: 'exact', head: true });
        
        if (count && count > 0) {
          setIsUnitParticipating(unitData?.is_active ?? false);
        } else {
          setIsUnitParticipating(true); // No restrictions configured
        }
      }

      const now = new Date();
      
      // If a specific period is requested, get that period's settings
      // Otherwise, find the currently active period based on date ranges
      let settings: EomSettings | null = null;
      
      if (period) {
        // Get settings for specific period
        const { data } = await supabase
          .from("eom_settings")
          .select("*")
          .eq("period", period)
          .maybeSingle();
        settings = data;
      } else {
        // Find currently active period - check ALL settings and find which one's date range we're in
        const { data: allSettings } = await supabase
          .from("eom_settings")
          .select("*")
          .order("rating_start_date", { ascending: false });
        
        if (allSettings && allSettings.length > 0) {
          // Find a period where current date falls within any of the phases
          for (const s of allSettings) {
            const ratingStart = new Date(s.rating_start_date);
            const verifyEnd = new Date(s.verification_end_date);
            verifyEnd.setHours(23, 59, 59, 999);
            
            // Check if now is within the entire period range (from rating start to verification end)
            if (now >= ratingStart && now <= verifyEnd) {
              settings = s;
              break;
            }
          }
          
          // If no active period found, check if there's an upcoming period
          if (!settings) {
            for (const s of allSettings) {
              const ratingStart = new Date(s.rating_start_date);
              if (now < ratingStart) {
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
          canRate: false, // No active period = cannot rate
          canEvaluate: false,
          canVerify: false,
          settings: null,
          message: "Tidak ada periode penilaian yang aktif saat ini.",
          activePeriod: null
        });
        return;
      }

      const ratingStart = new Date(settings.rating_start_date);
      const ratingEnd = new Date(settings.rating_end_date);
      ratingEnd.setHours(23, 59, 59, 999); // End of day
      
      const evalStart = new Date(settings.evaluation_start_date);
      const evalEnd = new Date(settings.evaluation_end_date);
      evalEnd.setHours(23, 59, 59, 999);
      
      const verifyStart = new Date(settings.verification_start_date);
      const verifyEnd = new Date(settings.verification_end_date);
      verifyEnd.setHours(23, 59, 59, 999);

      let phase: PeriodPhase;
      let canRate = false;
      let canEvaluate = false;
      let canVerify = false;
      let message = "";

      if (now < ratingStart) {
        phase = 'not_started';
        message = `Periode penilaian ${settings.period} akan dimulai pada ${formatDate(ratingStart)}`;
      } else if (now >= ratingStart && now <= ratingEnd) {
        phase = 'rating';
        canRate = true;
        message = `Periode penilaian ${settings.period} aktif sampai ${formatDate(ratingEnd)}`;
      } else if (now >= evalStart && now <= evalEnd) {
        phase = 'evaluation';
        canEvaluate = true;
        message = `Periode evaluasi ${settings.period} aktif. Penilaian oleh User Unit sudah ditutup.`;
      } else if (now >= verifyStart && now <= verifyEnd) {
        phase = 'verification';
        canVerify = true;
        message = `Periode verifikasi dan penetapan pemenang ${settings.period} aktif.`;
      } else if (now > verifyEnd) {
        phase = 'completed';
        message = `Periode ${settings.period} sudah selesai.`;
      } else {
        // Gap between rating end and evaluation start, or between evaluation end and verification start
        phase = 'not_started';
        message = `Menunggu fase berikutnya untuk periode ${settings.period}.`;
      }

      setStatus({
        phase,
        canRate,
        canEvaluate,
        canVerify,
        settings,
        message,
        activePeriod: settings.period // Return the period from settings
      });
    } catch (error) {
      console.error("Error loading period status:", error);
      // On error, don't allow actions
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
