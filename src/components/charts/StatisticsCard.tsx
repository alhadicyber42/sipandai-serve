import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatisticsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
  iconClassName?: string;
}

export function StatisticsCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  className,
  iconClassName,
}: StatisticsCardProps) {
  return (
    <Card className={cn("relative overflow-hidden", className)}>
      <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-muted/50 to-transparent rounded-full blur-2xl" />
      
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 md:p-4 lg:p-6">
        <CardTitle className="text-xs md:text-sm font-medium">
          {title}
        </CardTitle>
        <Icon className={cn("h-3.5 w-3.5 md:h-4 md:w-4 flex-shrink-0", iconClassName)} />
      </CardHeader>
      
      <CardContent className="p-3 md:p-4 lg:p-6 pt-0">
        <div className="text-lg md:text-xl lg:text-2xl font-bold">
          {value}
        </div>
        
        <div className="flex items-center gap-2 mt-1">
          {trend && (
            <span className={cn(
              "text-xs font-medium",
              trend.isPositive ? "text-green-600" : "text-red-600"
            )}>
              {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)}%
            </span>
          )}
          {description && (
            <p className="text-[10px] md:text-xs text-muted-foreground">
              {description}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
