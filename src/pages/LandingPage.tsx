import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    ArrowRight, Building2, FileText, Award, MessageSquare, ShieldCheck,
    Clock, CheckCircle2, TrendingUp, Briefcase, UserCheck, Calendar,
    Sparkles, Zap, Globe, Lock, BarChart3, Users
} from "lucide-react";

export default function LandingPage() {
    const navigate = useNavigate();
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            setMousePosition({ x: e.clientX, y: e.clientY });
        };
        window.addEventListener("mousemove", handleMouseMove);
        return () => window.removeEventListener("mousemove", handleMouseMove);
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 dark:from-slate-950 dark:via-blue-950/30 dark:to-indigo-950/40 flex flex-col overflow-x-hidden relative">
            {/* Animated Background Elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div
                    className="absolute w-[500px] h-[500px] bg-gradient-to-r from-blue-400/20 to-indigo-400/20 rounded-full blur-3xl"
                    style={{
                        top: '10%',
                        left: '10%',
                        transform: `translate(${mousePosition.x * 0.02}px, ${mousePosition.y * 0.02}px)`,
                        transition: 'transform 0.3s ease-out'
                    }}
                />
                <div
                    className="absolute w-[600px] h-[600px] bg-gradient-to-r from-purple-400/15 to-pink-400/15 rounded-full blur-3xl"
                    style={{
                        bottom: '10%',
                        right: '10%',
                        transform: `translate(${mousePosition.x * -0.03}px, ${mousePosition.y * -0.03}px)`,
                        transition: 'transform 0.3s ease-out'
                    }}
                />
                <div className="absolute top-1/4 right-1/4 w-72 h-72 bg-gradient-to-r from-cyan-400/10 to-blue-400/10 rounded-full blur-3xl animate-pulse" />
            </div>

            {/* Glassmorphic Navigation */}
            <nav className="border-b border-white/20 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-slate-900/60 sticky top-0 z-50 shadow-lg shadow-black/5">
                <div className="container flex h-20 items-center justify-between px-4 md:px-6">
                    <div
                        className="flex items-center gap-3 cursor-pointer group"
                        onClick={() => navigate("/")}
                    >
                        <div className="relative p-2.5 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-lg shadow-blue-500/50 group-hover:shadow-blue-500/70 transition-all group-hover:scale-110">
                            <Building2 className="h-7 w-7 text-white" />
                            <div className="absolute inset-0 bg-white/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <div>
                            <span className="text-2xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                                SIPANDAI
                            </span>
                            <div className="text-[10px] text-muted-foreground font-medium -mt-1">Digital ASN Platform</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 md:gap-4">
                        <Button
                            variant="ghost"
                            size="lg"
                            className="text-sm md:text-base font-semibold hover:bg-blue-50 dark:hover:bg-blue-950"
                            onClick={() => navigate("/auth")}
                        >
                            Masuk
                        </Button>
                        <Button
                            onClick={() => navigate("/auth?tab=register")}
                            size="lg"
                            className="gap-2 text-sm md:text-base font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all hover:scale-105"
                        >
                            <span className="hidden sm:inline">Daftar Sekarang</span>
                            <span className="sm:hidden">Daftar</span>
                            <ArrowRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </nav>

            {/* Hero Section - Ultra Modern */}
            <section className="relative flex-1 flex items-center pt-20 pb-32 lg:pt-32 lg:pb-48 overflow-hidden">
                <div className="container px-4 md:px-6 relative z-10">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        <div className="space-y-10 animate-in fade-in slide-in-from-left duration-1000">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border border-blue-500/20 backdrop-blur-sm">
                                <Sparkles className="h-4 w-4 text-blue-600 animate-pulse" />
                                <span className="text-sm font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                                    Platform Digital ASN Terintegrasi
                                </span>
                            </div>

                            <div className="space-y-6">
                                <h1 className="text-5xl font-black tracking-tight lg:text-7xl xl:text-8xl leading-tight">
                                    <span className="block">SIPANDAI</span>
                                    <span className="block mt-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent animate-in slide-in-from-bottom duration-1000">
                                        Masa Depan
                                    </span>
                                    <span className="block bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent animate-in slide-in-from-bottom duration-1000 delay-150">
                                        Administrasi ASN
                                    </span>
                                </h1>
                                <p className="text-xl md:text-2xl text-muted-foreground max-w-[600px] leading-relaxed">
                                    Platform terintegrasi untuk pengelolaan administrasi kepegawaian ASN yang
                                    <span className="font-semibold text-foreground"> efisien</span>,
                                    <span className="font-semibold text-foreground"> transparan</span>, dan
                                    <span className="font-semibold text-foreground"> modern</span>.
                                </p>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-4">
                                <Button
                                    size="lg"
                                    className="text-lg px-10 h-14 font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-2xl shadow-blue-500/40 hover:shadow-blue-500/60 transition-all hover:scale-105 group"
                                    onClick={() => navigate("/auth?tab=register")}
                                >
                                    Mulai Sekarang
                                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                                </Button>
                                <Button
                                    size="lg"
                                    variant="outline"
                                    className="text-lg px-10 h-14 font-semibold border-2 hover:bg-blue-50 dark:hover:bg-blue-950 transition-all hover:scale-105"
                                    onClick={() => navigate("/auth")}
                                >
                                    Masuk ke Akun
                                </Button>
                            </div>

                            <div className="flex flex-wrap items-center gap-6 text-sm">
                                {[
                                    { icon: ShieldCheck, text: "Keamanan Tingkat Enterprise" },
                                    { icon: Clock, text: "Akses 24/7" },
                                    { icon: Zap, text: "Proses Instan" }
                                ].map((item, i) => (
                                    <div key={i} className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-white/20">
                                        <item.icon className="h-4 w-4 text-blue-600" />
                                        <span className="font-medium">{item.text}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 3D Card Effect */}
                        <div className="relative lg:ml-auto animate-in fade-in slide-in-from-right duration-1000 delay-300">
                            <div className="relative group">
                                {/* Glowing border effect */}
                                <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-3xl blur-2xl opacity-30 group-hover:opacity-50 transition-opacity animate-pulse" />

                                {/* Main card */}
                                <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-white/20 bg-gradient-to-br from-white/80 to-white/40 dark:from-slate-900/80 dark:to-slate-800/40 backdrop-blur-xl p-3">
                                    <img
                                        src="/hero-illustration.png"
                                        alt="SIPANDAI Dashboard Preview"
                                        className="rounded-2xl w-full h-auto object-cover transform group-hover:scale-105 transition-transform duration-700"
                                        onError={e => {
                                            e.currentTarget.src = "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=80";
                                        }}
                                    />

                                    {/* Floating stats badges */}
                                    <div className="absolute top-6 right-6 px-4 py-2 rounded-xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md shadow-lg border border-white/20 animate-in fade-in zoom-in duration-500 delay-700">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                            <span className="text-sm font-bold">Online</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Floating elements */}
                                <div className="absolute -top-8 -left-8 w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl opacity-20 blur-xl animate-pulse" />
                                <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl opacity-20 blur-xl animate-pulse delay-500" />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Stats Section - Glassmorphic */}
            <section className="py-20 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-95" />
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjEiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-20" />

                <div className="container px-4 md:px-6 relative z-10">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        <StatCard icon={<Globe />} number="100%" label="Digital" />
                        <StatCard icon={<Clock />} number="24/7" label="Akses Online" />
                        <StatCard icon={<Zap />} number="Instan" label="Proses Cepat" />
                        <StatCard icon={<Lock />} number="Aman" label="Terenkripsi" />
                    </div>
                </div>
            </section>

            {/* Features Section - Modern Cards */}
            <section className="py-32 relative">
                <div className="container px-4 md:px-6">
                    <div className="text-center space-y-6 mb-20 animate-in fade-in slide-in-from-bottom duration-700">
                        <Badge variant="outline" className="text-base px-6 py-2 border-2 border-blue-500/20 bg-blue-500/5">
                            <Sparkles className="h-4 w-4 mr-2 inline" />
                            Layanan Unggulan
                        </Badge>
                        <h2 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight">
                            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                                Fitur Lengkap
                            </span>
                            <br />
                            untuk Kebutuhan Anda
                        </h2>
                        <p className="text-xl md:text-2xl text-muted-foreground max-w-[900px] mx-auto leading-relaxed">
                            Berbagai fitur layanan kepegawaian yang dapat diakses dengan mudah melalui satu pintu digital
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <FeatureCard
                            icon={<FileText className="h-12 w-12" />}
                            title="Pengajuan Cuti"
                            description="Proses pengajuan cuti yang lebih cepat dan transparan dengan notifikasi real-time dan tracking status."
                            gradient="from-blue-500 to-cyan-500"
                        />
                        <FeatureCard
                            icon={<Award className="h-12 w-12" />}
                            title="Kenaikan Pangkat"
                            description="Pantau status usulan kenaikan pangkat dan lengkapi berkas secara digital dengan mudah."
                            gradient="from-indigo-500 to-purple-500"
                        />
                        <FeatureCard
                            icon={<MessageSquare className="h-12 w-12" />}
                            title="Konsultasi Online"
                            description="Layanan konsultasi langsung dengan admin unit maupun pusat terkait kepegawaian."
                            gradient="from-purple-500 to-pink-500"
                        />
                        <FeatureCard
                            icon={<Briefcase className="h-12 w-12" />}
                            title="Mutasi Pegawai"
                            description="Kelola proses mutasi pegawai dengan sistem yang terintegrasi dan transparan."
                            gradient="from-pink-500 to-rose-500"
                        />
                        <FeatureCard
                            icon={<UserCheck className="h-12 w-12" />}
                            title="Pensiun"
                            description="Proses pengajuan pensiun yang terstruktur dengan panduan lengkap."
                            gradient="from-orange-500 to-amber-500"
                        />
                        <FeatureCard
                            icon={<Calendar className="h-12 w-12" />}
                            title="Employee Recognition"
                            description="Sistem penilaian dan penghargaan pegawai terbaik setiap bulan."
                            gradient="from-emerald-500 to-teal-500"
                        />
                    </div>
                </div>
            </section>

            {/* Benefits Section - Split Design */}
            <section className="py-32 bg-gradient-to-br from-slate-50 to-blue-50/50 dark:from-slate-900 dark:to-blue-950/50">
                <div className="container px-4 md:px-6">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        <div className="space-y-8 animate-in fade-in slide-in-from-left duration-700">
                            <Badge variant="outline" className="text-base px-6 py-2 border-2">
                                Keunggulan Kami
                            </Badge>
                            <h2 className="text-4xl md:text-5xl font-black tracking-tight">
                                Mengapa Memilih
                                <span className="block mt-2 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                                    SIPANDAI?
                                </span>
                            </h2>
                            <div className="space-y-6">
                                <BenefitItem
                                    icon={<CheckCircle2 className="h-6 w-6 text-blue-600" />}
                                    title="Efisiensi Waktu"
                                    description="Proses administrasi yang lebih cepat tanpa perlu datang ke kantor."
                                />
                                <BenefitItem
                                    icon={<CheckCircle2 className="h-6 w-6 text-indigo-600" />}
                                    title="Transparansi Penuh"
                                    description="Lacak status pengajuan Anda secara real-time kapan saja."
                                />
                                <BenefitItem
                                    icon={<CheckCircle2 className="h-6 w-6 text-purple-600" />}
                                    title="Keamanan Data"
                                    description="Data Anda dilindungi dengan enkripsi tingkat enterprise."
                                />
                                <BenefitItem
                                    icon={<CheckCircle2 className="h-6 w-6 text-pink-600" />}
                                    title="Mudah Digunakan"
                                    description="Interface yang intuitif dan user-friendly untuk semua kalangan."
                                />
                            </div>
                        </div>

                        <div className="relative animate-in fade-in slide-in-from-right duration-700 delay-300">
                            <div className="absolute -inset-4 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl blur-3xl opacity-20" />
                            <Card className="relative p-10 shadow-2xl border-2 border-white/20 bg-gradient-to-br from-white/80 to-white/40 dark:from-slate-900/80 dark:to-slate-800/40 backdrop-blur-xl">
                                <div className="space-y-8">
                                    <div className="flex items-center gap-4">
                                        <div className="p-4 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl shadow-lg shadow-blue-500/50">
                                            <TrendingUp className="h-10 w-10 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="text-3xl font-black">Digitalisasi ASN</h3>
                                            <p className="text-muted-foreground font-medium">Menuju era digital yang lebih baik</p>
                                        </div>
                                    </div>
                                    <p className="text-lg text-muted-foreground leading-relaxed">
                                        SIPANDAI hadir sebagai solusi modern untuk mengelola administrasi kepegawaian ASN.
                                        Dengan teknologi terkini, kami memastikan setiap proses berjalan efisien dan transparan.
                                    </p>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                                            <BarChart3 className="h-8 w-8 text-blue-600 mb-2" />
                                            <div className="text-2xl font-bold">99.9%</div>
                                            <div className="text-sm text-muted-foreground">Uptime</div>
                                        </div>
                                        <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                                            <Users className="h-8 w-8 text-indigo-600 mb-2" />
                                            <div className="text-2xl font-bold">1000+</div>
                                            <div className="text-sm text-muted-foreground">Pengguna</div>
                                        </div>
                                    </div>
                                    <Button
                                        className="w-full h-14 text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/30 group"
                                        size="lg"
                                        onClick={() => navigate("/auth?tab=register")}
                                    >
                                        Bergabung Sekarang
                                        <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                                    </Button>
                                </div>
                            </Card>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section - Bold & Modern */}
            <section className="py-32 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600" />
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjEiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-20" />

                <div className="container px-4 md:px-6 relative z-10">
                    <div className="max-w-4xl mx-auto text-center space-y-10 text-white">
                        <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white/10 backdrop-blur-sm border border-white/20">
                            <Sparkles className="h-5 w-5 animate-pulse" />
                            <span className="font-semibold">Mulai Perjalanan Digital Anda</span>
                        </div>

                        <h2 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tight leading-tight">
                            Siap Bergabung dengan
                            <span className="block mt-2">Masa Depan ASN?</span>
                        </h2>

                        <p className="text-xl md:text-2xl text-white/90 max-w-2xl mx-auto leading-relaxed">
                            Bergabunglah dengan ribuan ASN yang telah merasakan kemudahan SIPANDAI
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                            <Button
                                size="lg"
                                className="text-lg px-10 h-16 font-bold bg-white text-blue-600 hover:bg-white/90 shadow-2xl shadow-black/20 hover:scale-105 transition-all group"
                                onClick={() => navigate("/auth?tab=register")}
                            >
                                Daftar Gratis Sekarang
                                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                            </Button>
                            <Button
                                size="lg"
                                variant="outline"
                                className="text-lg px-10 h-16 font-semibold bg-transparent text-white border-2 border-white/30 hover:bg-white/10 hover:scale-105 transition-all"
                                onClick={() => navigate("/auth")}
                            >
                                Masuk ke Akun
                            </Button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer - Minimalist */}
            <footer className="py-12 border-t border-white/10 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl">
                <div className="container px-4 md:px-6">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-lg shadow-blue-500/30">
                                <Building2 className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <span className="text-xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                                    SIPANDAI
                                </span>
                                <div className="text-xs text-muted-foreground">Digital ASN Platform</div>
                            </div>
                        </div>
                        <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8">
                            <p className="text-sm text-muted-foreground">
                                © 2024 SIPANDAI. Hak Cipta Dilindungi.
                            </p>
                            <button
                                onClick={() => navigate("/privacy")}
                                className="text-sm text-muted-foreground hover:text-blue-600 transition-colors font-medium"
                            >
                                Kebijakan Privasi
                            </button>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}

function StatCard({ icon, number, label }: { icon: React.ReactNode; number: string; label: string }) {
    return (
        <div className="text-center space-y-3 group cursor-default">
            <div className="inline-flex p-3 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 group-hover:scale-110 transition-transform">
                <div className="text-white">{icon}</div>
            </div>
            <div className="text-5xl md:text-6xl font-black text-white group-hover:scale-110 transition-transform">{number}</div>
            <div className="text-base md:text-lg text-white/80 font-semibold">{label}</div>
        </div>
    );
}

function FeatureCard({ icon, title, description, gradient }: { icon: React.ReactNode; title: string; description: string; gradient: string }) {
    return (
        <Card className="group relative border-2 border-white/20 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 overflow-hidden">
            <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-5 transition-opacity`} />
            <CardContent className="pt-10 pb-8 relative">
                <div className={`mb-6 inline-flex p-5 bg-gradient-to-br ${gradient} rounded-2xl text-white shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-500`}>
                    {icon}
                </div>
                <h3 className="text-2xl font-bold mb-4 group-hover:text-blue-600 transition-colors">{title}</h3>
                <p className="text-muted-foreground leading-relaxed text-base">
                    {description}
                </p>
            </CardContent>
        </Card>
    );
}

function BenefitItem({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
    return (
        <div className="flex gap-5 p-5 rounded-2xl hover:bg-white/50 dark:hover:bg-slate-800/50 transition-all group cursor-default">
            <div className="flex-shrink-0 mt-1 group-hover:scale-110 transition-transform">{icon}</div>
            <div>
                <h4 className="font-bold text-lg mb-2 group-hover:text-blue-600 transition-colors">{title}</h4>
                <p className="text-muted-foreground leading-relaxed">{description}</p>
            </div>
        </div>
    );
}