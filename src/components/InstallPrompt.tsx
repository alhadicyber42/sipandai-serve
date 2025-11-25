import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Download, Smartphone, Share, MoreVertical } from "lucide-react";

const INSTALL_DISMISSED_KEY = 'sipandai-install-dismissed';
const DISMISS_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

export function InstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [isIOS, setIsIOS] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);

    useEffect(() => {
        // Check if running in standalone mode (already installed)
        const standalone = window.matchMedia('(display-mode: standalone)').matches 
            || (window.navigator as any).standalone 
            || document.referrer.includes('android-app://');
        
        setIsStandalone(standalone);

        // Detect iOS
        const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
        setIsIOS(ios);

        // Check if user dismissed the prompt recently
        const dismissedTime = localStorage.getItem(INSTALL_DISMISSED_KEY);
        const now = Date.now();
        
        let shouldShowPrompt = false;

        if (dismissedTime) {
            const timeSinceDismiss = now - parseInt(dismissedTime, 10);
            if (timeSinceDismiss > DISMISS_DURATION) {
                // More than 7 days since last dismiss, show again
                shouldShowPrompt = true;
                localStorage.removeItem(INSTALL_DISMISSED_KEY);
            }
        } else {
            // Never dismissed before, show prompt
            shouldShowPrompt = true;
        }

        // Don't show if already installed
        if (standalone) {
            shouldShowPrompt = false;
        }

        // Handler for Android/Chrome install prompt
        const handler = (e: any) => {
            e.preventDefault();
            setDeferredPrompt(e);
            if (shouldShowPrompt) {
                setIsOpen(true);
            }
        };

        window.addEventListener("beforeinstallprompt", handler);

        // For iOS or browsers that don't support beforeinstallprompt
        // Show manual install instructions
        if (shouldShowPrompt && (ios || !standalone)) {
            // Delay to avoid showing immediately on page load
            const timer = setTimeout(() => {
                setIsOpen(true);
            }, 2000); // Show after 2 seconds

            return () => {
                clearTimeout(timer);
                window.removeEventListener("beforeinstallprompt", handler);
            };
        }

        return () => {
            window.removeEventListener("beforeinstallprompt", handler);
        };
    }, []);

    const handleInstall = async () => {
        if (deferredPrompt) {
            // Android/Chrome install
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;

            if (outcome === 'accepted') {
                console.log('User accepted the install prompt');
            }

            setDeferredPrompt(null);
        }
        
        setIsOpen(false);
        // Don't save dismissed time if user installed, only if dismissed
    };

    const handleDismiss = () => {
        // Save dismissed time to localStorage
        localStorage.setItem(INSTALL_DISMISSED_KEY, Date.now().toString());
        setIsOpen(false);
    };

    if (!isOpen) return null;

    return (
        <Dialog open={isOpen} onOpenChange={handleDismiss}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Smartphone className="h-5 w-5 text-primary" />
                        Install Aplikasi SIPANDAI
                    </DialogTitle>
                    <DialogDescription>
                        Install aplikasi SIPANDAI di perangkat Anda untuk akses yang lebih cepat dan pengalaman pengguna yang lebih baik.
                    </DialogDescription>
                </DialogHeader>
                
                <div className="flex items-center justify-center p-4">
                    <img
                        src="/pwa-192x192.png"
                        alt="SIPANDAI Icon"
                        className="w-24 h-24 rounded-xl shadow-lg"
                    />
                </div>

                {isIOS ? (
                    // iOS Instructions
                    <div className="space-y-3 text-sm">
                        <p className="font-medium text-center">Cara Install di iPhone/iPad:</p>
                        <ol className="space-y-2 pl-4 list-decimal text-muted-foreground">
                            <li className="flex items-start gap-2">
                                <span>Tap tombol <Share className="inline h-4 w-4 mx-1" /> (Share) di bawah</span>
                            </li>
                            <li>Scroll ke bawah dan pilih "Add to Home Screen"</li>
                            <li>Tap "Add" untuk menyelesaikan instalasi</li>
                        </ol>
                    </div>
                ) : (
                    // Android/Chrome Instructions
                    <div className="space-y-2 text-sm text-center text-muted-foreground">
                        <p>Aplikasi akan tersedia di home screen Anda dan dapat digunakan offline.</p>
                    </div>
                )}

                <DialogFooter className="flex-col sm:flex-row gap-2">
                    <Button type="button" variant="secondary" onClick={handleDismiss} className="w-full sm:w-auto">
                        Nanti Saja
                    </Button>
                    {!isIOS && deferredPrompt && (
                        <Button type="button" onClick={handleInstall} className="gap-2 w-full sm:w-auto">
                            <Download className="h-4 w-4" />
                            Install Sekarang
                        </Button>
                    )}
                    {isIOS && (
                        <Button type="button" onClick={handleDismiss} variant="outline" className="w-full sm:w-auto">
                            Mengerti
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
