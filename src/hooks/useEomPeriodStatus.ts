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
}

export function useEomPeriodStatus(period?: string, workUnitId?: number) {
  const [status, setStatus] = useState<PeriodStatus>({
    phase: 'no_settings',
    canRate: true, // Default allow if no settings
    canEvaluate: true,
    canVerify: true,
    settings: null,
    message: ""
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

      // Get current period settings
      const targetPeriod = period || getCurrentPeriod();
      
      const { data: settings } = await supabase
        .from("eom_settings")
        .select("*")
        .eq("period", targetPeriod)
        .maybeSingle();

      if (!settings) {
        setStatus({
          phase: 'no_settings',
          canRate: true,
          canEvaluate: true,
          canVerify: true,
          settings: null,
          message: "Tidak ada pengaturan periode. Semua fitur tersedia."
        });
        return;
      }

      const now = new Date();
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
        message = `Periode penilaian akan dimulai pada ${formatDate(ratingStart)}`;
      } else if (now >= ratingStart && now <= ratingEnd) {
        phase = 'rating';
        canRate = true;
        message = `Periode penilaian aktif sampai ${formatDate(ratingEnd)}`;
      } else if (now >= evalStart && now <= evalEnd) {
        phase = 'evaluation';
        canEvaluate = true;
        message = `Periode evaluasi aktif. Penilaian oleh User Unit sudah ditutup.`;
      } else if (now >= verifyStart && now <= verifyEnd) {
        phase = 'verification';
        canVerify = true;
        message = `Periode verifikasi dan penetapan pemenang aktif.`;
      } else if (now > verifyEnd) {
        phase = 'completed';
        message = `Periode sudah selesai.`;
      } else {
        // Gap between periods
        phase = 'not_started';
        message = `Menunggu periode berikutnya.`;
      }

      setStatus({
        phase,
        canRate,
        canEvaluate,
        canVerify,
        settings,
        message
      });
    } catch (error) {
      console.error("Error loading period status:", error);
      // On error, allow all actions
      setStatus({
        phase: 'no_settings',
        canRate: true,
        canEvaluate: true,
        canVerify: true,
        settings: null,
        message: ""
      });
    } finally {
      setIsLoading(false);
    }
  };

  return { ...status, isUnitParticipating, isLoading, refresh: loadPeriodStatus };
}

function getCurrentPeriod(): string {
  const now = new Date();
  return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('id-ID', { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  });
}
