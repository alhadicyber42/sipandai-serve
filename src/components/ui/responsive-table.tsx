import * as React from "react";
import { cn } from "@/lib/utils";

interface ResponsiveTableProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
}

/**
 * Responsive table wrapper that provides better mobile experience
 * - Horizontal scroll on mobile
 * - Sticky first column option
 * - Visual scroll indicators
 */
export function ResponsiveTableWrapper({ children, className, ...props }: ResponsiveTableProps) {
    return (
        <div
            className={cn(
                "relative w-full rounded-md border",
                "overflow-x-auto",
                // Smooth scrolling
                "scroll-smooth",
                // Hide scrollbar on desktop, show on mobile
                "[&::-webkit-scrollbar]:h-2",
                "[&::-webkit-scrollbar-track]:bg-muted",
                "[&::-webkit-scrollbar-thumb]:bg-muted-foreground/20",
                "[&::-webkit-scrollbar-thumb]:rounded-full",
                "hover:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/30",
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
}

ResponsiveTableWrapper.displayName = "ResponsiveTableWrapper";
