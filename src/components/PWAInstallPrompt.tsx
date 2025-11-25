import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Download, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PWAInstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [showPrompt, setShowPrompt] = useState(false);

    useEffect(() => {
        const handler = (e: Event) => {
            // Prevent the mini-infobar from appearing on mobile
            e.preventDefault();

            // Stash the event so it can be triggered later
            setDeferredPrompt(e as BeforeInstallPromptEvent);

            // Check if user has dismissed the prompt before
            const dismissed = localStorage.getItem("pwa-install-dismissed");
            if (!dismissed) {
                setShowPrompt(true);
            }
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

        if (outcome === "accepted") {
            console.log("User accepted the install prompt");
        } else {
            console.log("User dismissed the install prompt");
        }

        // Clear the deferredPrompt
        setDeferredPrompt(null);
        setShowPrompt(false);
    };

    const handleDismiss = () => {
        setShowPrompt(false);
        // Remember that user dismissed the prompt
        localStorage.setItem("pwa-install-dismissed", "true");
    };

    if (!showPrompt) return null;

    return (
        <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-96">
            <Card className="border-primary shadow-lg">
                <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-1">
                            <Download className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-sm mb-1">
                                Install SIPANDAI
                            </h3>
                            <p className="text-xs text-muted-foreground mb-3">
                                Install aplikasi ini di perangkat Anda untuk akses yang lebih cepat dan mudah
                            </p>
                            <div className="flex gap-2">
                                <Button
                                    onClick={handleInstall}
                                    size="sm"
                                    className="flex-1"
                                >
                                    Install
                                </Button>
                                <Button
                                    onClick={handleDismiss}
                                    size="sm"
                                    variant="outline"
                                    className="flex-1"
                                >
                                    Nanti Saja
                                </Button>
                            </div>
                        </div>
                        <button
                            onClick={handleDismiss}
                            className="flex-shrink-0 text-muted-foreground hover:text-foreground"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
