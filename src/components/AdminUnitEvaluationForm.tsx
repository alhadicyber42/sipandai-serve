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
import { AlertTriangle, Award, TrendingDown, TrendingUp, CheckCircle2, XCircle, Star, Calculator, Gavel, Clock, BarChart3, HandHeart, Link, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AdminUnitEvaluationFormProps {
    isOpen: boolean;
    onClose: () => void;
    employeeId: string;
    employeeName: string;
    ratingPeriod: string;
    originalTotalPoints: number;
    workUnitId: number;
    evaluatorId: string;
    existingEvaluation?: any;
    onSuccess: () => void;
}

export function AdminUnitEvaluationForm({
    isOpen,
    onClose,
    employeeId,
    employeeName,
    ratingPeriod,
    originalTotalPoints,
    workUnitId,
    evaluatorId,
    existingEvaluation,
    onSuccess
}: AdminUnitEvaluationFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Form states
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

    // Load existing evaluation if available
    useEffect(() => {
        if (existingEvaluation) {
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
        }
    }, [existingEvaluation, isOpen]);

    // Calculate penalties and bonuses
    const disciplinaryPenalty = hasDisciplinaryAction ? Math.round(originalTotalPoints * 0.15) : 0;
    const attendancePenalty = hasPoorAttendance ? Math.round(originalTotalPoints * 0.05) : 0;
    const performancePenalty = hasPoorPerformance ? Math.round(originalTotalPoints * 0.05) : 0;
    const contributionBonus = hasContribution ? Math.round(originalTotalPoints * 0.10) : 0;
    
    const totalPenalty = disciplinaryPenalty + attendancePenalty + performancePenalty;
    const finalTotalPoints = originalTotalPoints - totalPenalty + contributionBonus;

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

        setIsSubmitting(true);

        try {
            const evaluationData = {
                rated_employee_id: employeeId,
                evaluator_id: evaluatorId,
                rating_period: ratingPeriod,
                work_unit_id: workUnitId,
                has_disciplinary_action: hasDisciplinaryAction,
                disciplinary_action_note: disciplinaryActionNote.trim() || null,
                disciplinary_evidence_link: disciplinaryEvidenceLink.trim() || null,
                has_poor_attendance: hasPoorAttendance,
                attendance_note: attendanceNote.trim() || null,
                attendance_evidence_link: attendanceEvidenceLink.trim() || null,
                has_poor_performance: hasPoorPerformance,
                performance_note: performanceNote.trim() || null,
                performance_evidence_link: performanceEvidenceLink.trim() || null,
                has_contribution: hasContribution,
                contribution_description: contributionDescription.trim() || null,
                contribution_evidence_link: contributionEvidenceLink.trim() || null,
                original_total_points: originalTotalPoints,
                disciplinary_penalty: disciplinaryPenalty,
                attendance_penalty: attendancePenalty,
                performance_penalty: performancePenalty,
                contribution_bonus: contributionBonus,
                final_total_points: finalTotalPoints
            };

            if (existingEvaluation) {
                // Update existing
                const { error } = await supabase
                    .from("admin_unit_evaluations")
                    .update(evaluationData)
                    .eq("id", existingEvaluation.id);

                if (error) throw error;
                toast.success("Penilaian lanjutan berhasil diperbarui");
            } else {
                // Insert new
                const { error } = await supabase
                    .from("admin_unit_evaluations")
                    .insert(evaluationData);

                if (error) throw error;
                toast.success("Penilaian lanjutan berhasil disimpan");
            }

            onSuccess();
            onClose();
        } catch (error: any) {
            console.error("Error saving evaluation:", error);
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
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Award className="h-5 w-5 text-yellow-600" />
                        Penilaian Lanjutan Pimpinan Unit
                    </DialogTitle>
                    <DialogDescription>
                        Evaluasi akhir untuk <strong>{employeeName}</strong> periode <strong>{formatPeriod(ratingPeriod)}</strong>
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Original Score Card */}
                    <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950/30 dark:to-orange-950/20 border-yellow-200 dark:border-yellow-800">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Star className="h-6 w-6 text-yellow-600 fill-yellow-600" />
                                    <div>
                                        <p className="text-sm text-muted-foreground">Total Poin dari Rekan Kerja</p>
                                        <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-400">{originalTotalPoints} Poin</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Separator />

                    {/* Evaluation Criteria */}
                    <div className="space-y-4">
                        <h4 className="font-semibold text-lg flex items-center gap-2">
                            <Calculator className="h-5 w-5" />
                            Kriteria Evaluasi
                        </h4>

                        {/* 1. Disciplinary Action - 15% penalty */}
                        <Card className={hasDisciplinaryAction ? "border-red-300 dark:border-red-700 bg-red-50/50 dark:bg-red-950/20" : ""}>
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Gavel className="h-5 w-5 text-red-600" />
                                        <CardTitle className="text-base">Hukuman Disiplin</CardTitle>
                                        <Badge variant="destructive" className="text-xs">-15%</Badge>
                                    </div>
                                    <Switch
                                        checked={hasDisciplinaryAction}
                                        onCheckedChange={setHasDisciplinaryAction}
                                    />
                                </div>
                                <CardDescription className="text-sm">
                                    Apakah pegawai memiliki hukuman disiplin dalam periode ini?
                                </CardDescription>
                            </CardHeader>
                        {hasDisciplinaryAction && (
                                <CardContent className="pt-0">
                                    <div className="space-y-3">
                                        <div className="space-y-2">
                                            <Label htmlFor="disciplinary-note" className="text-sm font-medium">
                                                Catatan Hukuman Disiplin <span className="text-destructive">*</span>
                                            </Label>
                                            <Textarea
                                                id="disciplinary-note"
                                                value={disciplinaryActionNote}
                                                onChange={(e) => setDisciplinaryActionNote(e.target.value)}
                                                placeholder="Jelaskan jenis hukuman disiplin yang diterima..."
                                                className="min-h-[80px]"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="disciplinary-link" className="text-sm font-medium flex items-center gap-1">
                                                <Link className="h-3 w-3" />
                                                Link Bukti Dukung
                                            </Label>
                                            <div className="flex gap-2">
                                                <Input
                                                    id="disciplinary-link"
                                                    type="url"
                                                    value={disciplinaryEvidenceLink}
                                                    onChange={(e) => setDisciplinaryEvidenceLink(e.target.value)}
                                                    placeholder="https://..."
                                                    className="flex-1"
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
                                        <p className="text-xs text-destructive flex items-center gap-1">
                                            <TrendingDown className="h-3 w-3" />
                                            Pengurangan: -{disciplinaryPenalty} poin
                                        </p>
                                    </div>
                                </CardContent>
                            )}
                        </Card>

                        {/* 2. Attendance - 5% penalty */}
                        <Card className={hasPoorAttendance ? "border-orange-300 dark:border-orange-700 bg-orange-50/50 dark:bg-orange-950/20" : ""}>
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Clock className="h-5 w-5 text-orange-600" />
                                        <CardTitle className="text-base">Presensi Kehadiran</CardTitle>
                                        <Badge variant="outline" className="text-xs border-orange-500 text-orange-600">-5%</Badge>
                                    </div>
                                    <Switch
                                        checked={hasPoorAttendance}
                                        onCheckedChange={setHasPoorAttendance}
                                    />
                                </div>
                                <CardDescription className="text-sm">
                                    Apakah presensi kehadiran pegawai buruk dalam periode ini?
                                </CardDescription>
                            </CardHeader>
                        {hasPoorAttendance && (
                                <CardContent className="pt-0">
                                    <div className="space-y-3">
                                        <div className="space-y-2">
                                            <Label htmlFor="attendance-note" className="text-sm font-medium">
                                                Catatan Presensi (opsional)
                                            </Label>
                                            <Textarea
                                                id="attendance-note"
                                                value={attendanceNote}
                                                onChange={(e) => setAttendanceNote(e.target.value)}
                                                placeholder="Jelaskan masalah presensi..."
                                                className="min-h-[60px]"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="attendance-link" className="text-sm font-medium flex items-center gap-1">
                                                <Link className="h-3 w-3" />
                                                Link Bukti Dukung
                                            </Label>
                                            <div className="flex gap-2">
                                                <Input
                                                    id="attendance-link"
                                                    type="url"
                                                    value={attendanceEvidenceLink}
                                                    onChange={(e) => setAttendanceEvidenceLink(e.target.value)}
                                                    placeholder="https://..."
                                                    className="flex-1"
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
                                    </div>
                                </CardContent>
                            )}
                        </Card>

                        {/* 3. E-Kinerja - 5% penalty */}
                        <Card className={hasPoorPerformance ? "border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-950/20" : ""}>
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <BarChart3 className="h-5 w-5 text-amber-600" />
                                        <CardTitle className="text-base">E-Kinerja</CardTitle>
                                        <Badge variant="outline" className="text-xs border-amber-500 text-amber-600">-5%</Badge>
                                    </div>
                                    <Switch
                                        checked={hasPoorPerformance}
                                        onCheckedChange={setHasPoorPerformance}
                                    />
                                </div>
                                <CardDescription className="text-sm">
                                    Apakah E-Kinerja pegawai tidak baik atau di bawah ekspektasi?
                                </CardDescription>
                            </CardHeader>
                        {hasPoorPerformance && (
                                <CardContent className="pt-0">
                                    <div className="space-y-3">
                                        <div className="space-y-2">
                                            <Label htmlFor="performance-note" className="text-sm font-medium">
                                                Catatan E-Kinerja (opsional)
                                            </Label>
                                            <Textarea
                                                id="performance-note"
                                                value={performanceNote}
                                                onChange={(e) => setPerformanceNote(e.target.value)}
                                                placeholder="Jelaskan masalah E-Kinerja..."
                                                className="min-h-[60px]"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="performance-link" className="text-sm font-medium flex items-center gap-1">
                                                <Link className="h-3 w-3" />
                                                Link Bukti Dukung
                                            </Label>
                                            <div className="flex gap-2">
                                                <Input
                                                    id="performance-link"
                                                    type="url"
                                                    value={performanceEvidenceLink}
                                                    onChange={(e) => setPerformanceEvidenceLink(e.target.value)}
                                                    placeholder="https://..."
                                                    className="flex-1"
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
                                    </div>
                                </CardContent>
                            )}
                        </Card>

                        {/* 4. Contribution - 10% bonus */}
                        <Card className={hasContribution ? "border-green-300 dark:border-green-700 bg-green-50/50 dark:bg-green-950/20" : ""}>
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <HandHeart className="h-5 w-5 text-green-600" />
                                        <CardTitle className="text-base">Kontribusi</CardTitle>
                                        <Badge className="text-xs bg-green-600">+10%</Badge>
                                    </div>
                                    <Switch
                                        checked={hasContribution}
                                        onCheckedChange={setHasContribution}
                                    />
                                </div>
                                <CardDescription className="text-sm">
                                    Apakah pegawai memiliki kontribusi besar di unit kerja?
                                </CardDescription>
                            </CardHeader>
                        {hasContribution && (
                                <CardContent className="pt-0">
                                    <div className="space-y-3">
                                        <div className="space-y-2">
                                            <Label htmlFor="contribution-desc" className="text-sm font-medium">
                                                Deskripsi Kontribusi <span className="text-destructive">*</span>
                                            </Label>
                                            <Textarea
                                                id="contribution-desc"
                                                value={contributionDescription}
                                                onChange={(e) => setContributionDescription(e.target.value)}
                                                placeholder="Jelaskan kontribusi yang diberikan pegawai..."
                                                className="min-h-[80px]"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="contribution-link" className="text-sm font-medium flex items-center gap-1">
                                                <Link className="h-3 w-3" />
                                                Link Bukti Dukung
                                            </Label>
                                            <div className="flex gap-2">
                                                <Input
                                                    id="contribution-link"
                                                    type="url"
                                                    value={contributionEvidenceLink}
                                                    onChange={(e) => setContributionEvidenceLink(e.target.value)}
                                                    placeholder="https://..."
                                                    className="flex-1"
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
                                            Bonus: +{contributionBonus} poin
                                        </p>
                                    </div>
                                </CardContent>
                            )}
                        </Card>
                    </div>

                    <Separator />

                    {/* Summary */}
                    <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base flex items-center gap-2">
                                <Calculator className="h-5 w-5 text-blue-600" />
                                Ringkasan Perhitungan
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <div className="flex justify-between items-center text-sm">
                                <span>Poin Awal (dari rekan kerja)</span>
                                <span className="font-semibold">{originalTotalPoints}</span>
                            </div>
                            {disciplinaryPenalty > 0 && (
                                <div className="flex justify-between items-center text-sm text-red-600">
                                    <span className="flex items-center gap-1"><XCircle className="h-3 w-3" /> Hukuman Disiplin (-15%)</span>
                                    <span>-{disciplinaryPenalty}</span>
                                </div>
                            )}
                            {attendancePenalty > 0 && (
                                <div className="flex justify-between items-center text-sm text-orange-600">
                                    <span className="flex items-center gap-1"><XCircle className="h-3 w-3" /> Presensi Buruk (-5%)</span>
                                    <span>-{attendancePenalty}</span>
                                </div>
                            )}
                            {performancePenalty > 0 && (
                                <div className="flex justify-between items-center text-sm text-amber-600">
                                    <span className="flex items-center gap-1"><XCircle className="h-3 w-3" /> E-Kinerja Buruk (-5%)</span>
                                    <span>-{performancePenalty}</span>
                                </div>
                            )}
                            {contributionBonus > 0 && (
                                <div className="flex justify-between items-center text-sm text-green-600">
                                    <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Kontribusi (+10%)</span>
                                    <span>+{contributionBonus}</span>
                                </div>
                            )}
                            <Separator />
                            <div className="flex justify-between items-center font-bold text-lg">
                                <span>Nilai Akhir</span>
                                <span className={finalTotalPoints >= originalTotalPoints ? "text-green-600" : "text-orange-600"}>
                                    {finalTotalPoints} Poin
                                </span>
                            </div>
                            {finalTotalPoints !== originalTotalPoints && (
                                <p className="text-xs text-muted-foreground">
                                    {finalTotalPoints > originalTotalPoints 
                                        ? `+${finalTotalPoints - originalTotalPoints} poin dari nilai awal` 
                                        : `${finalTotalPoints - originalTotalPoints} poin dari nilai awal`
                                    }
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <DialogFooter className="gap-2">
                    <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
                        Batal
                    </Button>
                    <Button onClick={handleSubmit} disabled={isSubmitting}>
                        {isSubmitting ? "Menyimpan..." : existingEvaluation ? "Perbarui Penilaian" : "Simpan Penilaian"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
