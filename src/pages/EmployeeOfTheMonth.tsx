import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { WORK_UNITS } from "@/lib/constants";
import { Trophy, ThumbsUp, Star, Medal, Search, User, TrendingUp, Award, Crown, Briefcase, Building2, Quote, Clock, CheckCircle2, Gavel, X, Lock, AlertCircle, CalendarClock, BarChart3, Eye } from "lucide-react";
import { EomAnalyticsTab } from "@/components/EomAnalyticsTab";
import { EmployeeDetailDialog } from "@/components/eom/EmployeeDetailDialog";
import confetti from "canvas-confetti";
import { TestimonialCarousel, Testimonial } from "@/components/ui/testimonial-carousel";
import { TestimonialSlideshow, TestimonialItem } from "@/components/TestimonialSlideshow";
import { useEomPeriodStatus } from "@/hooks/useEomPeriodStatus";

interface DesignatedWinner {
    id: string;
    employee_id: string;
    winner_type: 'monthly' | 'yearly';
    employee_category: 'ASN' | 'Non ASN';
    period: string;
    final_points: number;
    designated_at: string;
    notes: string | null;
}

export default function EmployeeOfTheMonth() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [employees, setEmployees] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [leaderboard, setLeaderboard] = useState<Array<{ employeeId: string, totalPoints: number, ratingCount: number }>>([]);
    // Ranking leaderboard - uses SUM of peer ratings like admin pusat's Penilaian Final
    const [rankingLeaderboard, setRankingLeaderboard] = useState<Array<{ employeeId: string, totalPoints: number, ratingCount: number }>>([]);
    // Leaderboard employees - full profile data for all employees in leaderboard (for ranking tab)
    const [leaderboardEmployees, setLeaderboardEmployees] = useState<Record<string, any>>({});
    const [activeTab, setActiveTab] = useState("employees");
    const [testimonialsASN, setTestimonialsASN] = useState<Testimonial[]>([]);
    const [testimonialsNonASN, setTestimonialsNonASN] = useState<Testimonial[]>([]);
    const [slideshowTestimonialsASN, setSlideshowTestimonialsASN] = useState<TestimonialItem[]>([]);
    const [slideshowTestimonialsNonASN, setSlideshowTestimonialsNonASN] = useState<TestimonialItem[]>([]);
    const [yearlyLeaderboard, setYearlyLeaderboard] = useState<Array<{ employeeId: string, totalPoints: number, ratingCount: number }>>([]);
    const [ratedEmployeeIds, setRatedEmployeeIds] = useState<Set<string>>(new Set());
    const [hasRatedASN, setHasRatedASN] = useState(false);
    const [hasRatedNonASN, setHasRatedNonASN] = useState(false);
    const [pimpinanRatedEmployeeIds, setPimpinanRatedEmployeeIds] = useState<Set<string>>(new Set());
    
    // Designated winners state
    const [monthlyWinners, setMonthlyWinners] = useState<DesignatedWinner[]>([]);
    const [yearlyWinners, setYearlyWinners] = useState<DesignatedWinner[]>([]);
    
    // Designation dialog state
    const [isDesignateDialogOpen, setIsDesignateDialogOpen] = useState(false);
    const [selectedForDesignation, setSelectedForDesignation] = useState<{
        employeeId: string;
        employeeName: string;
        category: 'ASN' | 'Non ASN';
        points: number;
        type: 'monthly' | 'yearly';
    } | null>(null);
    const [designationNotes, setDesignationNotes] = useState("");
    const [isDesignating, setIsDesignating] = useState(false);

    const isUserUnit = user?.role === "user_unit";
    const isAdminUnit = user?.role === "admin_unit";
    const isAdminPusat = user?.role === "admin_pusat";
    const isUserPimpinan = user?.role === "user_pimpinan";
    
    // Employee detail dialog state
    const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
    const [selectedEmployeeForDetail, setSelectedEmployeeForDetail] = useState<{
        id: string;
        name: string;
        avatar?: string;
        nip: string;
        isNonASN: boolean;
    } | null>(null);
    
    // Handler for showing employee detail
    const handleShowDetail = (employee: any) => {
        setSelectedEmployeeForDetail({
            id: employee.id,
            name: employee.name,
            avatar: employee.avatar_url,
            nip: employee.nip,
            isNonASN: employee.kriteria_asn === "Non ASN"
        });
        setIsDetailDialogOpen(true);
    };
    
    // Period status for rating lock
    const periodStatus = useEomPeriodStatus(undefined, user?.work_unit_id);
    
    // Unit leaderboard for admin_unit
    const [unitLeaderboard, setUnitLeaderboard] = useState<Array<{ employeeId: string, totalPoints: number, ratingCount: number }>>([]);

    useEffect(() => {
        loadEmployees();
    }, [user]);

    // Set default tab to "ranking" for user_pimpinan
    useEffect(() => {
        if (isUserPimpinan) {
            setActiveTab("ranking");
        }
    }, [isUserPimpinan]);

    // Load all period-dependent data when periodStatus is ready
    useEffect(() => {
        if (periodStatus.isLoading) return;
        
        // Always load designated winners (uses active period if available)
        loadDesignatedWinners();
        
        // Only load leaderboard and ratings if there's an active period
        if (!periodStatus.activePeriod) return;
        
        loadLeaderboard(periodStatus.activePeriod);
        loadYearlyLeaderboard(periodStatus.activePeriod);
        loadMyRatings();
        
        if (isAdminUnit && user?.work_unit_id) {
            loadUnitLeaderboard(periodStatus.activePeriod);
        }
        
        // Load ranking leaderboard for user_pimpinan (uses SUM like admin pusat)
        if (isUserPimpinan) {
            loadRankingLeaderboard(periodStatus.activePeriod);
        }
    }, [user, isAdminUnit, isUserPimpinan, periodStatus.isLoading, periodStatus.activePeriod]);

    // Trigger confetti fireworks when winner is displayed
    useEffect(() => {
        const hasMonthlyWinner = monthlyWinners.length > 0;
        const hasYearlyWinner = yearlyWinners.length > 0;
        
        // For user_unit, only show confetti when there are designated winners
        // For admin, show confetti based on leaderboard data
        const shouldShowConfetti = isUserUnit 
            ? ((hasMonthlyWinner && activeTab === "leaderboard") || (hasYearlyWinner && activeTab === "yearly"))
            : ((leaderboard.length > 0 && activeTab === "leaderboard") || (yearlyLeaderboard.length > 0 && activeTab === "yearly"));
            
        if (shouldShowConfetti) {
            // Delay to ensure page is rendered
            const timer = setTimeout(() => {
                const duration = 5 * 1000; // 5 seconds
                const animationEnd = Date.now() + duration;
                const defaults = {
                    startVelocity: 30,
                    spread: 360,
                    ticks: 60,
                    zIndex: 0,
                    colors: ["#facc15", "#fbbf24", "#f59e0b", "#f97316", "#eab308"] // Gold/Yellow colors
                };

                const randomInRange = (min: number, max: number) =>
                    Math.random() * (max - min) + min;

                const interval = window.setInterval(() => {
                    const timeLeft = animationEnd - Date.now();

                    if (timeLeft <= 0) {
                        return clearInterval(interval);
                    }

                    const particleCount = 50 * (timeLeft / duration);

                    // Fire from left side
                    confetti({
                        ...defaults,
                        particleCount,
                        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
                    });

                    // Fire from right side
                    confetti({
                        ...defaults,
                        particleCount,
                        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
                    });
                }, 250);

                return () => clearInterval(interval);
            }, 500);

            return () => clearTimeout(timer);
        }
    }, [leaderboard, yearlyLeaderboard, activeTab, monthlyWinners, yearlyWinners, isUserUnit]);

    const loadEmployees = async () => {
        setIsLoading(true);
        // Load all user_unit profiles using the employee_rating_view which has proper RLS
        // This view is accessible to all users for EOM rating purposes
        const { data, error } = await supabase
            .from("employee_rating_view")
            .select("*")
            .eq("role", "user_unit");

        if (error) {
            toast.error("Gagal memuat data pegawai");
            console.error("Error details:", error);
            // Fallback to profiles table if view fails
            const { data: fallbackData, error: fallbackError } = await supabase
                .from("profiles")
                .select("id, name, nip, jabatan, avatar_url, kriteria_asn, work_unit_id, role")
                .eq("role", "user_unit");
            
            if (!fallbackError) {
                setEmployees(fallbackData || []);
            }
        } else {
            setEmployees(data || []);
        }
        setIsLoading(false);
    };

    const loadMyRatings = async () => {
        if (!user) return;

        // IMPORTANT: quota is per ACTIVE configured period, not per month.
        const activePeriod = periodStatus.activePeriod;
        if (!activePeriod) {
            setRatedEmployeeIds(new Set());
            setHasRatedASN(false);
            setHasRatedNonASN(false);
            return;
        }

        const { data: myRatings } = await supabase
            .from("employee_ratings")
            .select("rated_employee_id")
            .eq("rater_id", user.id)
            .eq("rating_period", activePeriod);

        if (myRatings && myRatings.length > 0) {
            setRatedEmployeeIds(new Set(myRatings.map(r => r.rated_employee_id)));

            // Get categories of rated employees to track quota per category
            const ratedEmployeeIdsArr = myRatings.map(r => r.rated_employee_id);
            const { data: ratedProfiles } = await supabase
                .from("employee_rating_view")
                .select("id, kriteria_asn")
                .in("id", ratedEmployeeIdsArr);

            if (ratedProfiles) {
                const hasASN = ratedProfiles.some(p => p.kriteria_asn !== "Non ASN");
                const hasNonASN = ratedProfiles.some(p => p.kriteria_asn === "Non ASN");
                setHasRatedASN(hasASN);
                setHasRatedNonASN(hasNonASN);
            }
        } else {
            setRatedEmployeeIds(new Set());
            setHasRatedASN(false);
            setHasRatedNonASN(false);
        }
    };

    const loadDesignatedWinners = async () => {
        // Use active period from EOM settings if available, fallback to current month
        const activePeriod = periodStatus.activePeriod;
        const now = new Date();
        const currentPeriod = activePeriod || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        
        // Extract year from period (format: YYYY-MM)
        const currentYear = currentPeriod.split('-')[0];

        // Load monthly winners for active period
        const { data: monthlyData } = await supabase
            .from("designated_winners")
            .select("*")
            .eq("winner_type", "monthly")
            .eq("period", currentPeriod);

        setMonthlyWinners((monthlyData as DesignatedWinner[]) || []);

        // Load yearly winners for current year (based on active period)
        const { data: yearlyData } = await supabase
            .from("designated_winners")
            .select("*")
            .eq("winner_type", "yearly")
            .eq("period", currentYear);

        setYearlyWinners((yearlyData as DesignatedWinner[]) || []);
    };

    const loadLeaderboard = async (activePeriod: string) => {
        try {
            // Use active period from EOM settings
            const currentPeriod = activePeriod;

            // Fetch ratings from database
            const { data: ratings, error } = await supabase
                .from("employee_ratings")
                .select("*")
                .eq("rating_period", currentPeriod);

            if (error) {
                console.error('Error loading ratings:', error);
                return;
            }

            // Fetch admin unit evaluations for current period
            const { data: unitEvaluations } = await supabase
                .from("admin_unit_evaluations")
                .select("*")
                .eq("rating_period", currentPeriod);

            // Fetch admin pusat (final) evaluations for current period
            const { data: finalEvaluations } = await supabase
                .from("admin_pusat_evaluations")
                .select("*")
                .eq("rating_period", currentPeriod);

            // Build a map of employees who have ratings
            const employeesWithRatings = new Set<string>();
            const ratingCountByEmployee: Record<string, number> = {};

            (ratings || []).forEach((rating: any) => {
                const employeeId = rating.rated_employee_id;
                employeesWithRatings.add(employeeId);
                ratingCountByEmployee[employeeId] = (ratingCountByEmployee[employeeId] || 0) + 1;
            });

            // Create leaderboard entries - prioritize admin evaluations
            const leaderboardData: Array<{ employeeId: string, totalPoints: number, ratingCount: number, hasEvaluation: boolean }> = [];

            // Create maps for quick lookup
            const unitEvalMap = new Map<string, any>();
            const finalEvalMap = new Map<string, any>();

            (unitEvaluations || []).forEach((eval_: any) => {
                unitEvalMap.set(eval_.rated_employee_id, eval_);
            });

            (finalEvaluations || []).forEach((eval_: any) => {
                finalEvalMap.set(eval_.rated_employee_id, eval_);
            });

            // For each employee with ratings, determine their final points
            employeesWithRatings.forEach((employeeId) => {
                let finalPoints: number;
                let hasEvaluation = false;

                // Priority: admin_pusat > admin_unit > raw peer average
                if (finalEvalMap.has(employeeId)) {
                    // Use admin pusat final points
                    finalPoints = finalEvalMap.get(employeeId).final_total_points;
                    hasEvaluation = true;
                } else if (unitEvalMap.has(employeeId)) {
                    // Use admin unit final points
                    finalPoints = unitEvalMap.get(employeeId).final_total_points;
                    hasEvaluation = true;
                } else {
                    // Calculate average of peer ratings (not sum)
                    const employeeRatings = (ratings || []).filter((r: any) => r.rated_employee_id === employeeId);
                    const totalPeerPoints = employeeRatings.reduce((sum: number, r: any) => sum + (r.total_points || 0), 0);
                    finalPoints = employeeRatings.length > 0 ? Math.round(totalPeerPoints / employeeRatings.length) : 0;
                }

                leaderboardData.push({
                    employeeId,
                    totalPoints: finalPoints,
                    ratingCount: ratingCountByEmployee[employeeId] || 0,
                    hasEvaluation
                });
            });

            // Sort by points descending
            leaderboardData.sort((a, b) => b.totalPoints - a.totalPoints);

            setLeaderboard(leaderboardData);

            // Load testimonials for both ASN and Non ASN winners
            const loadTestimonialsForWinner = async (
                winnerId: string, 
                ratings: any[], 
                setTestimonials: (data: Testimonial[]) => void,
                setSlideshowTestimonials: (data: TestimonialItem[]) => void
            ) => {
                const winnerRatings = ratings.filter((r: any) => r.rated_employee_id === winnerId && r.reason);
                if (winnerRatings.length === 0) {
                    setTestimonials([]);
                    setSlideshowTestimonials([]);
                    return;
                }

                const raterIds = winnerRatings.map((r: any) => r.rater_id);
                const { data: raterProfiles } = await supabase
                    .from("profiles")
                    .select("id, name, avatar_url")
                    .in("id", raterIds);

                const raterMap = (raterProfiles || []).reduce((acc: any, p: any) => {
                    acc[p.id] = { name: p.name, avatar_url: p.avatar_url };
                    return acc;
                }, {});

                const testimonialData: Testimonial[] = winnerRatings.map((r: any, index: number) => ({
                    id: index,
                    name: raterMap[r.rater_id]?.name || "Rekan Kerja",
                    role: "Pegawai",
                    company: "Kemnaker",
                    avatar: raterMap[r.rater_id]?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${raterMap[r.rater_id]?.name || "User"}`,
                    rating: 5,
                    text: r.reason,
                    results: r.criteria_totals ? Object.entries(r.criteria_totals).map(([key, value]: [string, any]) => `${key.replace('_', ' ')}: ${value}/25`).slice(0, 3) : undefined
                }));

                // Create slideshow testimonials with rater info
                const slideshowData: TestimonialItem[] = winnerRatings.map((r: any, index: number) => ({
                    id: index,
                    raterName: raterMap[r.rater_id]?.name || "Rekan Kerja",
                    raterAvatar: raterMap[r.rater_id]?.avatar_url,
                    text: r.reason
                }));

                setTestimonials(testimonialData);
                setSlideshowTestimonials(slideshowData);
            };

            // Get employee profiles with full data for leaderboard display
            const { data: profiles } = await supabase
                .from("profiles")
                .select("*")
                .in("id", leaderboardData.map(e => e.employeeId));

            // Create a map of employee ID to full profile data
            const profileMap = (profiles || []).reduce((acc: any, p: any) => {
                acc[p.id] = p;
                return acc;
            }, {});
            
            // Store full profile data for leaderboard employees (for ranking tab)
            setLeaderboardEmployees(profileMap);

            // Find top ASN and Non ASN employees
            const asnLeaderboard = leaderboardData.filter(e => profileMap[e.employeeId]?.kriteria_asn === "ASN" || !profileMap[e.employeeId]?.kriteria_asn);
            const nonAsnLeaderboard = leaderboardData.filter(e => profileMap[e.employeeId]?.kriteria_asn === "Non ASN");

            if (asnLeaderboard.length > 0) {
                await loadTestimonialsForWinner(asnLeaderboard[0].employeeId, ratings || [], setTestimonialsASN, setSlideshowTestimonialsASN);
            }
            if (nonAsnLeaderboard.length > 0) {
                await loadTestimonialsForWinner(nonAsnLeaderboard[0].employeeId, ratings || [], setTestimonialsNonASN, setSlideshowTestimonialsNonASN);
            }
        } catch (error) {
            console.error('Error loading leaderboard:', error);
        }
    };

    // Load ranking leaderboard for user_pimpinan - uses SUM like admin pusat's Penilaian Final
    const loadRankingLeaderboard = async (activePeriod: string) => {
        try {
            // Fetch all ratings for the period
            const { data: ratings, error } = await supabase
                .from("employee_ratings")
                .select("*")
                .eq("rating_period", activePeriod);

            if (error) {
                console.error('Error loading rankings:', error);
                return;
            }

            // Aggregate by employee - SUM total_points (not average)
            const employeePoints: Record<string, { totalPoints: number; ratingCount: number }> = {};

            (ratings || []).forEach((rating: any) => {
                const empId = rating.rated_employee_id;
                if (!employeePoints[empId]) {
                    employeePoints[empId] = { totalPoints: 0, ratingCount: 0 };
                }
                employeePoints[empId].totalPoints += rating.total_points || 0;
                employeePoints[empId].ratingCount += 1;
            });

            // Convert to array and sort by total points descending
            const rankingData = Object.entries(employeePoints)
                .map(([employeeId, data]) => ({
                    employeeId,
                    totalPoints: data.totalPoints,
                    ratingCount: data.ratingCount
                }))
                .sort((a, b) => b.totalPoints - a.totalPoints);

            setRankingLeaderboard(rankingData);

            // Load employee profiles for ranking display using employee_rating_view
            if (rankingData.length > 0) {
                const { data: profiles, error: profilesError } = await supabase
                    .from("employee_rating_view")
                    .select("*")
                    .in("id", rankingData.map(e => e.employeeId));

                if (profilesError) {
                    console.error('Error loading profiles from view:', profilesError);
                    // Fallback to profiles table
                    const { data: fallbackProfiles } = await supabase
                        .from("profiles")
                        .select("id, name, nip, jabatan, avatar_url, kriteria_asn, work_unit_id, role")
                        .in("id", rankingData.map(e => e.employeeId));
                    
                    const profileMap = (fallbackProfiles || []).reduce((acc: any, p: any) => {
                        acc[p.id] = p;
                        return acc;
                    }, {});
                    setLeaderboardEmployees(prev => ({ ...prev, ...profileMap }));
                } else {
                    const profileMap = (profiles || []).reduce((acc: any, p: any) => {
                        acc[p.id] = p;
                        return acc;
                    }, {});
                    // Merge with existing leaderboardEmployees
                    setLeaderboardEmployees(prev => ({ ...prev, ...profileMap }));
                }
            }

            // Load pimpinan ratings for this period (all pimpinan ratings)
            const { data: pimpinanRatings } = await supabase
                .from("employee_ratings")
                .select("rated_employee_id")
                .eq("rating_period", activePeriod)
                .eq("is_pimpinan_rating", true);

            if (pimpinanRatings) {
                setPimpinanRatedEmployeeIds(new Set(pimpinanRatings.map(r => r.rated_employee_id)));
            }
            
            // Load current pimpinan's own ratings to track their quota
            if (user) {
                const { data: myPimpinanRatings } = await supabase
                    .from("employee_ratings")
                    .select("rated_employee_id")
                    .eq("rater_id", user.id)
                    .eq("rating_period", activePeriod)
                    .eq("is_pimpinan_rating", true);
                
                if (myPimpinanRatings && myPimpinanRatings.length > 0) {
                    const ratedIds = myPimpinanRatings.map(r => r.rated_employee_id);
                    const { data: ratedProfiles } = await supabase
                        .from("employee_rating_view")
                        .select("id, kriteria_asn")
                        .in("id", ratedIds);
                    
                    if (ratedProfiles) {
                        const hasASN = ratedProfiles.some(p => p.kriteria_asn !== "Non ASN");
                        const hasNonASN = ratedProfiles.some(p => p.kriteria_asn === "Non ASN");
                        setHasRatedASN(hasASN);
                        setHasRatedNonASN(hasNonASN);
                    }
                }
            }
        } catch (error) {
            console.error('Error loading ranking leaderboard:', error);
        }
    };

    // Load unit-specific leaderboard for admin_unit
    const loadUnitLeaderboard = async (activePeriod: string) => {
        if (!user?.work_unit_id) return;
        
        try {
            // Use active period from EOM settings
            const currentPeriod = activePeriod;

            // Get all employees in the unit
            const { data: unitEmployees } = await supabase
                .from("profiles")
                .select("id")
                .eq("work_unit_id", user.work_unit_id)
                .eq("role", "user_unit");

            if (!unitEmployees || unitEmployees.length === 0) {
                setUnitLeaderboard([]);
                return;
            }

            const unitEmployeeIds = unitEmployees.map(e => e.id);

            // Fetch all ratings where rated_employee_id is in this unit
            const { data: ratings, error } = await supabase
                .from("employee_ratings")
                .select("*")
                .eq("rating_period", currentPeriod)
                .in("rated_employee_id", unitEmployeeIds);

            if (error) {
                console.error('Error loading unit ratings:', error);
                return;
            }

            // Fetch admin unit evaluations for current period
            const { data: unitEvaluations } = await supabase
                .from("admin_unit_evaluations")
                .select("*")
                .eq("rating_period", currentPeriod)
                .eq("work_unit_id", user.work_unit_id);

            // Fetch admin pusat (final) evaluations for current period for unit employees
            const { data: finalEvaluations } = await supabase
                .from("admin_pusat_evaluations")
                .select("*")
                .eq("rating_period", currentPeriod)
                .in("rated_employee_id", unitEmployeeIds);

            // Build a map of employees who have ratings
            const employeesWithRatings = new Set<string>();
            const ratingCountByEmployee: Record<string, number> = {};

            (ratings || []).forEach((rating: any) => {
                const employeeId = rating.rated_employee_id;
                employeesWithRatings.add(employeeId);
                ratingCountByEmployee[employeeId] = (ratingCountByEmployee[employeeId] || 0) + 1;
            });

            // Create maps for quick lookup
            const unitEvalMap = new Map<string, any>();
            const finalEvalMap = new Map<string, any>();

            (unitEvaluations || []).forEach((eval_: any) => {
                unitEvalMap.set(eval_.rated_employee_id, eval_);
            });

            (finalEvaluations || []).forEach((eval_: any) => {
                finalEvalMap.set(eval_.rated_employee_id, eval_);
            });

            // Create leaderboard entries
            const leaderboardData: Array<{ employeeId: string, totalPoints: number, ratingCount: number }> = [];

            employeesWithRatings.forEach((employeeId) => {
                let finalPoints: number;

                if (finalEvalMap.has(employeeId)) {
                    finalPoints = finalEvalMap.get(employeeId).final_total_points;
                } else if (unitEvalMap.has(employeeId)) {
                    finalPoints = unitEvalMap.get(employeeId).final_total_points;
                } else {
                    const employeeRatings = (ratings || []).filter((r: any) => r.rated_employee_id === employeeId);
                    const totalPeerPoints = employeeRatings.reduce((sum: number, r: any) => sum + (r.total_points || 0), 0);
                    finalPoints = employeeRatings.length > 0 ? Math.round(totalPeerPoints / employeeRatings.length) : 0;
                }

                leaderboardData.push({
                    employeeId,
                    totalPoints: finalPoints,
                    ratingCount: ratingCountByEmployee[employeeId] || 0
                });
            });

            leaderboardData.sort((a, b) => b.totalPoints - a.totalPoints);
            setUnitLeaderboard(leaderboardData);
        } catch (error) {
            console.error('Error loading unit leaderboard:', error);
        }
    };

    const loadYearlyLeaderboard = async (activePeriod?: string) => {
        try {
            // Use year from active period if available, otherwise use current year
            const yearToUse = activePeriod 
                ? activePeriod.split('-')[0] 
                : new Date().getFullYear().toString();

            // Fetch all ratings for the target year
            const { data: ratings, error } = await supabase
                .from("employee_ratings")
                .select("*")
                .ilike("rating_period", `${yearToUse}-%`);

            if (error) {
                console.error('Error loading yearly ratings:', error);
                return;
            }

            // Fetch admin unit evaluations for target year
            const { data: unitEvaluations } = await supabase
                .from("admin_unit_evaluations")
                .select("*")
                .ilike("rating_period", `${yearToUse}-%`);

            // Fetch admin pusat (final) evaluations for target year
            const { data: finalEvaluations } = await supabase
                .from("admin_pusat_evaluations")
                .select("*")
                .ilike("rating_period", `${yearToUse}-%`);

            // Create maps for evaluations by employee and period
            const unitEvalMap: Record<string, number> = {};
            const finalEvalMap: Record<string, number> = {};

            (unitEvaluations || []).forEach((unitEval: any) => {
                const key = `${unitEval.rated_employee_id}-${unitEval.rating_period}`;
                unitEvalMap[key] = unitEval.final_total_points;
            });

            (finalEvaluations || []).forEach((finalEval: any) => {
                const key = `${finalEval.rated_employee_id}-${finalEval.rating_period}`;
                finalEvalMap[key] = finalEval.final_total_points;
            });

            // Group ratings by employee and period
            const ratingsByEmployeePeriod: Record<string, any[]> = {};
            (ratings || []).forEach((rating: any) => {
                const key = `${rating.rated_employee_id}-${rating.rating_period}`;
                if (!ratingsByEmployeePeriod[key]) {
                    ratingsByEmployeePeriod[key] = [];
                }
                ratingsByEmployeePeriod[key].push(rating);
            });

            // Calculate final points per employee, summing across all periods
            const pointsByEmployee: Record<string, { totalPoints: number, periodCount: number }> = {};

            Object.entries(ratingsByEmployeePeriod).forEach(([key, periodRatings]) => {
                const [employeeId] = key.split('-');
                const actualEmployeeId = key.substring(0, 36); // UUID is 36 characters
                const period = key.substring(37); // rest is period

                let periodPoints: number;

                // Priority: admin_pusat > admin_unit > average of peer ratings
                if (finalEvalMap[key]) {
                    periodPoints = finalEvalMap[key];
                } else if (unitEvalMap[key]) {
                    periodPoints = unitEvalMap[key];
                } else {
                    // Calculate average of peer ratings for this period
                    const totalPeerPoints = periodRatings.reduce((sum: number, r: any) => sum + (r.total_points || 0), 0);
                    periodPoints = periodRatings.length > 0 ? Math.round(totalPeerPoints / periodRatings.length) : 0;
                }

                if (!pointsByEmployee[actualEmployeeId]) {
                    pointsByEmployee[actualEmployeeId] = { totalPoints: 0, periodCount: 0 };
                }
                pointsByEmployee[actualEmployeeId].totalPoints += periodPoints;
                pointsByEmployee[actualEmployeeId].periodCount += 1;
            });

            // Convert to array and sort by total points
            const leaderboardData = Object.entries(pointsByEmployee).map(([employeeId, data]) => ({
                employeeId,
                totalPoints: data.totalPoints,
                ratingCount: data.periodCount
            })).sort((a, b) => b.totalPoints - a.totalPoints);

            setYearlyLeaderboard(leaderboardData);
        } catch (error) {
            console.error('Error loading yearly leaderboard:', error);
        }
    };

    // Handle designation of winner
    const handleDesignateWinner = (
        employeeId: string,
        employeeName: string,
        category: 'ASN' | 'Non ASN',
        points: number,
        type: 'monthly' | 'yearly'
    ) => {
        setSelectedForDesignation({ employeeId, employeeName, category, points, type });
        setDesignationNotes("");
        setIsDesignateDialogOpen(true);
    };

    const confirmDesignation = async () => {
        if (!selectedForDesignation || !user) return;
        
        setIsDesignating(true);
        
        try {
            // Use active period from EOM settings for consistency
            const activePeriod = periodStatus.activePeriod;
            const now = new Date();
            
            const period = selectedForDesignation.type === 'monthly'
                ? (activePeriod || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`)
                : (activePeriod ? activePeriod.split('-')[0] : now.getFullYear().toString());

            // Check if winner already exists for this period and category
            const existingQuery = supabase
                .from("designated_winners")
                .select("id")
                .eq("winner_type", selectedForDesignation.type)
                .eq("employee_category", selectedForDesignation.category)
                .eq("period", period);

            const { data: existing } = await existingQuery;

            if (existing && existing.length > 0) {
                // Update existing winner
                const { error } = await supabase
                    .from("designated_winners")
                    .update({
                        employee_id: selectedForDesignation.employeeId,
                        final_points: selectedForDesignation.points,
                        designated_by: user.id,
                        designated_at: new Date().toISOString(),
                        notes: designationNotes || null,
                        updated_at: new Date().toISOString()
                    })
                    .eq("id", existing[0].id);

                if (error) throw error;
            } else {
                // Insert new winner
                const { error } = await supabase
                    .from("designated_winners")
                    .insert({
                        employee_id: selectedForDesignation.employeeId,
                        winner_type: selectedForDesignation.type,
                        employee_category: selectedForDesignation.category,
                        period,
                        final_points: selectedForDesignation.points,
                        designated_by: user.id,
                        notes: designationNotes || null
                    });

                if (error) throw error;
            }

            toast.success(`${selectedForDesignation.employeeName} berhasil ditetapkan sebagai ${selectedForDesignation.type === 'monthly' ? 'Employee of the Year (Bulanan)' : 'Employee of the Year (Tahunan)'} ${selectedForDesignation.category}!`);
            setIsDesignateDialogOpen(false);
            setSelectedForDesignation(null);
            loadDesignatedWinners();
        } catch (error: any) {
            console.error('Error designating winner:', error);
            toast.error("Gagal menetapkan pemenang: " + error.message);
        } finally {
            setIsDesignating(false);
        }
    };

    // Remove designated winner
    const removeDesignatedWinner = async (winnerId: string) => {
        try {
            const { error } = await supabase
                .from("designated_winners")
                .delete()
                .eq("id", winnerId);

            if (error) throw error;

            toast.success("Penetapan pemenang berhasil dibatalkan");
            loadDesignatedWinners();
        } catch (error: any) {
            console.error('Error removing winner:', error);
            toast.error("Gagal membatalkan penetapan: " + error.message);
        }
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    // Filter employees based on search term
    const filteredEmployees = employees.filter(employee =>
        employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.nip.includes(searchTerm)
    );

    // Get employee details for leaderboard
    const leaderboardWithDetails = leaderboard.map((entry, index) => {
        const employee = employees.find(e => e.id === entry.employeeId);
        return {
            ...entry,
            rank: index + 1,
            employee
        };
    }).filter(entry => entry.employee); // Filter out entries without employee data

    const yearlyLeaderboardWithDetails = yearlyLeaderboard.map((entry, index) => {
        const employee = employees.find(e => e.id === entry.employeeId);
        return {
            ...entry,
            rank: index + 1,
            employee
        };
    }).filter(entry => entry.employee);

    // Unit leaderboard with details for admin_unit
    const unitLeaderboardWithDetails = unitLeaderboard.map((entry, index) => {
        const employee = employees.find(e => e.id === entry.employeeId);
        return {
            ...entry,
            rank: index + 1,
            employee
        };
    }).filter(entry => entry.employee);

    // Get top ASN and Non ASN employees (for admin view)
    const topASNEmployee = leaderboardWithDetails.find(e => e.employee.kriteria_asn === "ASN" || !e.employee.kriteria_asn);
    const topNonASNEmployee = leaderboardWithDetails.find(e => e.employee.kriteria_asn === "Non ASN");

    // Get designated winners with employee details
    const getDesignatedWinnerWithDetails = (category: 'ASN' | 'Non ASN', type: 'monthly' | 'yearly') => {
        const winners = type === 'monthly' ? monthlyWinners : yearlyWinners;
        const winner = winners.find(w => w.employee_category === category);
        if (!winner) return null;
        
        const employee = employees.find(e => e.id === winner.employee_id);
        if (!employee) return null;
        
        return { ...winner, employee };
    };

    const designatedASNMonthly = getDesignatedWinnerWithDetails('ASN', 'monthly');
    const designatedNonASNMonthly = getDesignatedWinnerWithDetails('Non ASN', 'monthly');
    const designatedASNYearly = getDesignatedWinnerWithDetails('ASN', 'yearly');
    const designatedNonASNYearly = getDesignatedWinnerWithDetails('Non ASN', 'yearly');

    // Check if winners have been designated for current period
    const hasMonthlyWinnerASN = monthlyWinners.some(w => w.employee_category === 'ASN');
    const hasMonthlyWinnerNonASN = monthlyWinners.some(w => w.employee_category === 'Non ASN');
    const hasYearlyWinnerASN = yearlyWinners.some(w => w.employee_category === 'ASN');
    const hasYearlyWinnerNonASN = yearlyWinners.some(w => w.employee_category === 'Non ASN');

    // Render winner card for designated winner
    const renderDesignatedWinnerCard = (winner: any, variant: 'yellow' | 'emerald', category: string) => {
        if (!winner) return null;
        
        const colorClasses = variant === 'yellow' 
            ? {
                bg: 'bg-gradient-to-br from-yellow-50 via-white to-yellow-50/50 dark:from-yellow-950/30 dark:via-background dark:to-yellow-950/20',
                border: 'border-yellow-200 dark:border-yellow-800',
                avatarBorder: 'border-yellow-400',
                badge: 'bg-yellow-500 text-white',
                crown: 'text-yellow-500',
                star: 'fill-yellow-500 text-yellow-500',
                points: 'text-yellow-600'
            }
            : {
                bg: 'bg-gradient-to-br from-emerald-50 via-white to-emerald-50/50 dark:from-emerald-950/30 dark:via-background dark:to-emerald-950/20',
                border: 'border-emerald-200 dark:border-emerald-800',
                avatarBorder: 'border-emerald-400',
                badge: 'bg-emerald-500 text-white',
                crown: 'text-emerald-500',
                star: 'fill-emerald-500 text-emerald-500',
                points: 'text-emerald-600'
            };

        const testimonials = variant === 'yellow' ? slideshowTestimonialsASN : slideshowTestimonialsNonASN;

        return (
            <Card className={`${colorClasses.bg} ${colorClasses.border} shadow-lg overflow-hidden relative`}>
                <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="relative shrink-0">
                            <Avatar className={`h-16 w-16 border-4 ${colorClasses.avatarBorder} shadow-lg`}>
                                <AvatarImage
                                    src={winner.employee.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${winner.employee.name}`}
                                    alt={winner.employee.name}
                                />
                                <AvatarFallback className={`text-lg font-bold bg-gradient-to-br ${variant === 'yellow' ? 'from-yellow-400 to-yellow-600' : 'from-emerald-400 to-emerald-600'} text-white`}>
                                    {getInitials(winner.employee.name)}
                                </AvatarFallback>
                            </Avatar>
                            <Crown className={`h-5 w-5 ${colorClasses.crown} absolute -top-2 left-1/2 -translate-x-1/2`} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <Badge className={`${colorClasses.badge} text-[10px] mb-1`}>🏆 WINNER {category}</Badge>
                            <h3 className="font-bold text-sm line-clamp-1">{winner.employee.name}</h3>
                            <p className="text-xs text-muted-foreground">{winner.employee.nip}</p>
                            <div className="flex items-center gap-2 mt-1">
                                <Star className={`h-4 w-4 ${colorClasses.star}`} />
                                <span className={`text-lg font-black ${colorClasses.points}`}>{winner.final_points}</span>
                            </div>
                        </div>
                    </div>
                    {testimonials.length > 0 ? (
                        <TestimonialSlideshow 
                            testimonials={testimonials}
                            variant={variant}
                            autoPlay={true}
                            interval={5000}
                        />
                    ) : (
                        <div className="mt-3 pt-3 border-t">
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <Quote className="h-3 w-3" /> Belum ada testimoni
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>
        );
    };

    // Render pending status card (for user_unit when no winner designated)
    const renderPendingCard = (category: string, variant: 'yellow' | 'emerald') => {
        const colorClasses = variant === 'yellow' 
            ? 'bg-yellow-50/50 dark:bg-yellow-950/10 border-yellow-200 dark:border-yellow-800'
            : 'bg-emerald-50/50 dark:bg-emerald-950/10 border-emerald-200 dark:border-emerald-800';
        const iconColor = variant === 'yellow' ? 'text-yellow-500' : 'text-emerald-500';
        
        return (
            <Card className={`${colorClasses} shadow-sm`}>
                <CardContent className="p-6 text-center">
                    <div className="flex flex-col items-center gap-3">
                        <div className={`p-3 rounded-full bg-muted/50`}>
                            <Clock className={`h-8 w-8 ${iconColor}`} />
                        </div>
                        <div>
                            <h3 className="font-semibold text-sm">Pemenang {category}</h3>
                            <p className="text-xs text-muted-foreground mt-1">
                                Menunggu penetapan oleh Admin Pusat
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    };

    return (
        <DashboardLayout>
            <div className="space-y-8">
                {/* Enhanced Header with Gradient */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-yellow-600 via-yellow-500 to-yellow-400 p-4 sm:p-6 md:p-8 text-white shadow-xl">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32 blur-3xl" />
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-16 -translate-x-16 blur-2xl" />

                    <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-start gap-3 sm:gap-4">
                            <div className="p-2 sm:p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                                <Trophy className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white">
                                    Employee of The Year
                                </h1>
                                <p className="text-white/90 mt-1 text-xs sm:text-sm md:text-base">
                                    Berikan apresiasi "Good Point" kepada rekan kerja terbaik Anda!
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border border-white/30 shadow-sm w-fit">
                            <Trophy className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                            <span className="font-semibold text-white text-xs sm:text-sm">
                                Periode: {periodStatus.activePeriod 
                                    ? (() => {
                                        const [year, month] = periodStatus.activePeriod.split('-');
                                        const date = new Date(parseInt(year), parseInt(month) - 1);
                                        return date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
                                    })()
                                    : 'Belum ada periode aktif'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Winner Section - Different display for user_unit/user_pimpinan vs admin */}
                {activeTab !== "yearly" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* ASN Winner */}
                        {(isUserUnit || isUserPimpinan) ? (
                            // For user_unit and user_pimpinan: show designated winner or pending card
                            hasMonthlyWinnerASN && designatedASNMonthly 
                                ? renderDesignatedWinnerCard(designatedASNMonthly, 'yellow', 'ASN')
                                : renderPendingCard('ASN', 'yellow')
                        ) : (
                            // For admin: show top employee from leaderboard
                            topASNEmployee && (
                                <Card className="bg-gradient-to-br from-yellow-50 via-white to-yellow-50/50 dark:from-yellow-950/30 dark:via-background dark:to-yellow-950/20 border-yellow-200 dark:border-yellow-800 shadow-lg overflow-hidden relative">
                                    <CardContent className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="relative shrink-0">
                                                <Avatar className="h-16 w-16 border-4 border-yellow-400 shadow-lg">
                                                    <AvatarImage
                                                        src={topASNEmployee.employee.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${topASNEmployee.employee.name}`}
                                                        alt={topASNEmployee.employee.name}
                                                    />
                                                    <AvatarFallback className="text-lg font-bold bg-gradient-to-br from-yellow-400 to-yellow-600 text-white">
                                                        {getInitials(topASNEmployee.employee.name)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <Crown className="h-5 w-5 text-yellow-500 absolute -top-2 left-1/2 -translate-x-1/2" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <Badge className="bg-yellow-500 text-white text-[10px] mb-1">
                                                    {hasMonthlyWinnerASN ? '🏆 WINNER ASN' : '👑 TOP ASN'}
                                                </Badge>
                                                <h3 className="font-bold text-sm line-clamp-1">{topASNEmployee.employee.name}</h3>
                                                <p className="text-xs text-muted-foreground">{topASNEmployee.employee.nip}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                                                    <span className="text-lg font-black text-yellow-600">{topASNEmployee.totalPoints}</span>
                                                    <span className="text-xs text-muted-foreground">({topASNEmployee.ratingCount}x)</span>
                                                </div>
                                            </div>
                                        </div>
                                        {slideshowTestimonialsASN.length > 0 ? (
                                            <TestimonialSlideshow 
                                                testimonials={slideshowTestimonialsASN}
                                                variant="yellow"
                                                autoPlay={true}
                                                interval={5000}
                                            />
                                        ) : (
                                            <div className="mt-3 pt-3 border-t">
                                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                                    <Quote className="h-3 w-3" /> Belum ada testimoni
                                                </p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            )
                        )}

                        {/* Non ASN Winner */}
                        {(isUserUnit || isUserPimpinan) ? (
                            // For user_unit and user_pimpinan: show designated winner or pending card
                            hasMonthlyWinnerNonASN && designatedNonASNMonthly
                                ? renderDesignatedWinnerCard(designatedNonASNMonthly, 'emerald', 'NON ASN')
                                : renderPendingCard('Non ASN', 'emerald')
                        ) : (
                            // For admin: show top employee from leaderboard
                            topNonASNEmployee && (
                                <Card className="bg-gradient-to-br from-emerald-50 via-white to-emerald-50/50 dark:from-emerald-950/30 dark:via-background dark:to-emerald-950/20 border-emerald-200 dark:border-emerald-800 shadow-lg overflow-hidden relative">
                                    <CardContent className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="relative shrink-0">
                                                <Avatar className="h-16 w-16 border-4 border-emerald-400 shadow-lg">
                                                    <AvatarImage
                                                        src={topNonASNEmployee.employee.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${topNonASNEmployee.employee.name}`}
                                                        alt={topNonASNEmployee.employee.name}
                                                    />
                                                    <AvatarFallback className="text-lg font-bold bg-gradient-to-br from-emerald-400 to-emerald-600 text-white">
                                                        {getInitials(topNonASNEmployee.employee.name)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <Crown className="h-5 w-5 text-emerald-500 absolute -top-2 left-1/2 -translate-x-1/2" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <Badge className="bg-emerald-500 text-white text-[10px] mb-1">
                                                    {hasMonthlyWinnerNonASN ? '🏆 WINNER NON ASN' : '👑 TOP NON ASN'}
                                                </Badge>
                                                <h3 className="font-bold text-sm line-clamp-1">{topNonASNEmployee.employee.name}</h3>
                                                <p className="text-xs text-muted-foreground">{topNonASNEmployee.employee.nip}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <Star className="h-4 w-4 fill-emerald-500 text-emerald-500" />
                                                    <span className="text-lg font-black text-emerald-600">{topNonASNEmployee.totalPoints}</span>
                                                    <span className="text-xs text-muted-foreground">({topNonASNEmployee.ratingCount}x)</span>
                                                </div>
                                            </div>
                                        </div>
                                        {slideshowTestimonialsNonASN.length > 0 ? (
                                            <TestimonialSlideshow 
                                                testimonials={slideshowTestimonialsNonASN}
                                                variant="emerald"
                                                autoPlay={true}
                                                interval={5000}
                                            />
                                        ) : (
                                            <div className="mt-3 pt-3 border-t">
                                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                                    <Quote className="h-3 w-3" /> Belum ada testimoni
                                                </p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            )
                        )}
                    </div>
                )}

                {/* Tabs for Employees List and Leaderboard */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className={`grid w-full h-auto sm:h-12 bg-muted/50 ${isAdminPusat ? 'grid-cols-4' : isAdminUnit ? 'grid-cols-4' : isUserPimpinan ? 'grid-cols-3' : 'grid-cols-3'}`}>
                        {/* Hide "Daftar Pegawai" tab for user_pimpinan - they should focus on rating top 10 only */}
                        {!isUserPimpinan && (
                            <TabsTrigger
                                value="employees"
                                className="text-xs sm:text-sm md:text-base font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white py-2 sm:py-3"
                            >
                                <User className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                                <span className="hidden sm:inline">Daftar Pegawai</span>
                                <span className="sm:hidden">Pegawai</span>
                            </TabsTrigger>
                        )}
                        {isAdminUnit && (
                            <TabsTrigger
                                value="unit_leaderboard"
                                className="text-xs sm:text-sm md:text-base font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-500 data-[state=active]:to-cyan-600 data-[state=active]:text-white py-2 sm:py-3"
                            >
                                <Building2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                                <span className="hidden sm:inline">Leaderboard Unit</span>
                                <span className="sm:hidden">Unit</span>
                            </TabsTrigger>
                        )}
                        {/* Peringkat tab for user_pimpinan */}
                        {isUserPimpinan && (
                            <TabsTrigger
                                value="ranking"
                                className="text-xs sm:text-sm md:text-base font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-orange-600 data-[state=active]:text-white py-2 sm:py-3"
                            >
                                <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                                <span className="hidden sm:inline">Peringkat</span>
                                <span className="sm:hidden">Ranking</span>
                            </TabsTrigger>
                        )}
                        <TabsTrigger
                            value="leaderboard"
                            className="text-xs sm:text-sm md:text-base font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-yellow-500 data-[state=active]:to-yellow-600 data-[state=active]:text-white py-2 sm:py-3"
                        >
                            <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                            <span className="hidden sm:inline">Leaderboard Bulanan</span>
                            <span className="sm:hidden">Bulanan</span>
                        </TabsTrigger>
                        <TabsTrigger
                            value="yearly"
                            className="text-xs sm:text-sm md:text-base font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-600 data-[state=active]:text-white py-2 sm:py-3"
                        >
                            <Crown className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                            <span className="hidden md:inline">Employee of The Year</span>
                            <span className="md:hidden">Tahunan</span>
                        </TabsTrigger>
                        {isAdminPusat && (
                            <TabsTrigger
                                value="analytics"
                                className="text-xs sm:text-sm md:text-base font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-blue-600 data-[state=active]:text-white py-2 sm:py-3"
                            >
                                <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                                <span className="hidden sm:inline">Analytics</span>
                                <span className="sm:hidden">Stats</span>
                            </TabsTrigger>
                        )}
                    </TabsList>

                    {/* Employees List Tab */}
                    <TabsContent value="employees" className="mt-6 data-[state=active]:animate-in data-[state=active]:fade-in data-[state=active]:slide-in-from-bottom-4 data-[state=active]:duration-500">
                        <Card>
                            <CardHeader>
                                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                                    <CardTitle className="flex items-center gap-2">
                                        <User className="h-5 w-5" />
                                        Daftar Pegawai
                                    </CardTitle>
                                    <div className="relative w-full md:w-72">
                                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Cari nama atau NIP..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="pl-8"
                                        />
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {/* No Active Period Warning */}
                                {periodStatus.phase === 'no_settings' && (
                                    <Alert className="mb-4 border-red-200 bg-red-50 dark:bg-red-950/30 dark:border-red-800">
                                        <AlertCircle className="h-4 w-4 text-red-600" />
                                        <AlertTitle className="text-red-800 dark:text-red-300">Tidak Ada Periode Penilaian Aktif</AlertTitle>
                                        <AlertDescription className="text-red-700 dark:text-red-400">
                                            Saat ini tidak ada periode penilaian yang aktif. Silakan hubungi Admin Pusat untuk membuat periode penilaian baru.
                                        </AlertDescription>
                                    </Alert>
                                )}

                                {/* Period Lock Warning */}
                                {!periodStatus.canRate && periodStatus.phase !== 'no_settings' && (
                                    <Alert className="mb-4 border-orange-200 bg-orange-50 dark:bg-orange-950/30 dark:border-orange-800">
                                        <Lock className="h-4 w-4 text-orange-600" />
                                        <AlertTitle className="text-orange-800 dark:text-orange-300">Periode Penilaian Ditutup</AlertTitle>
                                        <AlertDescription className="text-orange-700 dark:text-orange-400">
                                            {periodStatus.message}
                                        </AlertDescription>
                                    </Alert>
                                )}

                                {/* Unit not participating warning */}
                                {!periodStatus.isUnitParticipating && (
                                    <Alert className="mb-4 border-gray-200 bg-gray-50 dark:bg-gray-950/30 dark:border-gray-800">
                                        <AlertCircle className="h-4 w-4 text-gray-600" />
                                        <AlertTitle className="text-gray-800 dark:text-gray-300">Unit Kerja Tidak Terdaftar</AlertTitle>
                                        <AlertDescription className="text-gray-700 dark:text-gray-400">
                                            Unit kerja Anda tidak terdaftar sebagai peserta Employee of the Year periode ini.
                                        </AlertDescription>
                                    </Alert>
                                )}

                                {/* Info about rating limit */}
                                {hasRatedASN && hasRatedNonASN ? (
                                    <div className="mb-4 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                                        <p className="text-sm text-amber-700 dark:text-amber-300 flex items-center gap-2">
                                            <span className="text-amber-500">⚠️</span>
                                            <span>
                                                <strong>Kuota penilaian Anda sudah terpakai.</strong> Anda sudah menilai 1 pegawai ASN dan 1 pegawai Non ASN untuk periode ini.
                                            </span>
                                        </p>
                                    </div>
                                ) : (hasRatedASN || hasRatedNonASN) ? (
                                    <div className="mb-4 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
                                        <p className="text-sm text-blue-700 dark:text-blue-300 flex items-center gap-2">
                                            <span className="text-blue-500">ℹ️</span>
                                            <span>
                                                Anda masih memiliki <strong>1 kuota penilaian</strong> untuk kategori <strong>{hasRatedASN ? "Non ASN" : "ASN"}</strong>.
                                            </span>
                                        </p>
                                    </div>
                                ) : periodStatus.canRate && periodStatus.isUnitParticipating ? (
                                    <div className="mb-4 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
                                        <p className="text-sm text-blue-700 dark:text-blue-300 flex items-center gap-2">
                                            <span className="text-blue-500">ℹ️</span>
                                            <span>
                                                Anda memiliki <strong>2 kuota penilaian</strong>: 1 untuk ASN dan 1 untuk Non ASN.
                                            </span>
                                        </p>
                                    </div>
                                ) : null}
                                <Tabs defaultValue="asn" className="w-full">
                                    <TabsList className="grid w-full grid-cols-2 mb-6">
                                        <TabsTrigger value="asn">ASN</TabsTrigger>
                                        <TabsTrigger value="non_asn">Non ASN</TabsTrigger>
                                    </TabsList>

                                    {["asn", "non_asn"].map((type) => (
                                        <TabsContent key={type} value={type}>
                                            <div className="rounded-md border overflow-x-auto">
                                                <Table>
                                                    <TableHeader>
                                                        <TableRow>
                                                            <TableHead className="w-[50px]">No</TableHead>
                                                            <TableHead>Nama Pegawai</TableHead>
                                                            <TableHead className="hidden md:table-cell">NIP</TableHead>
                                                            <TableHead className="hidden lg:table-cell">Jabatan</TableHead>
                                                                        <TableHead className="hidden xl:table-cell">Unit Kerja</TableHead>
                                                                        <TableHead className="text-right">Aksi</TableHead>
                                                                    </TableRow>
                                                                </TableHeader>
                                                                <TableBody>
                                                        {filteredEmployees.filter(e =>
                                                            type === "asn"
                                                                ? (e.kriteria_asn === "ASN" || !e.kriteria_asn)
                                                                : e.kriteria_asn === "Non ASN"
                                                        ).length === 0 ? (
                                                            <TableRow>
                                                                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                                                    Tidak ada pegawai {type === "asn" ? "ASN" : "Non ASN"} ditemukan
                                                                </TableCell>
                                                            </TableRow>
                                                        ) : (
                                                            filteredEmployees
                                                                .filter(e =>
                                                                    type === "asn"
                                                                        ? (e.kriteria_asn === "ASN" || !e.kriteria_asn)
                                                                        : e.kriteria_asn === "Non ASN"
                                                                )
                                                                .map((employee, index) => {
                                                                    const isRated = ratedEmployeeIds.has(employee.id);
                                                                    const isSelf = employee.id === user?.id;
                                                                    const isNonASN = employee.kriteria_asn === "Non ASN";
                                                                    const categoryQuotaUsed = isNonASN ? hasRatedNonASN : hasRatedASN;
                                                                    const canRate = !isSelf && !categoryQuotaUsed;

                                                                    return (
                                                                        <TableRow key={employee.id}>
                                                                            <TableCell className="font-medium">{index + 1}</TableCell>
                                                                            <TableCell>
                                                                                <div className="flex items-center gap-3">
                                                                                    <Avatar className="h-8 w-8">
                                                                                        <AvatarImage src={employee.avatar_url} alt={employee.name} />
                                                                                        <AvatarFallback>
                                                                                            {getInitials(employee.name)}
                                                                                        </AvatarFallback>
                                                                                    </Avatar>
                                                                                    <div>
                                                                                        <p className="font-medium text-sm">{employee.name}</p>
                                                                                        <p className="text-xs text-muted-foreground md:hidden">
                                                                                            {employee.nip}
                                                                                        </p>
                                                                                    </div>
                                                                                </div>
                                                                            </TableCell>
                                                                            <TableCell className="hidden md:table-cell">{employee.nip}</TableCell>
                                                                            <TableCell className="hidden lg:table-cell">{employee.jabatan || "-"}</TableCell>
                                                                            <TableCell className="hidden xl:table-cell">
                                                                                {WORK_UNITS.find(u => u.id === employee.work_unit_id)?.name || "-"}
                                                                            </TableCell>
                                                                            <TableCell className="text-right">
                                                                                <div className="flex items-center justify-end gap-2">
                                                                                    {/* Detail button for user_pimpinan */}
                                                                                    {isUserPimpinan && !isSelf && (
                                                                                        <Button
                                                                                            size="sm"
                                                                                            variant="outline"
                                                                                            onClick={() => handleShowDetail(employee)}
                                                                                            className="border-purple-300 text-purple-600 hover:bg-purple-50"
                                                                                        >
                                                                                            <Eye className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
                                                                                            <span className="hidden sm:inline">Detail</span>
                                                                                        </Button>
                                                                                    )}
                                                                                    {isSelf ? (
                                                                                        <Badge variant="secondary" className="text-xs">
                                                                                            Anda sendiri
                                                                                        </Badge>
                                                                                    ) : isRated ? (
                                                                                        <Badge variant="outline" className="text-xs bg-green-50 text-green-600 border-green-200">
                                                                                            ✓ Sudah Dinilai
                                                                                        </Badge>
                                                                                    ) : categoryQuotaUsed ? (
                                                                                        <Badge variant="outline" className="text-xs bg-gray-50 text-gray-500 border-gray-200">
                                                                                            Kuota {isNonASN ? "Non ASN" : "ASN"} Habis
                                                                                        </Badge>
                                                                                    ) : periodStatus.phase === 'no_settings' ? (
                                                                                        <Badge variant="outline" className="text-xs bg-red-50 text-red-600 border-red-200">
                                                                                            <AlertCircle className="h-3 w-3 mr-1" />
                                                                                            Tidak Ada Periode
                                                                                        </Badge>
                                                                                    ) : !periodStatus.canRate || !periodStatus.isUnitParticipating ? (
                                                                                        <Badge variant="outline" className="text-xs bg-orange-50 text-orange-600 border-orange-200">
                                                                                            <Lock className="h-3 w-3 mr-1" />
                                                                                            Terkunci
                                                                                        </Badge>
                                                                                    ) : (
                                                                                        <Button
                                                                                            size="sm"
                                                                                            onClick={() => navigate(`/employee-rating?id=${employee.id}`)}
                                                                                            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                                                                                        >
                                                                                            <ThumbsUp className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                                                                                            <span className="hidden sm:inline">Nilai Pegawai</span>
                                                                                            <span className="sm:hidden">Nilai</span>
                                                                                        </Button>
                                                                                    )}
                                                                                </div>
                                                                            </TableCell>
                                                                        </TableRow>
                                                                    );
                                                                })
                                                        )}
                                                    </TableBody>
                                                </Table>
                                            </div>
                                        </TabsContent>
                                    ))}
                                </Tabs>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Unit Leaderboard Tab - Only for admin_unit */}
                    {isAdminUnit && (
                        <TabsContent value="unit_leaderboard" className="mt-6 data-[state=active]:animate-in data-[state=active]:fade-in data-[state=active]:slide-in-from-bottom-4 data-[state=active]:duration-500">
                            <Card className="border-teal-200 dark:border-teal-800">
                                <CardHeader className="bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-950/30 dark:to-cyan-950/20">
                                    <CardTitle className="flex items-center gap-2 text-teal-700 dark:text-teal-400">
                                        <Building2 className="h-5 w-5" />
                                        Leaderboard Unit - {WORK_UNITS.find(u => u.id === user?.work_unit_id)?.name || 'Unit Kerja'}
                                    </CardTitle>
                                    <p className="text-sm text-muted-foreground mt-2">
                                        Peringkat pegawai di unit Anda berdasarkan penilaian dari seluruh pegawai (lintas unit) bulan ini
                                    </p>
                                </CardHeader>
                                <CardContent className="pt-6">
                                    {unitLeaderboardWithDetails.length === 0 ? (
                                        <div className="text-center py-12">
                                            <Trophy className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                                            <p className="text-muted-foreground text-lg">
                                                Belum ada data penilaian pegawai unit Anda untuk periode ini
                                            </p>
                                            <p className="text-sm text-muted-foreground mt-2">
                                                Penilaian dari seluruh pegawai akan ditampilkan di sini
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {unitLeaderboardWithDetails.map((entry, index) => {
                                                const rank = index + 1;
                                                const isTop3 = rank <= 3;
                                                const isWinner = rank === 1;
                                                const kriteria = entry.employee?.kriteria_asn || 'ASN';

                                                return (
                                                    <div
                                                        key={entry.employeeId}
                                                        className={`
                                                            flex items-center gap-2 sm:gap-4 p-3 sm:p-4 rounded-xl border-2 transition-all hover:shadow-md
                                                            ${isWinner ? 'bg-gradient-to-r from-teal-50 to-cyan-100/50 dark:from-teal-950/30 dark:to-cyan-900/20 border-teal-400 dark:border-teal-600' :
                                                                isTop3 ? 'bg-gradient-to-r from-teal-50/50 to-cyan-50/50 dark:from-teal-950/20 dark:to-cyan-950/10 border-teal-300 dark:border-teal-700' :
                                                                    'bg-muted/30 border-border hover:border-teal-300'}
                                                        `}
                                                    >
                                                        {/* Rank Number */}
                                                        <div className={`
                                                            flex items-center justify-center w-8 h-8 sm:w-12 sm:h-12 rounded-full font-black text-sm sm:text-xl shrink-0
                                                            ${isWinner ? 'bg-gradient-to-br from-teal-400 to-cyan-600 text-white shadow-lg ring-2 ring-teal-300' :
                                                                rank === 2 ? 'bg-gradient-to-br from-gray-300 to-gray-500 text-white shadow-md ring-2 ring-gray-200' :
                                                                    rank === 3 ? 'bg-gradient-to-br from-orange-400 to-orange-600 text-white shadow-md ring-2 ring-orange-300' :
                                                                        'bg-muted text-muted-foreground'}
                                                        `}>
                                                            {rank}
                                                        </div>

                                                        {/* Avatar */}
                                                        <Avatar className={`h-10 w-10 sm:h-14 sm:w-14 ${isTop3 ? 'border-2 sm:border-4' : 'border'} ${isWinner ? 'border-teal-400' : isTop3 ? 'border-cyan-400' : 'border-border'}`}>
                                                            <AvatarImage
                                                                src={entry.employee?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${entry.employee?.name}`}
                                                                alt={entry.employee?.name}
                                                            />
                                                            <AvatarFallback className={isWinner ? 'bg-teal-100 dark:bg-teal-900 text-teal-700 dark:text-teal-300' : ''}>
                                                                {getInitials(entry.employee?.name || '')}
                                                            </AvatarFallback>
                                                        </Avatar>

                                                        {/* Employee Info */}
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                <h3 className={`font-bold line-clamp-1 ${isWinner ? 'text-sm sm:text-lg text-teal-700 dark:text-teal-400' : 'text-sm sm:text-base'}`}>
                                                                    {entry.employee?.name}
                                                                </h3>
                                                                <Badge variant="outline" className={`text-[10px] ${kriteria === 'ASN' ? 'border-yellow-500 text-yellow-600' : 'border-emerald-500 text-emerald-600'}`}>
                                                                    {kriteria}
                                                                </Badge>
                                                            </div>
                                                            <p className="text-[10px] sm:text-sm text-muted-foreground truncate">
                                                                {entry.employee?.nip}
                                                            </p>
                                                            {entry.employee?.jabatan && (
                                                                <p className="text-[10px] sm:text-xs text-muted-foreground truncate mt-0.5">
                                                                    <Briefcase className="h-3 w-3 inline mr-1" />
                                                                    {entry.employee.jabatan}
                                                                </p>
                                                            )}
                                                        </div>

                                                        {/* Points */}
                                                        <div className="text-right shrink-0">
                                                            <div className={`flex items-center justify-end gap-1 sm:gap-2 ${isWinner ? 'text-teal-600 dark:text-teal-400' : 'text-foreground'}`}>
                                                                <Star className={`h-4 w-4 sm:h-5 sm:w-5 ${isWinner ? 'fill-current' : ''}`} />
                                                                <span className="text-lg sm:text-2xl font-black">
                                                                    {entry.totalPoints}
                                                                </span>
                                                            </div>
                                                            <p className="text-[9px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1">
                                                                {entry.ratingCount} penilaian
                                                            </p>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>
                    )}

                    {/* Ranking Tab - Only for user_pimpinan */}
                    {isUserPimpinan && (
                        <TabsContent value="ranking" className="mt-6 data-[state=active]:animate-in data-[state=active]:fade-in data-[state=active]:slide-in-from-bottom-4 data-[state=active]:duration-500">
                            <Card className="border-amber-200 dark:border-amber-800">
                                <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20">
                                    <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                                        <TrendingUp className="h-5 w-5" />
                                        Top 10 Peringkat Pegawai
                                    </CardTitle>
                                    <p className="text-sm text-muted-foreground mt-2">
                                        10 pegawai dengan perolehan nilai tertinggi dari seluruh unit kerja. Berikan penilaian Anda untuk pegawai terbaik.
                                    </p>
                                </CardHeader>
                                <CardContent className="pt-6">
                                    {/* Pimpinan Quota and Weight Info */}
                                    <div className="mb-6 space-y-3">
                                        <Alert className="border-purple-200 bg-purple-50 dark:bg-purple-950/30 dark:border-purple-800">
                                            <Crown className="h-4 w-4 text-purple-600" />
                                            <AlertTitle className="text-purple-800 dark:text-purple-300">Kuota Penilaian Pimpinan</AlertTitle>
                                            <AlertDescription className="text-purple-700 dark:text-purple-400">
                                                Anda memiliki <strong>2 kuota penilaian</strong>: <span className="font-semibold">1 untuk ASN</span> dan <span className="font-semibold">1 untuk Non ASN</span>.
                                                {pimpinanRatedEmployeeIds.size > 0 && (
                                                    <span className="block mt-1">
                                                        Status: {(() => {
                                                            // Check which categories have been rated
                                                            const ratedASN = Array.from(pimpinanRatedEmployeeIds).some(id => {
                                                                const emp = leaderboardEmployees[id];
                                                                return emp && (emp.kriteria_asn === "ASN" || !emp.kriteria_asn);
                                                            });
                                                            const ratedNonASN = Array.from(pimpinanRatedEmployeeIds).some(id => {
                                                                const emp = leaderboardEmployees[id];
                                                                return emp && emp.kriteria_asn === "Non ASN";
                                                            });
                                                            
                                                            if (ratedASN && ratedNonASN) return "✅ Sudah menilai ASN dan Non ASN";
                                                            if (ratedASN) return "✅ Sudah menilai ASN | ⏳ Belum menilai Non ASN";
                                                            if (ratedNonASN) return "⏳ Belum menilai ASN | ✅ Sudah menilai Non ASN";
                                                            return "⏳ Belum menilai ASN | ⏳ Belum menilai Non ASN";
                                                        })()}
                                                    </span>
                                                )}
                                            </AlertDescription>
                                        </Alert>
                                        <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800">
                                            <Star className="h-4 w-4 text-amber-600" />
                                            <AlertTitle className="text-amber-800 dark:text-amber-300">Bobot Nilai Pimpinan</AlertTitle>
                                            <AlertDescription className="text-amber-700 dark:text-amber-400">
                                                Penilaian Anda memiliki <strong>bobot 1000 poin</strong> (10x lipat dari pegawai biasa yang bobotnya 100 poin). 
                                                Ini menunjukkan bahwa penilaian pimpinan sangat berpengaruh dalam menentukan pemenang Employee of the Year.
                                            </AlertDescription>
                                        </Alert>
                                    </div>
                                    <Tabs defaultValue="asn" className="w-full">
                                        <TabsList className="grid w-full grid-cols-2 mb-6">
                                            <TabsTrigger value="asn">ASN</TabsTrigger>
                                            <TabsTrigger value="non_asn">Non ASN</TabsTrigger>
                                        </TabsList>
                                        {["asn", "non_asn"].map((type) => {
                                            // Use rankingLeaderboard (SUM) for user_pimpinan ranking tab
                                            const filteredData = rankingLeaderboard
                                                .filter(entry => {
                                                    const emp = leaderboardEmployees[entry.employeeId];
                                                    if (!emp) return false;
                                                    return type === "asn" 
                                                        ? (emp.kriteria_asn === "ASN" || !emp.kriteria_asn) 
                                                        : emp.kriteria_asn === "Non ASN";
                                                })
                                                .slice(0, 10) // Limit to top 10
                                                .map((entry, index) => ({
                                                    ...entry,
                                                    rank: index + 1,
                                                    employee: leaderboardEmployees[entry.employeeId]
                                                }));
                                            
                                            return (
                                                <TabsContent key={type} value={type}>
                                                    {filteredData.length === 0 ? (
                                                        <div className="text-center py-12">
                                                            <Trophy className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                                                            <p className="text-muted-foreground">Belum ada data penilaian {type === "asn" ? "ASN" : "Non ASN"}</p>
                                                        </div>
                                                    ) : (
                                                        <div className="space-y-3">
                                                            {filteredData.map((entry) => {
                                                                const rank = entry.rank;
                                                                const isTop3 = rank <= 3;
                                                                const workUnitName = WORK_UNITS.find(u => u.id === entry.employee.work_unit_id)?.name || "-";
                                                                const isSelf = entry.employeeId === user?.id;
                                                                const isNonASN = entry.employee.kriteria_asn === "Non ASN";
                                                                const categoryQuotaUsed = isNonASN ? hasRatedNonASN : hasRatedASN;
                                                                const alreadyRatedByMe = ratedEmployeeIds.has(entry.employeeId);
                                                                
                                                                return (
                                                                    <div 
                                                                        key={entry.employeeId} 
                                                                        className={`flex items-center gap-3 p-3 sm:p-4 rounded-xl border-2 transition-all hover:shadow-md ${
                                                                            rank === 1 ? 'bg-gradient-to-r from-amber-50 to-orange-100/50 dark:from-amber-950/30 dark:to-orange-900/20 border-amber-400 dark:border-amber-600' : 
                                                                            isTop3 ? 'bg-gradient-to-r from-amber-50/50 to-orange-50/50 dark:from-amber-950/20 dark:to-orange-950/10 border-amber-300 dark:border-amber-700' :
                                                                            'bg-muted/30 border-border hover:border-amber-300'
                                                                        }`}
                                                                    >
                                                                        <div className={`flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full font-black text-sm sm:text-xl shrink-0 ${
                                                                            rank === 1 ? 'bg-gradient-to-br from-amber-400 to-orange-600 text-white shadow-lg ring-2 ring-amber-300' : 
                                                                            rank === 2 ? 'bg-gradient-to-br from-gray-300 to-gray-500 text-white shadow-md ring-2 ring-gray-200' :
                                                                            rank === 3 ? 'bg-gradient-to-br from-orange-400 to-orange-600 text-white shadow-md ring-2 ring-orange-300' :
                                                                            'bg-muted text-muted-foreground'
                                                                        }`}>
                                                                            {rank}
                                                                        </div>
                                                                        <Avatar className={`h-10 w-10 sm:h-12 sm:w-12 ${isTop3 ? 'border-2 sm:border-4' : 'border'} ${rank === 1 ? 'border-amber-400' : isTop3 ? 'border-orange-400' : 'border-border'}`}>
                                                                            <AvatarImage src={entry.employee.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${entry.employee.name}`} />
                                                                            <AvatarFallback className={rank === 1 ? 'bg-amber-100 dark:bg-amber-900 text-amber-700' : ''}>{getInitials(entry.employee.name)}</AvatarFallback>
                                                                        </Avatar>
                                                                        <div className="flex-1 min-w-0">
                                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                                <h3 className={`font-bold text-sm sm:text-base truncate ${rank === 1 ? 'text-amber-700 dark:text-amber-400' : ''}`}>
                                                                                    {entry.employee.name}
                                                                                </h3>
                                                                                {pimpinanRatedEmployeeIds.has(entry.employeeId) && (
                                                                                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 bg-gradient-to-r from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 border-purple-300 dark:border-purple-600 text-purple-700 dark:text-purple-300 shrink-0">
                                                                                        <Crown className="h-3 w-3 mr-1" />
                                                                                        Dinilai Pimpinan
                                                                                    </Badge>
                                                                                )}
                                                                            </div>
                                                                            <p className="text-xs text-muted-foreground">{entry.employee.nip}</p>
                                                                            <p className="text-[10px] sm:text-xs text-muted-foreground truncate mt-0.5">
                                                                                <Building2 className="h-3 w-3 inline mr-1" />
                                                                                {workUnitName}
                                                                            </p>
                                                                        </div>
                                                                        <div className="text-right shrink-0">
                                                                            <div className={`flex items-center justify-end gap-1 ${rank === 1 ? 'text-amber-600 dark:text-amber-400' : ''}`}>
                                                                                <Star className={`h-4 w-4 sm:h-5 sm:w-5 ${rank === 1 ? 'fill-current' : ''}`} />
                                                                                <span className="text-lg sm:text-2xl font-black">{entry.totalPoints}</span>
                                                                            </div>
                                                                            <p className="text-[9px] sm:text-xs text-muted-foreground">{entry.ratingCount} penilaian</p>
                                                                        </div>
                                                                        <div className="flex gap-1 sm:gap-2 shrink-0">
                                                                            <Button size="sm" variant="outline" onClick={() => handleShowDetail(entry.employee)} className="border-purple-300 text-purple-600 hover:bg-purple-50">
                                                                                <Eye className="h-4 w-4" />
                                                                            </Button>
                                                                            {isSelf ? (
                                                                                <Badge variant="secondary" className="text-xs">
                                                                                    Anda sendiri
                                                                                </Badge>
                                                                            ) : alreadyRatedByMe ? (
                                                                                <Badge variant="outline" className="text-xs bg-green-50 text-green-600 border-green-200">
                                                                                    ✓ Sudah Dinilai
                                                                                </Badge>
                                                                            ) : categoryQuotaUsed ? (
                                                                                <Badge variant="outline" className="text-xs bg-gray-50 text-gray-500 border-gray-200">
                                                                                    Kuota {isNonASN ? "Non ASN" : "ASN"} Habis
                                                                                </Badge>
                                                                            ) : periodStatus.phase === 'no_settings' ? (
                                                                                <Badge variant="outline" className="text-xs bg-red-50 text-red-600 border-red-200">
                                                                                    <AlertCircle className="h-3 w-3 mr-1" />
                                                                                    Tidak Ada Periode
                                                                                </Badge>
                                                                            ) : !periodStatus.canRate ? (
                                                                                <Badge variant="outline" className="text-xs bg-orange-50 text-orange-600 border-orange-200">
                                                                                    <Lock className="h-3 w-3 mr-1" />
                                                                                    Terkunci
                                                                                </Badge>
                                                                            ) : (
                                                                                <Button 
                                                                                    size="sm" 
                                                                                    className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white"
                                                                                    onClick={() => navigate(`/employee-of-the-month/rate/${entry.employeeId}?pimpinan=true`)}
                                                                                >
                                                                                    <Star className="h-4 w-4 sm:mr-1" />
                                                                                    <span className="hidden sm:inline">Nilai</span>
                                                                                </Button>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                </TabsContent>
                                            );
                                        })}
                                    </Tabs>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    )}

                    {/* Leaderboard Tab */}
                    <TabsContent value="leaderboard" className="mt-6 data-[state=active]:animate-in data-[state=active]:fade-in data-[state=active]:slide-in-from-bottom-4 data-[state=active]:duration-500">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <TrendingUp className="h-5 w-5 text-yellow-600" />
                                    Leaderboard Bulanan
                                </CardTitle>
                                <p className="text-sm text-muted-foreground mt-2">
                                    {(isUserUnit || isUserPimpinan)
                                        ? "Pemenang Employee of the Month yang telah ditetapkan oleh Admin Pusat"
                                        : "Peringkat berdasarkan total poin yang diperoleh dari penilaian rekan kerja bulan ini"
                                    }
                                </p>
                            </CardHeader>
                            <CardContent>
                                <Tabs defaultValue="asn" className="w-full">
                                    <TabsList className="grid w-full grid-cols-2 mb-6">
                                        <TabsTrigger value="asn">ASN</TabsTrigger>
                                        <TabsTrigger value="non_asn">Non ASN</TabsTrigger>
                                    </TabsList>

                                    {["asn", "non_asn"].map((type) => {
                                        const hasWinner = type === "asn" ? hasMonthlyWinnerASN : hasMonthlyWinnerNonASN;
                                        const designatedWinner = type === "asn" ? designatedASNMonthly : designatedNonASNMonthly;
                                        
                                        return (
                                            <TabsContent key={type} value={type}>
                                                {(isUserUnit || isUserPimpinan) ? (
                                                    // For user_unit and user_pimpinan: only show designated winner
                                                    hasWinner && designatedWinner ? (
                                                        <div className="space-y-4">
                                                            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-yellow-600 via-yellow-500 to-yellow-400 p-4 sm:p-8 text-white shadow-xl">
                                                                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32 blur-3xl" />
                                                                <div className="flex flex-col items-center text-center relative z-10">
                                                                    <div className="bg-white/20 p-2 sm:p-3 rounded-full mb-3 sm:mb-4 backdrop-blur-sm">
                                                                        <Trophy className="h-8 w-8 sm:h-12 sm:w-12 text-white" />
                                                                    </div>
                                                                    <Badge className="bg-white/20 text-white mb-2">
                                                                        <CheckCircle2 className="h-3 w-3 mr-1" />
                                                                        Pemenang Resmi
                                                                    </Badge>
                                                                    <h3 className="text-sm sm:text-xl font-medium text-white/90 mb-1 sm:mb-2">
                                                                        Employee of The Month {type === "asn" ? "ASN" : "Non ASN"}
                                                                    </h3>
                                                                    <Avatar className="h-20 w-20 border-4 border-white/50 shadow-xl mb-3">
                                                                        <AvatarImage
                                                                            src={designatedWinner.employee.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${designatedWinner.employee.name}`}
                                                                            alt={designatedWinner.employee.name}
                                                                        />
                                                                        <AvatarFallback className="text-xl font-bold bg-white/20 text-white">
                                                                            {getInitials(designatedWinner.employee.name)}
                                                                        </AvatarFallback>
                                                                    </Avatar>
                                                                    <h2 className="text-2xl sm:text-4xl font-bold mb-3 sm:mb-4 px-2 break-words">
                                                                        {designatedWinner.employee.name}
                                                                    </h2>
                                                                    <p className="text-white/80 text-sm mb-3">{designatedWinner.employee.nip}</p>
                                                                    <div className="flex items-center gap-2 bg-white/20 px-4 sm:px-6 py-2 sm:py-3 rounded-full backdrop-blur-sm">
                                                                        <Star className="h-4 w-4 sm:h-6 sm:w-6 fill-yellow-300 text-yellow-300" />
                                                                        <span className="text-lg sm:text-2xl font-bold">
                                                                            {designatedWinner.final_points} Poin
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="text-center py-12">
                                                            <Clock className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                                                            <p className="text-muted-foreground text-lg">
                                                                Pemenang {type === "asn" ? "ASN" : "Non ASN"} belum ditetapkan
                                                            </p>
                                                            <p className="text-sm text-muted-foreground mt-2">
                                                                Menunggu penetapan oleh Admin Pusat
                                                            </p>
                                                        </div>
                                                    )
                                                ) : (
                                                    // For admin: show full leaderboard
                                                    leaderboardWithDetails.filter(e =>
                                                        type === "asn"
                                                            ? (e.employee.kriteria_asn === "ASN" || !e.employee.kriteria_asn)
                                                            : e.employee.kriteria_asn === "Non ASN"
                                                    ).length === 0 ? (
                                                        <div className="text-center py-12">
                                                            <Trophy className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                                                            <p className="text-muted-foreground text-lg">
                                                                Belum ada data penilaian {type === "asn" ? "ASN" : "Non ASN"} untuk periode ini
                                                            </p>
                                                            <p className="text-sm text-muted-foreground mt-2">
                                                                Mulai berikan penilaian kepada rekan kerja Anda!
                                                            </p>
                                                        </div>
                                                    ) : (
                                                        <div className="space-y-3">
                                                            {leaderboardWithDetails
                                                                .filter(e =>
                                                                    type === "asn"
                                                                        ? (e.employee.kriteria_asn === "ASN" || !e.employee.kriteria_asn)
                                                                        : e.employee.kriteria_asn === "Non ASN"
                                                                )
                                                                .slice(0, 10) // Limit to top 10
                                                                .map((entry, index) => {
                                                                    const rank = index + 1;
                                                                    const isTop3 = rank <= 3;
                                                                    const isWinner = rank === 1;

                                                                    return (
                                                                        <div
                                                                            key={entry.employeeId}
                                                                            className={`
                                                                                flex items-center gap-2 sm:gap-4 p-2 sm:p-4 rounded-xl border-2 transition-all hover:shadow-md
                                                                                ${isWinner ? 'bg-gradient-to-r from-yellow-50 to-yellow-100/50 dark:from-yellow-950/30 dark:to-yellow-900/20 border-yellow-400 dark:border-yellow-600' :
                                                                                    isTop3 ? 'bg-gradient-to-r from-blue-50 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/10 border-blue-300 dark:border-blue-700' :
                                                                                        'bg-muted/30 border-border hover:border-primary/50'}
                                                                            `}
                                                                        >
                                                                            {/* Rank Number */}
                                                                            <div className={`
                                                                                flex items-center justify-center w-8 h-8 sm:w-12 sm:h-12 rounded-full font-black text-sm sm:text-xl shrink-0
                                                                                ${isWinner ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-white shadow-lg ring-2 ring-yellow-300' :
                                                                                    rank === 2 ? 'bg-gradient-to-br from-gray-300 to-gray-500 text-white shadow-md ring-2 ring-gray-200' :
                                                                                        rank === 3 ? 'bg-gradient-to-br from-orange-400 to-orange-600 text-white shadow-md ring-2 ring-orange-300' :
                                                                                            'bg-muted text-muted-foreground'}
                                                                            `}>
                                                                                {rank}
                                                                            </div>

                                                                            {/* Avatar */}
                                                                            <Avatar className={`h-8 w-8 sm:h-14 sm:w-14 ${isTop3 ? 'border sm:border-4' : 'border'} ${isWinner ? 'border-yellow-400' : isTop3 ? 'border-blue-400' : 'border-border'}`}>
                                                                                <AvatarImage
                                                                                    src={entry.employee.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${entry.employee.name}`}
                                                                                    alt={entry.employee.name}
                                                                                />
                                                                                <AvatarFallback className={isWinner ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 text-[10px] sm:text-base' : 'text-[10px] sm:text-base'}>
                                                                                    {getInitials(entry.employee.name)}
                                                                                </AvatarFallback>
                                                                            </Avatar>

                                                                            {/* Employee Info */}
                                                                            <div className="flex-1 min-w-0 pr-1.5 sm:pr-2">
                                                                                <h3 className={`font-bold line-clamp-2 leading-none sm:leading-tight ${isWinner ? 'text-xs sm:text-lg text-yellow-700 dark:text-yellow-400' : 'text-xs sm:text-base'}`}>
                                                                                    {entry.employee.name}
                                                                                </h3>
                                                                                <p className="text-[10px] sm:text-sm text-muted-foreground truncate mt-0.5">
                                                                                    {entry.employee.nip}
                                                                                </p>
                                                                            </div>

                                                                            {/* Points */}
                                                                            <div className="text-right shrink-0">
                                                                                <div className={`flex items-center justify-end gap-1 sm:gap-2 ${isWinner ? 'text-yellow-600 dark:text-yellow-400' : 'text-foreground'}`}>
                                                                                    <Star className={`h-3 w-3 sm:h-5 sm:w-5 ${isWinner ? 'fill-current' : ''}`} />
                                                                                    <span className="text-sm sm:text-2xl font-black">
                                                                                        {entry.totalPoints}
                                                                                    </span>
                                                                                </div>
                                                                                <p className="text-[9px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1">
                                                                                    {entry.ratingCount} penilaian
                                                                                </p>
                                                                            </div>

                                                                            {/* Designate Winner Button - Only for admin_pusat */}
                                                                            {isAdminPusat && (
                                                                                <div className="shrink-0">
                                                                                    {hasWinner && designatedWinner?.employee_id === entry.employeeId ? (
                                                                                        <Button
                                                                                            size="sm"
                                                                                            variant="outline"
                                                                                            className="text-red-600 border-red-300 hover:bg-red-50"
                                                                                            onClick={() => removeDesignatedWinner(designatedWinner.id)}
                                                                                        >
                                                                                            <X className="h-3 w-3 sm:mr-1" />
                                                                                            <span className="hidden sm:inline">Batalkan</span>
                                                                                        </Button>
                                                                                    ) : (
                                                                                        <Button
                                                                                            size="sm"
                                                                                            className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white"
                                                                                            onClick={() => handleDesignateWinner(
                                                                                                entry.employeeId,
                                                                                                entry.employee.name,
                                                                                                type === "asn" ? "ASN" : "Non ASN",
                                                                                                entry.totalPoints,
                                                                                                'monthly'
                                                                                            )}
                                                                                        >
                                                                                            <Gavel className="h-3 w-3 sm:mr-1" />
                                                                                            <span className="hidden sm:inline">Tetapkan</span>
                                                                                        </Button>
                                                                                    )}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    );
                                                                })}
                                                        </div>
                                                    )
                                                )}
                                            </TabsContent>
                                        );
                                    })}
                                </Tabs>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Yearly Leaderboard Tab */}
                    <TabsContent value="yearly" className="mt-6 data-[state=active]:animate-in data-[state=active]:fade-in data-[state=active]:slide-in-from-bottom-4 data-[state=active]:duration-500">
                        <Card className="border-purple-200 dark:border-purple-800">
                            <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/20">
                                <CardTitle className="flex items-center gap-2 text-purple-700 dark:text-purple-400">
                                    <Crown className="h-6 w-6" />
                                    Employee of The Year {new Date().getFullYear()}
                                </CardTitle>
                                <p className="text-sm text-muted-foreground mt-2">
                                    {(isUserUnit || isUserPimpinan)
                                        ? "Pemenang Employee of the Year yang telah ditetapkan oleh Admin Pusat"
                                        : "Akumulasi total poin sepanjang tahun ini. Pemenang akan dinobatkan di akhir tahun!"
                                    }
                                </p>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <Tabs defaultValue="asn" className="w-full">
                                    <TabsList className="grid w-full grid-cols-2 mb-6">
                                        <TabsTrigger value="asn">ASN</TabsTrigger>
                                        <TabsTrigger value="non_asn">Non ASN</TabsTrigger>
                                    </TabsList>

                                    {["asn", "non_asn"].map((type) => {
                                        const hasWinner = type === "asn" ? hasYearlyWinnerASN : hasYearlyWinnerNonASN;
                                        const designatedWinner = type === "asn" ? designatedASNYearly : designatedNonASNYearly;
                                        
                                        return (
                                            <TabsContent key={type} value={type}>
                                                {(isUserUnit || isUserPimpinan) ? (
                                                    // For user_unit and user_pimpinan: only show designated winner
                                                    hasWinner && designatedWinner ? (
                                                        <div className="space-y-4">
                                                            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-600 via-purple-500 to-pink-500 p-4 sm:p-8 text-white shadow-xl">
                                                                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32 blur-3xl" />
                                                                <div className="flex flex-col items-center text-center relative z-10">
                                                                    <div className="bg-white/20 p-2 sm:p-3 rounded-full mb-3 sm:mb-4 backdrop-blur-sm">
                                                                        <Crown className="h-8 w-8 sm:h-12 sm:w-12 text-white" />
                                                                    </div>
                                                                    <Badge className="bg-white/20 text-white mb-2">
                                                                        <CheckCircle2 className="h-3 w-3 mr-1" />
                                                                        Pemenang Resmi
                                                                    </Badge>
                                                                    <h3 className="text-sm sm:text-xl font-medium text-white/90 mb-1 sm:mb-2">
                                                                        Employee of The Year {type === "asn" ? "ASN" : "Non ASN"}
                                                                    </h3>
                                                                    <Avatar className="h-20 w-20 border-4 border-white/50 shadow-xl mb-3">
                                                                        <AvatarImage
                                                                            src={designatedWinner.employee.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${designatedWinner.employee.name}`}
                                                                            alt={designatedWinner.employee.name}
                                                                        />
                                                                        <AvatarFallback className="text-xl font-bold bg-white/20 text-white">
                                                                            {getInitials(designatedWinner.employee.name)}
                                                                        </AvatarFallback>
                                                                    </Avatar>
                                                                    <h2 className="text-2xl sm:text-4xl font-bold mb-3 sm:mb-4 px-2 break-words">
                                                                        {designatedWinner.employee.name}
                                                                    </h2>
                                                                    <p className="text-white/80 text-sm mb-3">{designatedWinner.employee.nip}</p>
                                                                    <div className="flex items-center gap-2 bg-white/20 px-4 sm:px-6 py-2 sm:py-3 rounded-full backdrop-blur-sm">
                                                                        <Star className="h-4 w-4 sm:h-6 sm:w-6 fill-yellow-400 text-yellow-400" />
                                                                        <span className="text-lg sm:text-2xl font-bold">
                                                                            {designatedWinner.final_points} Poin
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="text-center py-12">
                                                            <Clock className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                                                            <p className="text-muted-foreground text-lg">
                                                                Pemenang {type === "asn" ? "ASN" : "Non ASN"} belum ditetapkan
                                                            </p>
                                                            <p className="text-sm text-muted-foreground mt-2">
                                                                Menunggu penetapan oleh Admin Pusat
                                                            </p>
                                                        </div>
                                                    )
                                                ) : (
                                                    // For admin: show full yearly leaderboard
                                                    yearlyLeaderboardWithDetails.filter(e =>
                                                        type === "asn"
                                                            ? (e.employee.kriteria_asn === "ASN" || !e.employee.kriteria_asn)
                                                            : e.employee.kriteria_asn === "Non ASN"
                                                    ).length === 0 ? (
                                                        <div className="text-center py-12">
                                                            <Crown className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                                                            <p className="text-muted-foreground text-lg">
                                                                Belum ada data penilaian {type === "asn" ? "ASN" : "Non ASN"} untuk tahun ini
                                                            </p>
                                                        </div>
                                                    ) : (
                                                        <div className="space-y-4">
                                                            {/* Top 1 Yearly Winner Display */}
                                                            {yearlyLeaderboardWithDetails
                                                                .filter(e =>
                                                                    type === "asn"
                                                                        ? (e.employee.kriteria_asn === "ASN" || !e.employee.kriteria_asn)
                                                                        : e.employee.kriteria_asn === "Non ASN"
                                                                )[0] && (
                                                                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-600 via-purple-500 to-pink-500 p-4 sm:p-8 text-white shadow-xl mb-6 sm:mb-8">
                                                                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32 blur-3xl" />
                                                                        <div className="flex flex-col items-center text-center relative z-10">
                                                                            <div className="bg-white/20 p-2 sm:p-3 rounded-full mb-3 sm:mb-4 backdrop-blur-sm">
                                                                                <Crown className="h-8 w-8 sm:h-12 sm:w-12 text-white" />
                                                                            </div>
                                                                            <h3 className="text-sm sm:text-xl font-medium text-white/90 mb-1 sm:mb-2">Kandidat Terkuat {type === "asn" ? "ASN" : "Non ASN"}</h3>
                                                                            <h2 className="text-2xl sm:text-4xl font-bold mb-3 sm:mb-4 px-2 break-words">
                                                                                {yearlyLeaderboardWithDetails
                                                                                    .filter(e =>
                                                                                        type === "asn"
                                                                                            ? (e.employee.kriteria_asn === "ASN" || !e.employee.kriteria_asn)
                                                                                            : e.employee.kriteria_asn === "Non ASN"
                                                                                    )[0].employee.name}
                                                                            </h2>
                                                                            <div className="flex items-center gap-2 bg-white/20 px-4 sm:px-6 py-2 sm:py-3 rounded-full backdrop-blur-sm">
                                                                                <Star className="h-4 w-4 sm:h-6 sm:w-6 fill-yellow-400 text-yellow-400" />
                                                                                <span className="text-lg sm:text-2xl font-bold">
                                                                                    {yearlyLeaderboardWithDetails
                                                                                        .filter(e =>
                                                                                            type === "asn"
                                                                                                ? (e.employee.kriteria_asn === "ASN" || !e.employee.kriteria_asn)
                                                                                                : e.employee.kriteria_asn === "Non ASN"
                                                                                        )[0].totalPoints} Poin
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                )}

                                                            <div className="space-y-3">
                                                                {yearlyLeaderboardWithDetails
                                                                    .filter(e =>
                                                                        type === "asn"
                                                                            ? (e.employee.kriteria_asn === "ASN" || !e.employee.kriteria_asn)
                                                                            : e.employee.kriteria_asn === "Non ASN"
                                                                    )
                                                                    .slice(0, 10)
                                                                    .map((entry, index) => {
                                                                        const rank = index + 1;
                                                                        const isTop3 = rank <= 3;
                                                                        const isWinner = rank === 1;

                                                                        return (
                                                                            <div
                                                                                key={entry.employeeId}
                                                                                className={`
                                                                                    flex items-center gap-2 sm:gap-4 p-2 sm:p-4 rounded-xl border-2 transition-all hover:shadow-md
                                                                                    ${isWinner ? 'bg-gradient-to-r from-purple-50 to-pink-50/50 dark:from-purple-950/30 dark:to-pink-900/20 border-purple-400 dark:border-purple-600' :
                                                                                        isTop3 ? 'bg-gradient-to-r from-purple-50/50 to-pink-50/30 dark:from-purple-950/20 dark:to-pink-950/10 border-purple-300 dark:border-purple-700' :
                                                                                            'bg-muted/30 border-border hover:border-primary/50'}
                                                                                `}
                                                                            >
                                                                                {/* Rank Number */}
                                                                                <div className={`
                                                                                    flex items-center justify-center w-8 h-8 sm:w-12 sm:h-12 rounded-full font-black text-sm sm:text-xl shrink-0
                                                                                    ${isWinner ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-lg ring-2 ring-purple-300' :
                                                                                        rank === 2 ? 'bg-gradient-to-br from-gray-300 to-gray-500 text-white shadow-md ring-2 ring-gray-200' :
                                                                                            rank === 3 ? 'bg-gradient-to-br from-orange-400 to-orange-600 text-white shadow-md ring-2 ring-orange-300' :
                                                                                                'bg-muted text-muted-foreground'}
                                                                                `}>
                                                                                    {rank}
                                                                                </div>

                                                                                {/* Avatar */}
                                                                                <Avatar className={`h-8 w-8 sm:h-14 sm:w-14 ${isTop3 ? 'border sm:border-4' : 'border'} ${isWinner ? 'border-purple-400' : isTop3 ? 'border-purple-300' : 'border-border'}`}>
                                                                                    <AvatarImage
                                                                                        src={entry.employee.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${entry.employee.name}`}
                                                                                        alt={entry.employee.name}
                                                                                    />
                                                                                    <AvatarFallback className={isWinner ? 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 text-[10px] sm:text-base' : 'text-[10px] sm:text-base'}>
                                                                                        {getInitials(entry.employee.name)}
                                                                                    </AvatarFallback>
                                                                                </Avatar>

                                                                                {/* Employee Info */}
                                                                                <div className="flex-1 min-w-0 pr-1.5 sm:pr-2">
                                                                                    <h3 className={`font-bold line-clamp-2 leading-none sm:leading-tight ${isWinner ? 'text-xs sm:text-lg text-purple-700 dark:text-purple-400' : 'text-xs sm:text-base'}`}>
                                                                                        {entry.employee.name}
                                                                                    </h3>
                                                                                    <p className="text-[10px] sm:text-sm text-muted-foreground truncate mt-0.5">
                                                                                        {entry.employee.nip}
                                                                                    </p>
                                                                                </div>

                                                                                {/* Points */}
                                                                                <div className="text-right shrink-0">
                                                                                    <div className={`flex items-center justify-end gap-1 sm:gap-2 ${isWinner ? 'text-purple-600 dark:text-purple-400' : 'text-foreground'}`}>
                                                                                        <Star className={`h-3 w-3 sm:h-5 sm:w-5 ${isWinner ? 'fill-current' : ''}`} />
                                                                                        <span className="text-sm sm:text-2xl font-black">
                                                                                            {entry.totalPoints}
                                                                                        </span>
                                                                                    </div>
                                                                                    <p className="text-[9px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1">
                                                                                        {entry.ratingCount} periode
                                                                                    </p>
                                                                                </div>

                                                                                {/* Designate Winner Button - Only for admin_pusat */}
                                                                                {isAdminPusat && (
                                                                                    <div className="shrink-0">
                                                                                        {hasWinner && designatedWinner?.employee_id === entry.employeeId ? (
                                                                                            <Button
                                                                                                size="sm"
                                                                                                variant="outline"
                                                                                                className="text-red-600 border-red-300 hover:bg-red-50"
                                                                                                onClick={() => removeDesignatedWinner(designatedWinner.id)}
                                                                                            >
                                                                                                <X className="h-3 w-3 sm:mr-1" />
                                                                                                <span className="hidden sm:inline">Batalkan</span>
                                                                                            </Button>
                                                                                        ) : (
                                                                                            <Button
                                                                                                size="sm"
                                                                                                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                                                                                                onClick={() => handleDesignateWinner(
                                                                                                    entry.employeeId,
                                                                                                    entry.employee.name,
                                                                                                    type === "asn" ? "ASN" : "Non ASN",
                                                                                                    entry.totalPoints,
                                                                                                    'yearly'
                                                                                                )}
                                                                                            >
                                                                                                <Gavel className="h-3 w-3 sm:mr-1" />
                                                                                                <span className="hidden sm:inline">Tetapkan</span>
                                                                                            </Button>
                                                                                        )}
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        );
                                                                    })}
                                                            </div>
                                                        </div>
                                                    )
                                                )}
                                            </TabsContent>
                                        );
                                    })}
                                </Tabs>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Analytics Tab - Admin Pusat Only */}
                    {isAdminPusat && (
                        <TabsContent value="analytics" className="mt-6 data-[state=active]:animate-in data-[state=active]:fade-in data-[state=active]:slide-in-from-bottom-4 data-[state=active]:duration-500">
                            <EomAnalyticsTab />
                        </TabsContent>
                    )}
                </Tabs>
            </div>

            {/* Designation Confirmation Dialog */}
            <Dialog open={isDesignateDialogOpen} onOpenChange={setIsDesignateDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Gavel className="h-5 w-5 text-yellow-600" />
                            Tetapkan Pemenang
                        </DialogTitle>
                        <DialogDescription>
                            Anda akan menetapkan pemenang {selectedForDesignation?.type === 'monthly' ? 'Employee of the Month' : 'Employee of the Year'} kategori {selectedForDesignation?.category}
                        </DialogDescription>
                    </DialogHeader>
                    
                    {selectedForDesignation && (
                        <div className="space-y-4">
                            <div className="p-4 rounded-lg bg-gradient-to-r from-yellow-50 to-yellow-100/50 dark:from-yellow-950/30 dark:to-yellow-900/20 border border-yellow-200">
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-12 w-12 border-2 border-yellow-400">
                                        <AvatarImage 
                                            src={employees.find(e => e.id === selectedForDesignation.employeeId)?.avatar_url} 
                                            alt={selectedForDesignation.employeeName} 
                                        />
                                        <AvatarFallback className="bg-yellow-100 text-yellow-700">
                                            {getInitials(selectedForDesignation.employeeName)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <h4 className="font-bold text-lg">{selectedForDesignation.employeeName}</h4>
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Badge variant="outline" className={selectedForDesignation.category === 'ASN' ? 'border-yellow-500 text-yellow-600' : 'border-emerald-500 text-emerald-600'}>
                                                {selectedForDesignation.category}
                                            </Badge>
                                            <span className="flex items-center gap-1">
                                                <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                                                {selectedForDesignation.points} poin
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="notes">Catatan (Opsional)</Label>
                                <Textarea
                                    id="notes"
                                    placeholder="Tambahkan catatan mengenai penetapan pemenang..."
                                    value={designationNotes}
                                    onChange={(e) => setDesignationNotes(e.target.value)}
                                    rows={3}
                                />
                            </div>
                        </div>
                    )}

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            variant="outline"
                            onClick={() => setIsDesignateDialogOpen(false)}
                            disabled={isDesignating}
                        >
                            Batal
                        </Button>
                        <Button
                            onClick={confirmDesignation}
                            disabled={isDesignating}
                            className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700"
                        >
                            {isDesignating ? (
                                <>
                                    <span className="animate-spin mr-2">⏳</span>
                                    Menyimpan...
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 className="h-4 w-4 mr-2" />
                                    Tetapkan Pemenang
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Employee Detail Dialog for user_pimpinan */}
            {selectedEmployeeForDetail && (
                <EmployeeDetailDialog
                    open={isDetailDialogOpen}
                    onOpenChange={setIsDetailDialogOpen}
                    employeeId={selectedEmployeeForDetail.id}
                    employeeName={selectedEmployeeForDetail.name}
                    employeeAvatar={selectedEmployeeForDetail.avatar}
                    employeeNip={selectedEmployeeForDetail.nip}
                    isNonASN={selectedEmployeeForDetail.isNonASN}
                    period={periodStatus.activePeriod}
                />
            )}
        </DashboardLayout>
    );
}
