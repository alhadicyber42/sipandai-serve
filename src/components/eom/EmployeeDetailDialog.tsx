import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { Star, Quote, User, MessageSquare, BarChart3 } from "lucide-react";

interface EmployeeDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employeeId: string;
  employeeName: string;
  employeeAvatar?: string;
  employeeNip: string;
  isNonASN: boolean;
  period?: string;
}

interface CriteriaBreakdown {
  criteriaId: string;
  criteriaTitle: string;
  averagePercentage: number;
  totalPoints: number;
  maxPoints: number;
}

interface Testimonial {
  raterName: string;
  raterAvatar?: string;
  reason: string;
  totalPoints: number;
  createdAt: string;
}

// Rating criteria labels for ASN
const criteriaLabelsASN: Record<string, string> = {
  kedisiplinan: "Kedisiplinan",
  kinerja_produktivitas: "Kinerja & Produktivitas",
  keteladanan: "Keteladanan",
  profesionalisme_kompetensi: "Profesionalisme & Kompetensi",
  berakhlak: "BerAKHLAK"
};

// Rating criteria labels for Non ASN
const criteriaLabelsNonASN: Record<string, string> = {
  kedisiplinan: "Nilai Kedisiplinan",
  kinerja_produktivitas: "Nilai Kinerja & Produktivitas",
  nilai_5s: "Nilai 5S",
  nilai_pelayanan: "Nilai Pelayanan"
};

// Max points per criteria item (assuming 5 points per item)
const maxPointsPerCriteriaASN: Record<string, number> = {
  kedisiplinan: 15, // 3 items * 5
  kinerja_produktivitas: 20, // 4 items * 5
  keteladanan: 20, // 4 items * 5
  profesionalisme_kompetensi: 20, // 4 items * 5
  berakhlak: 25 // 5 items * 5
};

const maxPointsPerCriteriaNonASN: Record<string, number> = {
  kedisiplinan: 25, // 5 items * 5
  kinerja_produktivitas: 25, // 5 items * 5
  nilai_5s: 25, // 5 items * 5
  nilai_pelayanan: 25 // 5 items * 5
};

export function EmployeeDetailDialog({
  open,
  onOpenChange,
  employeeId,
  employeeName,
  employeeAvatar,
  employeeNip,
  isNonASN,
  period
}: EmployeeDetailDialogProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [criteriaBreakdown, setCriteriaBreakdown] = useState<CriteriaBreakdown[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [totalRatings, setTotalRatings] = useState(0);

  const criteriaLabels = isNonASN ? criteriaLabelsNonASN : criteriaLabelsASN;
  const maxPointsPerCriteria = isNonASN ? maxPointsPerCriteriaNonASN : maxPointsPerCriteriaASN;

  useEffect(() => {
    if (open && employeeId) {
      loadEmployeeRatingDetails();
    }
  }, [open, employeeId, period]);

  const loadEmployeeRatingDetails = async () => {
    setIsLoading(true);
    try {
      // Determine period filter
      const now = new Date();
      const currentPeriod = period || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

      // Fetch all ratings for this employee in the current period
      const { data: ratings, error } = await supabase
        .from("employee_ratings")
        .select("*")
        .eq("rated_employee_id", employeeId)
        .eq("rating_period", currentPeriod);

      if (error) {
        console.error("Error loading ratings:", error);
        return;
      }

      if (!ratings || ratings.length === 0) {
        setCriteriaBreakdown([]);
        setTestimonials([]);
        setTotalRatings(0);
        setIsLoading(false);
        return;
      }

      setTotalRatings(ratings.length);

      // Calculate average per criteria
      const criteriaData: Record<string, { total: number; count: number }> = {};

      ratings.forEach((rating: any) => {
        const criteriaTotals = rating.criteria_totals || {};
        Object.entries(criteriaTotals).forEach(([criteriaId, points]) => {
          if (!criteriaData[criteriaId]) {
            criteriaData[criteriaId] = { total: 0, count: 0 };
          }
          criteriaData[criteriaId].total += points as number;
          criteriaData[criteriaId].count += 1;
        });
      });

      // Build breakdown array
      const breakdown: CriteriaBreakdown[] = Object.entries(criteriaLabels).map(([criteriaId, title]) => {
        const data = criteriaData[criteriaId] || { total: 0, count: 0 };
        const maxPoints = maxPointsPerCriteria[criteriaId] || 25;
        const averagePoints = data.count > 0 ? data.total / data.count : 0;
        const percentage = (averagePoints / maxPoints) * 100;

        return {
          criteriaId,
          criteriaTitle: title,
          averagePercentage: Math.round(percentage),
          totalPoints: Math.round(averagePoints * 10) / 10,
          maxPoints
        };
      });

      setCriteriaBreakdown(breakdown);

      // Fetch rater profiles from secure view for testimonials
      const raterIds = ratings.map((r: any) => r.rater_id);
      const { data: raterProfiles } = await supabase
        .from("employee_rating_view")
        .select("id, name, avatar_url")
        .in("id", raterIds);

      const raterMap = (raterProfiles || []).reduce((acc: any, p: any) => {
        acc[p.id] = { name: p.name, avatar_url: p.avatar_url };
        return acc;
      }, {});

      // Build testimonials list
      const testimonialsList: Testimonial[] = ratings
        .filter((r: any) => r.reason && r.reason.trim())
        .map((r: any) => ({
          raterName: raterMap[r.rater_id]?.name || "Rekan Kerja",
          raterAvatar: raterMap[r.rater_id]?.avatar_url,
          reason: r.reason,
          totalPoints: r.total_points,
          createdAt: r.created_at
        }));

      setTestimonials(testimonialsList);
    } catch (error) {
      console.error("Error loading employee details:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return "bg-emerald-500";
    if (percentage >= 60) return "bg-yellow-500";
    if (percentage >= 40) return "bg-orange-500";
    return "bg-red-500";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Avatar className="h-12 w-12 border-2 border-primary">
              <AvatarImage src={employeeAvatar} alt={employeeName} />
              <AvatarFallback className="bg-primary/10 text-primary">
                {getInitials(employeeName)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-bold">{employeeName}</h3>
              <p className="text-sm text-muted-foreground font-normal">{employeeNip}</p>
            </div>
          </DialogTitle>
          <DialogDescription className="flex items-center gap-2">
            <Badge variant="outline" className={isNonASN ? "border-emerald-500 text-emerald-600" : "border-yellow-500 text-yellow-600"}>
              {isNonASN ? "Non ASN" : "ASN"}
            </Badge>
            <span>•</span>
            <span>{totalRatings} penilaian</span>
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Rating Breakdown */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <BarChart3 className="h-4 w-4" />
                    Rata-rata Penilaian per Kriteria
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {criteriaBreakdown.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Belum ada data penilaian untuk periode ini
                    </p>
                  ) : (
                    criteriaBreakdown.map((criteria) => (
                      <div key={criteria.criteriaId} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">{criteria.criteriaTitle}</span>
                          <span className="font-bold text-primary">
                            {criteria.averagePercentage}%
                          </span>
                        </div>
                        <div className="relative h-3 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`absolute left-0 top-0 h-full rounded-full transition-all duration-500 ${getProgressColor(criteria.averagePercentage)}`}
                            style={{ width: `${criteria.averagePercentage}%` }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Rata-rata: {criteria.totalPoints} / {criteria.maxPoints} poin
                        </p>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              <Separator />

              {/* Testimonials */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <MessageSquare className="h-4 w-4" />
                    Testimoni dari Penilai ({testimonials.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {testimonials.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Belum ada testimoni dari penilai
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {testimonials.map((testimonial, index) => (
                        <div
                          key={index}
                          className="p-4 rounded-lg bg-muted/50 border"
                        >
                          <div className="flex items-start gap-3">
                            <Avatar className="h-8 w-8 shrink-0">
                              <AvatarImage src={testimonial.raterAvatar} />
                              <AvatarFallback className="text-xs">
                                {getInitials(testimonial.raterName)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2 mb-1">
                                <span className="font-medium text-sm">{testimonial.raterName}</span>
                                <Badge variant="secondary" className="text-xs shrink-0">
                                  <Star className="h-3 w-3 mr-1 fill-yellow-500 text-yellow-500" />
                                  {testimonial.totalPoints} poin
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground leading-relaxed">
                                <Quote className="h-3 w-3 inline mr-1 text-primary" />
                                {testimonial.reason}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
