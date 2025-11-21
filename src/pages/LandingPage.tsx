import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Building2, FileText, Users, Award, MessageSquare, ShieldCheck, Clock, CheckCircle2, TrendingUp, Briefcase, UserCheck, Calendar } from "lucide-react";

export default function LandingPage() {
    const navigate = useNavigate();
    return (
        <div className="min-h-screen bg-background flex flex-col overflow-x-hidden">
            {/* Navigation */}
            <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
                <div className="container flex h-16 items-center justify-between px-4 md:px-6">
                    <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
                        <div className="p-2 bg-primary rounded-lg">
                            <Building2 className="h-6 w-6 text-primary-foreground" />
                        </div>
                        <span className="text-xl font-bold text-primary">SIPANDAI</span>
                    </div>
                    <div className="flex items-center gap-2 md:gap-4">
                        <Button variant="ghost" size="sm" className="text-sm md:text-base" onClick={() => navigate("/auth")}>
                            Masuk
                        </Button>
                        <Button onClick={() => navigate("/auth?tab=register")} size="sm" className="gap-2 text-sm md:text-base">
                            <span className="hidden sm:inline">Daftar Sekarang</span>
                            <span className="sm:hidden">Daftar</span>
                            <ArrowRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative flex-1 flex items-center pt-16 pb-24 lg:pt-32 lg:pb-40 overflow-hidden">
                <div className="container px-4 md:px-6">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <div className="space-y-8 animate-in fade-in slide-in-from-left duration-700">
                            <Badge variant="secondary" className="w-fit">
                                Platform Digital ASN Terintegrasi
                            </Badge>
                            <div className="space-y-4">
                                <h1 className="text-4xl font-extrabold tracking-tight lg:text-6xl xl:text-7xl">
                                    SIPANDAI <br />
                                    <span className="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                                        Sistem Pelayanan Administrasi Digital ASN Terintegrasi
                                    </span>
                                </h1>
                                <p className="text-xl text-muted-foreground max-w-[600px]">
                                    Platform terintegrasi untuk pengelolaan administrasi kepegawaian ASN yang efisien, transparan, dan modern.
                                </p>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-4">
                                <Button size="lg" className="text-lg px-8 h-12 shadow-lg hover:shadow-xl transition-all" onClick={() => navigate("/auth?tab=register")}>
                                    Mulai Sekarang
                                    <ArrowRight className="ml-2 h-5 w-5" />
                                </Button>
                                <Button size="lg" variant="outline" className="text-lg px-8 h-12" onClick={() => navigate("/auth")}>
                                    Masuk ke Akun
                                </Button>
                            </div>
                            <div className="flex items-center gap-8 text-sm text-muted-foreground">
                                <div className="flex items-center gap-2">
                                    <ShieldCheck className="h-5 w-5 text-primary" />
                                    <span>Aman & Terpercaya</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Clock className="h-5 w-5 text-primary" />
                                    <span>24/7 Akses</span>
                                </div>
                            </div>
                        </div>
                        <div className="relative lg:ml-auto animate-in fade-in slide-in-from-right duration-700">
                            <div className="relative rounded-2xl overflow-hidden shadow-2xl border bg-gradient-to-br from-background to-muted/50 backdrop-blur-sm p-2">
                                <img src="/hero-illustration.png" alt="SIPANDAI Dashboard Preview" className="rounded-xl w-full h-auto object-cover" onError={e => {
                                    e.currentTarget.src = "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3";
                                }} />
                            </div>
                            {/* Decorative elements */}
                            <div className="absolute -z-10 -top-12 -right-12 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
                            <div className="absolute -z-10 -bottom-12 -left-12 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="py-16 bg-primary text-primary-foreground">
                <div className="container px-4 md:px-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        <StatCard number="100%" label="Digital" />
                        <StatCard number="24/7" label="Akses Online" />
                        <StatCard number="Fast" label="Proses Cepat" />
                        <StatCard number="Secure" label="Aman Terpercaya" />
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-24 bg-muted/50">
                <div className="container px-4 md:px-6">
                    <div className="text-center space-y-4 mb-16">
                        <Badge variant="outline" className="mb-4">Layanan Kami</Badge>
                        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
                            Layanan Unggulan SIPANDAI
                        </h2>
                        <p className="text-xl text-muted-foreground max-w-[800px] mx-auto">
                            Berbagai fitur layanan kepegawaian yang dapat diakses dengan mudah melalui satu pintu digital.
                        </p>
                    </div>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <FeatureCard icon={<FileText className="h-10 w-10" />} title="Pengajuan Cuti" description="Proses pengajuan cuti yang lebih cepat dan transparan dengan notifikasi real-time dan tracking status." />
                        <FeatureCard icon={<Award className="h-10 w-10" />} title="Kenaikan Pangkat" description="Pantau status usulan kenaikan pangkat dan lengkapi berkas secara digital dengan mudah." />
                        <FeatureCard icon={<MessageSquare className="h-10 w-10" />} title="Konsultasi Online" description="Layanan konsultasi langsung dengan admin unit maupun pusat terkait kepegawaian." />
                        <FeatureCard icon={<Briefcase className="h-10 w-10" />} title="Mutasi Pegawai" description="Kelola proses mutasi pegawai dengan sistem yang terintegrasi dan transparan." />
                        <FeatureCard icon={<UserCheck className="h-10 w-10" />} title="Pensiun" description="Proses pengajuan pensiun yang terstruktur dengan panduan lengkap." />
                        <FeatureCard icon={<Calendar className="h-10 w-10" />} title="Employee Recognition" description="Sistem penilaian dan penghargaan pegawai terbaik setiap bulan." />
                    </div>
                </div>
            </section>

            {/* Benefits Section */}
            <section className="py-24">
                <div className="container px-4 md:px-6">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <div className="space-y-6">
                            <Badge variant="outline">Keunggulan</Badge>
                            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                                Mengapa Memilih SIPANDAI?
                            </h2>
                            <div className="space-y-4">
                                <BenefitItem icon={<CheckCircle2 className="h-5 w-5 text-primary" />} title="Efisiensi Waktu" description="Proses administrasi yang lebih cepat tanpa perlu datang ke kantor." />
                                <BenefitItem icon={<CheckCircle2 className="h-5 w-5 text-primary" />} title="Transparansi Penuh" description="Lacak status pengajuan Anda secara real-time kapan saja." />
                                <BenefitItem icon={<CheckCircle2 className="h-5 w-5 text-primary" />} title="Keamanan Data" description="Data Anda dilindungi dengan enkripsi tingkat enterprise." />
                                <BenefitItem icon={<CheckCircle2 className="h-5 w-5 text-primary" />} title="Mudah Digunakan" description="Interface yang intuitif dan user-friendly untuk semua kalangan." />
                            </div>
                        </div>
                        <div className="relative">
                            <Card className="p-8 shadow-2xl">
                                <div className="space-y-6">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-primary/10 rounded-lg">
                                            <TrendingUp className="h-8 w-8 text-primary" />
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-bold">Digitalisasi ASN</h3>
                                            <p className="text-muted-foreground">Menuju era digital yang lebih baik</p>
                                        </div>
                                    </div>
                                    <p className="text-muted-foreground leading-relaxed">
                                        SIPANDAI hadir sebagai solusi modern untuk mengelola administrasi kepegawaian ASN.
                                        Dengan teknologi terkini, kami memastikan setiap proses berjalan efisien dan transparan.
                                    </p>
                                    <Button className="w-full" size="lg" onClick={() => navigate("/auth?tab=register")}>
                                        Bergabung Sekarang
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </Button>
                                </div>
                            </Card>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-24 bg-primary text-primary-foreground">
                <div className="container px-4 md:px-6">
                    <div className="max-w-3xl mx-auto text-center space-y-8">
                        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
                            Siap Memulai Perjalanan Digital Anda?
                        </h2>
                        <p className="text-xl text-primary-foreground/90">
                            Bergabunglah dengan ribuan ASN yang telah merasakan kemudahan SIPANDAI.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Button size="lg" variant="secondary" className="text-lg px-8 h-12" onClick={() => navigate("/auth?tab=register")}>
                                Daftar Gratis
                                <ArrowRight className="ml-2 h-5 w-5" />
                            </Button>
                            <Button size="lg" variant="outline" className="text-lg px-8 h-12 bg-transparent text-primary-foreground border-primary-foreground hover:bg-primary-foreground/10" onClick={() => navigate("/auth")}>
                                Masuk
                            </Button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 border-t bg-background">
                <div className="container px-4 md:px-6">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <Building2 className="h-5 w-5 text-primary" />
                            </div>
                            <span className="text-lg font-bold">SIPANDAI</span>
                        </div>
                        <p className="text-sm text-muted-foreground text-center md:text-right">
                            &copy; 2024 SIPANDAI - Sistem Pelayanan Administrasi Digital ASN. <br />
                            Hak Cipta Dilindungi Undang-Undang.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
}

function StatCard({
    number,
    label
}: {
    number: string;
    label: string;
}) {
    return (
        <div className="text-center space-y-2">
            <div className="text-4xl md:text-5xl font-bold">{number}</div>
            <div className="text-sm md:text-base text-primary-foreground/80">{label}</div>
        </div>
    );
}

function FeatureCard({
    icon,
    title,
    description
}: {
    icon: React.ReactNode;
    title: string;
    description: string;
}) {
    return (
        <Card className="border-none shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 duration-300">
            <CardContent className="pt-8">
                <div className="mb-6 inline-block p-4 bg-primary/5 rounded-2xl text-primary">
                    {icon}
                </div>
                <h3 className="text-xl font-bold mb-3">{title}</h3>
                <p className="text-muted-foreground leading-relaxed">
                    {description}
                </p>
            </CardContent>
        </Card>
    );
}

function BenefitItem({
    icon,
    title,
    description
}: {
    icon: React.ReactNode;
    title: string;
    description: string;
}) {
    return (
        <div className="flex gap-4">
            <div className="flex-shrink-0 mt-1">{icon}</div>
            <div>
                <h4 className="font-semibold mb-1">{title}</h4>
                <p className="text-sm text-muted-foreground">{description}</p>
            </div>
        </div>
    );
}