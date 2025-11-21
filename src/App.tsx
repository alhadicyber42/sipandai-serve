import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import KenaikanPangkat from "./pages/services/KenaikanPangkat";
import Mutasi from "./pages/services/Mutasi";
import Cuti from "./pages/services/Cuti";
import Pensiun from "./pages/services/Pensiun";
import Profile from "./pages/Profile";
import KelolaAdminUnit from "./pages/admin/KelolaAdminUnit";
import KelolaUnitKerja from "./pages/admin/KelolaUnitKerja";
import DaftarPegawaiUnit from "./pages/admin/DaftarPegawaiUnit";
import UsulanDisetujui from "./pages/admin/UsulanDisetujui";
import AllConsultations from "./pages/consultations/AllConsultations";
import MyConsultations from "./pages/consultations/MyConsultations";
import NewConsultation from "./pages/consultations/NewConsultation";
import UnitConsultations from "./pages/consultations/UnitConsultations";
import UnitConsultationHistory from "./pages/consultations/UnitConsultationHistory";
import ConsultationDetail from "./pages/consultations/ConsultationDetail";
import EmployeeOfTheMonth from "./pages/EmployeeOfTheMonth";
import EmployeeRating from "./pages/EmployeeRating";
import AdminEmployeeRatings from "./pages/admin/EmployeeRatings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

import LandingPage from "./pages/LandingPage";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Memuat...</p>
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
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<LandingPage />} />
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
              <Route path="/usulan/disetujui" element={<ProtectedRoute><UsulanDisetujui /></ProtectedRoute>} />
              <Route path="/konsultasi/baru" element={<ProtectedRoute><NewConsultation /></ProtectedRoute>} />
              <Route path="/konsultasi/riwayat" element={<ProtectedRoute><MyConsultations /></ProtectedRoute>} />
              <Route path="/konsultasi/riwayat-unit" element={<ProtectedRoute><UnitConsultationHistory /></ProtectedRoute>} />
              <Route path="/konsultasi/semua" element={<ProtectedRoute><AllConsultations /></ProtectedRoute>} />
              <Route path="/konsultasi/masuk" element={<ProtectedRoute><UnitConsultations /></ProtectedRoute>} />
              <Route path="/konsultasi/:id" element={<ProtectedRoute><ConsultationDetail /></ProtectedRoute>} />
              <Route path="/employee-of-the-month" element={<ProtectedRoute><EmployeeOfTheMonth /></ProtectedRoute>} />
              <Route path="/employee-of-the-month/rate/:employeeId" element={<ProtectedRoute><EmployeeRating /></ProtectedRoute>} />
              <Route path="/admin/employee-ratings" element={<ProtectedRoute><AdminEmployeeRatings /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
