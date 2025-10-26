import { cn } from "@/lib/utils";
import { STATUS_COLORS, STATUS_LABELS } from "@/lib/constants";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export const StatusBadge = ({ status, className }: StatusBadgeProps) => {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
        STATUS_COLORS[status as keyof typeof STATUS_COLORS] || "bg-muted text-muted-foreground",
        className
      )}
    >
      {STATUS_LABELS[status as keyof typeof STATUS_LABELS] || status}
    </span>
  );
};
