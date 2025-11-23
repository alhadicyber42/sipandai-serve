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

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
    return (
        <div className={cn("flex flex-col items-center justify-center py-12 px-4 text-center", className)}>
            <div className="mb-4 text-muted-foreground">
                {icon || <Inbox className="h-16 w-16" />}
            </div>
            <h3 className="text-lg font-semibold mb-2">{title}</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-md">{description}</p>
            {action && (
                <Button onClick={action.onClick}>
                    {action.label}
                </Button>
            )}
        </div>
    );
}

export function NoDataState({ message = "Tidak ada data tersedia", className }: { message?: string; className?: string }) {
    return (
        <EmptyState
            icon={<FileQuestion className="h-16 w-16 opacity-50" />}
            title="Belum Ada Data"
            description={message}
            className={className}
        />
    );
}

export function SearchState({ message = "Tidak ada hasil yang sesuai dengan pencarian Anda", className }: { message?: string; className?: string }) {
    return (
        <EmptyState
            icon={<Search className="h-16 w-16 opacity-50" />}
            title="Tidak Ditemukan"
            description={message}
            className={className}
        />
    );
}

export function ErrorState({
    message = "Terjadi kesalahan saat memuat data",
    onRetry,
    className
}: {
    message?: string;
    onRetry?: () => void;
    className?: string;
}) {
    return (
        <EmptyState
            icon={<AlertCircle className="h-16 w-16 text-destructive opacity-80" />}
            title="Terjadi Kesalahan"
            description={message}
            action={onRetry ? {
                label: "Coba Lagi",
                onClick: onRetry
            } : undefined}
            className={className}
        />
    );
}
