import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { User, Mail, Phone, IdCard, Building2, Shield, Briefcase, Calendar, ArrowLeft, FileText, MapPin, Award, History, GitCompare } from "lucide-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { ProfileSkeleton } from "@/components/skeletons";
import { REQUIRED_DOCUMENTS } from "@/lib/constants";

interface EmployeeProfile {
  id: string;
  name: string;
  nip: string;
  email?: string | null;
  phone: string | null;
  work_unit_id: number | null;
  work_unit_name: string;
  role: string;
  avatar_url: string | null;
  jabatan: string | null;
  pangkat_golongan: string | null;
  alamat: string | null;
  tempat_lahir: string | null;
  tanggal_lahir: string | null;
  jenis_kelamin: string | null;
  agama: string | null;
  status_perkawinan: string | null;
  pendidikan_terakhir: string | null;
  tmt_pns: string | null;
  tmt_pensiun: string | null;
  masa_kerja_tahun: number | null;
  masa_kerja_bulan: number | null;
  nomor_hp: string | null;
  nomor_wa: string | null;
  email_alternatif: string | null;
  alamat_lengkap: string | null;
  riwayat_jabatan: any[] | null;
  riwayat_mutasi: any[] | null;
  documents: Record<string, any> | null;
  created_at?: string;
  updated_at?: string;
}

export default function EmployeeProfile() {
  const { employeeId } = useParams<{ employeeId: string }>();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState<EmployeeProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("profile");
  const [isOwnProfile, setIsOwnProfile] = useState(false);

  useEffect(() => {
    if (employeeId) {
      loadEmployeeData();
    }
  }, [employeeId]);

  const loadEmployeeData = async () => {
    setIsLoading(true);
    try {
      console.log("Loading employee data for:", employeeId);
      
      const { data, error } = await supabase
        .from("profiles")
        .select(`
          *,
          work_units (
            name
          )
        `)
        .eq("id", employeeId)
        .single();

      console.log("Profile data:", data);
      console.log("Profile error:", error);

      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }

      if (!data) {
        throw new Error("Data pegawai tidak ditemukan");
      }

      // Get role from user_roles
      const { data: roleData, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", data.id)
        .maybeSingle();

      console.log("Role data:", roleData, "Role error:", roleError);

      // Get user metadata
      // Since we can't access other users' auth metadata directly without RPC,
      // we'll try to get it from the current user if viewing own profile
      let userMetadata: any = {};
      let userEmail = "-";
      
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        
        // If viewing own profile, use metadata from auth
        if (currentUser?.id === data.id) {
          setIsOwnProfile(true);
          userMetadata = currentUser.user_metadata || {};
          userEmail = currentUser.email || "-";
          console.log("Using own user metadata:", userMetadata);
        } else {
          setIsOwnProfile(false);
          // For other users' profiles viewed by admins:
          // We need to check if metadata is stored in profiles table columns
          // or create a workaround
          console.log("Viewing another user's profile - metadata may be limited");
          
          // Try to construct email from profile data or use a placeholder
          userEmail = (data as any).email || "-";
          
          // Check if there are any metadata fields in the profiles table itself
          // that were synced during registration or profile updates
          userMetadata = {
            jabatan: (data as any).jabatan,
            pangkat_golongan: (data as any).pangkat_golongan,
            tmt_pns: (data as any).tmt_pns,
            tmt_pensiun: (data as any).tmt_pensiun,
            riwayat_jabatan: (data as any).riwayat_jabatan,
            riwayat_mutasi: (data as any).riwayat_mutasi,
            documents: (data as any).documents,
            avatar_url: (data as any).avatar_url,
            tempat_lahir: (data as any).tempat_lahir,
            tanggal_lahir: (data as any).tanggal_lahir,
            jenis_kelamin: (data as any).jenis_kelamin,
            agama: (data as any).agama,
            status_perkawinan: (data as any).status_perkawinan,
            pendidikan_terakhir: (data as any).pendidikan_terakhir,
            masa_kerja_tahun: (data as any).masa_kerja_tahun,
            masa_kerja_bulan: (data as any).masa_kerja_bulan,
            nomor_hp: (data as any).nomor_hp,
            nomor_wa: (data as any).nomor_wa,
            email_alternatif: (data as any).email_alternatif,
            alamat_lengkap: (data as any).alamat_lengkap,
            alamat: (data as any).alamat,
          };
        }
      } catch (e) {
        console.log("Could not access user data:", e);
      }

      const employeeProfile: EmployeeProfile = {
        id: data.id,
        name: data.name || "-",
        nip: data.nip || "-",
        email: userEmail,
        phone: data.phone || userMetadata.phone || null,
        work_unit_id: data.work_unit_id || null,
        work_unit_name: (data.work_units as any)?.name || "-",
        role: roleData?.role || (data as any).role || "user_unit",
        avatar_url: userMetadata.avatar_url || data.avatar_url || null,
        jabatan: userMetadata.jabatan || data.jabatan || null,
        pangkat_golongan: userMetadata.pangkat_golongan || data.pangkat_golongan || null,
        alamat: userMetadata.alamat || data.alamat || null,
        tempat_lahir: userMetadata.tempat_lahir || data.tempat_lahir || null,
        tanggal_lahir: userMetadata.tanggal_lahir || data.tanggal_lahir || null,
        jenis_kelamin: userMetadata.jenis_kelamin || data.jenis_kelamin || null,
        agama: userMetadata.agama || data.agama || null,
        status_perkawinan: userMetadata.status_perkawinan || data.status_perkawinan || null,
        pendidikan_terakhir: userMetadata.pendidikan_terakhir || data.pendidikan_terakhir || null,
        tmt_pns: userMetadata.tmt_pns || data.tmt_pns || null,
        tmt_pensiun: userMetadata.tmt_pensiun || data.tmt_pensiun || null,
        masa_kerja_tahun: userMetadata.masa_kerja_tahun || data.masa_kerja_tahun || null,
        masa_kerja_bulan: userMetadata.masa_kerja_bulan || data.masa_kerja_bulan || null,
        nomor_hp: userMetadata.nomor_hp || data.nomor_hp || null,
        nomor_wa: userMetadata.nomor_wa || data.nomor_wa || null,
        email_alternatif: userMetadata.email_alternatif || data.email_alternatif || null,
        alamat_lengkap: userMetadata.alamat_lengkap || data.alamat_lengkap || null,
        riwayat_jabatan: userMetadata.riwayat_jabatan || data.riwayat_jabatan || null,
        riwayat_mutasi: userMetadata.riwayat_mutasi || data.riwayat_mutasi || null,
        documents: userMetadata.documents || data.documents || null,
        created_at: data.created_at,
        updated_at: data.updated_at,
      };

      console.log("Setting employee profile:", employeeProfile);
      setEmployee(employeeProfile);
    } catch (error: any) {
      console.error("Error loading employee:", error);
      toast.error(`Gagal memuat data pegawai: ${error.message || "Unknown error"}`);
      navigate(-1);
    } finally {
      setIsLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleName = (role: string) => {
    const roleNames: Record<string, string> = {
      user_unit: "User Unit",
      admin_unit: "Admin Unit",
      admin_pusat: "Admin Pusat",
    };
    return roleNames[role] || role;
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "admin_pusat":
        return "default";
      case "admin_unit":
        return "secondary";
      default:
        return "outline";
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <ProfileSkeleton />
      </DashboardLayout>
    );
  }

  if (!employee) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Data pegawai tidak ditemukan</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-4 md:space-y-6 pb-10">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali
        </Button>

        {/* Header */}
        <div className="relative overflow-hidden rounded-xl md:rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-500 to-indigo-400 p-4 md:p-6 lg:p-8 text-white shadow-xl">
          <div className="absolute top-0 right-0 w-32 h-32 md:w-64 md:h-64 bg-white/10 rounded-full blur-3xl -mr-16 md:-mr-32 -mt-16 md:-mt-32"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 md:w-48 md:h-48 bg-white/10 rounded-full blur-3xl -ml-12 md:-ml-24 -mb-12 md:-mb-24"></div>

          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-6">
            <div className="flex items-center gap-3 md:gap-4">
              <Avatar className="h-16 w-16 md:h-20 md:w-20 lg:h-24 lg:w-24 border-2 md:border-4 border-white/30 shadow-xl flex-shrink-0">
                <AvatarImage src={employee.avatar_url || undefined} alt={employee.name} />
                <AvatarFallback className="bg-white/20 backdrop-blur-sm text-white text-xl md:text-2xl lg:text-3xl font-bold">
                  {getInitials(employee.name)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <h1 className="text-lg md:text-2xl lg:text-4xl font-bold truncate">{employee.name}</h1>
                <p className="text-xs md:text-sm lg:text-base text-white/80 mt-0.5 md:mt-1 truncate">
                  {employee.jabatan || 'ASN'} • {employee.nip}
                </p>
                <Badge variant={getRoleBadgeVariant(employee.role) as any} className="mt-2">
                  {getRoleName(employee.role)}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Info Banner for Admin viewing other profiles */}
        {!isOwnProfile && (
          <div className="rounded-lg border bg-blue-50 dark:bg-blue-950/20 p-4 mb-4">
            <div className="flex gap-3">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100">Informasi Terbatas</h3>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  Data detail kepegawaian seperti riwayat jabatan, mutasi, dan dokumen hanya dapat dilihat lengkap oleh pegawai yang bersangkutan. 
                  Silakan minta pegawai untuk melengkapi profil mereka melalui halaman Profil.
                </p>
              </div>
            </div>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4 md:mb-6 h-10 md:h-11">
            <TabsTrigger value="profile" className="gap-1.5 md:gap-2 text-xs md:text-sm">
              <User className="h-3.5 w-3.5 md:h-4 md:w-4" />
              <span className="hidden sm:inline">Data Diri</span>
              <span className="sm:hidden">Profil</span>
            </TabsTrigger>
            <TabsTrigger value="documents" className="gap-1.5 md:gap-2 text-xs md:text-sm">
              <FileText className="h-3.5 w-3.5 md:h-4 md:w-4" />
              <span className="hidden sm:inline">Kelengkapan Administrasi</span>
              <span className="sm:hidden">Dokumen</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <div className="space-y-4 md:space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Informasi Pribadi */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                    <User className="h-4 w-4 md:h-5 md:w-5" />
                    Informasi Pribadi
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg flex-shrink-0">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs md:text-sm text-muted-foreground">Nama Lengkap</p>
                      <p className="font-medium text-sm md:text-base truncate">{employee.name}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg flex-shrink-0">
                      <IdCard className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs md:text-sm text-muted-foreground">NIP</p>
                      <p className="font-medium text-sm md:text-base truncate">{employee.nip}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg flex-shrink-0">
                      <Mail className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs md:text-sm text-muted-foreground">Email</p>
                      <p className="font-medium text-sm md:text-base truncate">{employee.email || "-"}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg flex-shrink-0">
                      <Phone className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs md:text-sm text-muted-foreground">No. Telepon</p>
                      <p className="font-medium text-sm md:text-base truncate">{employee.phone || employee.nomor_hp || "-"}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg flex-shrink-0">
                      <Building2 className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs md:text-sm text-muted-foreground">Unit Kerja</p>
                      <p className="font-medium text-sm md:text-base truncate">{employee.work_unit_name}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg flex-shrink-0">
                      <Shield className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs md:text-sm text-muted-foreground">Role</p>
                      <Badge variant={getRoleBadgeVariant(employee.role) as any}>
                        {getRoleName(employee.role)}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Informasi Kepegawaian */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                    <Briefcase className="h-4 w-4 md:h-5 md:w-5" />
                    Informasi Kepegawaian
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg flex-shrink-0">
                      <Briefcase className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs md:text-sm text-muted-foreground">Jabatan</p>
                      <p className="font-medium text-sm md:text-base">{employee.jabatan || "-"}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg flex-shrink-0">
                      <Award className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs md:text-sm text-muted-foreground">Pangkat/Golongan</p>
                      <p className="font-medium text-sm md:text-base">{employee.pangkat_golongan || "-"}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg flex-shrink-0">
                      <Calendar className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs md:text-sm text-muted-foreground">TMT PNS</p>
                      <p className="font-medium text-sm md:text-base">
                        {employee.tmt_pns ? format(new Date(employee.tmt_pns), "dd MMMM yyyy", { locale: localeId }) : "-"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg flex-shrink-0">
                      <Calendar className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs md:text-sm text-muted-foreground">TMT Pensiun</p>
                      <p className="font-medium text-sm md:text-base">
                        {employee.tmt_pensiun ? format(new Date(employee.tmt_pensiun), "dd MMMM yyyy", { locale: localeId }) : "-"}
                      </p>
                    </div>
                  </div>

                  {(employee.masa_kerja_tahun || employee.masa_kerja_bulan) && (
                    <div className="flex items-start gap-3 md:col-span-2">
                      <div className="p-2 bg-primary/10 rounded-lg flex-shrink-0">
                        <History className="h-4 w-4 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs md:text-sm text-muted-foreground">Masa Kerja</p>
                        <p className="font-medium text-sm md:text-base">
                          {employee.masa_kerja_tahun || 0} Tahun {employee.masa_kerja_bulan || 0} Bulan
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Data Pribadi Tambahan */}
              {(employee.tempat_lahir || employee.tanggal_lahir || employee.jenis_kelamin || employee.agama || employee.alamat_lengkap) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                      <MapPin className="h-4 w-4 md:h-5 md:w-5" />
                      Data Pribadi
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    {employee.tempat_lahir && (
                      <div className="space-y-1">
                        <p className="text-xs md:text-sm text-muted-foreground">Tempat Lahir</p>
                        <p className="font-medium text-sm md:text-base">{employee.tempat_lahir}</p>
                      </div>
                    )}

                    {employee.tanggal_lahir && (
                      <div className="space-y-1">
                        <p className="text-xs md:text-sm text-muted-foreground">Tanggal Lahir</p>
                        <p className="font-medium text-sm md:text-base">
                          {format(new Date(employee.tanggal_lahir), "dd MMMM yyyy", { locale: localeId })}
                        </p>
                      </div>
                    )}

                    {employee.jenis_kelamin && (
                      <div className="space-y-1">
                        <p className="text-xs md:text-sm text-muted-foreground">Jenis Kelamin</p>
                        <p className="font-medium text-sm md:text-base">{employee.jenis_kelamin}</p>
                      </div>
                    )}

                    {employee.agama && (
                      <div className="space-y-1">
                        <p className="text-xs md:text-sm text-muted-foreground">Agama</p>
                        <p className="font-medium text-sm md:text-base">{employee.agama}</p>
                      </div>
                    )}

                    {employee.status_perkawinan && (
                      <div className="space-y-1">
                        <p className="text-xs md:text-sm text-muted-foreground">Status Perkawinan</p>
                        <p className="font-medium text-sm md:text-base">{employee.status_perkawinan}</p>
                      </div>
                    )}

                    {employee.pendidikan_terakhir && (
                      <div className="space-y-1">
                        <p className="text-xs md:text-sm text-muted-foreground">Pendidikan Terakhir</p>
                        <p className="font-medium text-sm md:text-base">{employee.pendidikan_terakhir}</p>
                      </div>
                    )}

                    {employee.alamat_lengkap && (
                      <div className="space-y-1 md:col-span-2">
                        <p className="text-xs md:text-sm text-muted-foreground">Alamat Lengkap</p>
                        <p className="font-medium text-sm md:text-base">{employee.alamat_lengkap}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Riwayat Jabatan */}
              {employee.riwayat_jabatan && employee.riwayat_jabatan.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                      <History className="h-4 w-4 md:h-5 md:w-5" />
                      Riwayat Jabatan
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {employee.riwayat_jabatan.map((jabatan: any, index: number) => (
                        <div key={index} className="flex gap-3 p-3 rounded-lg bg-muted/50 border">
                          <div className="p-2 bg-primary/10 rounded-lg h-fit flex-shrink-0">
                            <Briefcase className="h-4 w-4 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm md:text-base">{jabatan.nama_jabatan}</p>
                            <p className="text-xs md:text-sm text-muted-foreground mt-1">
                              {jabatan.unit_kerja}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {format(new Date(jabatan.tmt_jabatan), "dd MMM yyyy", { locale: localeId })} 
                              {jabatan.tmt_selesai && ` - ${format(new Date(jabatan.tmt_selesai), "dd MMM yyyy", { locale: localeId })}`}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Riwayat Mutasi */}
              {employee.riwayat_mutasi && employee.riwayat_mutasi.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                      <GitCompare className="h-4 w-4 md:h-5 md:w-5" />
                      Riwayat Mutasi
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {employee.riwayat_mutasi.map((mutasi: any, index: number) => (
                        <div key={index} className="flex gap-3 p-3 rounded-lg bg-muted/50 border">
                          <div className="p-2 bg-primary/10 rounded-lg h-fit flex-shrink-0">
                            <GitCompare className="h-4 w-4 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm md:text-base">{mutasi.unit_asal} → {mutasi.unit_tujuan}</p>
                            <p className="text-xs md:text-sm text-muted-foreground mt-1">
                              {mutasi.alasan_mutasi}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              TMT: {format(new Date(mutasi.tmt_mutasi), "dd MMM yyyy", { locale: localeId })}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="documents">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                  <FileText className="h-4 w-4 md:h-5 md:w-5" />
                  Kelengkapan Administrasi
                </CardTitle>
                <CardDescription className="text-xs md:text-sm">
                  Dokumen-dokumen administratif yang dimiliki pegawai
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {REQUIRED_DOCUMENTS && REQUIRED_DOCUMENTS.length > 0 ? (
                    REQUIRED_DOCUMENTS.map((doc: any) => {
                      const hasDocument = employee.documents?.[doc.id];
                      return (
                        <div key={doc.id} className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                          <div className="flex items-start gap-3 flex-1">
                            <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="font-medium text-sm md:text-base">{doc.label}</p>
                              {doc.description && (
                                <p className="text-xs text-muted-foreground">{doc.description}</p>
                              )}
                            </div>
                          </div>
                          <Badge variant={hasDocument ? "default" : "secondary"}>
                            {hasDocument ? "Tersedia" : "Belum Upload"}
                          </Badge>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      Tidak ada data dokumen
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
