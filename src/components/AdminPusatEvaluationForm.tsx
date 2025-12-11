import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
    Award, TrendingDown, TrendingUp, CheckCircle2, Star, Calculator, 
    Gavel, Clock, BarChart3, HandHeart, Crown, Building2, ArrowRight,
    AlertTriangle, Sparkles, Link, ExternalLink, ShieldCheck, Lock
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AdminPusatEvaluationFormProps {
    isOpen: boolean;
    onClose: () => void;
    employeeId: string;
    employeeName: string;
    employeeWorkUnit?: string;
    ratingPeriod: string;
    peerTotalPoints: number;
    adminUnitEvaluation?: any;
    evaluatorId: string;
    existingEvaluation?: any;
    onSuccess: () => void;
}

export function AdminPusatEvaluationForm({
    isOpen,
    onClose,
    employeeId,
    employeeName,
    employeeWorkUnit,
    ratingPeriod,
    peerTotalPoints,
    adminUnitEvaluation,
    evaluatorId,
    existingEvaluation,
    onSuccess
}: AdminPusatEvaluationFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Form states - can override admin_unit decisions
    const [hasDisciplinaryAction, setHasDisciplinaryAction] = useState(false);
    const [disciplinaryActionNote, setDisciplinaryActionNote] = useState("");
    const [disciplinaryEvidenceLink, setDisciplinaryEvidenceLink] = useState("");
    
    const [hasPoorAttendance, setHasPoorAttendance] = useState(false);
    const [attendanceNote, setAttendanceNote] = useState("");
    const [attendanceEvidenceLink, setAttendanceEvidenceLink] = useState("");
    
    const [hasPoorPerformance, setHasPoorPerformance] = useState(false);
    const [performanceNote, setPerformanceNote] = useState("");
    const [performanceEvidenceLink, setPerformanceEvidenceLink] = useState("");
    
    const [hasContribution, setHasContribution] = useState(false);
    const [contributionDescription, setContributionDescription] = useState("");
    const [contributionEvidenceLink, setContributionEvidenceLink] = useState("");

    // Additional adjustment unique to admin_pusat
    const [additionalAdjustment, setAdditionalAdjustment] = useState(0);
    const [additionalAdjustmentNote, setAdditionalAdjustmentNote] = useState("");

    // Verification states
    const [disciplinaryVerified, setDisciplinaryVerified] = useState(false);
    const [attendanceVerified, setAttendanceVerified] = useState(false);
    const [performanceVerified, setPerformanceVerified] = useState(false);
    const [contributionVerified, setContributionVerified] = useState(false);

    // Base points to use for calculations
    const basePoints = peerTotalPoints;

    // Load existing evaluation or pre-fill from admin_unit evaluation
    useEffect(() => {
        if (existingEvaluation) {
            // Load existing admin_pusat evaluation
            setHasDisciplinaryAction(existingEvaluation.has_disciplinary_action);
            setDisciplinaryActionNote(existingEvaluation.disciplinary_action_note || "");
            setDisciplinaryEvidenceLink(existingEvaluation.disciplinary_evidence_link || "");
            setHasPoorAttendance(existingEvaluation.has_poor_attendance);
            setAttendanceNote(existingEvaluation.attendance_note || "");
            setAttendanceEvidenceLink(existingEvaluation.attendance_evidence_link || "");
            setHasPoorPerformance(existingEvaluation.has_poor_performance);
            setPerformanceNote(existingEvaluation.performance_note || "");
            setPerformanceEvidenceLink(existingEvaluation.performance_evidence_link || "");
            setHasContribution(existingEvaluation.has_contribution);
            setContributionDescription(existingEvaluation.contribution_description || "");
            setContributionEvidenceLink(existingEvaluation.contribution_evidence_link || "");
            setAdditionalAdjustment(existingEvaluation.additional_adjustment || 0);
            setAdditionalAdjustmentNote(existingEvaluation.additional_adjustment_note || "");
            // Load verification states
            setDisciplinaryVerified(existingEvaluation.disciplinary_verified || false);
            setAttendanceVerified(existingEvaluation.attendance_verified || false);
            setPerformanceVerified(existingEvaluation.performance_verified || false);
            setContributionVerified(existingEvaluation.contribution_verified || false);
        } else if (adminUnitEvaluation) {
            // Pre-fill from admin_unit evaluation
            setHasDisciplinaryAction(adminUnitEvaluation.has_disciplinary_action);
            setDisciplinaryActionNote(adminUnitEvaluation.disciplinary_action_note || "");
            setDisciplinaryEvidenceLink(adminUnitEvaluation.disciplinary_evidence_link || "");
            setHasPoorAttendance(adminUnitEvaluation.has_poor_attendance);
            setAttendanceNote(adminUnitEvaluation.attendance_note || "");
            setAttendanceEvidenceLink(adminUnitEvaluation.attendance_evidence_link || "");
            setHasPoorPerformance(adminUnitEvaluation.has_poor_performance);
            setPerformanceNote(adminUnitEvaluation.performance_note || "");
            setPerformanceEvidenceLink(adminUnitEvaluation.performance_evidence_link || "");
            setHasContribution(adminUnitEvaluation.has_contribution);
            setContributionDescription(adminUnitEvaluation.contribution_description || "");
            setContributionEvidenceLink(adminUnitEvaluation.contribution_evidence_link || "");
            setAdditionalAdjustment(0);
            setAdditionalAdjustmentNote("");
            // Reset verification states for new evaluation
            setDisciplinaryVerified(false);
            setAttendanceVerified(false);
            setPerformanceVerified(false);
            setContributionVerified(false);
        } else {
            // Reset form
            setHasDisciplinaryAction(false);
            setDisciplinaryActionNote("");
            setDisciplinaryEvidenceLink("");
            setHasPoorAttendance(false);
            setAttendanceNote("");
            setAttendanceEvidenceLink("");
            setHasPoorPerformance(false);
            setPerformanceNote("");
            setPerformanceEvidenceLink("");
            setHasContribution(false);
            setContributionDescription("");
            setContributionEvidenceLink("");
            setAdditionalAdjustment(0);
            setAdditionalAdjustmentNote("");
            // Reset verification states
            setDisciplinaryVerified(false);
            setAttendanceVerified(false);
            setPerformanceVerified(false);
            setContributionVerified(false);
        }
    }, [existingEvaluation, adminUnitEvaluation, isOpen]);

    // Calculate penalties and bonuses
    const disciplinaryPenalty = hasDisciplinaryAction ? Math.round(basePoints * 0.15) : 0;
    const attendancePenalty = hasPoorAttendance ? Math.round(basePoints * 0.05) : 0;
    const performancePenalty = hasPoorPerformance ? Math.round(basePoints * 0.05) : 0;
    const contributionBonus = hasContribution ? Math.round(basePoints * 0.10) : 0;
    
    const totalPenalty = disciplinaryPenalty + attendancePenalty + performancePenalty;
    const totalBonus = contributionBonus + (additionalAdjustment > 0 ? additionalAdjustment : 0);
    const totalDeduction = totalPenalty + (additionalAdjustment < 0 ? Math.abs(additionalAdjustment) : 0);
    const finalTotalPoints = basePoints - totalPenalty + contributionBonus + additionalAdjustment;

    const handleSubmit = async () => {
        // Validation
        if (hasDisciplinaryAction && !disciplinaryActionNote.trim()) {
            toast.error("Mohon berikan catatan untuk hukuman disiplin");
            return;
        }
        if (hasContribution && !contributionDescription.trim()) {
            toast.error("Mohon jelaskan kontribusi pegawai");
            return;
        }
        if (additionalAdjustment !== 0 && !additionalAdjustmentNote.trim()) {
            toast.error("Mohon berikan catatan untuk penyesuaian tambahan");
            return;
        }

        setIsSubmitting(true);

        try {
            const evaluationData = {
                rated_employee_id: employeeId,
                evaluator_id: evaluatorId,
                rating_period: ratingPeriod,
                admin_unit_evaluation_id: adminUnitEvaluation?.id || null,
                peer_total_points: peerTotalPoints,
                admin_unit_final_points: adminUnitEvaluation?.final_total_points || null,
                has_disciplinary_action: hasDisciplinaryAction,
                disciplinary_penalty: disciplinaryPenalty,
                disciplinary_action_note: disciplinaryActionNote.trim() || null,
                disciplinary_evidence_link: disciplinaryEvidenceLink.trim() || null,
                disciplinary_verified: disciplinaryVerified,
                disciplinary_verified_at: disciplinaryVerified ? new Date().toISOString() : null,
                has_poor_attendance: hasPoorAttendance,
                attendance_penalty: attendancePenalty,
                attendance_note: attendanceNote.trim() || null,
                attendance_evidence_link: attendanceEvidenceLink.trim() || null,
                attendance_verified: attendanceVerified,
                attendance_verified_at: attendanceVerified ? new Date().toISOString() : null,
                has_poor_performance: hasPoorPerformance,
                performance_penalty: performancePenalty,
                performance_note: performanceNote.trim() || null,
                performance_evidence_link: performanceEvidenceLink.trim() || null,
                performance_verified: performanceVerified,
                performance_verified_at: performanceVerified ? new Date().toISOString() : null,
                has_contribution: hasContribution,
                contribution_bonus: contributionBonus,
                contribution_description: contributionDescription.trim() || null,
                contribution_evidence_link: contributionEvidenceLink.trim() || null,
                contribution_verified: contributionVerified,
                contribution_verified_at: contributionVerified ? new Date().toISOString() : null,
                additional_adjustment: additionalAdjustment,
                additional_adjustment_note: additionalAdjustmentNote.trim() || null,
                final_total_points: finalTotalPoints
            };

            if (existingEvaluation) {
                // Update existing
                const { error } = await supabase
                    .from("admin_pusat_evaluations")
                    .update(evaluationData)
                    .eq("id", existingEvaluation.id);

                if (error) throw error;
                toast.success("Penilaian final berhasil diperbarui");
            } else {
                // Insert new
                const { error } = await supabase
                    .from("admin_pusat_evaluations")
                    .insert(evaluationData);

                if (error) throw error;
                toast.success("Penilaian final berhasil disimpan");
            }

            onSuccess();
            onClose();
        } catch (error: any) {
            console.error("Error saving final evaluation:", error);
            toast.error("Gagal menyimpan penilaian: " + error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatPeriod = (period: string) => {
        const [year, month] = period.split('-');
        const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
        return `${months[parseInt(month) - 1]} ${year}`;
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="w-[95vw] max-w-3xl h-[90vh] sm:h-[85vh] flex flex-col p-0">
                <DialogHeader className="flex-shrink-0 p-4 sm:p-6 pb-2 sm:pb-4">
                    <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
                        <Crown className="h-5 w-5 text-purple-600" />
                        Penilaian Final Admin Pusat
                    </DialogTitle>
                    <DialogDescription className="text-xs sm:text-sm">
                        Evaluasi final untuk <strong>{employeeName}</strong> 
                        {employeeWorkUnit && <> dari <strong>{employeeWorkUnit}</strong></>}
                        {" "}periode <strong>{formatPeriod(ratingPeriod)}</strong>
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto px-4 sm:px-6">
                    <div className="space-y-4 sm:space-y-5 py-2 pb-4">
                        {/* Points Summary Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            {/* Peer Points */}
                            <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950/30 dark:to-orange-950/20 border-yellow-200 dark:border-yellow-800">
                                <CardContent className="p-3">
                                    <div className="flex items-center gap-2">
                                        <Star className="h-5 w-5 text-yellow-600 fill-yellow-600" />
                                        <div>
                                            <p className="text-xs text-muted-foreground">Poin Rekan Kerja</p>
                                            <p className="text-xl font-bold text-yellow-700">{peerTotalPoints}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Admin Unit Points */}
                            <Card className={`${adminUnitEvaluation ? 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800' : 'bg-muted/30'}`}>
                                <CardContent className="p-3">
                                    <div className="flex items-center gap-2">
                                        <Building2 className={`h-5 w-5 ${adminUnitEvaluation ? 'text-blue-600' : 'text-muted-foreground'}`} />
                                        <div>
                                            <p className="text-xs text-muted-foreground">Poin Admin Unit</p>
                                            {adminUnitEvaluation ? (
                                                <p className="text-xl font-bold text-blue-700">{adminUnitEvaluation.final_total_points}</p>
                                            ) : (
                                                <p className="text-sm text-muted-foreground italic">Belum dievaluasi</p>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Final Points */}
                            <Card className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/20 border-purple-200 dark:border-purple-800">
                                <CardContent className="p-3">
                                    <div className="flex items-center gap-2">
                                        <Crown className="h-5 w-5 text-purple-600" />
                                        <div>
                                            <p className="text-xs text-muted-foreground">Poin Final</p>
                                            <p className={`text-xl font-bold ${finalTotalPoints >= peerTotalPoints ? 'text-purple-700' : 'text-orange-600'}`}>
                                                {finalTotalPoints}
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Admin Unit Evaluation Info */}
                        {adminUnitEvaluation && (
                            <Card className="bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
                                <CardHeader className="py-3">
                                    <CardTitle className="text-sm flex items-center gap-2">
                                        <Building2 className="h-4 w-4 text-blue-600" />
                                        Hasil Evaluasi Admin Unit
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-0 pb-3">
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                                        <div className="flex items-center gap-1">
                                            <Gavel className={`h-3 w-3 ${adminUnitEvaluation.has_disciplinary_action ? 'text-red-500' : 'text-green-500'}`} />
                                            <span>Disiplin: {adminUnitEvaluation.has_disciplinary_action ? '-15%' : 'OK'}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Clock className={`h-3 w-3 ${adminUnitEvaluation.has_poor_attendance ? 'text-orange-500' : 'text-green-500'}`} />
                                            <span>Presensi: {adminUnitEvaluation.has_poor_attendance ? '-5%' : 'OK'}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <BarChart3 className={`h-3 w-3 ${adminUnitEvaluation.has_poor_performance ? 'text-amber-500' : 'text-green-500'}`} />
                                            <span>E-Kinerja: {adminUnitEvaluation.has_poor_performance ? '-5%' : 'OK'}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <HandHeart className={`h-3 w-3 ${adminUnitEvaluation.has_contribution ? 'text-green-500' : 'text-muted-foreground'}`} />
                                            <span>Kontribusi: {adminUnitEvaluation.has_contribution ? '+10%' : '-'}</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {!adminUnitEvaluation && (
                            <Card className="bg-orange-50/50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800">
                                <CardContent className="p-3">
                                    <div className="flex items-center gap-2 text-orange-700 dark:text-orange-300">
                                        <AlertTriangle className="h-4 w-4" />
                                        <p className="text-sm">Pegawai ini belum dievaluasi oleh Admin Unit. Anda akan membuat penilaian langsung.</p>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        <Separator />

                        {/* Evaluation Criteria */}
                        <div className="space-y-3">
                            <h4 className="font-semibold flex items-center gap-2">
                                <Calculator className="h-4 w-4" />
                                Kriteria Evaluasi Final
                            </h4>

                            {/* 1. Disciplinary Action - 15% penalty */}
                            <Card className={hasDisciplinaryAction ? "border-red-300 dark:border-red-700 bg-red-50/50 dark:bg-red-950/20" : ""}>
                                <CardHeader className="py-2 px-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Gavel className="h-4 w-4 text-red-600" />
                                            <CardTitle className="text-sm">Hukuman Disiplin</CardTitle>
                                            <Badge variant="destructive" className="text-xs">-15%</Badge>
                                            {disciplinaryVerified && (
                                                <Badge className="text-xs bg-green-600 text-white">
                                                    <Lock className="h-3 w-3 mr-1" />
                                                    Terverifikasi
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {adminUnitEvaluation && !disciplinaryVerified && (
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    className="bg-green-600 hover:bg-green-700 text-white text-xs h-7"
                                                    onClick={() => setDisciplinaryVerified(true)}
                                                >
                                                    <ShieldCheck className="h-3 w-3 mr-1" />
                                                    Verifikasi
                                                </Button>
                                            )}
                                            <Switch
                                                checked={hasDisciplinaryAction}
                                                onCheckedChange={setHasDisciplinaryAction}
                                            />
                                        </div>
                                    </div>
                                </CardHeader>
                                {hasDisciplinaryAction && (
                                    <CardContent className="pt-0 pb-3 px-4 space-y-3">
                                        <div className="space-y-2">
                                            <Label className="text-xs font-medium">Catatan <span className="text-destructive">*</span></Label>
                                            <Textarea
                                                value={disciplinaryActionNote}
                                                onChange={(e) => setDisciplinaryActionNote(e.target.value)}
                                                placeholder="Jelaskan hukuman disiplin..."
                                                className="min-h-[60px] text-sm"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-medium flex items-center gap-1">
                                                <Link className="h-3 w-3" />
                                                Link Bukti Dukung
                                            </Label>
                                            <div className="flex gap-2">
                                                <Input
                                                    type="url"
                                                    value={disciplinaryEvidenceLink}
                                                    onChange={(e) => setDisciplinaryEvidenceLink(e.target.value)}
                                                    placeholder="https://..."
                                                    className="text-sm flex-1"
                                                />
                                                {disciplinaryEvidenceLink && (
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => window.open(disciplinaryEvidenceLink, '_blank')}
                                                        className="shrink-0"
                                                    >
                                                        <ExternalLink className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                        <p className="text-xs text-red-600 flex items-center gap-1">
                                            <TrendingDown className="h-3 w-3" />
                                            Pengurangan: -{disciplinaryPenalty} poin
                                        </p>
                                    </CardContent>
                                )}
                            </Card>

                            {/* 2. Attendance - 5% penalty */}
                            <Card className={hasPoorAttendance ? "border-orange-300 dark:border-orange-700 bg-orange-50/50 dark:bg-orange-950/20" : ""}>
                                <CardHeader className="py-2 px-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Clock className="h-4 w-4 text-orange-600" />
                                            <CardTitle className="text-sm">Presensi Kehadiran</CardTitle>
                                            <Badge variant="outline" className="text-xs border-orange-500 text-orange-600">-5%</Badge>
                                            {attendanceVerified && (
                                                <Badge className="text-xs bg-green-600 text-white">
                                                    <Lock className="h-3 w-3 mr-1" />
                                                    Terverifikasi
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {adminUnitEvaluation && !attendanceVerified && (
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    className="bg-green-600 hover:bg-green-700 text-white text-xs h-7"
                                                    onClick={() => setAttendanceVerified(true)}
                                                >
                                                    <ShieldCheck className="h-3 w-3 mr-1" />
                                                    Verifikasi
                                                </Button>
                                            )}
                                            <Switch
                                                checked={hasPoorAttendance}
                                                onCheckedChange={setHasPoorAttendance}
                                            />
                                        </div>
                                    </div>
                                </CardHeader>
                                {hasPoorAttendance && (
                                    <CardContent className="pt-0 pb-3 px-4 space-y-3">
                                        <div className="space-y-2">
                                            <Label className="text-xs font-medium">Catatan (opsional)</Label>
                                            <Textarea
                                                value={attendanceNote}
                                                onChange={(e) => setAttendanceNote(e.target.value)}
                                                placeholder="Catatan presensi (opsional)..."
                                                className="min-h-[50px] text-sm"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-medium flex items-center gap-1">
                                                <Link className="h-3 w-3" />
                                                Link Bukti Dukung
                                            </Label>
                                            <div className="flex gap-2">
                                                <Input
                                                    type="url"
                                                    value={attendanceEvidenceLink}
                                                    onChange={(e) => setAttendanceEvidenceLink(e.target.value)}
                                                    placeholder="https://..."
                                                    className="text-sm flex-1"
                                                />
                                                {attendanceEvidenceLink && (
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => window.open(attendanceEvidenceLink, '_blank')}
                                                        className="shrink-0"
                                                    >
                                                        <ExternalLink className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                        <p className="text-xs text-orange-600 flex items-center gap-1">
                                            <TrendingDown className="h-3 w-3" />
                                            Pengurangan: -{attendancePenalty} poin
                                        </p>
                                    </CardContent>
                                )}
                            </Card>

                            {/* 3. E-Kinerja - 5% penalty */}
                            <Card className={hasPoorPerformance ? "border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-950/20" : ""}>
                                <CardHeader className="py-2 px-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <BarChart3 className="h-4 w-4 text-amber-600" />
                                            <CardTitle className="text-sm">E-Kinerja</CardTitle>
                                            <Badge variant="outline" className="text-xs border-amber-500 text-amber-600">-5%</Badge>
                                            {performanceVerified && (
                                                <Badge className="text-xs bg-green-600 text-white">
                                                    <Lock className="h-3 w-3 mr-1" />
                                                    Terverifikasi
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {adminUnitEvaluation && !performanceVerified && (
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    className="bg-green-600 hover:bg-green-700 text-white text-xs h-7"
                                                    onClick={() => setPerformanceVerified(true)}
                                                >
                                                    <ShieldCheck className="h-3 w-3 mr-1" />
                                                    Verifikasi
                                                </Button>
                                            )}
                                            <Switch
                                                checked={hasPoorPerformance}
                                                onCheckedChange={setHasPoorPerformance}
                                            />
                                        </div>
                                    </div>
                                </CardHeader>
                                {hasPoorPerformance && (
                                    <CardContent className="pt-0 pb-3 px-4 space-y-3">
                                        <div className="space-y-2">
                                            <Label className="text-xs font-medium">Catatan (opsional)</Label>
                                            <Textarea
                                                value={performanceNote}
                                                onChange={(e) => setPerformanceNote(e.target.value)}
                                                placeholder="Catatan E-Kinerja (opsional)..."
                                                className="min-h-[50px] text-sm"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-medium flex items-center gap-1">
                                                <Link className="h-3 w-3" />
                                                Link Bukti Dukung
                                            </Label>
                                            <div className="flex gap-2">
                                                <Input
                                                    type="url"
                                                    value={performanceEvidenceLink}
                                                    onChange={(e) => setPerformanceEvidenceLink(e.target.value)}
                                                    placeholder="https://..."
                                                    className="text-sm flex-1"
                                                />
                                                {performanceEvidenceLink && (
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => window.open(performanceEvidenceLink, '_blank')}
                                                        className="shrink-0"
                                                    >
                                                        <ExternalLink className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                        <p className="text-xs text-amber-600 flex items-center gap-1">
                                            <TrendingDown className="h-3 w-3" />
                                            Pengurangan: -{performancePenalty} poin
                                        </p>
                                    </CardContent>
                                )}
                            </Card>

                            {/* 4. Contribution - 10% bonus */}
                            <Card className={hasContribution ? "border-green-300 dark:border-green-700 bg-green-50/50 dark:bg-green-950/20" : ""}>
                                <CardHeader className="py-2 px-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <HandHeart className="h-4 w-4 text-green-600" />
                                            <CardTitle className="text-sm">Kontribusi</CardTitle>
                                            <Badge className="text-xs bg-green-600">+10%</Badge>
                                            {contributionVerified && (
                                                <Badge className="text-xs bg-green-600 text-white">
                                                    <Lock className="h-3 w-3 mr-1" />
                                                    Terverifikasi
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {adminUnitEvaluation && !contributionVerified && (
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    className="bg-green-600 hover:bg-green-700 text-white text-xs h-7"
                                                    onClick={() => setContributionVerified(true)}
                                                >
                                                    <ShieldCheck className="h-3 w-3 mr-1" />
                                                    Verifikasi
                                                </Button>
                                            )}
                                            <Switch
                                                checked={hasContribution}
                                                onCheckedChange={setHasContribution}
                                            />
                                        </div>
                                    </div>
                                </CardHeader>
                                {hasContribution && (
                                    <CardContent className="pt-0 pb-3 px-4 space-y-3">
                                        <div className="space-y-2">
                                            <Label className="text-xs font-medium">Deskripsi Kontribusi <span className="text-destructive">*</span></Label>
                                            <Textarea
                                                value={contributionDescription}
                                                onChange={(e) => setContributionDescription(e.target.value)}
                                                placeholder="Jelaskan kontribusi pegawai..."
                                                className="min-h-[60px] text-sm"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-medium flex items-center gap-1">
                                                <Link className="h-3 w-3" />
                                                Link Bukti Dukung
                                            </Label>
                                            <div className="flex gap-2">
                                                <Input
                                                    type="url"
                                                    value={contributionEvidenceLink}
                                                    onChange={(e) => setContributionEvidenceLink(e.target.value)}
                                                    placeholder="https://..."
                                                    className="text-sm flex-1"
                                                />
                                                {contributionEvidenceLink && (
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => window.open(contributionEvidenceLink, '_blank')}
                                                        className="shrink-0"
                                                    >
                                                        <ExternalLink className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                        <p className="text-xs text-green-600 flex items-center gap-1">
                                            <TrendingUp className="h-3 w-3" />
                                            Penambahan: +{contributionBonus} poin
                                        </p>
                                    </CardContent>
                                )}
                            </Card>

                            {/* 5. Additional Adjustment - Admin Pusat Only */}
                            <Card className={additionalAdjustment !== 0 ? "border-purple-300 dark:border-purple-700 bg-purple-50/50 dark:bg-purple-950/20" : ""}>
                                <CardHeader className="py-2 px-4">
                                    <div className="flex items-center gap-2">
                                        <Sparkles className="h-4 w-4 text-purple-600" />
                                        <CardTitle className="text-sm">Penyesuaian Tambahan</CardTitle>
                                        <Badge variant="outline" className="text-xs border-purple-500 text-purple-600">Admin Pusat</Badge>
                                    </div>
                                    <CardDescription className="text-xs mt-1">
                                        Tambahkan poin (+) atau kurangi poin (-) sesuai pertimbangan khusus
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="pt-0 pb-3 px-4 space-y-2">
                                    <div className="flex items-center gap-3">
                                        <Label className="text-sm whitespace-nowrap">Poin:</Label>
                                        <Input
                                            type="number"
                                            value={additionalAdjustment}
                                            onChange={(e) => setAdditionalAdjustment(parseInt(e.target.value) || 0)}
                                            placeholder="0"
                                            className="w-24 text-center"
                                        />
                                        <span className="text-xs text-muted-foreground">
                                            (positif = tambah, negatif = kurangi)
                                        </span>
                                    </div>
                                    {additionalAdjustment !== 0 && (
                                        <Textarea
                                            value={additionalAdjustmentNote}
                                            onChange={(e) => setAdditionalAdjustmentNote(e.target.value)}
                                            placeholder="Jelaskan alasan penyesuaian..."
                                            className="min-h-[60px] text-sm"
                                        />
                                    )}
                                    {additionalAdjustment !== 0 && (
                                        <p className={`text-xs flex items-center gap-1 ${additionalAdjustment > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {additionalAdjustment > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                                            {additionalAdjustment > 0 ? 'Penambahan' : 'Pengurangan'}: {additionalAdjustment > 0 ? '+' : ''}{additionalAdjustment} poin
                                        </p>
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        <Separator />

                        {/* Final Calculation Summary */}
                        <Card className="bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-950/50 dark:to-pink-950/50 border-purple-300 dark:border-purple-700">
                            <CardHeader className="py-3">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Crown className="h-5 w-5 text-purple-600" />
                                    Ringkasan Penilaian Final
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-0 pb-4">
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span>Poin dari Rekan Kerja:</span>
                                        <span className="font-semibold">{peerTotalPoints}</span>
                                    </div>
                                    {totalDeduction > 0 && (
                                        <div className="flex justify-between text-red-600">
                                            <span>Total Pengurangan:</span>
                                            <span className="font-semibold">-{totalDeduction}</span>
                                        </div>
                                    )}
                                    {totalBonus > 0 && (
                                        <div className="flex justify-between text-green-600">
                                            <span>Total Penambahan:</span>
                                            <span className="font-semibold">+{totalBonus}</span>
                                        </div>
                                    )}
                                    <Separator />
                                    <div className="flex justify-between items-center pt-1">
                                        <span className="font-bold text-base">POIN FINAL:</span>
                                        <span className={`text-2xl font-bold ${finalTotalPoints >= peerTotalPoints ? 'text-purple-700' : 'text-orange-600'}`}>
                                            {finalTotalPoints}
                                        </span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                <DialogFooter className="flex-shrink-0 p-4 sm:p-6 pt-4 border-t gap-2 flex-col sm:flex-row">
                    <Button variant="outline" onClick={onClose} disabled={isSubmitting} className="w-full sm:w-auto">
                        Batal
                    </Button>
                    <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700">
                        {isSubmitting ? "Menyimpan..." : (
                            <>
                                <Crown className="h-4 w-4 mr-2" />
                                {existingEvaluation ? "Perbarui Penilaian Final" : "Simpan Penilaian Final"}
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}