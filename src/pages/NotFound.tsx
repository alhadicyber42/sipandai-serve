import { useNavigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { FileQuestion, Home, ArrowLeft } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 text-center">
      <div className="space-y-6 max-w-md animate-in fade-in zoom-in duration-500">
        {/* Icon Illustration */}
        <div className="relative mx-auto w-32 h-32 flex items-center justify-center">
          <div className="absolute inset-0 bg-primary/10 rounded-full animate-pulse" />
          <FileQuestion className="h-16 w-16 text-primary relative z-10" />
        </div>

        {/* Text Content */}
        <div className="space-y-2">
          <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl text-primary">404</h1>
          <h2 className="text-2xl font-semibold tracking-tight">Halaman Tidak Ditemukan</h2>
          <p className="text-muted-foreground">
            Maaf, halaman yang Anda cari ({location.pathname}) tidak dapat ditemukan atau telah dipindahkan.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
          <Button variant="outline" onClick={() => navigate(-1)} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Kembali
          </Button>
          <Button onClick={() => navigate("/")} className="gap-2">
            <Home className="h-4 w-4" />
            Ke Beranda
          </Button>
        </div>
      </div>

      {/* Footer Help */}
      <div className="absolute bottom-8 text-sm text-muted-foreground">
        Butuh bantuan? <a href="#" className="text-primary hover:underline">Hubungi Admin</a>
      </div>
    </div>
  );
};

export default NotFound;
