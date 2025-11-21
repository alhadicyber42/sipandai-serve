import { FileQuestion, Inbox, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
    icon?: React.ReactNode;
    title: string;
    description: string;
    action?: {
        label: string;
        onClick: () => void;
    };
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
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

export function NoDataState({ message = "Tidak ada data tersedia" }: { message?: string }) {
    return (
        <EmptyState
            icon={<FileQuestion className="h-16 w-16" />}
            title="Belum Ada Data"
            description={message}
        />
    );
}

export function ErrorState({
    message = "Terjadi kesalahan saat memuat data",
    onRetry
}: {
    message?: string;
    onRetry?: () => void;
}) {
    return (
        <EmptyState
            icon={<AlertCircle className="h-16 w-16 text-destructive" />}
            title="Terjadi Kesalahan"
            description={message}
            action={onRetry ? {
                label: "Coba Lagi",
                onClick: onRetry
            } : undefined}
        />
    );
}
