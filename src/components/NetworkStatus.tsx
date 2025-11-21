import { useEffect, useState } from "react";
import { Wifi, WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";

export function NetworkStatus() {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [showStatus, setShowStatus] = useState(false);

    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            setShowStatus(true);
            setTimeout(() => setShowStatus(false), 3000);
        };

        const handleOffline = () => {
            setIsOnline(false);
            setShowStatus(true);
        };

        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);

        return () => {
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
        };
    }, []);

    if (!showStatus) return null;

    return (
        <div
            className={cn(
                "fixed bottom-4 right-4 z-50 flex items-center gap-2 px-4 py-2 rounded-lg shadow-lg transition-all duration-300",
                isOnline
                    ? "bg-green-500 text-white"
                    : "bg-red-500 text-white"
            )}
        >
            {isOnline ? (
                <>
                    <Wifi className="h-4 w-4" />
                    <span className="text-sm font-medium">Kembali Online</span>
                </>
            ) : (
                <>
                    <WifiOff className="h-4 w-4" />
                    <span className="text-sm font-medium">Tidak Ada Koneksi</span>
                </>
            )}
        </div>
    );
}
