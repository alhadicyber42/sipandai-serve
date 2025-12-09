import { useState } from "react";
import { useAuth, User as AuthUser, EmploymentHistory, MutationHistory, EducationHistory, DiklatHistory, KompetensiHistory } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AvatarUpload } from "@/components/AvatarUpload";
import { Textarea } from "@/components/ui/textarea";
import { WORK_UNITS, REQUIRED_DOCUMENTS } from "@/lib/constants";
import { User, Mail, Phone, IdCard, Building2, Shield, Briefcase, Calendar, Edit2, Save, X, Plus, Trash2, GitCompare, FileText, Search, MapPin, GraduationCap, Award, ClipboardCheck } from "lucide-react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { toast } from "sonner";
import { format } from "date-fns";
import { DocumentField } from "@/components/DocumentField";

const PANGKAT_GOLONGAN_OPTIONS = [
  {
    label: "Golongan I (Juru)",
    options: ["Juru Muda (I/a)", "Juru Muda Tingkat I (I/b)", "Juru (I/c)", "Juru Tingkat I (I/d)"],
  },
  {
    label: "Golongan II (Pengatur)",
    options: ["Pengatur Muda (II/a)", "Pengatur Muda Tingkat I (II/b)", "Pengatur (II/c)", "Pengatur Tingkat I (II/d)"],
  },
  {
    label: "Golongan III (Penata)",
    options: ["Penata Muda (III/a)", "Penata Muda Tingkat I (III/b)", "Penata (III/c)", "Penata Tingkat I (III/d)"],
  },
  {
    label: "Golongan IV (Pembina)",
    options: ["Pembina (IV/a)", "Pembina Tingkat I (IV/b)", "Pembina Utama Muda (IV/c)", "Pembina Utama Madya (IV/d)", "Pembina Utama (IV/e)"],
  },
];

export default function Profile() {
  const { user, updateProfile, refreshProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [searchQuery, setSearchQuery] = useState("");

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleAvatarChange = async (url: string | null) => {
    // Avatar is already updated in Supabase by useAvatarUpload
    // Also save to localStorage as backup
    if (url && user?.id) {
      try {
        localStorage.setItem(`avatar_url_${user.id}`, url);
      } catch (e) {
        console.warn('Could not save avatar to localStorage:', e);
      }
    } else if (!url && user?.id) {
      try {
        localStorage.removeItem(`avatar_url_${user.id}`);
      } catch (e) {
        console.warn('Could not remove avatar from localStorage:', e);
      }
    }
    
    // Refresh user context with new avatar
    console.log('Avatar changed, refreshing profile with new URL:', url);
    await refreshProfile();
    console.log('Profile refreshed');
  };

  const workUnit = WORK_UNITS.find((u) => u.id === user?.work_unit_id);

  const form = useForm<AuthUser>({
    defaultValues: user || {},
  });

  const { fields: jabatanFields, append: appendJabatan, remove: removeJabatan } = useFieldArray({
    control: form.control,
    name: "riwayat_jabatan",
  });

  const { fields: mutasiFields, append: appendMutasi, remove: removeMutasi } = useFieldArray({
    control: form.control,
    name: "riwayat_mutasi",
  });

  const { fields: pendidikanFields, append: appendPendidikan, remove: removePendidikan } = useFieldArray({
    control: form.control,
    name: "riwayat_pendidikan",
  });

  const { fields: diklatFields, append: appendDiklat, remove: removeDiklat } = useFieldArray({
    control: form.control,
    name: "riwayat_diklat",
  });

  const { fields: kompetensiFields, append: appendKompetensi, remove: removeKompetensi } = useFieldArray({
    control: form.control,
    name: "riwayat_uji_kompetensi",
  });

  const handleSaveDocument = async (id: string, value: any) => {
    if (!user) return false;

    const currentDocs = user.documents || {};
    const updatedDocs = {
      ...currentDocs,
      [id]: value
    };

    const updatedUser = {
      ...user,
      documents: updatedDocs
    } as AuthUser;

    const result = await updateProfile(updatedUser);
    if (result.success) {
      toast.success("Dokumen berhasil diperbarui");
      return true;
    } else {
      toast.error(result.error || "Gagal memperbarui dokumen");
      return false;
    }
  };

  const handleSaveProfile = async (data: AuthUser) => {
    setIsLoading(true);
    const result = await updateProfile(data);
    if (result.success) {
      toast.success("Profil berhasil diperbarui");
      setIsEditing(false);
    } else {
      toast.error(result.error || "Gagal memperbarui profil");
    }
    setIsLoading(false);
  };

  if (!user) return null;

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-4 md:space-y-6 pb-10">
        {/* Header */}
        <div className="relative overflow-hidden rounded-xl md:rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-500 to-indigo-400 p-4 md:p-6 lg:p-8 text-white shadow-xl">
          <div className="absolute top-0 right-0 w-32 h-32 md:w-64 md:h-64 bg-white/10 rounded-full blur-3xl -mr-16 md:-mr-32 -mt-16 md:-mt-32"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 md:w-48 md:h-48 bg-white/10 rounded-full blur-3xl -ml-12 md:-ml-24 -mb-12 md:-mb-24"></div>

          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-6">
            <div className="flex items-center gap-3 md:gap-4">
              <Avatar className="h-16 w-16 md:h-20 md:w-20 lg:h-24 lg:w-24 border-2 md:border-4 border-white/30 shadow-xl flex-shrink-0">
                <AvatarImage src={user.avatar_url || undefined} alt={user.name} />
                <AvatarFallback className="bg-white/20 backdrop-blur-sm text-white text-xl md:text-2xl lg:text-3xl font-bold">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <h1 className="text-lg md:text-2xl lg:text-4xl font-bold truncate">{user.name}</h1>
                <p className="text-xs md:text-sm lg:text-base text-white/80 mt-0.5 md:mt-1 truncate">
                  {user.jabatan || 'ASN'} • {user.nip}
                </p>
              </div>
            </div>
            {activeTab === "profile" && !isEditing && (
              <Button onClick={() => setIsEditing(true)} variant="secondary" className="gap-1.5 md:gap-2 shadow-lg h-9 md:h-10 px-3 md:px-4 text-xs md:text-sm">
                <Edit2 className="h-3.5 w-3.5 md:h-4 md:w-4" />
                <span className="hidden sm:inline">Edit Profil</span>
                <span className="sm:hidden">Edit</span>
              </Button>
            )}
          </div>
        </div>

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
            {isEditing ? (
              <form onSubmit={form.handleSubmit(handleSaveProfile)} className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Edit Mode */}
                <Card>
                  <CardHeader>
                    <CardTitle>Foto Profil</CardTitle>
                    <CardDescription>Upload foto profil Anda (akan dikompres otomatis)</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <AvatarUpload
                      currentAvatarUrl={user.avatar_url}
                      userName={user.name}
                      userId={user.id}
                      onAvatarChange={handleAvatarChange}
                      size="lg"
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Edit Informasi Pribadi</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Nama Lengkap</Label>
                        <Input {...form.register("name")} />
                      </div>
                      <div className="space-y-2">
                        <Label>Email</Label>
                        <Input {...form.register("email")} disabled className="bg-muted" />
                      </div>
                      <div className="space-y-2">
                        <Label>NIP / NIK</Label>
                        <p className="text-xs text-muted-foreground -mt-1">ASN: NIP | Non-ASN: NIK</p>
                        <Input {...form.register("nip")} placeholder="Masukkan NIP atau NIK" />
                      </div>
                      <div className="space-y-2">
                        <Label>No. Telepon</Label>
                        <Input {...form.register("phone")} />
                      </div>
                      <div className="space-y-2">
                        <Label>Tempat Lahir</Label>
                        <Input {...form.register("tempat_lahir")} placeholder="Contoh: Jakarta" />
                      </div>
                      <div className="space-y-2">
                        <Label>Tanggal Lahir</Label>
                        <Input type="date" {...form.register("tanggal_lahir")} />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label>Alamat Lengkap</Label>
                        <Textarea {...form.register("alamat_lengkap")} placeholder="Masukkan alamat lengkap..." rows={3} />
                      </div>
                    </div>

                    {/* Riwayat Pendidikan */}
                    <div className="border-t pt-4">
                      <div className="flex justify-between items-center mb-4">
                        <Label className="text-base font-semibold flex items-center gap-2">
                          <GraduationCap className="h-4 w-4" />
                          Riwayat Pendidikan
                        </Label>
                        <Button type="button" variant="outline" size="sm" onClick={() => appendPendidikan({ jenjang: "", institusi: "", jurusan: "", tahun_lulus: "" })}>
                          <Plus className="h-4 w-4 mr-2" /> Tambah
                        </Button>
                      </div>
                      <div className="space-y-3">
                        {pendidikanFields.map((field, index) => (
                          <div key={field.id} className="p-3 bg-muted/30 rounded-lg border space-y-3">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                              <div className="space-y-2">
                                <Label className="text-xs">Jenjang</Label>
                                <Controller
                                  control={form.control}
                                  name={`riwayat_pendidikan.${index}.jenjang`}
                                  render={({ field }) => (
                                    <Select onValueChange={field.onChange} value={field.value}>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Pilih" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="SD">SD</SelectItem>
                                        <SelectItem value="SMP">SMP</SelectItem>
                                        <SelectItem value="SMA/SMK">SMA/SMK</SelectItem>
                                        <SelectItem value="D1">D1</SelectItem>
                                        <SelectItem value="D2">D2</SelectItem>
                                        <SelectItem value="D3">D3</SelectItem>
                                        <SelectItem value="D4/S1">D4/S1</SelectItem>
                                        <SelectItem value="S2">S2</SelectItem>
                                        <SelectItem value="S3">S3</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  )}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label className="text-xs">Institusi</Label>
                                <Input {...form.register(`riwayat_pendidikan.${index}.institusi`)} placeholder="Nama Sekolah/Universitas" />
                              </div>
                              <div className="space-y-2">
                                <Label className="text-xs">Jurusan</Label>
                                <Input {...form.register(`riwayat_pendidikan.${index}.jurusan`)} placeholder="Jurusan/Prodi" />
                              </div>
                              <div className="space-y-2">
                                <Label className="text-xs">Tahun Lulus</Label>
                                <Input {...form.register(`riwayat_pendidikan.${index}.tahun_lulus`)} placeholder="2020" />
                              </div>
                            </div>
                            <div className="flex justify-end">
                              <Button type="button" variant="ghost" size="sm" className="text-destructive" onClick={() => removePendidikan(index)}>
                                <Trash2 className="h-4 w-4 mr-1" /> Hapus
                              </Button>
                            </div>
                          </div>
                        ))}
                        {pendidikanFields.length === 0 && <p className="text-sm text-muted-foreground text-center italic">Belum ada riwayat pendidikan.</p>}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Edit Data Kepegawaian</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Unit Kerja</Label>
                        <Controller
                          control={form.control}
                          name="work_unit_id"
                          render={({ field }) => (
                            <Select onValueChange={(val) => field.onChange(parseInt(val))} defaultValue={field.value?.toString()}>
                              <SelectTrigger>
                                <SelectValue placeholder="Pilih Unit Kerja" />
                              </SelectTrigger>
                              <SelectContent>
                                {WORK_UNITS.map((u) => (
                                  <SelectItem key={u.id} value={u.id.toString()}>{u.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Jabatan Saat Ini</Label>
                        <Input {...form.register("jabatan")} />
                      </div>
                      <div className="space-y-2">
                        <Label>Pangkat/Golongan</Label>
                        <Controller
                          control={form.control}
                          name="pangkat_golongan"
                          render={({ field }) => (
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <SelectTrigger>
                                <SelectValue placeholder="Pilih Pangkat" />
                              </SelectTrigger>
                              <SelectContent>
                                {PANGKAT_GOLONGAN_OPTIONS.map((group) => (
                                  <SelectGroup key={group.label}>
                                    <SelectLabel>{group.label}</SelectLabel>
                                    {group.options.map((option) => (
                                      <SelectItem key={option} value={option}>{option}</SelectItem>
                                    ))}
                                  </SelectGroup>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>TMT PNS</Label>
                        <Input type="date" {...form.register("tmt_pns")} />
                      </div>
                      <div className="space-y-2">
                        <Label>TMT Pensiun</Label>
                        <Input type="date" {...form.register("tmt_pensiun")} />
                      </div>
                      <div className="space-y-2">
                        <Label>Kriteria ASN</Label>
                        <Controller
                          control={form.control}
                          name="kriteria_asn"
                          render={({ field }) => (
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <SelectTrigger>
                                <SelectValue placeholder="Pilih Kriteria ASN" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="ASN">ASN</SelectItem>
                                <SelectItem value="Non ASN">Non ASN</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        />
                      </div>
                    </div>

                    {/* Riwayat Jabatan */}
                    <div className="border-t pt-4">
                      <div className="flex justify-between items-center mb-4">
                        <Label className="text-base font-semibold">Riwayat Jabatan</Label>
                        <Button type="button" variant="outline" size="sm" onClick={() => appendJabatan({ jabatan: "", tmt: "" })}>
                          <Plus className="h-4 w-4 mr-2" /> Tambah
                        </Button>
                      </div>
                      <div className="space-y-3">
                        {jabatanFields.map((field, index) => (
                          <div key={field.id} className="flex gap-3 items-end p-3 bg-muted/30 rounded-lg border">
                            <div className="flex-1 space-y-2">
                              <Label className="text-xs">Jabatan</Label>
                              <Input {...form.register(`riwayat_jabatan.${index}.jabatan`)} placeholder="Nama Jabatan" />
                            </div>
                            <div className="flex-1 space-y-2">
                              <Label className="text-xs">TMT</Label>
                              <Input type="date" {...form.register(`riwayat_jabatan.${index}.tmt`)} />
                            </div>
                            <Button type="button" variant="ghost" size="icon" className="text-destructive" onClick={() => removeJabatan(index)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                        {jabatanFields.length === 0 && <p className="text-sm text-muted-foreground text-center italic">Belum ada riwayat jabatan.</p>}
                      </div>
                    </div>

                    {/* Riwayat Mutasi */}
                    <div className="border-t pt-4">
                      <div className="flex justify-between items-center mb-4">
                        <Label className="text-base font-semibold">Riwayat Mutasi</Label>
                        <Button type="button" variant="outline" size="sm" onClick={() => appendMutasi({ jenis_mutasi: "", tmt: "" })}>
                          <Plus className="h-4 w-4 mr-2" /> Tambah
                        </Button>
                      </div>
                      <div className="space-y-3">
                        {mutasiFields.map((field, index) => (
                          <div key={field.id} className="flex gap-3 items-end p-3 bg-muted/30 rounded-lg border">
                            <div className="flex-1 space-y-2">
                              <Label className="text-xs">Jenis Mutasi / Unit Kerja</Label>
                              <Input {...form.register(`riwayat_mutasi.${index}.jenis_mutasi`)} placeholder="Contoh: Mutasi ke Dinas X" />
                            </div>
                            <div className="flex-1 space-y-2">
                              <Label className="text-xs">TMT</Label>
                              <Input type="date" {...form.register(`riwayat_mutasi.${index}.tmt`)} />
                            </div>
                            <Button type="button" variant="ghost" size="icon" className="text-destructive" onClick={() => removeMutasi(index)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                        {mutasiFields.length === 0 && <p className="text-sm text-muted-foreground text-center italic">Belum ada riwayat mutasi.</p>}
                      </div>
                    </div>

                    {/* Riwayat Diklat */}
                    <div className="border-t pt-4">
                      <div className="flex justify-between items-center mb-4">
                        <Label className="text-base font-semibold flex items-center gap-2">
                          <Award className="h-4 w-4" />
                          Riwayat Diklat
                        </Label>
                        <Button type="button" variant="outline" size="sm" onClick={() => appendDiklat({ nama_diklat: "", penyelenggara: "", tahun: "", sertifikat_url: "" })}>
                          <Plus className="h-4 w-4 mr-2" /> Tambah
                        </Button>
                      </div>
                      <div className="space-y-3">
                        {diklatFields.map((field, index) => (
                          <div key={field.id} className="p-3 bg-muted/30 rounded-lg border space-y-3">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              <div className="space-y-2">
                                <Label className="text-xs">Nama Diklat</Label>
                                <Input {...form.register(`riwayat_diklat.${index}.nama_diklat`)} placeholder="Nama Diklat/Pelatihan" />
                              </div>
                              <div className="space-y-2">
                                <Label className="text-xs">Penyelenggara</Label>
                                <Input {...form.register(`riwayat_diklat.${index}.penyelenggara`)} placeholder="Lembaga Penyelenggara" />
                              </div>
                              <div className="space-y-2">
                                <Label className="text-xs">Tahun</Label>
                                <Input {...form.register(`riwayat_diklat.${index}.tahun`)} placeholder="2023" />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label className="text-xs">Link Sertifikat (Opsional)</Label>
                              <Input {...form.register(`riwayat_diklat.${index}.sertifikat_url`)} placeholder="https://..." />
                            </div>
                            <div className="flex justify-end">
                              <Button type="button" variant="ghost" size="sm" className="text-destructive" onClick={() => removeDiklat(index)}>
                                <Trash2 className="h-4 w-4 mr-1" /> Hapus
                              </Button>
                            </div>
                          </div>
                        ))}
                        {diklatFields.length === 0 && <p className="text-sm text-muted-foreground text-center italic">Belum ada riwayat diklat.</p>}
                      </div>
                    </div>

                    {/* Riwayat Uji Kompetensi */}
                    <div className="border-t pt-4">
                      <div className="flex justify-between items-center mb-4">
                        <Label className="text-base font-semibold flex items-center gap-2">
                          <ClipboardCheck className="h-4 w-4" />
                          Riwayat Uji Kompetensi
                        </Label>
                        <Button type="button" variant="outline" size="sm" onClick={() => appendKompetensi({ nama_uji: "", penyelenggara: "", tahun: "", hasil: "", sertifikat_url: "" })}>
                          <Plus className="h-4 w-4 mr-2" /> Tambah
                        </Button>
                      </div>
                      <div className="space-y-3">
                        {kompetensiFields.map((field, index) => (
                          <div key={field.id} className="p-3 bg-muted/30 rounded-lg border space-y-3">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                              <div className="space-y-2">
                                <Label className="text-xs">Nama Uji Kompetensi</Label>
                                <Input {...form.register(`riwayat_uji_kompetensi.${index}.nama_uji`)} placeholder="Nama Uji Kompetensi" />
                              </div>
                              <div className="space-y-2">
                                <Label className="text-xs">Penyelenggara</Label>
                                <Input {...form.register(`riwayat_uji_kompetensi.${index}.penyelenggara`)} placeholder="Lembaga Penyelenggara" />
                              </div>
                              <div className="space-y-2">
                                <Label className="text-xs">Tahun</Label>
                                <Input {...form.register(`riwayat_uji_kompetensi.${index}.tahun`)} placeholder="2023" />
                              </div>
                              <div className="space-y-2">
                                <Label className="text-xs">Hasil</Label>
                                <Controller
                                  control={form.control}
                                  name={`riwayat_uji_kompetensi.${index}.hasil`}
                                  render={({ field }) => (
                                    <Select onValueChange={field.onChange} value={field.value}>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Pilih" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="Lulus">Lulus</SelectItem>
                                        <SelectItem value="Tidak Lulus">Tidak Lulus</SelectItem>
                                        <SelectItem value="Dalam Proses">Dalam Proses</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  )}
                                />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label className="text-xs">Link Sertifikat (Opsional)</Label>
                              <Input {...form.register(`riwayat_uji_kompetensi.${index}.sertifikat_url`)} placeholder="https://..." />
                            </div>
                            <div className="flex justify-end">
                              <Button type="button" variant="ghost" size="sm" className="text-destructive" onClick={() => removeKompetensi(index)}>
                                <Trash2 className="h-4 w-4 mr-1" /> Hapus
                              </Button>
                            </div>
                          </div>
                        ))}
                        {kompetensiFields.length === 0 && <p className="text-sm text-muted-foreground text-center italic">Belum ada riwayat uji kompetensi.</p>}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex gap-4 justify-end">
                  <Button type="button" variant="outline" onClick={() => setIsEditing(false)} disabled={isLoading}>
                    <X className="h-4 w-4 mr-2" /> Batal
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? "Menyimpan..." : <><Save className="h-4 w-4 mr-2" /> Simpan Perubahan</>}
                  </Button>
                </div>
              </form>
            ) : (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* View Mode */}
                <div className="grid md:grid-cols-2 gap-6">
                  <Card className="md:col-span-1 h-full">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5 text-primary" />
                        Informasi Pribadi
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <InfoItem label="Nama Lengkap" value={user.name} icon={<User className="h-4 w-4" />} />
                      <InfoItem label="Email" value={user.email} icon={<Mail className="h-4 w-4" />} />
                      <InfoItem label="NIP / NIK" value={user.nip || "-"} icon={<IdCard className="h-4 w-4" />} />
                      <InfoItem label="No. Telepon" value={user.phone || "-"} icon={<Phone className="h-4 w-4" />} />
                      <InfoItem 
                        label="Tempat, Tanggal Lahir" 
                        value={
                          user.tempat_lahir || user.tanggal_lahir 
                            ? `${user.tempat_lahir || "-"}, ${user.tanggal_lahir ? format(new Date(user.tanggal_lahir), "dd MMMM yyyy") : "-"}`
                            : "-"
                        } 
                        icon={<Calendar className="h-4 w-4" />} 
                      />
                      <InfoItem label="Alamat" value={user.alamat_lengkap || "-"} icon={<MapPin className="h-4 w-4" />} />
                    </CardContent>
                  </Card>

                  <Card className="md:col-span-1 h-full">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Briefcase className="h-5 w-5 text-primary" />
                        Data Kepegawaian
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                       <InfoItem label="Unit Kerja" value={workUnit?.name || "-"} icon={<Building2 className="h-4 w-4" />} />
                      <InfoItem label="Jabatan Saat Ini" value={user.jabatan || "-"} icon={<Briefcase className="h-4 w-4" />} />
                      <InfoItem label="Pangkat/Golongan" value={user.pangkat_golongan || "-"} icon={<Shield className="h-4 w-4" />} />
                      <InfoItem label="Kriteria ASN" value={user.kriteria_asn || "-"} icon={<IdCard className="h-4 w-4" />} />
                      <div className="grid grid-cols-2 gap-4">
                        <InfoItem label="TMT PNS" value={user.tmt_pns ? format(new Date(user.tmt_pns), "dd MMMM yyyy") : "-"} icon={<Calendar className="h-4 w-4" />} />
                        <InfoItem label="TMT Pensiun" value={user.tmt_pensiun ? format(new Date(user.tmt_pensiun), "dd MMMM yyyy") : "-"} icon={<Calendar className="h-4 w-4" />} />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Riwayat Pendidikan */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <GraduationCap className="h-5 w-5 text-primary" />
                      Riwayat Pendidikan
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {user.riwayat_pendidikan && user.riwayat_pendidikan.length > 0 ? (
                      <div className="relative border-l-2 border-primary/20 ml-3 space-y-6 py-2">
                        {user.riwayat_pendidikan.map((item, idx) => (
                          <div key={idx} className="relative pl-8">
                            <div className="absolute -left-[9px] top-1 h-4 w-4 rounded-full bg-primary border-4 border-background"></div>
                            <h4 className="font-semibold text-lg">{item.jenjang} - {item.institusi}</h4>
                            <p className="text-sm text-muted-foreground">
                              {item.jurusan && `${item.jurusan} • `}Lulus {item.tahun_lulus || "-"}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-center py-4">Belum ada riwayat pendidikan.</p>
                    )}
                  </CardContent>
                </Card>

                <div className="grid md:grid-cols-2 gap-6">
                  <Card className="h-full">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Briefcase className="h-5 w-5 text-primary" />
                        Riwayat Jabatan
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {user.riwayat_jabatan && user.riwayat_jabatan.length > 0 ? (
                        <div className="relative border-l-2 border-primary/20 ml-3 space-y-8 py-2">
                          {user.riwayat_jabatan.map((item, idx) => (
                            <div key={idx} className="relative pl-8">
                              <div className="absolute -left-[9px] top-1 h-4 w-4 rounded-full bg-primary border-4 border-background"></div>
                              <h4 className="font-semibold text-lg">{item.jabatan}</h4>
                              <p className="text-sm text-muted-foreground">
                                TMT: {item.tmt ? format(new Date(item.tmt), "dd MMMM yyyy") : "-"}
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted-foreground text-center py-4">Belum ada riwayat jabatan.</p>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="h-full">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <GitCompare className="h-5 w-5 text-primary" />
                        Riwayat Mutasi
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {user.riwayat_mutasi && user.riwayat_mutasi.length > 0 ? (
                        <div className="relative border-l-2 border-primary/20 ml-3 space-y-8 py-2">
                          {user.riwayat_mutasi.map((item, idx) => (
                            <div key={idx} className="relative pl-8">
                              <div className="absolute -left-[9px] top-1 h-4 w-4 rounded-full bg-primary border-4 border-background"></div>
                              <h4 className="font-semibold text-lg">{item.jenis_mutasi}</h4>
                              <p className="text-sm text-muted-foreground">
                                TMT: {item.tmt ? format(new Date(item.tmt), "dd MMMM yyyy") : "-"}
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted-foreground text-center py-4">Belum ada riwayat mutasi.</p>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Riwayat Diklat */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Award className="h-5 w-5 text-primary" />
                      Riwayat Diklat
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {user.riwayat_diklat && user.riwayat_diklat.length > 0 ? (
                      <div className="relative border-l-2 border-primary/20 ml-3 space-y-6 py-2">
                        {user.riwayat_diklat.map((item, idx) => (
                          <div key={idx} className="relative pl-8">
                            <div className="absolute -left-[9px] top-1 h-4 w-4 rounded-full bg-primary border-4 border-background"></div>
                            <h4 className="font-semibold text-lg">{item.nama_diklat}</h4>
                            <p className="text-sm text-muted-foreground">
                              {item.penyelenggara} • {item.tahun}
                            </p>
                            {item.sertifikat_url && (
                              <a href={item.sertifikat_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">
                                Lihat Sertifikat
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-center py-4">Belum ada riwayat diklat.</p>
                    )}
                  </CardContent>
                </Card>

                {/* Riwayat Uji Kompetensi */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ClipboardCheck className="h-5 w-5 text-primary" />
                      Riwayat Uji Kompetensi
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {user.riwayat_uji_kompetensi && user.riwayat_uji_kompetensi.length > 0 ? (
                      <div className="relative border-l-2 border-primary/20 ml-3 space-y-6 py-2">
                        {user.riwayat_uji_kompetensi.map((item, idx) => (
                          <div key={idx} className="relative pl-8">
                            <div className="absolute -left-[9px] top-1 h-4 w-4 rounded-full bg-primary border-4 border-background"></div>
                            <h4 className="font-semibold text-lg">{item.nama_uji}</h4>
                            <p className="text-sm text-muted-foreground">
                              {item.penyelenggara} • {item.tahun} • <span className={item.hasil === "Lulus" ? "text-green-600" : item.hasil === "Tidak Lulus" ? "text-red-600" : "text-yellow-600"}>{item.hasil}</span>
                            </p>
                            {item.sertifikat_url && (
                              <a href={item.sertifikat_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">
                                Lihat Sertifikat
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-center py-4">Belum ada riwayat uji kompetensi.</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          <TabsContent value="documents">
            <Card>
              <CardHeader>
                <CardTitle>Repository Dokumen</CardTitle>
                <CardDescription>
                  Simpan link dokumen penting Anda di sini. Klik ikon Edit untuk mengubah atau menambahkan link.
                </CardDescription>
                <div className="mt-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Cari dokumen..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 h-10 text-sm"
                    />
                  </div>
                  {searchQuery && (
                    <p className="text-xs md:text-sm text-muted-foreground mt-2">
                      Menampilkan {REQUIRED_DOCUMENTS.filter(doc =>
                        doc.label.toLowerCase().includes(searchQuery.toLowerCase())
                      ).length} dari {REQUIRED_DOCUMENTS.length} dokumen
                    </p>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4 md:space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  {REQUIRED_DOCUMENTS
                    .filter(doc =>
                      searchQuery === "" ||
                      doc.label.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map((doc) => (
                      <DocumentField
                        key={doc.id}
                        doc={doc}
                        initialValue={user.documents?.[doc.id] || ""}
                        onSave={handleSaveDocument}
                      />
                    ))}
                </div>
                {searchQuery && REQUIRED_DOCUMENTS.filter(doc =>
                  doc.label.toLowerCase().includes(searchQuery.toLowerCase())
                ).length === 0 && (
                    <div className="text-center py-8 md:py-12">
                      <Search className="h-10 w-10 md:h-12 md:w-12 mx-auto text-muted-foreground/50 mb-3 md:mb-4" />
                      <p className="text-sm md:text-base text-muted-foreground">Tidak ada dokumen yang cocok dengan "{searchQuery}"</p>
                      <Button
                        variant="link"
                        onClick={() => setSearchQuery("")}
                        className="mt-1 md:mt-2 text-sm"
                      >
                        Hapus pencarian
                      </Button>
                    </div>
                  )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}

function InfoItem({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
      <div className="mt-1 text-muted-foreground">{icon}</div>
      <div>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
        <p className="font-medium text-foreground mt-0.5">{value}</p>
      </div>
    </div>
  );
}
