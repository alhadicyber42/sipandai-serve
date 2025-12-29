import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { LayoutDashboard, FileText, MessageSquare, Users, Settings, LogOut, ChevronDown, Menu, X, Building2, TrendingUp, User, Trophy, Megaphone, CalendarX, Briefcase, Bell, HelpCircle, CalendarDays } from "lucide-react";
import { AIChatbot } from "@/components/AIChatbot";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { NetworkStatus } from "@/components/NetworkStatus";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

export const DashboardLayout = ({
  children
}: {
  children: React.ReactNode;
}) => {
  const {
    user,
    logout
  } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [openMenus, setOpenMenus] = useState<string[]>(["layanan"]);

  const handleLogout = () => {
    logout();
    navigate("/auth");
  };
  const toggleMenu = (menu: string) => {
    setOpenMenus(prev => prev.includes(menu) ? prev.filter(m => m !== menu) : [...prev, menu]);
  };
  const isActive = (path: string) => location.pathname === path;

  // Menu items based on role - grouped by functionality
  const getMenuItems = () => {
    const role = user?.role;
    
    if (role === "user_unit") {
      return [
        {
          path: "/dashboard",
          label: "Dashboard",
          icon: LayoutDashboard
        },
        {
          label: "Layanan Saya",
          icon: FileText,
          id: "layanan",
          submenu: [
            { path: "/layanan/kenaikan-pangkat", label: "Kenaikan Pangkat" },
            { path: "/layanan/mutasi", label: "Mutasi Pegawai" },
            { path: "/layanan/pensiun", label: "Pensiun" },
            { path: "/layanan/cuti", label: "Cuti Pegawai" }
          ]
        },
        {
          label: "Konsultasi",
          icon: MessageSquare,
          id: "konsultasi",
          submenu: [
            { path: "/konsultasi/baru", label: "Buat Konsultasi Baru" },
            { path: "/konsultasi/riwayat", label: "Riwayat Konsultasi" }
          ]
        },
        {
          path: "/employee-of-the-month",
          label: "Employee of The Year",
          icon: Trophy
        },
        {
          path: "/profile",
          label: "Profil",
          icon: User
        }
      ];
    }
    
    if (role === "admin_unit") {
      return [
        {
          path: "/dashboard",
          label: "Dashboard",
          icon: LayoutDashboard
        },
        {
          label: "Usulan Masuk",
          icon: FileText,
          id: "usulan",
          submenu: [
            { path: "/usulan/kenaikan-pangkat", label: "Kenaikan Pangkat" },
            { path: "/usulan/mutasi", label: "Mutasi Pegawai" },
            { path: "/usulan/pensiun", label: "Pensiun" },
            { path: "/usulan/cuti", label: "Cuti Pegawai" }
          ]
        },
        {
          label: "Konsultasi Unit",
          icon: MessageSquare,
          id: "konsultasi",
          submenu: [
            { path: "/konsultasi/masuk", label: "Konsultasi Masuk" },
            { path: "/konsultasi/riwayat-unit", label: "Riwayat Konsultasi" }
          ]
        },
        {
          label: "Kelola Pegawai",
          icon: Users,
          id: "pegawai",
          submenu: [
            { path: "/admin/daftar-pegawai", label: "Daftar Pegawai Unit" },
            { path: "/admin/formasi-jabatan", label: "Formasi Jabatan" },
            { path: "/admin/reminder-pensiun", label: "Reminder Pensiun" }
          ]
        },
        {
          label: "Lainnya",
          icon: Settings,
          id: "lainnya",
          submenu: [
            { path: "/admin/buat-surat", label: "Buat Surat" },
            { path: "/admin/employee-ratings", label: "Employee of The Year" },
            { path: "/pengumuman", label: "Kelola Pengumuman" },
            { path: "/admin/faq", label: "Kelola FAQ" }
          ]
        },
        {
          path: "/profile",
          label: "Profil",
          icon: User
        }
      ];
    }
    
    if (role === "admin_pusat") {
      return [
        {
          path: "/dashboard",
          label: "Dashboard",
          icon: LayoutDashboard
        },
        {
          label: "Semua Usulan",
          icon: FileText,
          id: "usulan",
          submenu: [
            { path: "/usulan/kenaikan-pangkat", label: "Kenaikan Pangkat" },
            { path: "/usulan/mutasi", label: "Mutasi Pegawai" },
            { path: "/usulan/pensiun", label: "Pensiun" },
            { path: "/usulan/cuti", label: "Cuti Pegawai" }
          ]
        },
        {
          label: "Konsultasi",
          icon: MessageSquare,
          id: "konsultasi",
          submenu: [
            { path: "/konsultasi/semua", label: "Konsultasi Masuk" }
          ]
        },
        {
          label: "Kelola Organisasi",
          icon: Building2,
          id: "organisasi",
          submenu: [
            { path: "/admin/kelola-admin", label: "Kelola Admin Unit" },
            { path: "/admin/kelola-unit", label: "Kelola Unit Kerja" }
          ]
        },
        {
          label: "Kelola Pegawai",
          icon: Users,
          id: "pegawai",
          submenu: [
            { path: "/admin/daftar-pegawai", label: "Daftar Pegawai Unit" },
            { path: "/admin/formasi-jabatan", label: "Formasi Jabatan" },
            { path: "/admin/reminder-pensiun", label: "Reminder Pensiun" },
            { path: "/admin/employee-ratings", label: "Employee of The Year" }
          ]
        },
        {
          label: "Pengaturan",
          icon: Settings,
          id: "pengaturan",
          submenu: [
            { path: "/admin/penangguhan-cuti", label: "Penangguhan Cuti" },
            { path: "/admin/kalender-libur", label: "Kalender Hari Libur" },
            { path: "/admin/buat-surat", label: "Buat Surat" },
            { path: "/pengumuman", label: "Kelola Pengumuman" },
            { path: "/admin/faq", label: "Kelola FAQ" }
          ]
        },
        {
          path: "/profile",
          label: "Profil",
          icon: User
        }
      ];
    }
    
    return [];
  };

  const menuItems = getMenuItems();

  return (
    <div className="min-h-screen w-full flex bg-gradient-to-br from-background via-background to-muted/20">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-primary text-primary-foreground border-b border-primary/20 shadow-md glass">
        <div className="flex items-center justify-between p-3 sm:p-4">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 sm:h-6 sm:w-6" />
            <span className="font-bold text-base sm:text-lg">SIPANDAI</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
              className="text-primary-foreground hover:bg-primary-glow/20 touch-target btn-press"
              aria-label={isSidebarOpen ? "Tutup menu" : "Buka menu"}
            >
              {isSidebarOpen ? <X className="h-5 w-5 sm:h-6 sm:w-6" /> : <Menu className="h-5 w-5 sm:h-6 sm:w-6" />}
            </Button>
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <aside 
        className={cn(
          "fixed lg:sticky top-0 left-0 h-screen bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-white z-40 flex flex-col",
          "w-[280px] sm:w-72 lg:w-64 xl:w-72",
          "transition-transform duration-300 ease-out",
          isSidebarOpen 
            ? "translate-x-0 shadow-2xl border-r border-white/10" 
            : "-translate-x-full lg:translate-x-0 lg:shadow-2xl lg:border-r lg:border-white/10"
        )}
      >
        {/* Logo */}
        <div className="p-4 sm:p-5 lg:p-6 border-b border-white/10 hidden lg:block relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl -mr-16 -mt-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-500/20 rounded-full blur-2xl -ml-12 -mb-12"></div>
          <div className="relative z-10 flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-lg shadow-lg">
              <Building2 className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg sm:text-xl tracking-tight text-white">SIPANDAI</h1>
              <p className="text-[10px] sm:text-xs text-white/70 leading-tight">Sistem Pelayanan Administrasi<br />Digital ASN Terintegrasi</p>
            </div>
          </div>
        </div>

        {/* User Info */}
        <div className="p-3 sm:p-4 border-b border-white/10 bg-black/20 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10 sm:w-11 sm:h-11 border-2 border-white/20 shadow-md flex-shrink-0">
              <AvatarImage src={user?.avatar_url || undefined} alt={user?.name} />
              <AvatarFallback className="bg-gradient-to-br from-indigo-400 to-blue-500 text-white text-sm font-bold">
                {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || <User className="h-5 w-5" />}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate text-white">{user?.name}</p>
              <p className="text-xs text-white/60 truncate">
                {user?.role === "admin_pusat" ? "Administrator Pusat" : user?.role === "admin_unit" ? "Admin Unit" : "Pegawai"}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-1 scrollbar-thin">
          {menuItems.map(item => item.submenu ? (
            <Collapsible 
              key={item.id} 
              open={openMenus.includes(item.id || "")} 
              onOpenChange={() => toggleMenu(item.id || "")}
            >
              <CollapsibleTrigger className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-white/5 transition-all duration-200 group touch-target">
                <div className="flex items-center gap-3">
                  <item.icon className="h-5 w-5 text-white/70 group-hover:text-white transition-colors flex-shrink-0" />
                  <span className="text-sm font-medium text-white/80 group-hover:text-white transition-colors">{item.label}</span>
                </div>
                <ChevronDown className={cn(
                  "h-4 w-4 text-white/50 transition-transform duration-200 flex-shrink-0", 
                  openMenus.includes(item.id || "") && "rotate-180 text-white"
                )} />
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-1 ml-4 space-y-1 border-l border-white/10 pl-3 animate-accordion-down">
                {item.submenu.map(subitem => (
                  <Link 
                    key={subitem.path} 
                    to={subitem.path} 
                    onClick={() => setIsSidebarOpen(false)} 
                    className={cn(
                      "block px-3 py-2.5 rounded-lg text-sm transition-all duration-200 touch-target",
                      isActive(subitem.path) 
                        ? "bg-indigo-600/20 text-white font-medium border-l-2 border-indigo-400" 
                        : "text-white/60 hover:text-white hover:bg-white/5"
                    )}
                  >
                    {subitem.label}
                  </Link>
                ))}
              </CollapsibleContent>
            </Collapsible>
          ) : (
            <Link 
              key={item.path} 
              to={item.path} 
              onClick={() => setIsSidebarOpen(false)} 
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 touch-target",
                isActive(item.path) 
                  ? "bg-gradient-to-r from-indigo-600/80 to-blue-600/80 text-white font-medium shadow-md" 
                  : "text-white/70 hover:text-white hover:bg-white/5"
              )}
            >
              <item.icon className={cn(
                "h-5 w-5 flex-shrink-0", 
                isActive(item.path) ? "text-white" : "text-white/70 group-hover:text-white"
              )} />
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Theme Toggle & Logout */}
        <div className="p-3 sm:p-4 border-t border-white/10 space-y-2">
          <div className="hidden lg:block">
            <ThemeToggle />
          </div>
          <Button 
            onClick={handleLogout} 
            variant="ghost" 
            className="w-full justify-start gap-3 bg-red-500/10 hover:bg-red-500/20 text-red-300 hover:text-red-200 transition-colors h-11 px-3 btn-press"
          >
            <LogOut className="h-5 w-5 flex-shrink-0" />
            <span className="text-sm">Keluar</span>
          </Button>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-30 lg:hidden animate-fade-in" 
          onClick={() => setIsSidebarOpen(false)} 
          aria-hidden="true"
        />
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pt-14 sm:pt-16 lg:pt-0 min-w-0">
        <div className="p-4 sm:p-6 lg:p-8 animate-fade-in">
          {children}
        </div>
      </main>

      <NetworkStatus />
      <AIChatbot />
    </div>
  );
};