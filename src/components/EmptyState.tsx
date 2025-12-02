import { memo } from "react";
import { FileQuestion, Inbox, AlertCircle, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
    icon?: React.ReactNode;
    title: string;
    description: string;
    action?: {
        label: string;
        onClick: () => void;
    };
    className?: string;
}

export const EmptyState = memo(({ icon, title, description, action, className }: EmptyStateProps) => {
    return (
        <div 
            className={cn("flex flex-col items-center justify-center py-12 px-4 text-center", className)}
            role="status"
            aria-live="polite"
        >
            <div className="mb-4 text-muted-foreground" aria-hidden="true">
                {icon || <Inbox className="h-12 w-12 sm:h-16 sm:w-16" />}
            </div>
            <h3 className="text-base sm:text-lg font-semibold mb-2">{title}</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-md">{description}</p>
            {action && (
                <Button 
                    onClick={action.onClick}
                    className="min-h-[44px] min-w-[120px] px-4 py-2"
                    aria-label={action.label}
                >
                    {action.label}
                </Button>
            )}
        </div>
    );
});

EmptyState.displayName = "EmptyState";

export const NoDataState = memo(({ message = "Tidak ada data tersedia", className }: { message?: string; className?: string }) => {
    return (
        <EmptyState
            icon={<FileQuestion className="h-12 w-12 sm:h-16 sm:w-16 opacity-50" />}
            title="Belum Ada Data"
            description={message}
            className={className}
        />
    );
});

NoDataState.displayName = "NoDataState";

export const SearchState = memo(({ message = "Tidak ada hasil yang sesuai dengan pencarian Anda", className }: { message?: string; className?: string }) => {
    return (
        <EmptyState
            icon={<Search className="h-12 w-12 sm:h-16 sm:w-16 opacity-50" />}
            title="Tidak Ditemukan"
            description={message}
            className={className}
        />
    );
});

SearchState.displayName = "SearchState";

export const ErrorState = memo(({
    message = "Terjadi kesalahan saat memuat data",
    onRetry,
    retryCount,
    maxRetries = 3,
    className
}: {
    message?: string;
    onRetry?: () => void;
    retryCount?: number;
    maxRetries?: number;
    className?: string;
}) => {
    const canRetry = retryCount !== undefined && retryCount < maxRetries;
    const retryMessage = retryCount !== undefined 
        ? `Percobaan ${retryCount + 1} dari ${maxRetries + 1}`
        : undefined;

    return (
        <EmptyState
            icon={<AlertCircle className="h-12 w-12 sm:h-16 sm:w-16 text-destructive opacity-80" />}
            title="Terjadi Kesalahan"
            description={
                <div className="space-y-2">
                    <p>{message}</p>
                    {retryMessage && (
                        <p className="text-sm text-muted-foreground">{retryMessage}</p>
                    )}
                </div>
            }
            action={onRetry && canRetry ? {
                label: "Coba Lagi",
                onClick: onRetry
            } : undefined}
            className={className}
        />
    );
});

ErrorState.displayName = "ErrorState";
