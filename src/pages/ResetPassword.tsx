import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Building2, Lock, Eye, EyeOff, CheckCircle2, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

const passwordSchema = z.object({
  password: z.string()
    .min(8, "Password minimal 8 karakter")
    .max(72, "Password maksimal 72 karakter")
    .regex(/[a-z]/, "Password harus mengandung huruf kecil")
    .regex(/[A-Z]/, "Password harus mengandung huruf besar")
    .regex(/[0-9]/, "Password harus mengandung angka"),
  confirmPassword: z.string().min(1, "Konfirmasi password diperlukan"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Password tidak cocok",
  path: ["confirmPassword"],
});

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string }>({});

  // Password strength indicator
  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { score: 0, label: "", color: "" };

    let score = 0;
    if (pwd.length >= 8) score++;
    if (pwd.length >= 12) score++;
    if (/[a-z]/.test(pwd)) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^a-zA-Z0-9]/.test(pwd)) score++;

    if (score <= 2) return { score: 1, label: "Lemah", color: "bg-red-500" };
    if (score <= 4) return { score: 2, label: "Sedang", color: "bg-yellow-500" };
    return { score: 3, label: "Kuat", color: "bg-green-500" };
  };

  const passwordStrength = getPasswordStrength(password);

  useEffect(() => {
    // Check if we have a valid session from the reset link
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        // No session means the reset link might be invalid or expired
        // We'll let the user try anyway and show an error if it fails
      }
    };
    checkSession();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validate
    const result = passwordSchema.safeParse({ password, confirmPassword });
    if (!result.success) {
      const fieldErrors: { password?: string; confirmPassword?: string } = {};
      result.error.errors.forEach((err) => {
        if (err.path[0] === "password") fieldErrors.password = err.message;
        if (err.path[0] === "confirmPassword") fieldErrors.confirmPassword = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        if (error.message.includes("session")) {
          toast.error("Link reset password sudah kadaluarsa. Silakan minta link baru.");
        } else {
          toast.error(error.message || "Gagal mengubah password");
        }
      } else {
        setIsSuccess(true);
        toast.success("Password berhasil diubah!");
        // Sign out and redirect to login after 2 seconds
        setTimeout(async () => {
          await supabase.auth.signOut();
          navigate("/auth");
        }, 2000);
      }
    } catch (err) {
      toast.error("Terjadi kesalahan saat mengubah password");
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 dark:from-slate-950 dark:via-blue-950/30 dark:to-indigo-950/40 p-4">
        <Card className="w-full max-w-md shadow-2xl border-2 border-white/20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl">
          <CardContent className="pt-8 pb-8 text-center">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-green-100 dark:bg-green-900/30 rounded-full">
                <CheckCircle2 className="h-12 w-12 text-green-600" />
              </div>
            </div>
            <h2 className="text-2xl font-bold mb-2">Password Berhasil Diubah!</h2>
            <p className="text-muted-foreground mb-6">
              Anda akan dialihkan ke halaman login...
            </p>
            <Button
              onClick={() => navigate("/auth")}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              Ke Halaman Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 dark:from-slate-950 dark:via-blue-950/30 dark:to-indigo-950/40 p-3 md:p-4 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-[300px] h-[300px] md:w-[500px] md:h-[500px] bg-gradient-to-r from-blue-400/20 to-indigo-400/20 rounded-full blur-3xl top-0 -left-48 animate-pulse" />
        <div className="absolute w-[400px] h-[400px] md:w-[600px] md:h-[600px] bg-gradient-to-r from-purple-400/15 to-pink-400/15 rounded-full blur-3xl bottom-0 -right-48 animate-pulse delay-1000" />
      </div>

      {/* Back to Login Button */}
      <Button
        variant="ghost"
        size="sm"
        className="absolute top-2 left-2 md:top-4 md:left-4 z-10 gap-1 md:gap-2 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm hover:bg-white/80 dark:hover:bg-slate-900/80 h-8 md:h-9 px-2 md:px-3 text-xs md:text-sm"
        onClick={() => navigate("/auth")}
      >
        <ArrowLeft className="h-3 w-3 md:h-4 md:w-4" />
        <span className="hidden sm:inline">Kembali</span>
      </Button>

      <Card className="w-full max-w-md shadow-2xl border-2 border-white/20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl relative z-10">
        <CardHeader className="space-y-1 text-center pb-6 pt-6">
          <div className="flex justify-center mb-4">
            <div className="relative p-3 md:p-4 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl md:rounded-2xl shadow-lg shadow-blue-500/50">
              <Building2 className="h-8 w-8 md:h-12 md:w-12 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl md:text-3xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Reset Password
          </CardTitle>
          <CardDescription className="text-sm md:text-base px-2">
            Masukkan password baru untuk akun Anda
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 md:px-6">
          <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm md:text-base font-semibold">Password Baru</Label>
              <div className="relative group">
                <Lock className="absolute left-3 top-2.5 md:top-3.5 h-4 w-4 md:h-5 md:w-5 text-muted-foreground group-focus-within:text-blue-600 transition-colors" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Min. 8 karakter, huruf besar, kecil & angka"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9 md:pl-10 pr-10 h-10 md:h-12 text-sm md:text-base border-2 focus:border-blue-600 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 md:top-3.5 h-4 w-4 md:h-5 md:w-5 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4 md:h-5 md:w-5" /> : <Eye className="h-4 w-4 md:h-5 md:w-5" />}
                </button>
              </div>
              {/* Password Strength Indicator */}
              {password && (
                <div className="space-y-1">
                  <div className="flex gap-1">
                    {[1, 2, 3].map((level) => (
                      <div
                        key={level}
                        className={`h-1.5 flex-1 rounded-full transition-all ${
                          passwordStrength.score >= level ? passwordStrength.color : "bg-muted"
                        }`}
                      />
                    ))}
                  </div>
                  <p className={`text-xs font-medium ${
                    passwordStrength.score === 1 ? "text-red-500" :
                    passwordStrength.score === 2 ? "text-yellow-600" :
                    "text-green-600"
                  }`}>
                    Kekuatan: {passwordStrength.label}
                  </p>
                </div>
              )}
              {errors.password && (
                <p className="text-xs md:text-sm text-destructive font-medium">{errors.password}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Password harus mengandung: huruf besar, huruf kecil, dan angka
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm md:text-base font-semibold">Konfirmasi Password</Label>
              <div className="relative group">
                <Lock className="absolute left-3 top-2.5 md:top-3.5 h-4 w-4 md:h-5 md:w-5 text-muted-foreground group-focus-within:text-blue-600 transition-colors" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Ulangi password baru"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-9 md:pl-10 pr-10 h-10 md:h-12 text-sm md:text-base border-2 focus:border-blue-600 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-2.5 md:top-3.5 h-4 w-4 md:h-5 md:w-5 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4 md:h-5 md:w-5" /> : <Eye className="h-4 w-4 md:h-5 md:w-5" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-xs md:text-sm text-destructive font-medium">{errors.confirmPassword}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full h-10 md:h-12 text-sm md:text-base font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all"
              disabled={isLoading}
            >
              {isLoading ? "Menyimpan..." : "Simpan Password Baru"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
