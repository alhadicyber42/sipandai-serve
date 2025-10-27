import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { User, Mail, Building2, Shield, Save, Key } from "lucide-react";
import { WORK_UNITS } from "@/lib/constants";

const ROLE_LABELS = {
  user_unit: "Pegawai Unit",
  admin_unit: "Admin Unit",
  admin_pusat: "Admin Pusat",
};

export default function Profile() {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || "",
    nip: user?.nip || "",
    phone: user?.phone || "",
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const workUnit = WORK_UNITS.find((u) => u.id === user?.work_unit_id);

  const handleSaveProfile = async () => {
    setIsSaving(true);

    const { error } = await supabase
      .from("profiles")
      .update({
        name: formData.name,
        nip: formData.nip,
        phone: formData.phone,
      })
      .eq("id", user!.id);

    if (error) {
      toast.error("Gagal menyimpan profil");
      console.error(error);
    } else {
      toast.success("Profil berhasil diperbarui");
      setIsEditing(false);
    }

    setIsSaving(false);
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("Password baru tidak cocok");
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error("Password minimal 6 karakter");
      return;
    }

    setIsSaving(true);

    const { error } = await supabase.auth.updateUser({
      password: passwordData.newPassword,
    });

    if (error) {
      toast.error("Gagal mengubah password");
      console.error(error);
    } else {
      toast.success("Password berhasil diubah");
      setIsChangingPassword(false);
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    }

    setIsSaving(false);
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Profil Saya</h1>
          <p className="text-muted-foreground mt-1">Kelola informasi profil dan keamanan akun Anda</p>
        </div>

        {/* Profile Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Informasi Profil
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-6">
              <Avatar className="h-24 w-24">
                <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email}`} />
                <AvatarFallback className="text-2xl">{user?.name?.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="text-xl font-semibold">{user?.name}</h3>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Shield className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">{ROLE_LABELS[user?.role as keyof typeof ROLE_LABELS]}</span>
                </div>
              </div>
            </div>

            <Separator />

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nama Lengkap</Label>
                {isEditing ? (
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                ) : (
                  <p className="text-sm py-2">{user?.name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="nip">NIP</Label>
                {isEditing ? (
                  <Input
                    id="nip"
                    value={formData.nip}
                    onChange={(e) => setFormData({ ...formData, nip: e.target.value })}
                  />
                ) : (
                  <p className="text-sm py-2">{user?.nip || "-"}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>
                  <Mail className="inline h-4 w-4 mr-1" />
                  Email
                </Label>
                <p className="text-sm py-2">{user?.email}</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Nomor Telepon</Label>
                {isEditing ? (
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                ) : (
                  <p className="text-sm py-2">{user?.phone || "-"}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>
                  <Building2 className="inline h-4 w-4 mr-1" />
                  Unit Kerja
                </Label>
                <p className="text-sm py-2">{workUnit?.name || "-"}</p>
              </div>

              <div className="space-y-2">
                <Label>Tanggal Bergabung</Label>
                <p className="text-sm py-2">
                  {user?.created_at ? new Date(user.created_at).toLocaleDateString("id-ID") : "-"}
                </p>
              </div>
            </div>

            <div className="flex gap-2 pt-4 border-t">
              {isEditing ? (
                <>
                  <Button onClick={handleSaveProfile} disabled={isSaving}>
                    <Save className="mr-2 h-4 w-4" />
                    {isSaving ? "Menyimpan..." : "Simpan Perubahan"}
                  </Button>
                  <Button variant="outline" onClick={() => setIsEditing(false)} disabled={isSaving}>
                    Batal
                  </Button>
                </>
              ) : (
                <Button onClick={() => setIsEditing(true)}>Edit Profil</Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Security Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Keamanan Akun
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!isChangingPassword ? (
              <div>
                <p className="text-sm text-muted-foreground mb-4">
                  Ubah password Anda secara berkala untuk menjaga keamanan akun
                </p>
                <Button variant="outline" onClick={() => setIsChangingPassword(true)}>
                  Ubah Password
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">Password Baru</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    placeholder="Minimal 6 karakter"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Konfirmasi Password Baru</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    placeholder="Ketik ulang password baru"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <Button onClick={handleChangePassword} disabled={isSaving}>
                    {isSaving ? "Menyimpan..." : "Simpan Password"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsChangingPassword(false);
                      setPasswordData({
                        currentPassword: "",
                        newPassword: "",
                        confirmPassword: "",
                      });
                    }}
                    disabled={isSaving}
                  >
                    Batal
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}