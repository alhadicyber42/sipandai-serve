import { useState } from "react";
import { useAuth, User as AuthUser, EmploymentHistory, MutationHistory } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WORK_UNITS, REQUIRED_DOCUMENTS } from "@/lib/constants";
import { User, Mail, Phone, IdCard, Building2, Shield, Briefcase, Calendar, Edit2, Save, X, Plus, Trash2, GitCompare, FileText } from "lucide-react";
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
  const { user, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");

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
      <div className="max-w-4xl mx-auto space-y-6 pb-10">
        {/* Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-500 to-indigo-400 p-6 md:p-8 text-white shadow-xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -ml-24 -mb-24"></div>

          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 md:p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <User className="h-6 w-6 md:h-8 md:w-8" />
              </div>
              <div>
                <h1 className="text-2xl md:text-4xl font-bold">Profil Pengguna</h1>
                <p className="text-sm md:text-base text-white/80 mt-1">
                  Kelola informasi akun, data kepegawaian, dan dokumen Anda
                </p>
              </div>
            </div>
            {activeTab === "profile" && !isEditing && (
              <Button onClick={() => setIsEditing(true)} variant="secondary" className="gap-2 shadow-lg">
                <Edit2 className="h-4 w-4" />
                Edit Profil
              </Button>
            )}
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="profile" className="gap-2">
              <User className="h-4 w-4" /> Data Diri
            </TabsTrigger>
            <TabsTrigger value="documents" className="gap-2">
              <FileText className="h-4 w-4" /> Kelengkapan Administrasi
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            {isEditing ? (
              <form onSubmit={form.handleSubmit(handleSaveProfile)} className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Edit Mode */}
                <Card>
                  <CardHeader>
                    <CardTitle>Edit Informasi Pribadi</CardTitle>
                  </CardHeader>
                  <CardContent className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Nama Lengkap</Label>
                      <Input {...form.register("name")} />
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input {...form.register("email")} disabled className="bg-muted" />
                    </div>
                    <div className="space-y-2">
                      <Label>NIP</Label>
                      <Input {...form.register("nip")} />
                    </div>
                    <div className="space-y-2">
                      <Label>No. Telepon</Label>
                      <Input {...form.register("phone")} />
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
                      <InfoItem label="NIP" value={user.nip} icon={<IdCard className="h-4 w-4" />} />
                      <InfoItem label="No. Telepon" value={user.phone || "-"} icon={<Phone className="h-4 w-4" />} />
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
                      <div className="grid grid-cols-2 gap-4">
                        <InfoItem label="TMT PNS" value={user.tmt_pns ? format(new Date(user.tmt_pns), "dd MMMM yyyy") : "-"} icon={<Calendar className="h-4 w-4" />} />
                        <InfoItem label="TMT Pensiun" value={user.tmt_pensiun ? format(new Date(user.tmt_pensiun), "dd MMMM yyyy") : "-"} icon={<Calendar className="h-4 w-4" />} />
                      </div>
                    </CardContent>
                  </Card>
                </div>

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
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-6">
                  {REQUIRED_DOCUMENTS.map((doc) => (
                    <DocumentField
                      key={doc.id}
                      doc={doc}
                      initialValue={user.documents?.[doc.id] || ""}
                      onSave={handleSaveDocument}
                    />
                  ))}
                </div>
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
