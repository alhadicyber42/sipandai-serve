import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Building2, Mail, Lock, User, Phone, IdCard, Briefcase, Calendar, Plus, Trash2, GitCompare } from "lucide-react";
import { WORK_UNITS } from "@/lib/constants";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

// Zod Schemas
const loginSchema = z.object({
  email: z.string().email("Email tidak valid"),
  password: z.string().min(1, "Password diperlukan"),
});

const employmentHistorySchema = z.object({
  jabatan: z.string().min(1, "Jabatan diperlukan"),
  tmt: z.string().min(1, "TMT diperlukan"),
});

const mutationHistorySchema = z.object({
  jenis_mutasi: z.string().min(1, "Jenis mutasi diperlukan"),
  tmt: z.string().min(1, "TMT diperlukan"),
});

const registerSchema = z.object({
  name: z.string().min(1, "Nama lengkap diperlukan"),
  email: z.string().email("Email tidak valid"),
  nip: z.string().min(1, "NIP diperlukan"),
  phone: z.string().min(1, "No. Telepon diperlukan"),
  work_unit: z.string().min(1, "Unit kerja diperlukan"),
  jabatan: z.string().min(1, "Jabatan saat ini diperlukan"),
  pangkat_golongan: z.string().min(1, "Pangkat/Golongan diperlukan"),
  tmt_pns: z.string().min(1, "TMT PNS diperlukan"),
  tmt_pensiun: z.string().min(1, "TMT Pensiun diperlukan"),
  riwayat_jabatan: z.array(employmentHistorySchema).optional(),
  riwayat_mutasi: z.array(mutationHistorySchema).optional(),
  password: z.string().min(6, "Password minimal 6 karakter"),
  confirmPassword: z.string().min(1, "Konfirmasi password diperlukan"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Password tidak cocok",
  path: ["confirmPassword"],
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

const PANGKAT_GOLONGAN_OPTIONS = [
  {
    label: "Golongan I (Juru)",
    options: [
      "Juru Muda (I/a)",
      "Juru Muda Tingkat I (I/b)",
      "Juru (I/c)",
      "Juru Tingkat I (I/d)",
    ],
  },
  {
    label: "Golongan II (Pengatur)",
    options: [
      "Pengatur Muda (II/a)",
      "Pengatur Muda Tingkat I (II/b)",
      "Pengatur (II/c)",
      "Pengatur Tingkat I (II/d)",
    ],
  },
  {
    label: "Golongan III (Penata)",
    options: [
      "Penata Muda (III/a)",
      "Penata Muda Tingkat I (III/b)",
      "Penata (III/c)",
      "Penata Tingkat I (III/d)",
    ],
  },
  {
    label: "Golongan IV (Pembina)",
    options: [
      "Pembina (IV/a)",
      "Pembina Tingkat I (IV/b)",
      "Pembina Utama Muda (IV/c)",
      "Pembina Utama Madya (IV/d)",
      "Pembina Utama (IV/e)",
    ],
  },
];

export default function Auth() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, register, user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("login");

  // Login Form
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Register Form
  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      nip: "",
      phone: "",
      work_unit: "",
      jabatan: "",
      pangkat_golongan: "",
      tmt_pns: "",
      tmt_pensiun: "",
      riwayat_jabatan: [],
      riwayat_mutasi: [],
      password: "",
      confirmPassword: "",
    },
  });

  const { fields: jabatanFields, append: appendJabatan, remove: removeJabatan } = useFieldArray({
    control: registerForm.control,
    name: "riwayat_jabatan",
  });

  const { fields: mutasiFields, append: appendMutasi, remove: removeMutasi } = useFieldArray({
    control: registerForm.control,
    name: "riwayat_mutasi",
  });

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "register") {
      setActiveTab("register");
    }
  }, [searchParams]);

  // Redirect if already logged in
  if (user) {
    navigate("/dashboard");
    return null;
  }

  const onLoginSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    const result = await login(data.email, data.password);
    if (result.success) {
      toast.success("Login berhasil!");
      navigate("/dashboard");
    } else {
      toast.error(result.error || "Login gagal");
    }
    setIsLoading(false);
  };

  const onRegisterSubmit = async (data: RegisterFormValues) => {
    setIsLoading(true);
    const userData = {
      name: data.name,
      email: data.email,
      password: data.password,
      work_unit_id: parseInt(data.work_unit),
      nip: data.nip,
      phone: data.phone,
      jabatan: data.jabatan,
      pangkat_golongan: data.pangkat_golongan,
      tmt_pns: data.tmt_pns,
      tmt_pensiun: data.tmt_pensiun,
      riwayat_jabatan: data.riwayat_jabatan,
      riwayat_mutasi: data.riwayat_mutasi,
    };

    const result = await register(userData);
    if (result.success) {
      toast.success("Registrasi berhasil!");
      navigate("/dashboard");
    } else {
      toast.error(result.error || "Registrasi gagal");
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-primary via-primary-glow to-accent p-4 py-8">
      <Card className="w-full max-w-2xl shadow-2xl my-8">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary rounded-xl">
              <Building2 className="h-10 w-10 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">SIPANDAI</CardTitle>
          <CardDescription>Sistem Pelayanan Administrasi Digital ASN Terintegrasi</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Daftar</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4 max-w-md mx-auto">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input id="login-email" type="email" placeholder="nama@email.com" className="pl-9" {...loginForm.register("email")} />
                  </div>
                  {loginForm.formState.errors.email && (
                    <p className="text-sm text-destructive">{loginForm.formState.errors.email.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input id="login-password" type="password" placeholder="••••••••" className="pl-9" {...loginForm.register("password")} />
                  </div>
                  {loginForm.formState.errors.password && (
                    <p className="text-sm text-destructive">{loginForm.formState.errors.password.message}</p>
                  )}
                </div>
                <Button type="submit" className="w-full" isLoading={isLoading}>
                  Login
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="register">
              <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  {/* Basic Info */}
                  <div className="space-y-2">
                    <Label htmlFor="register-name">Nama Lengkap</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input id="register-name" placeholder="Nama lengkap Anda" className="pl-9" {...registerForm.register("name")} />
                    </div>
                    {registerForm.formState.errors.name && <p className="text-sm text-destructive">{registerForm.formState.errors.name.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input id="register-email" type="email" placeholder="nama@email.com" className="pl-9" {...registerForm.register("email")} />
                    </div>
                    {registerForm.formState.errors.email && <p className="text-sm text-destructive">{registerForm.formState.errors.email.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-nip">NIP</Label>
                    <div className="relative">
                      <IdCard className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input id="register-nip" placeholder="Nomor Induk Pegawai" className="pl-9" {...registerForm.register("nip")} />
                    </div>
                    {registerForm.formState.errors.nip && <p className="text-sm text-destructive">{registerForm.formState.errors.nip.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-phone">No. Telepon</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input id="register-phone" type="tel" placeholder="08xxxxxxxxxx" className="pl-9" {...registerForm.register("phone")} />
                    </div>
                    {registerForm.formState.errors.phone && <p className="text-sm text-destructive">{registerForm.formState.errors.phone.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-unit">Unit Kerja</Label>
                    <Controller
                      control={registerForm.control}
                      name="work_unit"
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih unit kerja" />
                          </SelectTrigger>
                          <SelectContent>
                            {WORK_UNITS.map(unit => (
                              <SelectItem key={unit.id} value={unit.id.toString()}>
                                {unit.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {registerForm.formState.errors.work_unit && <p className="text-sm text-destructive">{registerForm.formState.errors.work_unit.message}</p>}
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Briefcase className="h-5 w-5" />
                    Data Kepegawaian
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="register-jabatan">Jabatan Saat Ini</Label>
                      <Input id="register-jabatan" placeholder="Sesuai SK Terakhir" {...registerForm.register("jabatan")} />
                      {registerForm.formState.errors.jabatan && <p className="text-sm text-destructive">{registerForm.formState.errors.jabatan.message}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="register-pangkat">Pangkat/Golongan</Label>
                      <Controller
                        control={registerForm.control}
                        name="pangkat_golongan"
                        render={({ field }) => (
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih Pangkat/Golongan" />
                            </SelectTrigger>
                            <SelectContent>
                              {PANGKAT_GOLONGAN_OPTIONS.map((group) => (
                                <SelectGroup key={group.label}>
                                  <SelectLabel>{group.label}</SelectLabel>
                                  {group.options.map((option) => (
                                    <SelectItem key={option} value={option}>
                                      {option}
                                    </SelectItem>
                                  ))}
                                </SelectGroup>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                      {registerForm.formState.errors.pangkat_golongan && <p className="text-sm text-destructive">{registerForm.formState.errors.pangkat_golongan.message}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="register-tmt-pns">TMT PNS</Label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input id="register-tmt-pns" type="date" className="pl-9" {...registerForm.register("tmt_pns")} />
                      </div>
                      {registerForm.formState.errors.tmt_pns && <p className="text-sm text-destructive">{registerForm.formState.errors.tmt_pns.message}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="register-tmt-pensiun">TMT Pensiun</Label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input id="register-tmt-pensiun" type="date" className="pl-9" {...registerForm.register("tmt_pensiun")} />
                      </div>
                      {registerForm.formState.errors.tmt_pensiun && <p className="text-sm text-destructive">{registerForm.formState.errors.tmt_pensiun.message}</p>}
                    </div>
                  </div>
                </div>

                {/* Riwayat Jabatan */}
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Briefcase className="h-5 w-5" />
                      Riwayat Jabatan (Opsional)
                    </h3>
                    <Button type="button" variant="outline" size="sm" onClick={() => appendJabatan({ jabatan: "", tmt: "" })}>
                      <Plus className="h-4 w-4 mr-2" />
                      Tambah Riwayat
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {jabatanFields.map((field, index) => (
                      <div key={field.id} className="flex gap-4 items-end p-4 border rounded-lg bg-muted/20">
                        <div className="flex-1 space-y-2">
                          <Label>Nama Jabatan</Label>
                          <Input placeholder="Nama Jabatan" {...registerForm.register(`riwayat_jabatan.${index}.jabatan`)} />
                          {registerForm.formState.errors.riwayat_jabatan?.[index]?.jabatan && (
                            <p className="text-sm text-destructive">{registerForm.formState.errors.riwayat_jabatan[index]?.jabatan?.message}</p>
                          )}
                        </div>
                        <div className="flex-1 space-y-2">
                          <Label>TMT Jabatan</Label>
                          <Input type="date" {...registerForm.register(`riwayat_jabatan.${index}.tmt`)} />
                          {registerForm.formState.errors.riwayat_jabatan?.[index]?.tmt && (
                            <p className="text-sm text-destructive">{registerForm.formState.errors.riwayat_jabatan[index]?.tmt?.message}</p>
                          )}
                        </div>
                        <Button type="button" variant="ghost" size="icon" className="text-destructive hover:text-destructive/90" onClick={() => removeJabatan(index)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    {jabatanFields.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4 border border-dashed rounded-lg">
                        Belum ada riwayat jabatan ditambahkan
                      </p>
                    )}
                  </div>
                </div>

                {/* Riwayat Mutasi */}
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <GitCompare className="h-5 w-5" />
                      Riwayat Mutasi (Opsional)
                    </h3>
                    <Button type="button" variant="outline" size="sm" onClick={() => appendMutasi({ jenis_mutasi: "", tmt: "" })}>
                      <Plus className="h-4 w-4 mr-2" />
                      Tambah Mutasi
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {mutasiFields.map((field, index) => (
                      <div key={field.id} className="flex gap-4 items-end p-4 border rounded-lg bg-muted/20">
                        <div className="flex-1 space-y-2">
                          <Label>Jenis Mutasi / Unit Kerja</Label>
                          <Input placeholder="Contoh: Mutasi ke Dinas X" {...registerForm.register(`riwayat_mutasi.${index}.jenis_mutasi`)} />
                          {registerForm.formState.errors.riwayat_mutasi?.[index]?.jenis_mutasi && (
                            <p className="text-sm text-destructive">{registerForm.formState.errors.riwayat_mutasi[index]?.jenis_mutasi?.message}</p>
                          )}
                        </div>
                        <div className="flex-1 space-y-2">
                          <Label>TMT Mutasi</Label>
                          <Input type="date" {...registerForm.register(`riwayat_mutasi.${index}.tmt`)} />
                          {registerForm.formState.errors.riwayat_mutasi?.[index]?.tmt && (
                            <p className="text-sm text-destructive">{registerForm.formState.errors.riwayat_mutasi[index]?.tmt?.message}</p>
                          )}
                        </div>
                        <Button type="button" variant="ghost" size="icon" className="text-destructive hover:text-destructive/90" onClick={() => removeMutasi(index)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    {mutasiFields.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4 border border-dashed rounded-lg">
                        Belum ada riwayat mutasi ditambahkan
                      </p>
                    )}
                  </div>
                </div>

                <div className="border-t pt-4 grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="register-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input id="register-password" type="password" placeholder="Min. 6 karakter" className="pl-9" {...registerForm.register("password")} />
                    </div>
                    {registerForm.formState.errors.password && <p className="text-sm text-destructive">{registerForm.formState.errors.password.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-confirm">Konfirmasi Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input id="register-confirm" type="password" placeholder="Ulangi password" className="pl-9" {...registerForm.register("confirmPassword")} />
                    </div>
                    {registerForm.formState.errors.confirmPassword && <p className="text-sm text-destructive">{registerForm.formState.errors.confirmPassword.message}</p>}
                  </div>
                </div>

                <Button type="submit" className="w-full" isLoading={isLoading}>
                  Daftar Sekarang
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}