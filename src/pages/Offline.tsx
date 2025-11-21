import { Wifi, WifiOff, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function OfflinePage() {
    const handleRefresh = () => {
        window.location.reload();
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
            <Card className="max-w-md w-full">
                <CardContent className="pt-6">
                    <div className="flex flex-col items-center text-center space-y-4">
                        {/* Animated Icon */}
                        <div className="relative">
                            <div className="absolute inset-0 bg-red-500/20 rounded-full animate-ping"></div>
                            <div className="relative bg-red-500/10 p-6 rounded-full">
                                <WifiOff className="h-12 w-12 text-red-500" />
                            </div>
                        </div>

                        {/* Title */}
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                            Tidak Ada Koneksi Internet
                        </h1>

                        {/* Description */}
                        <p className="text-slate-600 dark:text-slate-400">
                            Sepertinya Anda sedang offline. Periksa koneksi internet Anda dan coba lagi.
                        </p>

                        {/* Tips */}
                        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-lg p-4 text-left space-y-2">
                            <p className="text-sm font-medium text-slate-900 dark:text-white">
                                Tips untuk terhubung kembali:
                            </p>
                            <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1 list-disc list-inside">
                                <li>Periksa koneksi WiFi atau data seluler Anda</li>
                                <li>Pastikan mode pesawat tidak aktif</li>
                                <li>Coba restart router Anda</li>
                            </ul>
                        </div>

                        {/* Action Button */}
                        <Button
                            onClick={handleRefresh}
                            className="w-full gap-2"
                            size="lg"
                        >
                            <RefreshCw className="h-4 w-4" />
                            Coba Lagi
                        </Button>

                        {/* Connection Status */}
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                            <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse"></div>
                            <span>Offline</span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
