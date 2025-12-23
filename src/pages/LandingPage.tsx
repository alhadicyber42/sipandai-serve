import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Building2, FileText, Award, MessageSquare, ShieldCheck, Clock, CheckCircle2, TrendingUp, Briefcase, UserCheck, Calendar, Sparkles, Zap, Globe, Lock, BarChart3, Users } from "lucide-react";
export default function LandingPage() {
  const navigate = useNavigate();
  const [mousePosition, setMousePosition] = useState({
    x: 0,
    y: 0
  });
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: e.clientX,
        y: e.clientY
      });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);
  return <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 dark:from-slate-950 dark:via-blue-950/30 dark:to-indigo-950/40 flex flex-col overflow-x-hidden relative">
        {/* Animated Background Elements */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
            <div className="absolute w-[500px] h-[500px] bg-gradient-to-r from-blue-400/20 to-indigo-400/20 rounded-full blur-3xl" style={{
        top: '10%',
        left: '10%',
        transform: `translate(${mousePosition.x * 0.02}px, ${mousePosition.y * 0.02}px)`,
        transition: 'transform 0.3s ease-out'
      }} />
            <div className="absolute w-[600px] h-[600px] bg-gradient-to-r from-purple-400/15 to-pink-400/15 rounded-full blur-3xl" style={{
        bottom: '10%',
        right: '10%',
        transform: `translate(${mousePosition.x * -0.03}px, ${mousePosition.y * -0.03}px)`,
        transition: 'transform 0.3s ease-out'
      }} />
            <div className="absolute top-1/4 right-1/4 w-72 h-72 bg-gradient-to-r from-cyan-400/10 to-blue-400/10 rounded-full blur-3xl animate-pulse" />
        </div>

        {/* Glassmorphic Navigation */}
        <nav className="border-b border-white/20 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-slate-900/60 sticky top-0 z-50 shadow-lg shadow-black/5">
            <div className="container flex h-16 md:h-20 items-center justify-between px-3 md:px-6">
                <div className="flex items-center gap-2 md:gap-3 cursor-pointer group" onClick={() => navigate("/")}>
                    <div className="relative p-1.5 md:p-2.5 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg md:rounded-xl shadow-lg shadow-blue-500/50 group-hover:shadow-blue-500/70 transition-all group-hover:scale-110">
                        <Building2 className="h-5 w-5 md:h-7 md:w-7 text-white" />
                        <div className="absolute inset-0 bg-white/20 rounded-lg md:rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div>
                        <span className="text-lg md:text-2xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                            SIPANDAI
                        </span>
                        <div className="text-[9px] md:text-[10px] text-muted-foreground font-medium -mt-1 hidden sm:block">Digital ASN Platform</div>
                    </div>
                </div>
                <div className="flex items-center gap-2 md:gap-4">
                    <Button variant="ghost" size="sm" className="text-xs md:text-base font-semibold hover:bg-blue-50 dark:hover:bg-blue-950 h-8 md:h-10 px-3 md:px-4" onClick={() => navigate("/auth")}>
                        Masuk
                    </Button>
                    <Button onClick={() => navigate("/auth?tab=register")} size="sm" className="gap-1 md:gap-2 text-xs md:text-base font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all hover:scale-105 h-8 md:h-10 px-3 md:px-4">
                        Daftar
                        <ArrowRight className="h-3 w-3 md:h-4 md:w-4" />
                    </Button>
                </div>
            </div>
        </nav>

        {/* Hero Section - Ultra Modern */}
        <section className="relative flex-1 flex items-center pt-12 pb-16 md:pt-20 md:pb-32 lg:pt-32 lg:pb-48 overflow-hidden">
            <div className="container px-3 md:px-6 relative z-10">
                <div className="grid lg:grid-cols-2 gap-8 md:gap-16 items-center">
                    <div className="space-y-6 md:space-y-10 animate-in fade-in slide-in-from-left duration-1000">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-full bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border border-blue-500/20 backdrop-blur-sm">
                            <Building2 className="h-3 w-3 md:h-4 md:w-4 text-blue-600" />
                            <span className="text-xs md:text-sm font-semibold text-blue-700 dark:text-blue-400">
                                Ditjen Binalavotas - Kementerian Ketenagakerjaan RI
                            </span>
                        </div>

                        <div className="space-y-4 md:space-y-6">
                            <h1 className="text-3xl md:text-5xl font-black tracking-tight lg:text-6xl xl:text-7xl leading-tight">
                                <span className="block text-foreground">SIPANDAI</span>
                                <span className="block mt-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 bg-clip-text text-transparent text-2xl md:text-3xl lg:text-5xl leading-tight py-[10px]">
                                    Sistem Informasi Pelayanan Administrasi Digital ASN Terintegrasi
                                </span>
                            </h1>
                            <p className="text-base md:text-lg lg:text-xl text-muted-foreground max-w-[650px] leading-relaxed">
                                Aplikasi resmi <span className="font-semibold text-foreground">Direktorat Jenderal Pembinaan Pelatihan Vokasi dan Produktivitas</span> untuk digitalisasi layanan kepegawaian ASN yang terintegrasi, transparan, dan akuntabel.
                            </p>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground bg-blue-50/50 dark:bg-blue-950/20 p-3 rounded-lg border border-blue-200/50 dark:border-blue-800/30">
                                <ShieldCheck className="h-5 w-5 text-blue-600 flex-shrink-0" />
                                <p className="text-xs md:text-sm">
                                    Platform resmi untuk ASN di lingkungan Ditjen Binalavotas 
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
                            <Button size="lg" className="text-base md:text-lg px-6 md:px-10 h-12 md:h-14 font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-xl shadow-blue-500/30 hover:shadow-blue-500/50 transition-all group" onClick={() => navigate("/auth")}>
                                Masuk Aplikasi
                                <ArrowRight className="ml-2 h-4 w-4 md:h-5 md:w-5 group-hover:translate-x-1 transition-transform" />
                            </Button>
                            <Button size="lg" variant="outline" className="text-base md:text-lg px-6 md:px-10 h-12 md:h-14 font-semibold border-2 border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-all" onClick={() => {
                const infoSection = document.getElementById('fitur-layanan');
                infoSection?.scrollIntoView({
                  behavior: 'smooth'
                });
              }}>
                                Lihat Fitur
                            </Button>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 md:gap-6 text-xs md:text-sm">
                            {[{
                icon: ShieldCheck,
                text: "Aman & Terenkripsi"
              }, {
                icon: CheckCircle2,
                text: "Terintegrasi"
              }, {
                icon: Users,
                text: "Untuk ASN"
              }].map((item, i) => <div key={i} className="flex items-center gap-1.5 md:gap-2 px-2.5 md:px-4 py-1.5 md:py-2 rounded-full bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-blue-200/50 dark:border-blue-800/30">
                                <item.icon className="h-3 w-3 md:h-4 md:w-4 text-blue-600 flex-shrink-0" />
                                <span className="font-medium whitespace-nowrap text-xs md:text-sm text-foreground/80">{item.text}</span>
                            </div>)}
                        </div>
                    </div>

                    {/* 3D Card Effect */}
                    <div className="relative lg:ml-auto animate-in fade-in slide-in-from-right duration-1000 delay-300 hidden lg:block">
                        <div className="relative group">
                            {/* Glowing border effect */}
                            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-3xl blur-2xl opacity-30 group-hover:opacity-50 transition-opacity animate-pulse" />

                            {/* Main card */}
                            <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-white/20 bg-gradient-to-br from-white/80 to-white/40 dark:from-slate-900/80 dark:to-slate-800/40 backdrop-blur-xl p-3">
                                <img src="/hero-illustration.png" alt="SIPANDAI Dashboard Preview" className="rounded-2xl w-full h-auto object-cover transform group-hover:scale-105 transition-transform duration-700" onError={e => {
                  e.currentTarget.src = "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=80";
                }} />

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
        <section className="py-12 md:py-20 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-95" />
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjEiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-20" />

            <div className="container px-3 md:px-6 relative z-10">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
                    <StatCard icon={<Globe />} number="100%" label="Digital" />
                    <StatCard icon={<Clock />} number="24/7" label="Akses Online" />
                    <StatCard icon={<Zap />} number="Instan" label="Proses Cepat" />
                    <StatCard icon={<Lock />} number="Aman" label="Terenkripsi" />
                </div>
            </div>
        </section>

        {/* Features Section - Modern Cards */}
        <section id="fitur-layanan" className="py-16 md:py-32 relative">
            <div className="container px-3 md:px-6">
                <div className="text-center space-y-4 md:space-y-6 mb-12 md:mb-20 animate-in fade-in slide-in-from-bottom duration-700">
                    <Badge variant="outline" className="text-xs md:text-base px-4 md:px-6 py-1.5 md:py-2 border-2 border-blue-500/20 bg-blue-500/5">
                        <FileText className="h-3 w-3 md:h-4 md:w-4 mr-1.5 md:mr-2 inline" />
                        Layanan Digital ASN
                    </Badge>
                    <h2 className="text-2xl md:text-4xl lg:text-5xl xl:text-6xl font-black tracking-tight px-4">
                        <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                            Layanan Kepegawaian
                        </span>
                        <br />
                        Terintegrasi
                    </h2>
                    <p className="text-sm md:text-xl lg:text-2xl text-muted-foreground max-w-[900px] mx-auto leading-relaxed px-4">
                        Akses seluruh layanan administrasi kepegawaian ASN secara digital dalam satu platform
                    </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
                    <FeatureCard icon={<FileText className="h-12 w-12" />} title="Pengajuan Cuti" description="Proses pengajuan cuti yang lebih cepat dan transparan dengan notifikasi real-time dan tracking status." gradient="from-blue-500 to-cyan-500" />
                    <FeatureCard icon={<Award className="h-12 w-12" />} title="Kenaikan Pangkat" description="Pantau status usulan kenaikan pangkat dan lengkapi berkas secara digital dengan mudah." gradient="from-indigo-500 to-purple-500" />
                    <FeatureCard icon={<MessageSquare className="h-12 w-12" />} title="Konsultasi Online" description="Layanan konsultasi langsung dengan admin unit maupun pusat terkait kepegawaian." gradient="from-purple-500 to-pink-500" />
                    <FeatureCard icon={<Briefcase className="h-12 w-12" />} title="Mutasi Pegawai" description="Kelola proses mutasi pegawai dengan sistem yang terintegrasi dan transparan." gradient="from-pink-500 to-rose-500" />
                    <FeatureCard icon={<UserCheck className="h-12 w-12" />} title="Pensiun" description="Proses pengajuan pensiun yang terstruktur dengan panduan lengkap." gradient="from-orange-500 to-amber-500" />
                    <FeatureCard icon={<Calendar className="h-12 w-12" />} title="Employee Recognition" description="Sistem penilaian dan penghargaan pegawai terbaik setiap bulan." gradient="from-emerald-500 to-teal-500" />
                </div>
            </div>
        </section>

        {/* Benefits Section - Split Design */}
        <section className="py-16 md:py-32 bg-gradient-to-br from-slate-50 to-blue-50/50 dark:from-slate-900 dark:to-blue-950/50">
            <div className="container px-3 md:px-6">
                <div className="grid lg:grid-cols-2 gap-8 md:gap-16 items-center">
                    <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-left duration-700">
                        <Badge variant="outline" className="text-xs md:text-base px-4 md:px-6 py-1.5 md:py-2 border-2">
                            <Building2 className="h-3 w-3 md:h-4 md:w-4 mr-1.5 md:mr-2 inline" />
                            Keunggulan Platform
                        </Badge>
                        <h2 className="text-2xl md:text-4xl lg:text-5xl font-black tracking-tight">
                            Pelayanan Digital
                            <span className="block mt-2 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                                untuk ASN Modern
                            </span>
                        </h2>
                        <div className="space-y-6">
                            <BenefitItem icon={<CheckCircle2 className="h-6 w-6 text-blue-600" />} title="Efisien & Cepat" description="Proses administrasi yang lebih cepat dengan sistem terintegrasi." />
                            <BenefitItem icon={<CheckCircle2 className="h-6 w-6 text-indigo-600" />} title="Transparan & Akuntabel" description="Lacak status pengajuan secara real-time dengan sistem yang transparan." />
                            <BenefitItem icon={<CheckCircle2 className="h-6 w-6 text-purple-600" />} title="Aman & Terpercaya" description="Data dilindungi dengan standar keamanan pemerintahan." />
                            <BenefitItem icon={<CheckCircle2 className="h-6 w-6 text-pink-600" />} title="Mudah Diakses" description="Interface yang mudah digunakan untuk seluruh pegawai ASN." />
                        </div>
                    </div>

                    <div className="relative animate-in fade-in slide-in-from-right duration-700 delay-300">
                        <div className="absolute -inset-4 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl blur-3xl opacity-20" />
                        <Card className="relative p-6 md:p-10 shadow-2xl border-2 border-white/20 bg-gradient-to-br from-white/80 to-white/40 dark:from-slate-900/80 dark:to-slate-800/40 backdrop-blur-xl">
                            <div className="space-y-6 md:space-y-8">
                                <div className="flex items-center gap-3 md:gap-4">
                                    <div className="p-3 md:p-4 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl md:rounded-2xl shadow-lg shadow-blue-500/50">
                                        <TrendingUp className="h-7 w-7 md:h-10 md:w-10 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl md:text-3xl font-black">Digitalisasi ASN</h3>
                                        <p className="text-xs md:text-base text-muted-foreground font-medium">Menuju era digital yang lebih baik</p>
                                    </div>
                                </div>
                                <p className="text-sm md:text-lg text-muted-foreground leading-relaxed">
                                    SIPANDAI dikembangkan oleh Ditjen Binalavotas untuk mendukung transformasi digital pelayanan kepegawaian ASN dengan sistem yang terintegrasi, transparan, dan akuntabel.
                                </p>
                                <div className="grid grid-cols-2 gap-3 md:gap-4">
                                    <div className="p-3 md:p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                                        <ShieldCheck className="h-6 w-6 md:h-8 md:w-8 text-blue-600 mb-2" />
                                        <div className="text-xl md:text-2xl font-bold">100%</div>
                                        <div className="text-xs md:text-sm text-muted-foreground">Resmi</div>
                                    </div>
                                    <div className="p-3 md:p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                                        <Users className="h-6 w-6 md:h-8 md:w-8 text-indigo-600 mb-2" />
                                        <div className="text-xl md:text-2xl font-bold">ASN</div>
                                        <div className="text-xs md:text-sm text-muted-foreground">Terintegrasi</div>
                                    </div>
                                </div>
                                <Button className="w-full h-12 md:h-14 text-base md:text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/30 group" size="lg" onClick={() => navigate("/auth")}>
                                    Akses SIPANDAI
                                    <ArrowRight className="ml-2 h-4 w-4 md:h-5 md:w-5 group-hover:translate-x-1 transition-transform" />
                                </Button>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </section>

        {/* CTA Section - Bold & Modern */}
        <section className="py-16 md:py-32 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600" />
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjEiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-20" />

            <div className="container px-3 md:px-6 relative z-10">
                <div className="max-w-4xl mx-auto text-center space-y-6 md:space-y-10 text-white">
                    <div className="inline-flex items-center gap-2 px-4 md:px-6 py-2 md:py-3 rounded-full bg-white/10 backdrop-blur-sm border border-white/20">
                        <Building2 className="h-4 w-4 md:h-5 md:w-5" />
                        <span className="font-semibold text-xs md:text-base">Platform Resmi Ditjen Binalavotas</span>
                    </div>

                    <h2 className="text-2xl md:text-4xl lg:text-6xl xl:text-7xl font-black tracking-tight leading-tight px-4">
                        Transformasi Digital
                        <span className="block mt-2">Pelayanan ASN</span>
                    </h2>

                    <p className="text-base md:text-xl lg:text-2xl text-white/90 max-w-2xl mx-auto leading-relaxed px-4">
                        Akses layanan kepegawaian digital yang terintegrasi, transparan, dan akuntabel
                    </p>

                    <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center pt-4">
                        <Button size="lg" className="text-base md:text-lg px-6 md:px-10 h-12 md:h-16 font-bold bg-white text-blue-600 hover:bg-white/90 shadow-2xl shadow-black/20 transition-all group" onClick={() => navigate("/auth")}>
                            Masuk Aplikasi
                            <ArrowRight className="ml-2 h-4 w-4 md:h-5 md:w-5 group-hover:translate-x-1 transition-transform" />
                        </Button>
                        <Button size="lg" variant="outline" className="text-base md:text-lg px-6 md:px-10 h-12 md:h-16 font-semibold bg-transparent text-white border-2 border-white/30 hover:bg-white/10 transition-all" onClick={() => {
              const infoSection = document.getElementById('fitur-layanan');
              infoSection?.scrollIntoView({
                behavior: 'smooth'
              });
            }}>
                            Pelajari Lebih Lanjut
                        </Button>
                    </div>
                </div>
            </div>
        </section>

        {/* Footer - Government Style */}
        <footer className="py-8 md:py-12 border-t border-white/10 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl">
            <div className="container px-3 md:px-6">
                <div className="flex flex-col gap-6 md:gap-8">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4 md:gap-6">
                        <div className="flex items-center gap-2 md:gap-3">
                            <div className="p-1.5 md:p-2 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg md:rounded-xl shadow-lg shadow-blue-500/30">
                                <Building2 className="h-5 w-5 md:h-6 md:w-6 text-white" />
                            </div>
                            <div>
                                <span className="text-base md:text-xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                                    SIPANDAI
                                </span>
                                <div className="text-[10px] md:text-xs text-muted-foreground">Sistem Informasi Pelayanan Administrasi Digital ASN Terintegrasi</div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="border-t border-white/10 pt-4 md:pt-6">
                        <div className="flex flex-col md:flex-row justify-between items-center gap-3 md:gap-6 text-center md:text-left">
                            <div className="space-y-1">
                                <p className="text-xs md:text-sm text-muted-foreground font-medium">
                                    Direktorat Jenderal Pembinaan Pelatihan Vokasi dan Produktivitas
                                </p>
                                <p className="text-xs md:text-sm text-muted-foreground">
                                    Kementerian Ketenagakerjaan Republik Indonesia
                                </p>
                            </div>
                            <p className="text-xs md:text-sm text-muted-foreground">© 2025 Ditjen Binalavotas. All rights reserved.</p>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    </div>;
}
function StatCard({
  icon,
  number,
  label
}: {
  icon: React.ReactNode;
  number: string;
  label: string;
}) {
  return <div className="text-center space-y-2 md:space-y-3 group cursor-default">
        <div className="inline-flex p-2 md:p-3 rounded-xl md:rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 group-hover:scale-110 transition-transform">
            <div className="text-white [&>svg]:h-5 [&>svg]:w-5 md:[&>svg]:h-6 md:[&>svg]:w-6">{icon}</div>
        </div>
        <div className="text-3xl md:text-5xl lg:text-6xl font-black text-white group-hover:scale-110 transition-transform">{number}</div>
        <div className="text-xs md:text-base lg:text-lg text-white/80 font-semibold">{label}</div>
    </div>;
}
function FeatureCard({
  icon,
  title,
  description,
  gradient
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  gradient: string;
}) {
  return <Card className="group relative border-2 border-white/20 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 overflow-hidden">
        <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-5 transition-opacity`} />
        <CardContent className="pt-6 md:pt-10 pb-6 md:pb-8 relative">
            <div className={`mb-4 md:mb-6 inline-flex p-3 md:p-5 bg-gradient-to-br ${gradient} rounded-xl md:rounded-2xl text-white shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 [&>svg]:h-8 [&>svg]:w-8 md:[&>svg]:h-12 md:[&>svg]:w-12`}>
                {icon}
            </div>
            <h3 className="text-lg md:text-2xl font-bold mb-3 md:mb-4 group-hover:text-blue-600 transition-colors">{title}</h3>
            <p className="text-muted-foreground leading-relaxed text-sm md:text-base">
                {description}
            </p>
        </CardContent>
    </Card>;
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
  return <div className="flex gap-3 md:gap-5 p-3 md:p-5 rounded-xl md:rounded-2xl hover:bg-white/50 dark:hover:bg-slate-800/50 transition-all group cursor-default">
        <div className="flex-shrink-0 mt-1 group-hover:scale-110 transition-transform [&>svg]:h-5 [&>svg]:w-5 md:[&>svg]:h-6 md:[&>svg]:w-6">{icon}</div>
        <div>
            <h4 className="font-bold text-base md:text-lg mb-1 md:mb-2 group-hover:text-blue-600 transition-colors">{title}</h4>
            <p className="text-muted-foreground leading-relaxed text-sm md:text-base">{description}</p>
        </div>
    </div>;
}