import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MultiStepForm } from "@/components/ui/multi-step-form";
import { toast } from "sonner";
import { Building2, Mail, Lock, User, Phone, IdCard, Briefcase, Calendar, Plus, Trash2, GitCompare, ArrowLeft, CheckCircle2 } from "lucide-react";
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
  kriteria_asn: z.string().min(1, "Kriteria ASN diperlukan"),
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
  const [registerStep, setRegisterStep] = useState(1);

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
    mode: "onChange",
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
      kriteria_asn: "",
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
  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  if (user) {
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

  const validateStep = async (step: number): Promise<boolean> => {
    let fieldsToValidate: (keyof RegisterFormValues)[] = [];

    switch (step) {
      case 1:
        fieldsToValidate = ["name", "email", "nip", "phone", "work_unit"];
        break;
      case 2:
        fieldsToValidate = ["jabatan", "pangkat_golongan", "tmt_pns", "tmt_pensiun", "kriteria_asn"];
        break;
      case 3:
        // Riwayat is optional, always valid
        return true;
      case 4:
        fieldsToValidate = ["password", "confirmPassword"];
        break;
    }

    const result = await registerForm.trigger(fieldsToValidate);
    return result;
  };

  const handleNext = async () => {
    const isValid = await validateStep(registerStep);

    if (!isValid) {
      toast.error("Mohon lengkapi semua field yang diperlukan");
      return;
    }

    if (registerStep < 4) {
      setRegisterStep(registerStep + 1);
    } else {
      // Submit form
      registerForm.handleSubmit(onRegisterSubmit)();
    }
  };

  const handleBack = () => {
    if (registerStep > 1) {
      setRegisterStep(registerStep - 1);
    }
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
      kriteria_asn: data.kriteria_asn,
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

  const getStepTitle = () => {
    switch (registerStep) {
      case 1: return "Data Pribadi";
      case 2: return "Data Kepegawaian";
      case 3: return "Riwayat (Opsional)";
      case 4: return "Keamanan & Review";
      default: return "";
    }
  };

  const getStepDescription = () => {
    switch (registerStep) {
      case 1: return "Masukkan informasi pribadi Anda";
      case 2: return "Lengkapi data kepegawaian Anda";
      case 3: return "Tambahkan riwayat jabatan dan mutasi (opsional)";
      case 4: return "Buat password dan review data Anda";
      default: return "";
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 dark:from-slate-950 dark:via-blue-950/30 dark:to-indigo-950/40 p-3 md:p-4 py-4 md:py-8 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-[300px] h-[300px] md:w-[500px] md:h-[500px] bg-gradient-to-r from-blue-400/20 to-indigo-400/20 rounded-full blur-3xl top-0 -left-48 animate-pulse" />
        <div className="absolute w-[400px] h-[400px] md:w-[600px] md:h-[600px] bg-gradient-to-r from-purple-400/15 to-pink-400/15 rounded-full blur-3xl bottom-0 -right-48 animate-pulse delay-1000" />
      </div>

      {/* Back to Home Button */}
      <Button
        variant="ghost"
        size="sm"
        className="absolute top-2 left-2 md:top-4 md:left-4 z-10 gap-1 md:gap-2 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm hover:bg-white/80 dark:hover:bg-slate-900/80 h-8 md:h-9 px-2 md:px-3 text-xs md:text-sm"
        onClick={() => navigate("/")}
      >
        <ArrowLeft className="h-3 w-3 md:h-4 md:w-4" />
        <span className="hidden sm:inline">Kembali</span>
      </Button>

      {activeTab === "login" ? (
        <Card className="w-full max-w-md shadow-2xl border-2 border-white/20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl my-4 md:my-8 relative z-10">
          <CardHeader className="space-y-1 text-center pb-6 md:pb-8 pt-6 md:pt-6">
            <div className="flex justify-center mb-3 md:mb-4">
              <div className="relative p-3 md:p-4 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl md:rounded-2xl shadow-lg shadow-blue-500/50 group hover:shadow-blue-500/70 transition-all">
                <Building2 className="h-8 w-8 md:h-12 md:w-12 text-white" />
                <div className="absolute inset-0 bg-white/20 rounded-xl md:rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
            <CardTitle className="text-2xl md:text-3xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              SIPANDAI
            </CardTitle>
            <CardDescription className="text-sm md:text-base px-2">
              Sistem Pelayanan Administrasi Digital ASN Terintegrasi
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 md:px-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6 md:mb-8 h-10 md:h-12 bg-muted/50 p-1">
                <TabsTrigger
                  value="login"
                  className="text-sm md:text-base font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white"
                >
                  Login
                </TabsTrigger>
                <TabsTrigger
                  value="register"
                  className="text-sm md:text-base font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white"
                >
                  Daftar
                </TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="data-[state=active]:animate-in data-[state=active]:fade-in data-[state=active]:slide-in-from-bottom-4 data-[state=active]:duration-500">
                <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4 md:space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="login-email" className="text-sm md:text-base font-semibold">Email</Label>
                    <div className="relative group">
                      <Mail className="absolute left-3 top-2.5 md:top-3.5 h-4 w-4 md:h-5 md:w-5 text-muted-foreground group-focus-within:text-blue-600 transition-colors" />
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="nama@email.com"
                        className="pl-9 md:pl-10 h-10 md:h-12 text-sm md:text-base border-2 focus:border-blue-600 transition-all"
                        {...loginForm.register("email")}
                      />
                    </div>
                    {loginForm.formState.errors.email && (
                      <p className="text-xs md:text-sm text-destructive font-medium">{loginForm.formState.errors.email.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password" className="text-sm md:text-base font-semibold">Password</Label>
                    <div className="relative group">
                      <Lock className="absolute left-3 top-2.5 md:top-3.5 h-4 w-4 md:h-5 md:w-5 text-muted-foreground group-focus-within:text-blue-600 transition-colors" />
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="••••••••"
                        className="pl-9 md:pl-10 h-10 md:h-12 text-sm md:text-base border-2 focus:border-blue-600 transition-all"
                        {...loginForm.register("password")}
                      />
                    </div>
                    {loginForm.formState.errors.password && (
                      <p className="text-xs md:text-sm text-destructive font-medium">{loginForm.formState.errors.password.message}</p>
                    )}
                  </div>
                  <Button
                    type="submit"
                    className="w-full h-10 md:h-12 text-sm md:text-base font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all"
                    isLoading={isLoading}
                  >
                    Login
                  </Button>
                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => setActiveTab("register")}
                      className="text-xs md:text-sm text-blue-600 hover:text-blue-700 font-medium hover:underline"
                    >
                      Belum punya akun? Daftar sekarang
                    </button>
                  </div>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      ) : (
        <MultiStepForm
          currentStep={registerStep}
          totalSteps={4}
          title={getStepTitle()}
          description={getStepDescription()}
          onBack={handleBack}
          onNext={handleNext}
          onClose={() => setActiveTab("login")}
          nextButtonText={registerStep === 4 ? "Daftar Sekarang" : "Lanjut"}
          isLoading={isLoading}
          size="lg"
          className="w-full my-4 md:my-8 relative z-10"
        >
          {/* Step 1: Data Pribadi */}
          {registerStep === 1 && (
            <div className="space-y-4 md:space-y-6">
              <div className="grid md:grid-cols-2 gap-3 md:gap-4">
                <div className="space-y-2">
                  <Label htmlFor="register-name" className="text-xs md:text-sm font-semibold">Nama Lengkap</Label>
                  <div className="relative group">
                    <User className="absolute left-2.5 md:left-3 top-2.5 md:top-3 h-3.5 w-3.5 md:h-4 md:w-4 text-muted-foreground group-focus-within:text-blue-600 transition-colors" />
                    <Input
                      id="register-name"
                      placeholder="Nama lengkap Anda"
                      className="pl-8 md:pl-9 h-9 md:h-10 text-sm border-2 focus:border-blue-600 transition-all"
                      {...registerForm.register("name")}
                    />
                  </div>
                  {registerForm.formState.errors.name && <p className="text-xs md:text-sm text-destructive font-medium">{registerForm.formState.errors.name.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-email" className="text-xs md:text-sm font-semibold">Email</Label>
                  <div className="relative group">
                    <Mail className="absolute left-2.5 md:left-3 top-2.5 md:top-3 h-3.5 w-3.5 md:h-4 md:w-4 text-muted-foreground group-focus-within:text-blue-600 transition-colors" />
                    <Input
                      id="register-email"
                      type="email"
                      placeholder="nama@email.com"
                      className="pl-8 md:pl-9 h-9 md:h-10 text-sm border-2 focus:border-blue-600 transition-all"
                      {...registerForm.register("email")}
                    />
                  </div>
                  {registerForm.formState.errors.email && <p className="text-xs md:text-sm text-destructive font-medium">{registerForm.formState.errors.email.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-nip" className="text-xs md:text-sm font-semibold">NIP</Label>
                  <div className="relative group">
                    <IdCard className="absolute left-2.5 md:left-3 top-2.5 md:top-3 h-3.5 w-3.5 md:h-4 md:w-4 text-muted-foreground group-focus-within:text-blue-600 transition-colors" />
                    <Input
                      id="register-nip"
                      placeholder="Nomor Induk Pegawai"
                      className="pl-8 md:pl-9 h-9 md:h-10 text-sm border-2 focus:border-blue-600 transition-all"
                      {...registerForm.register("nip")}
                    />
                  </div>
                  {registerForm.formState.errors.nip && <p className="text-xs md:text-sm text-destructive font-medium">{registerForm.formState.errors.nip.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-phone" className="text-xs md:text-sm font-semibold">No. Telepon</Label>
                  <div className="relative group">
                    <Phone className="absolute left-2.5 md:left-3 top-2.5 md:top-3 h-3.5 w-3.5 md:h-4 md:w-4 text-muted-foreground group-focus-within:text-blue-600 transition-colors" />
                    <Input
                      id="register-phone"
                      type="tel"
                      placeholder="08xxxxxxxxxx"
                      className="pl-8 md:pl-9 h-9 md:h-10 text-sm border-2 focus:border-blue-600 transition-all"
                      {...registerForm.register("phone")}
                    />
                  </div>
                  {registerForm.formState.errors.phone && <p className="text-xs md:text-sm text-destructive font-medium">{registerForm.formState.errors.phone.message}</p>}
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="register-unit" className="text-xs md:text-sm font-semibold">Unit Kerja</Label>
                  <Controller
                    control={registerForm.control}
                    name="work_unit"
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger className="border-2 focus:border-blue-600 transition-all h-9 md:h-10 text-sm">
                          <SelectValue placeholder="Pilih unit kerja" />
                        </SelectTrigger>
                        <SelectContent>
                          {WORK_UNITS.map(unit => (
                            <SelectItem key={unit.id} value={unit.id.toString()} className="text-sm">
                              {unit.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {registerForm.formState.errors.work_unit && <p className="text-xs md:text-sm text-destructive font-medium">{registerForm.formState.errors.work_unit.message}</p>}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Data Kepegawaian */}
          {registerStep === 2 && (
            <div className="space-y-4 md:space-y-6">
              <div className="grid md:grid-cols-2 gap-3 md:gap-4">
                <div className="space-y-2">
                  <Label htmlFor="register-jabatan" className="text-xs md:text-sm font-semibold">Jabatan Saat Ini</Label>
                  <Input
                    id="register-jabatan"
                    placeholder="Sesuai SK Terakhir"
                    className="border-2 focus:border-blue-600 transition-all h-9 md:h-10 text-sm"
                    {...registerForm.register("jabatan")}
                  />
                  {registerForm.formState.errors.jabatan && <p className="text-xs md:text-sm text-destructive font-medium">{registerForm.formState.errors.jabatan.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-pangkat" className="text-xs md:text-sm font-semibold">Pangkat/Golongan</Label>
                  <Controller
                    control={registerForm.control}
                    name="pangkat_golongan"
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger className="border-2 focus:border-blue-600 transition-all h-9 md:h-10 text-sm">
                          <SelectValue placeholder="Pilih Pangkat/Golongan" />
                        </SelectTrigger>
                        <SelectContent>
                          {PANGKAT_GOLONGAN_OPTIONS.map((group) => (
                            <SelectGroup key={group.label}>
                              <SelectLabel className="text-xs">{group.label}</SelectLabel>
                              {group.options.map((option) => (
                                <SelectItem key={option} value={option} className="text-sm">
                                  {option}
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {registerForm.formState.errors.pangkat_golongan && <p className="text-xs md:text-sm text-destructive font-medium">{registerForm.formState.errors.pangkat_golongan.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-tmt-pns" className="text-xs md:text-sm font-semibold">TMT PNS</Label>
                  <div className="relative group">
                    <Calendar className="absolute left-2.5 md:left-3 top-2.5 md:top-3 h-3.5 w-3.5 md:h-4 md:w-4 text-muted-foreground group-focus-within:text-blue-600 transition-colors" />
                    <Input
                      id="register-tmt-pns"
                      type="date"
                      className="pl-8 md:pl-9 border-2 focus:border-blue-600 transition-all h-9 md:h-10 text-sm"
                      {...registerForm.register("tmt_pns")}
                    />
                  </div>
                  {registerForm.formState.errors.tmt_pns && <p className="text-xs md:text-sm text-destructive font-medium">{registerForm.formState.errors.tmt_pns.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-tmt-pensiun" className="text-xs md:text-sm font-semibold">TMT Pensiun</Label>
                  <div className="relative group">
                    <Calendar className="absolute left-2.5 md:left-3 top-2.5 md:top-3 h-3.5 w-3.5 md:h-4 md:w-4 text-muted-foreground group-focus-within:text-blue-600 transition-colors" />
                    <Input
                      id="register-tmt-pensiun"
                      type="date"
                      className="pl-8 md:pl-9 border-2 focus:border-blue-600 transition-all h-9 md:h-10 text-sm"
                      {...registerForm.register("tmt_pensiun")}
                    />
                  </div>
                  {registerForm.formState.errors.tmt_pensiun && <p className="text-xs md:text-sm text-destructive font-medium">{registerForm.formState.errors.tmt_pensiun.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-kriteria-asn" className="text-xs md:text-sm font-semibold">Kriteria ASN</Label>
                  <Controller
                    control={registerForm.control}
                    name="kriteria_asn"
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger className="border-2 focus:border-blue-600 transition-all h-9 md:h-10 text-sm">
                          <SelectValue placeholder="Pilih Kriteria ASN" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ASN" className="text-sm">ASN</SelectItem>
                          <SelectItem value="Non ASN" className="text-sm">Non ASN</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {registerForm.formState.errors.kriteria_asn && <p className="text-xs md:text-sm text-destructive font-medium">{registerForm.formState.errors.kriteria_asn.message}</p>}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Riwayat */}
          {registerStep === 3 && (
            <div className="space-y-8">
              {/* Riwayat Jabatan */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    <Briefcase className="h-5 w-5 text-blue-600" />
                    Riwayat Jabatan
                  </h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => appendJabatan({ jabatan: "", tmt: "" })}
                    className="border-2 border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Tambah
                  </Button>
                </div>

                <div className="space-y-4">
                  {jabatanFields.map((field, index) => (
                    <div key={field.id} className="flex gap-4 items-end p-4 border-2 rounded-xl bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/20">
                      <div className="flex-1 space-y-2">
                        <Label className="text-sm font-semibold">Nama Jabatan</Label>
                        <Input
                          placeholder="Nama Jabatan"
                          className="border-2 focus:border-blue-600 transition-all"
                          {...registerForm.register(`riwayat_jabatan.${index}.jabatan`)}
                        />
                      </div>
                      <div className="flex-1 space-y-2">
                        <Label className="text-sm font-semibold">TMT Jabatan</Label>
                        <Input
                          type="date"
                          className="border-2 focus:border-blue-600 transition-all"
                          {...registerForm.register(`riwayat_jabatan.${index}.tmt`)}
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                        onClick={() => removeJabatan(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  {jabatanFields.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-8 border-2 border-dashed rounded-xl bg-muted/20">
                      Belum ada riwayat jabatan ditambahkan
                    </p>
                  )}
                </div>
              </div>

              {/* Riwayat Mutasi */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    <GitCompare className="h-5 w-5 text-blue-600" />
                    Riwayat Mutasi
                  </h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => appendMutasi({ jenis_mutasi: "", tmt: "" })}
                    className="border-2 border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Tambah
                  </Button>
                </div>

                <div className="space-y-4">
                  {mutasiFields.map((field, index) => (
                    <div key={field.id} className="flex gap-4 items-end p-4 border-2 rounded-xl bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/20">
                      <div className="flex-1 space-y-2">
                        <Label className="text-sm font-semibold">Jenis Mutasi / Unit Kerja</Label>
                        <Input
                          placeholder="Contoh: Mutasi ke Dinas X"
                          className="border-2 focus:border-blue-600 transition-all"
                          {...registerForm.register(`riwayat_mutasi.${index}.jenis_mutasi`)}
                        />
                      </div>
                      <div className="flex-1 space-y-2">
                        <Label className="text-sm font-semibold">TMT Mutasi</Label>
                        <Input
                          type="date"
                          className="border-2 focus:border-blue-600 transition-all"
                          {...registerForm.register(`riwayat_mutasi.${index}.tmt`)}
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                        onClick={() => removeMutasi(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  {mutasiFields.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-8 border-2 border-dashed rounded-xl bg-muted/20">
                      Belum ada riwayat mutasi ditambahkan
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Keamanan & Review */}
          {registerStep === 4 && (
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="register-password" className="text-sm font-semibold">Password</Label>
                  <div className="relative group">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground group-focus-within:text-blue-600 transition-colors" />
                    <Input
                      id="register-password"
                      type="password"
                      placeholder="Min. 6 karakter"
                      className="pl-9 border-2 focus:border-blue-600 transition-all"
                      {...registerForm.register("password")}
                    />
                  </div>
                  {registerForm.formState.errors.password && <p className="text-sm text-destructive font-medium">{registerForm.formState.errors.password.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-confirm" className="text-sm font-semibold">Konfirmasi Password</Label>
                  <div className="relative group">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground group-focus-within:text-blue-600 transition-colors" />
                    <Input
                      id="register-confirm"
                      type="password"
                      placeholder="Ulangi password"
                      className="pl-9 border-2 focus:border-blue-600 transition-all"
                      {...registerForm.register("confirmPassword")}
                    />
                  </div>
                  {registerForm.formState.errors.confirmPassword && <p className="text-sm text-destructive font-medium">{registerForm.formState.errors.confirmPassword.message}</p>}
                </div>
              </div>

              {/* Review Summary */}
              <div className="mt-8 p-6 border-2 border-dashed rounded-xl bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/20">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  Review Data Anda
                </h3>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Nama</p>
                    <p className="font-semibold">{registerForm.watch("name") || "-"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Email</p>
                    <p className="font-semibold">{registerForm.watch("email") || "-"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">NIP</p>
                    <p className="font-semibold">{registerForm.watch("nip") || "-"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Jabatan</p>
                    <p className="font-semibold">{registerForm.watch("jabatan") || "-"}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </MultiStepForm>
      )}
    </div>
  );
}