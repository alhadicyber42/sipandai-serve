import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { lazy, Suspense } from "react";
import { DashboardSkeleton, ProfileSkeleton, ServiceListSkeleton } from "./components/skeletons";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { Building2 } from "lucide-react";

import ReloadPrompt from "./components/ReloadPrompt";
import { PWAInstallPrompt } from "./components/PWAInstallPrompt";

// Lazy load all pages for code splitting
const LandingPage = lazy(() => import("./pages/LandingPage"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const Auth = lazy(() => import("./pages/Auth"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const KenaikanPangkat = lazy(() => import("./pages/services/KenaikanPangkat"));
const Mutasi = lazy(() => import("./pages/services/Mutasi"));
const Cuti = lazy(() => import("./pages/services/Cuti"));
const Pensiun = lazy(() => import("./pages/services/Pensiun"));
const Profile = lazy(() => import("./pages/Profile"));
const KelolaAdminUnit = lazy(() => import("./pages/admin/KelolaAdminUnit"));
const KelolaUnitKerja = lazy(() => import("./pages/admin/KelolaUnitKerja"));
const DaftarPegawaiUnit = lazy(() => import("./pages/admin/DaftarPegawaiUnit"));
const UsulanDisetujui = lazy(() => import("./pages/admin/UsulanDisetujui"));
const AllConsultations = lazy(() => import("./pages/consultations/AllConsultations"));
const MyConsultations = lazy(() => import("./pages/consultations/MyConsultations"));
const NewConsultation = lazy(() => import("./pages/consultations/NewConsultation"));
const UnitConsultations = lazy(() => import("./pages/consultations/UnitConsultations"));
const UnitConsultationHistory = lazy(() => import("./pages/consultations/UnitConsultationHistory"));
const ConsultationDetail = lazy(() => import("./pages/consultations/ConsultationDetail"));
const EmployeeOfTheMonth = lazy(() => import("./pages/EmployeeOfTheMonth"));
const EmployeeRating = lazy(() => import("./pages/EmployeeRating"));
const AdminEmployeeRatings = lazy(() => import("./pages/admin/EmployeeRatings"));
const EmployeeProfile = lazy(() => import("./pages/admin/EmployeeProfile"));
const Pengumuman = lazy(() => import("./pages/admin/Pengumuman"));
const LeaveDeferralManagement = lazy(() => import("./pages/admin/LeaveDeferralManagement"));
const JobFormationManagement = lazy(() => import("./pages/admin/JobFormationManagement"));
const RetirementReminders = lazy(() => import("./pages/admin/RetirementReminders"));
const TemplateManagement = lazy(() => import("./pages/admin/TemplateManagement"));
const LetterGenerator = lazy(() => import("./pages/admin/LetterGenerator"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes (garbage collection time)
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background via-background to-muted/20">
        <div className="relative">
          <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
          <div className="relative p-4 bg-background/80 backdrop-blur-sm rounded-2xl shadow-lg border border-primary/10">
            <Building2 className="h-10 w-10 text-primary animate-pulse" />
          </div>
        </div>
        <div className="mt-6 flex flex-col items-center gap-2">
          <h2 className="font-bold text-lg tracking-tight">SIPANDAI</h2>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
            <div className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
            <div className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
};

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <ReloadPrompt />
            <PWAInstallPrompt />
            <BrowserRouter>
              <Suspense fallback={<DashboardSkeleton />}>
                <Routes>
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/privacy" element={<PrivacyPolicy />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                  <Route path="/layanan/kenaikan-pangkat" element={<ProtectedRoute><KenaikanPangkat /></ProtectedRoute>} />
                  <Route path="/layanan/mutasi" element={<ProtectedRoute><Mutasi /></ProtectedRoute>} />
                  <Route path="/layanan/pensiun" element={<ProtectedRoute><Pensiun /></ProtectedRoute>} />
                  <Route path="/layanan/cuti" element={<ProtectedRoute><Cuti /></ProtectedRoute>} />
                  <Route path="/usulan/kenaikan-pangkat" element={<ProtectedRoute><KenaikanPangkat /></ProtectedRoute>} />
                  <Route path="/usulan/mutasi" element={<ProtectedRoute><Mutasi /></ProtectedRoute>} />
                  <Route path="/usulan/pensiun" element={<ProtectedRoute><Pensiun /></ProtectedRoute>} />
                  <Route path="/usulan/cuti" element={<ProtectedRoute><Cuti /></ProtectedRoute>} />
                  <Route path="/admin/kelola-admin" element={<ProtectedRoute><KelolaAdminUnit /></ProtectedRoute>} />
                  <Route path="/admin/kelola-unit" element={<ProtectedRoute><KelolaUnitKerja /></ProtectedRoute>} />
                  <Route path="/admin/daftar-pegawai" element={<ProtectedRoute><DaftarPegawaiUnit /></ProtectedRoute>} />
                  <Route path="/admin/formasi-jabatan" element={<ProtectedRoute><JobFormationManagement /></ProtectedRoute>} />
                  <Route path="/admin/reminder-pensiun" element={<ProtectedRoute><RetirementReminders /></ProtectedRoute>} />
                  <Route path="/usulan/disetujui" element={<ProtectedRoute><UsulanDisetujui /></ProtectedRoute>} />
                  <Route path="/pengumuman" element={<ProtectedRoute><Pengumuman /></ProtectedRoute>} />
                  <Route path="/konsultasi/baru" element={<ProtectedRoute><NewConsultation /></ProtectedRoute>} />
                  <Route path="/konsultasi/riwayat" element={<ProtectedRoute><MyConsultations /></ProtectedRoute>} />
                  <Route path="/konsultasi/riwayat-unit" element={<ProtectedRoute><UnitConsultationHistory /></ProtectedRoute>} />
                  <Route path="/konsultasi/tereskalasi" element={<ProtectedRoute><AllConsultations /></ProtectedRoute>} />
                  <Route path="/konsultasi/semua" element={<ProtectedRoute><AllConsultations /></ProtectedRoute>} />
                  <Route path="/konsultasi/masuk" element={<ProtectedRoute><UnitConsultations /></ProtectedRoute>} />
                  <Route path="/konsultasi/:id" element={<ProtectedRoute><ConsultationDetail /></ProtectedRoute>} />
                  <Route path="/employee-of-the-month" element={<ProtectedRoute><EmployeeOfTheMonth /></ProtectedRoute>} />
                  <Route path="/employee-of-the-month/rate/:employeeId" element={<ProtectedRoute><EmployeeRating /></ProtectedRoute>} />
                  <Route path="/admin/employee-ratings" element={<ProtectedRoute><AdminEmployeeRatings /></ProtectedRoute>} />
                  <Route path="/admin/employee/:employeeId" element={<ProtectedRoute><EmployeeProfile /></ProtectedRoute>} />
                  <Route path="/admin/penangguhan-cuti" element={<ProtectedRoute><LeaveDeferralManagement /></ProtectedRoute>} />
                  <Route path="/admin/buat-surat" element={<ProtectedRoute><LetterGenerator /></ProtectedRoute>} />
                  <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
