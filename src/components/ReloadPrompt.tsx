import { useRegisterSW } from "virtual:pwa-register/react";
import { Button } from "@/components/ui/button";
import { ToastAction } from "@/components/ui/toast";
import { useToast } from "@/components/ui/use-toast";
import { useEffect } from "react";

export default function ReloadPrompt() {
    const { toast } = useToast();
    const {
        offlineReady: [offlineReady, setOfflineReady],
        needRefresh: [needRefresh, setNeedRefresh],
        updateServiceWorker,
    } = useRegisterSW({
        onRegistered(r) {
            console.log("SW Registered: " + r);
        },
        onRegisterError(error) {
            console.log("SW registration error", error);
        },
    });

    const close = () => {
        setOfflineReady(false);
        setNeedRefresh(false);
    };

    useEffect(() => {
        if (offlineReady) {
            toast({
                title: "Siap Offline",
                description: "Aplikasi siap digunakan dalam mode offline.",
                action: <ToastAction altText="Tutup" onClick={close}>Oke</ToastAction>,
            });
        }
    }, [offlineReady, toast]);

    useEffect(() => {
        if (needRefresh) {
            toast({
                title: "Update Tersedia",
                description: "Versi baru aplikasi tersedia. Muat ulang untuk memperbarui?",
                action: (
                    <ToastAction
                        altText="Muat Ulang"
                        onClick={() => updateServiceWorker(true)}
                    >
                        Muat Ulang
                    </ToastAction>
                ),
                duration: Infinity, // Keep it open until user interacts
            });
        }
    }, [needRefresh, toast, updateServiceWorker]);

    return null; // This component doesn't render anything visible itself
}
