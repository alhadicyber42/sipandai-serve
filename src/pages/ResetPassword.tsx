import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Building2, Lock, Eye, EyeOff, CheckCircle2, ArrowLeft, Loader2, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isValidSession, setIsValidSession] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Check if user has a valid recovery session
  useEffect(() => {
    const checkRecoverySession = async () => {
      // Check URL hash for access_token (Supabase recovery flow)
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get("access_token");
      const type = hashParams.get("type");
      const errorDescription = hashParams.get("error_description");

      // Check if there's an error in the URL
      if (errorDescription) {
        setErrorMessage(decodeURIComponent(errorDescription.replace(/\+/g, " ")));
        setIsValidSession(false);
        return;
      }

      // If we have recovery token in URL, Supabase will handle the session automatically
      if (accessToken && type === "recovery") {
        // Wait a moment for Supabase to process the token
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          setErrorMessage(error.message);
          setIsValidSession(false);
          return;
        }

        if (session) {
          setIsValidSession(true);
          return;
        }
      }

      // Check for existing session (in case user is already authenticated via recovery)
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        setIsValidSession(true);
      } else {
        // No valid session found
        setErrorMessage("Link reset password tidak valid atau sudah kadaluarsa. Silakan minta link reset password baru.");
        setIsValidSession(false);
      }
    };

    // Listen for auth state changes (for when recovery token is processed)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsValidSession(true);
        setErrorMessage(null);
      } else if (event === "SIGNED_IN" && session) {
        setIsValidSession(true);
        setErrorMessage(null);
      }
    });

    checkRecoverySession();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

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

  const validatePassword = () => {
    if (password.length < 8) {
      toast.error("Password minimal 8 karakter");
      return false;
    }
    if (!/[a-z]/.test(password)) {
      toast.error("Password harus mengandung huruf kecil");
      return false;
    }
    if (!/[A-Z]/.test(password)) {
      toast.error("Password harus mengandung huruf besar");
      return false;
    }
    if (!/[0-9]/.test(password)) {
      toast.error("Password harus mengandung angka");
      return false;
    }
    if (password !== confirmPassword) {
      toast.error("Password dan konfirmasi password tidak cocok");
      return false;
    }
    return true;
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validatePassword()) return;

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        toast.error(error.message || "Gagal mengubah password");
      } else {
        setIsSuccess(true);
        toast.success("Password berhasil diubah!");
        
        // Sign out and redirect to login
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

  const handleRequestNewLink = () => {
    navigate("/auth");
  };

  // Loading state while checking session
  if (isValidSession === null) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 dark:from-slate-950 dark:via-blue-950/30 dark:to-indigo-950/40 p-4">
        <Card className="w-full max-w-md shadow-2xl border-2 border-white/20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Memverifikasi link reset password...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Invalid session state
  if (!isValidSession) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 dark:from-slate-950 dark:via-blue-950/30 dark:to-indigo-950/40 p-4">
        {/* Animated Background Elements */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute w-[500px] h-[500px] bg-gradient-to-r from-red-400/20 to-orange-400/20 rounded-full blur-3xl top-0 -left-48 animate-pulse" />
          <div className="absolute w-[600px] h-[600px] bg-gradient-to-r from-purple-400/15 to-pink-400/15 rounded-full blur-3xl bottom-0 -right-48 animate-pulse delay-1000" />
        </div>

        <Card className="w-full max-w-md shadow-2xl border-2 border-white/20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl relative z-10">
          <CardHeader className="space-y-1 text-center pb-6">
            <div className="flex justify-center mb-4">
              <div className="relative p-4 bg-gradient-to-br from-red-500 to-orange-500 rounded-2xl shadow-lg">
                <AlertCircle className="h-12 w-12 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-red-600 dark:text-red-400">
              Link Tidak Valid
            </CardTitle>
            <CardDescription className="text-base">
              {errorMessage || "Link reset password tidak valid atau sudah kadaluarsa."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              Silakan kembali ke halaman login dan minta link reset password baru melalui fitur "Lupa Password".
            </p>
            <Button
              onClick={handleRequestNewLink}
              className="w-full h-12 text-base font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              <ArrowLeft className="mr-2 h-5 w-5" />
              Kembali ke Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Success state
  if (isSuccess) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 dark:from-slate-950 dark:via-blue-950/30 dark:to-indigo-950/40 p-4">
        {/* Animated Background Elements */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute w-[500px] h-[500px] bg-gradient-to-r from-green-400/20 to-emerald-400/20 rounded-full blur-3xl top-0 -left-48 animate-pulse" />
          <div className="absolute w-[600px] h-[600px] bg-gradient-to-r from-blue-400/15 to-cyan-400/15 rounded-full blur-3xl bottom-0 -right-48 animate-pulse delay-1000" />
        </div>

        <Card className="w-full max-w-md shadow-2xl border-2 border-white/20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl relative z-10">
          <CardHeader className="space-y-1 text-center pb-6">
            <div className="flex justify-center mb-4">
              <div className="relative p-4 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl shadow-lg shadow-green-500/50 animate-bounce">
                <CheckCircle2 className="h-12 w-12 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-green-600 dark:text-green-400">
              Password Berhasil Diubah!
            </CardTitle>
            <CardDescription className="text-base">
              Anda akan dialihkan ke halaman login...
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => navigate("/auth")}
              className="w-full h-12 text-base font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              Login Sekarang
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Reset password form
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 dark:from-slate-950 dark:via-blue-950/30 dark:to-indigo-950/40 p-4 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-[500px] h-[500px] bg-gradient-to-r from-blue-400/20 to-indigo-400/20 rounded-full blur-3xl top-0 -left-48 animate-pulse" />
        <div className="absolute w-[600px] h-[600px] bg-gradient-to-r from-purple-400/15 to-pink-400/15 rounded-full blur-3xl bottom-0 -right-48 animate-pulse delay-1000" />
      </div>

      {/* Back Button */}
      <Button
        variant="ghost"
        size="sm"
        className="absolute top-4 left-4 z-10 gap-2 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm hover:bg-white/80 dark:hover:bg-slate-900/80"
        onClick={() => navigate("/auth")}
      >
        <ArrowLeft className="h-4 w-4" />
        Kembali
      </Button>

      <Card className="w-full max-w-md shadow-2xl border-2 border-white/20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl relative z-10">
        <CardHeader className="space-y-1 text-center pb-6">
          <div className="flex justify-center mb-4">
            <div className="relative p-4 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl shadow-lg shadow-blue-500/50 group hover:shadow-blue-500/70 transition-all">
              <Building2 className="h-12 w-12 text-white" />
              <div className="absolute inset-0 bg-white/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Reset Password
          </CardTitle>
          <CardDescription className="text-base">
            Masukkan password baru Anda
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleResetPassword} className="space-y-6">
            {/* New Password */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-base font-semibold">
                Password Baru
              </Label>
              <div className="relative group">
                <Lock className="absolute left-3 top-3.5 h-5 w-5 text-muted-foreground group-focus-within:text-blue-600 transition-colors" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 h-12 text-base border-2 focus:border-blue-600 transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3.5 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              
              {/* Password Strength Indicator */}
              {password && (
                <div className="space-y-2">
                  <div className="flex gap-1">
                    {[1, 2, 3].map((level) => (
                      <div
                        key={level}
                        className={`h-1.5 flex-1 rounded-full transition-colors ${
                          level <= passwordStrength.score
                            ? passwordStrength.color
                            : "bg-muted"
                        }`}
                      />
                    ))}
                  </div>
                  <p className={`text-xs font-medium ${
                    passwordStrength.score === 1 ? "text-red-500" :
                    passwordStrength.score === 2 ? "text-yellow-500" : "text-green-500"
                  }`}>
                    Kekuatan password: {passwordStrength.label}
                  </p>
                </div>
              )}
              
              <div className="text-xs text-muted-foreground space-y-1">
                <p className={password.length >= 8 ? "text-green-600" : ""}>• Minimal 8 karakter</p>
                <p className={/[a-z]/.test(password) ? "text-green-600" : ""}>• Mengandung huruf kecil</p>
                <p className={/[A-Z]/.test(password) ? "text-green-600" : ""}>• Mengandung huruf besar</p>
                <p className={/[0-9]/.test(password) ? "text-green-600" : ""}>• Mengandung angka</p>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-base font-semibold">
                Konfirmasi Password
              </Label>
              <div className="relative group">
                <Lock className="absolute left-3 top-3.5 h-5 w-5 text-muted-foreground group-focus-within:text-blue-600 transition-colors" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10 pr-10 h-12 text-base border-2 focus:border-blue-600 transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-3.5 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {confirmPassword && password !== confirmPassword && (
                <p className="text-xs text-red-500">Password tidak cocok</p>
              )}
              {confirmPassword && password === confirmPassword && (
                <p className="text-xs text-green-600">Password cocok</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-base font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/30"
              disabled={isLoading || !password || !confirmPassword}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Mengubah Password...
                </>
              ) : (
                "Ubah Password"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
