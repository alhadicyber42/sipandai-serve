import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Send, Star } from "lucide-react";

interface RatingCriteria {
    id: string;
    title: string;
    description: string;
    items: string[];
}

const ratingCriteria: RatingCriteria[] = [
    {
        id: "kedisiplinan",
        title: "Kedisiplinan",
        description: "Nilai kepatuhan terhadap jam kerja, penggunaan seragam dan ID card, aturan, serta tata tertib ASN",
        items: [
            "Mematuhi jam kerja (tidak datang terlambat dan tidak pulang cepat)",
            "Menggunakan seragam sesuai ketentuan (Senin-Rabu: putih Kemnaker, Kamis: batik, Jumat: bebas rapi)",
            "Menggunakan ID card pegawai Kemnaker setiap hari",
            "Mengikuti kegiatan Apel Pagi Kemnaker setiap awal bulan",
            "Mengikuti kegiatan Senam Pagi di ballroom setiap hari Jumat"
        ]
    },
    {
        id: "kinerja_produktivitas",
        title: "Kinerja & Produktivitas",
        description: "Kemampuan menyelesaikan tugas rutin harian serta tugas yang diberikan oleh pimpinan dengan cepat, tepat, dan berkualitas",
        items: [
            "Mencapai predikat kinerja minimal Baik (Sesuai Ekspektasi) pada E-Kinerja",
            "Mampu menyusun prioritas kerja dengan baik",
            "Memiliki dedikasi penuh terhadap pekerjaan",
            "Tidak menunda pekerjaan dan menyelesaikan pekerjaan tepat waktu",
            "Cepat, tanggap, dan solutif dalam menyelesaikan kendala"
        ]
    },
    {
        id: "keteladanan",
        title: "Keteladanan",
        description: "Menjadi contoh positif dalam sikap, perilaku, tutur kata, dan etika kerja baik terhadap pimpinan maupun rekan kerja, serta menjaga nama baik instansi",
        items: [
            "Selalu bersikap sopan, santun, dan peduli terhadap seluruh pegawai",
            "Tidak pernah mengeluarkan kata kasar",
            "Tidak mudah mengeluh dan selalu semangat dalam bekerja",
            "Tidak bergaya hidup berlebihan",
            "Rela mengutamakan kepentingan instansi di atas kepentingan pribadi"
        ]
    },
    {
        id: "profesionalisme_kompetensi",
        title: "Profesionalisme dan Kompetensi",
        description: "Mampu menjalankan tugas secara profesional dengan dedikasi, tanggung jawab, serta kompetensi yang relevan dengan bidang pekerjaan",
        items: [
            "Menjalankan semua tugas yang diberikan pimpinan dengan penuh dedikasi",
            "Jujur, konsisten, dan berperilaku sesuai kode etik",
            "Menguasai peraturan, kebijakan, dan regulasi terkait bidang kerjanya",
            "Mau terus belajar demi meningkatkan kompetensi",
            "Menyelesaikan tugas dengan penuh tanggung jawab"
        ]
    },
    {
        id: "berakhlak",
        title: "BerAKHLAK",
        description: "Bekerja dengan menerapkan sikap berorientasi pada pelayanan, akuntabel, kompeten, harmonis, loyal, adaptif, dan kolaboratif",
        items: [
            "Berorientasi pelayanan - memahami dan memenuhi kebutuhan masyarakat dengan cepat, ramah, dan solutif",
            "Akuntabel & Kompeten - jujur, bertanggung jawab, dan terus meningkatkan kompetensi diri",
            "Harmonis - menciptakan lingkungan kerja kondusif dengan menghormati perbedaan",
            "Loyal - memiliki loyalitas tinggi terhadap Pancasila, UUD 1945, NKRI, dan instansi",
            "Adaptif & Kolaboratif - menyesuaikan diri dengan perubahan dan bekerja sama untuk mencapai tujuan bersama"
        ]
    }
];

export default function EmployeeRating() {
    const { employeeId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [employee, setEmployee] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form state - now each item in each criteria gets a rating
    const [ratings, setRatings] = useState<Record<string, Record<number, number>>>({});
    const [reason, setReason] = useState("");

    useEffect(() => {
        if (employeeId) {
            loadEmployee();
        }
    }, [employeeId]);

    const loadEmployee = async () => {
        setIsLoading(true);
        const { data, error } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", employeeId)
            .single();

        if (error) {
            toast.error("Gagal memuat data pegawai");
            console.error(error);
            navigate("/employee-of-the-month");
        } else {
            setEmployee(data);
        }
        setIsLoading(false);
    };

    const handleRatingChange = (criteriaId: string, itemIndex: number, value: string) => {
        setRatings(prev => ({
            ...prev,
            [criteriaId]: {
                ...(prev[criteriaId] || {}),
                [itemIndex]: parseInt(value)
            }
        }));
    };

    const handleSubmit = async () => {
        // Validation
        if (!reason.trim()) {
            toast.error("Mohon isi alasan memilih pegawai ini");
            return;
        }

        // Check if all items in all criteria are rated
        const missingRatings: string[] = [];
        ratingCriteria.forEach(criteria => {
            const criteriaRatings = ratings[criteria.id] || {};
            criteria.items.forEach((item, index) => {
                if (!criteriaRatings[index]) {
                    missingRatings.push(`${criteria.title} - ${item}`);
                }
            });
        });

        if (missingRatings.length > 0) {
            toast.error(`Mohon berikan penilaian untuk semua indikator. Masih ada ${missingRatings.length} indikator yang belum dinilai.`);
            return;
        }

        if (!user || !employeeId) {
            toast.error("Data tidak lengkap");
            return;
        }

        setIsSubmitting(true);

        try {
            const now = new Date();
            const ratingPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

            // Calculate total points and points per criteria
            const criteriaTotals: Record<string, number> = {};
            let totalPoints = 0;

            ratingCriteria.forEach(criteria => {
                const criteriaRatings = ratings[criteria.id] || {};
                const sum = Object.values(criteriaRatings).reduce((acc, val) => acc + val, 0);
                criteriaTotals[criteria.id] = sum;
                totalPoints += sum;
            });

            const maxPossiblePoints = ratingCriteria.reduce((sum, c) => sum + (c.items.length * 5), 0);

            const rating = {
                id: crypto.randomUUID(),
                rater_id: user.id,
                rater_name: user.name || user.email,
                rated_employee_id: employeeId,
                rated_employee_name: employee.name,
                rating_period: ratingPeriod,
                reason: reason.trim(),
                detailed_ratings: ratings,
                criteria_totals: criteriaTotals,
                total_points: totalPoints,
                max_possible_points: maxPossiblePoints,
                created_at: new Date().toISOString()
            };

            const existingRatings = JSON.parse(localStorage.getItem('employee_ratings') || '[]');

            const isDuplicate = existingRatings.some(
                (r: any) => r.rater_id === user.id &&
                    r.rated_employee_id === employeeId &&
                    r.rating_period === ratingPeriod
            );

            if (isDuplicate) {
                toast.error("Anda sudah memberikan penilaian untuk pegawai ini di periode ini");
                setIsSubmitting(false);
                return;
            }

            existingRatings.push(rating);
            localStorage.setItem('employee_ratings', JSON.stringify(existingRatings));

            console.log('Rating saved to localStorage:', rating);
            toast.success(`Penilaian berhasil dikirim! Total Poin: ${totalPoints}/${maxPossiblePoints}`);

            setTimeout(() => {
                navigate("/employee-of-the-month");
            }, 1000);
        } catch (err) {
            console.error('Unexpected error:', err);
            toast.error("Terjadi kesalahan yang tidak terduga");
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
            </DashboardLayout>
        );
    }

    if (!employee) return null;

    return (
        <DashboardLayout>
            <div className="max-w-4xl mx-auto space-y-6 pb-8">
                <Button
                    variant="ghost"
                    onClick={() => navigate("/employee-of-the-month")}
                    className="mb-4"
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Kembali ke Daftar
                </Button>

                <div className="space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight">Penilaian Pegawai</h1>
                    <p className="text-muted-foreground">
                        Berikan penilaian untuk setiap indikator. Skala: 1 (Sangat Kurang) - 5 (Sangat Baik)
                    </p>
                </div>

                {/* Employee Info Card */}
                <Card className="border-t-4 border-t-blue-600">
                    <CardHeader>
                        <div className="flex flex-col md:flex-row items-center gap-6">
                            <Avatar className="h-24 w-24 border-4 border-background shadow-md">
                                <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${employee.name}`} />
                                <AvatarFallback className="text-xl">{employee.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div className="text-center md:text-left space-y-1">
                                <CardTitle className="text-2xl">{employee.name}</CardTitle>
                                <CardDescription className="text-lg font-medium text-blue-600">
                                    {employee.nip}
                                </CardDescription>
                                <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-secondary text-secondary-foreground">
                                    {employee.role === 'user_unit' ? 'Pegawai Unit' : employee.role.replace('_', ' ')}
                                </div>
                            </div>
                        </div>
                    </CardHeader>
                </Card>

                {/* Rating Criteria */}
                {ratingCriteria.map((criteria, criteriaIndex) => (
                    <Card key={criteria.id} className="shadow-sm">
                        <CardHeader className="pb-4">
                            <div className="flex items-start gap-3">
                                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-bold flex-shrink-0">
                                    {criteriaIndex + 1}
                                </div>
                                <div className="flex-1">
                                    <CardTitle className="text-lg">{criteria.title}</CardTitle>
                                    <CardDescription className="mt-1 text-sm">
                                        {criteria.description}
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {criteria.items.map((item, itemIndex) => (
                                <div key={itemIndex} className="space-y-3 pb-4 border-b last:border-b-0 last:pb-0">
                                    <Label className="text-sm font-medium leading-relaxed block">
                                        {itemIndex + 1}. {item}
                                    </Label>
                                    <RadioGroup
                                        value={ratings[criteria.id]?.[itemIndex]?.toString() || ""}
                                        onValueChange={(value) => handleRatingChange(criteria.id, itemIndex, value)}
                                        className="flex gap-3"
                                    >
                                        {[1, 2, 3, 4, 5].map((value) => (
                                            <div key={value} className="flex items-center space-x-2">
                                                <RadioGroupItem
                                                    value={value.toString()}
                                                    id={`${criteria.id}-${itemIndex}-${value}`}
                                                />
                                                <Label
                                                    htmlFor={`${criteria.id}-${itemIndex}-${value}`}
                                                    className="cursor-pointer flex items-center gap-1 font-normal"
                                                >
                                                    <Star className={`h-4 w-4 ${ratings[criteria.id]?.[itemIndex] >= value ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                                                    <span className="text-sm">{value}</span>
                                                </Label>
                                            </div>
                                        ))}
                                    </RadioGroup>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                ))}

                {/* Reason Section */}
                <Card className="shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg">Alasan Memilih Pegawai Ini <span className="text-red-500">*</span></CardTitle>
                        <CardDescription>
                            Jelaskan secara detail mengapa Anda memilih pegawai ini sebagai Employee of The Month
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Textarea
                            placeholder="Contoh: Pegawai yang sangat rajin dan selalu membantu rekan kerja. Kinerjanya sangat baik dan patut diapresiasi..."
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className="min-h-[120px] resize-y"
                        />
                    </CardContent>
                </Card>

                {/* Submit Section */}
                <Card className="bg-muted/50">
                    <CardFooter className="flex justify-between items-center p-6">
                        <div className="text-sm text-muted-foreground">
                            <span className="text-red-500">*</span> Semua indikator wajib dinilai (Total: {ratingCriteria.reduce((sum, c) => sum + c.items.length, 0)} indikator)
                        </div>
                        <div className="flex gap-3">
                            <Button variant="outline" onClick={() => navigate("/employee-of-the-month")}>
                                Batal
                            </Button>
                            <Button
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                                className="bg-blue-600 hover:bg-blue-700 min-w-[140px]"
                            >
                                {isSubmitting ? (
                                    "Mengirim..."
                                ) : (
                                    <>
                                        <Send className="mr-2 h-4 w-4" />
                                        Kirim Penilaian
                                    </>
                                )}
                            </Button>
                        </div>
                    </CardFooter>
                </Card>
            </div>
        </DashboardLayout>
    );
}
