import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
    return (
        <div className="space-y-3">
            {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-[250px]" />
                        <Skeleton className="h-4 w-[200px]" />
                    </div>
                    <Skeleton className="h-8 w-24" />
                </div>
            ))}
        </div>
    );
}

export function CardSkeleton() {
    return (
        <Card>
            <CardHeader>
                <Skeleton className="h-6 w-[200px]" />
                <Skeleton className="h-4 w-[150px]" />
            </CardHeader>
            <CardContent className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
            </CardContent>
        </Card>
    );
}

export function StatCardSkeleton() {
    return (
        <Card>
            <CardContent className="p-6">
                <div className="flex items-center justify-between space-x-4">
                    <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-8 w-16" />
                    </div>
                    <Skeleton className="h-12 w-12 rounded-lg" />
                </div>
            </CardContent>
        </Card>
    );
}

export function FormSkeleton() {
    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-24 w-full" />
            </div>
            <Skeleton className="h-10 w-32" />
        </div>
    );
}

export function DashboardSkeleton() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="space-y-2">
                <Skeleton className="h-8 w-[300px]" />
                <Skeleton className="h-4 w-[200px]" />
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCardSkeleton />
                <StatCardSkeleton />
                <StatCardSkeleton />
                <StatCardSkeleton />
            </div>

            {/* Content Cards */}
            <div className="grid gap-4 md:grid-cols-2">
                <CardSkeleton />
                <CardSkeleton />
            </div>
        </div>
    );
}
