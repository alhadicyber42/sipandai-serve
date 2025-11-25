import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { LayoutDashboard, FileText, MessageSquare, Users, Settings, LogOut, ChevronDown, Menu, X, Building2, TrendingUp, User, Trophy, Megaphone, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { InstallPrompt } from "@/components/InstallPrompt";
import { NetworkStatus } from "@/components/NetworkStatus";
import { ThemeToggle } from "@/components/ThemeToggle";

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
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isStandalone, setIsStandalone] = useState(() => {
    // Check if app is already installed
    const standalone = window.matchMedia('(display-mode: standalone)').matches 
      || (window.navigator as any).standalone 
      || document.referrer.includes('android-app://');
    return standalone;
  });

  const handleLogout = () => {
    logout();
    navigate("/auth");
  };
  const toggleMenu = (menu: string) => {
    setOpenMenus(prev => prev.includes(menu) ? prev.filter(m => m !== menu) : [...prev, menu]);
  };
  const isActive = (path: string) => location.pathname === path;

  const handleManualInstall = () => {
    // Clear localStorage to force showing prompt
    localStorage.removeItem('sipandai-install-dismissed');
    setShowInstallPrompt(true);
  };

  // Menu items based on role
  const getMenuItems = () => {
    const role = user?.role;
    if (role === "user_unit") {
      return [{
        path: "/dashboard",
        label: "Dashboard",
        icon: LayoutDashboard
      }, {
        label: "Layanan Saya",
        icon: FileText,
        id: "layanan",
        submenu: [{
          path: "/layanan/kenaikan-pangkat",
          label: "Kenaikan Pangkat"
        }, {
          path: "/layanan/mutasi",
          label: "Mutasi Pegawai"
        }, {
          path: "/layanan/pensiun",
          label: "Pensiun"
        }, {
          path: "/layanan/cuti",
          label: "Cuti Pegawai"
        }]
      }, {
        label: "Konsultasi",
        icon: MessageSquare,
        id: "konsultasi",
        submenu: [{
          path: "/konsultasi/baru",
          label: "Buat Konsultasi Baru"
        }, {
          path: "/konsultasi/riwayat",
          label: "Riwayat Konsultasi"
        }]
      }, {
        path: "/employee-of-the-month",
        label: "Employee of The Month",
        icon: Trophy
      }, {
        path: "/profile",
        label: "Profil",
        icon: User
      }];
    }
    if (role === "admin_unit") {
      return [{
        path: "/dashboard",
        label: "Dashboard",
        icon: LayoutDashboard
      }, {
        label: "Usulan Masuk",
        icon: FileText,
        id: "usulan",
        submenu: [{
          path: "/usulan/kenaikan-pangkat",
          label: "Kenaikan Pangkat"
        }, {
          path: "/usulan/mutasi",
          label: "Mutasi Pegawai"
        }, {
          path: "/usulan/pensiun",
          label: "Pensiun"
        }, {
          path: "/usulan/cuti",
          label: "Cuti Pegawai"
        }]
      }, {
        label: "Konsultasi Unit",
        icon: MessageSquare,
        id: "konsultasi",
        submenu: [{
          path: "/konsultasi/masuk",
          label: "Konsultasi Masuk"
        }, {
          path: "/konsultasi/riwayat-unit",
          label: "Riwayat Konsultasi"
        }]
      }, {
        path: "/admin/daftar-pegawai",
        label: "Daftar Pegawai Unit",
        icon: Users
      }, {
        path: "/admin/employee-ratings",
        label: "Penilaian Employee of The Month",
        icon: Trophy
      }, {
        path: "/pengumuman",
        label: "Kelola Pengumuman",
        icon: Megaphone
      }, {
        path: "/profile",
        label: "Profil",
        icon: User
      }];
    }
    if (role === "admin_pusat") {
      return [{
        path: "/dashboard",
        label: "Dashboard",
        icon: LayoutDashboard
      }, {
        label: "Semua Usulan",
        icon: FileText,
        id: "usulan",
        submenu: [{
          path: "/usulan/kenaikan-pangkat",
          label: "Kenaikan Pangkat"
        }, {
          path: "/usulan/mutasi",
          label: "Mutasi Pegawai"
        }, {
          path: "/usulan/pensiun",
          label: "Pensiun"
        }, {
          path: "/usulan/cuti",
          label: "Cuti Pegawai"
        }]
      }, {
        label: "Konsultasi",
        icon: MessageSquare,
        id: "konsultasi",
        submenu: [{
          path: "/konsultasi/tereskalasi",
          label: "Konsultasi Tereskalasi"
        }]
      }, {
        path: "/admin/kelola-admin",
        label: "Kelola Admin Unit",
        icon: Users
      }, {
        path: "/admin/kelola-unit",
        label: "Kelola Unit Kerja",
        icon: Building2
      }, {
        path: "/admin/daftar-pegawai",
        label: "Daftar Pegawai Unit",
        icon: Users
      }, {
        path: "/admin/employee-ratings",
        label: "Penilaian Employee of The Month",
        icon: Trophy
      }, {
        path: "/pengumuman",
        label: "Kelola Pengumuman",
        icon: Megaphone
      }, {
        path: "/profile",
        label: "Profil",
        icon: User
      }];
    }
    return [];
  };
  const menuItems = getMenuItems();
  return <div className="min-h-screen w-full flex bg-gradient-to-br from-background via-background to-muted/20">
    {/* PWA Install Prompt - Manual Trigger */}
    {showInstallPrompt && (
      <InstallPrompt 
        isManual={true} 
        onClose={() => setShowInstallPrompt(false)} 
      />
    )}

    {/* Auto Install Prompt */}
    <InstallPrompt />

    {/* Mobile Header */}
    <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-primary text-primary-foreground border-b border-primary/20 shadow-md">
      <div className="flex items-center justify-between p-3 md:p-4">
        <div className="flex items-center gap-1.5 md:gap-2">
          <Building2 className="h-5 w-5 md:h-6 md:w-6" />
          <span className="font-bold text-base md:text-lg">SIPANDAI</span>
        </div>
        <div className="flex items-center gap-1 md:gap-2">
          <ThemeToggle />
          <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="text-primary-foreground hover:bg-primary-glow/20 h-8 w-8 md:h-10 md:w-10">
            {isSidebarOpen ? <X className="h-5 w-5 md:h-6 md:w-6" /> : <Menu className="h-5 w-5 md:h-6 md:w-6" />}
          </Button>
        </div>
      </div>
    </div>

    {/* Sidebar */}
    <aside className={cn("fixed lg:sticky top-0 left-0 h-screen bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-white transition-all duration-300 z-40 flex flex-col w-64 md:w-72 lg:w-64", isSidebarOpen ? "translate-x-0 shadow-2xl border-r border-white/10" : "-translate-x-full lg:translate-x-0 lg:shadow-2xl lg:border-r lg:border-white/10")}>
      {/* Logo */}
      <div className="p-4 md:p-5 lg:p-6 border-b border-white/10 hidden lg:block relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl -mr-16 -mt-16"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-500/20 rounded-full blur-2xl -ml-12 -mb-12"></div>
        <div className="relative z-10 flex items-center gap-2 md:gap-3">
          <div className="p-1.5 md:p-2 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-lg shadow-lg">
            <Building2 className="h-5 w-5 md:h-6 md:w-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg md:text-xl tracking-tight text-white">SIPANDAI</h1>
            <p className="text-[9px] md:text-[10px] text-white/70 leading-tight">Sistem Pelayanan Administrasi<br />Digital ASN Terintegrasi</p>
          </div>
        </div>
      </div>

      {/* User Info */}
      <div className="p-3 md:p-4 border-b border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="flex items-center gap-2 md:gap-3">
          <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-indigo-400 to-blue-500 flex items-center justify-center border-2 border-white/10 shadow-md flex-shrink-0">
            <User className="h-4 w-4 md:h-5 md:w-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-xs md:text-sm truncate text-white">{user?.name}</p>
            <p className="text-[10px] md:text-xs text-white/60 truncate">
              {user?.role === "admin_pusat" ? "Administrator Pusat" : user?.role === "admin_unit" ? "Admin Unit" : "Pegawai"}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3 md:p-4 space-y-1">
        {menuItems.map(item => item.submenu ? <Collapsible key={item.id} open={openMenus.includes(item.id || "")} onOpenChange={() => toggleMenu(item.id || "")}>
          <CollapsibleTrigger className="w-full flex items-center justify-between px-2.5 md:px-3 py-1.5 md:py-2 rounded-lg hover:bg-white/5 transition-all duration-200 group">
            <div className="flex items-center gap-2 md:gap-3">
              <item.icon className="h-4 w-4 md:h-5 md:w-5 text-white/70 group-hover:text-white transition-colors flex-shrink-0" />
              <span className="text-xs md:text-sm font-medium text-white/80 group-hover:text-white transition-colors">{item.label}</span>
            </div>
            <ChevronDown className={cn("h-3.5 w-3.5 md:h-4 md:w-4 text-white/50 transition-transform duration-200 flex-shrink-0", openMenus.includes(item.id || "") && "rotate-180 text-white")} />
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-1 ml-3 md:ml-4 space-y-1 border-l border-white/10 pl-2 md:pl-3">
            {item.submenu.map(subitem => <Link key={subitem.path} to={subitem.path} onClick={() => setIsSidebarOpen(false)} className={cn("block px-2.5 md:px-3 py-1.5 md:py-2 rounded-lg text-xs md:text-sm transition-all duration-200", isActive(subitem.path) ? "bg-indigo-600/20 text-white font-medium border-l-2 border-indigo-400" : "text-white/60 hover:text-white hover:bg-white/5")}>
              {subitem.label}
            </Link>)}
          </CollapsibleContent>
        </Collapsible> : <Link key={item.path} to={item.path} onClick={() => setIsSidebarOpen(false)} className={cn("flex items-center gap-2 md:gap-3 px-2.5 md:px-3 py-1.5 md:py-2 rounded-lg transition-all duration-200", isActive(item.path) ? "bg-gradient-to-r from-indigo-600/80 to-blue-600/80 text-white font-medium shadow-md" : "text-white/70 hover:text-white hover:bg-white/5")}>
          <item.icon className={cn("h-4 w-4 md:h-5 md:w-5 flex-shrink-0", isActive(item.path) ? "text-white" : "text-white/70 group-hover:text-white")} />
          <span className="text-xs md:text-sm font-medium">{item.label}</span>
        </Link>)}

        {/* Install PWA Button - Only show if not already installed */}
        {!isStandalone && (
          <div className="mt-4 pt-3 border-t border-white/10">
            <Button 
              onClick={handleManualInstall} 
              variant="ghost" 
              className="w-full justify-start gap-2 md:gap-3 bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 hover:text-blue-200 transition-colors px-2.5 md:px-3 py-1.5 md:py-2 rounded-lg"
            >
              <Download className="h-4 w-4 md:h-5 md:w-5 flex-shrink-0" />
              <span className="text-xs md:text-sm font-medium">Install Aplikasi</span>
            </Button>
          </div>
        )}
      </nav>

      {/* Theme Toggle & Logout */}
      <div className="p-3 md:p-4 border-t border-white/10 space-y-2">
        
        <div className="hidden lg:block">
          <ThemeToggle />
        </div>
        <Button onClick={handleLogout} variant="ghost" className="w-full justify-start gap-2 md:gap-3 bg-red-500/10 hover:bg-red-500/20 text-red-300 hover:text-red-200 transition-colors h-9 md:h-10 px-2.5 md:px-3">
          <LogOut className="h-4 w-4 md:h-5 md:w-5 flex-shrink-0" />
          <span className="text-xs md:text-sm">Keluar</span>
        </Button>
      </div>
    </aside>

    {/* Mobile Overlay */}
    {isSidebarOpen && <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-30 lg:hidden" onClick={() => setIsSidebarOpen(false)} />}

    {/* Main Content */}
    <main className="flex-1 overflow-y-auto pt-14 md:pt-16 lg:pt-0">
      <div className="p-3 md:p-4 lg:p-6 xl:p-8">{children}</div>
    </main>

    <InstallPrompt />
    <NetworkStatus />
  </div>;
};