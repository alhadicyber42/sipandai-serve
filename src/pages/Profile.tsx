import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WORK_UNITS } from "@/lib/constants";
import { User, Mail, Phone, IdCard, Building2, Shield } from "lucide-react";

export default function Profile() {
  const { user } = useAuth();
  const workUnit = WORK_UNITS.find((u) => u.id === user?.work_unit_id);

  const getRoleName = (role: string) => {
    switch (role) {
      case "admin_pusat":
        return "Administrator Pusat";
      case "admin_unit":
        return "Administrator Unit";
      case "user_unit":
        return "Pegawai";
      default:
        return role;
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Modern Header with Gradient */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-500 to-indigo-400 p-6 md:p-8 text-white shadow-xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -ml-24 -mb-24"></div>

          <div className="relative z-10">
            <div className="flex items-center gap-3">
              <div className="p-2 md:p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <User className="h-6 w-6 md:h-8 md:w-8" />
              </div>
              <div>
                <h1 className="text-2xl md:text-4xl font-bold">Profil Pengguna</h1>
                <p className="text-sm md:text-base text-white/80 mt-1">
                  Informasi akun dan kepegawaian Anda
                </p>
              </div>
            </div>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Informasi Pribadi</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <User className="h-5 w-5 text-primary" />
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Nama Lengkap</p>
                <p className="font-medium">{user?.name}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <Mail className="h-5 w-5 text-primary" />
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{user?.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <IdCard className="h-5 w-5 text-primary" />
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">NIP</p>
                <p className="font-medium">{user?.nip}</p>
              </div>
            </div>

            {user?.phone && (
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <Phone className="h-5 w-5 text-primary" />
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">No. Telepon</p>
                  <p className="font-medium">{user.phone}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Informasi Kepegawaian</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <Building2 className="h-5 w-5 text-primary" />
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Unit Kerja</p>
                <p className="font-medium">{workUnit?.name || "-"}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <Shield className="h-5 w-5 text-primary" />
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Role</p>
                <p className="font-medium">{user ? getRoleName(user.role) : "-"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
