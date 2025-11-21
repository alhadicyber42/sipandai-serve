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
import { Download, Smartphone } from "lucide-react";

export function InstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        const handler = (e: any) => {
            // Prevent the mini-infobar from appearing on mobile
            e.preventDefault();
            // Stash the event so it can be triggered later.
            setDeferredPrompt(e);
            // Update UI notify the user they can install the PWA
            setIsOpen(true);
        };

        window.addEventListener("beforeinstallprompt", handler);

        return () => {
            window.removeEventListener("beforeinstallprompt", handler);
        };
    }, []);

    const handleInstall = async () => {
        if (!deferredPrompt) return;

        // Show the install prompt
        deferredPrompt.prompt();

        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
            console.log('User accepted the install prompt');
        } else {
            console.log('User dismissed the install prompt');
        }

        // We've used the prompt, and can't use it again, throw it away
        setDeferredPrompt(null);
        setIsOpen(false);
    };

    if (!isOpen) return null;

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
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
                <DialogFooter className="sm:justify-start">
                    <Button type="button" variant="secondary" onClick={() => setIsOpen(false)}>
                        Nanti Saja
                    </Button>
                    <Button type="button" onClick={handleInstall} className="gap-2">
                        <Download className="h-4 w-4" />
                        Install Sekarang
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
