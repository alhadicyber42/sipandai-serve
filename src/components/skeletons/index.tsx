import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
    return (
        <div className="space-y-2 md:space-y-3">
            {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className="flex items-center space-x-3 md:space-x-4 p-3 md:p-4 border rounded-lg animate-pulse">
                    <Skeleton className="h-10 w-10 md:h-12 md:w-12 rounded-full flex-shrink-0" />
                    <div className="space-y-2 flex-1 min-w-0">
                        <Skeleton className="h-3 md:h-4 w-full max-w-[250px]" />
                        <Skeleton className="h-3 md:h-4 w-full max-w-[200px]" />
                    </div>
                    <Skeleton className="h-7 w-20 md:h-8 md:w-24 flex-shrink-0" />
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
        <Card className="relative overflow-hidden">
            <CardContent className="p-3 md:p-4 lg:p-6">
                <div className="flex items-center justify-between space-x-3 md:space-x-4">
                    <div className="space-y-2 flex-1">
                        <Skeleton className="h-3 md:h-4 w-20 md:w-24" />
                        <Skeleton className="h-6 md:h-8 w-12 md:w-16" />
                        <Skeleton className="h-2 md:h-3 w-24 md:w-32" />
                    </div>
                    <Skeleton className="h-10 w-10 md:h-12 md:w-12 rounded-lg flex-shrink-0" />
                </div>
            </CardContent>
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-muted/50 to-transparent rounded-full blur-2xl" />
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
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
            <div className="p-3 md:p-4 lg:p-6 xl:p-8 space-y-4 md:space-y-6">
                {/* Header */}
                <div className="relative overflow-hidden rounded-xl md:rounded-2xl bg-gradient-to-br from-primary/90 to-primary/70 p-4 md:p-6 lg:p-8 shadow-xl">
                    <div className="space-y-2">
                        <Skeleton className="h-5 md:h-8 w-48 md:w-[300px] bg-white/20" />
                        <Skeleton className="h-3 md:h-4 w-32 md:w-[200px] bg-white/20" />
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 md:gap-3 lg:gap-4">
                    <StatCardSkeleton />
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
        </div>
    );
}

export function ServiceListSkeleton({ count = 3 }: { count?: number }) {
    return (
        <div className="space-y-3 md:space-y-4">
            {Array.from({ length: count }).map((_, i) => (
                <Card key={i} className="relative overflow-hidden">
                    <CardContent className="p-3 md:p-4 lg:p-6">
                        <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
                            <Skeleton className="h-12 w-12 rounded-lg flex-shrink-0" />
                            <div className="flex-1 space-y-2 min-w-0">
                                <Skeleton className="h-4 md:h-5 w-full max-w-xs" />
                                <Skeleton className="h-3 w-full max-w-sm" />
                                <div className="flex flex-wrap gap-2">
                                    <Skeleton className="h-5 w-20" />
                                    <Skeleton className="h-5 w-24" />
                                </div>
                            </div>
                            <Skeleton className="h-8 w-24 md:h-9 md:w-28 flex-shrink-0" />
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

export function ProfileSkeleton() {
    return (
        <div className="max-w-4xl mx-auto space-y-4 md:space-y-6">
            {/* Header */}
            <div className="relative overflow-hidden rounded-xl md:rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-400 p-4 md:p-6 lg:p-8 shadow-xl">
                <div className="flex items-center gap-3 md:gap-4">
                    <Skeleton className="h-16 w-16 md:h-20 md:w-20 lg:h-24 lg:w-24 rounded-full bg-white/20 flex-shrink-0" />
                    <div className="space-y-2 flex-1">
                        <Skeleton className="h-6 md:h-8 w-48 md:w-64 bg-white/20" />
                        <Skeleton className="h-3 md:h-4 w-32 md:w-48 bg-white/20" />
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="space-y-4">
                <Skeleton className="h-10 md:h-11 w-full rounded-lg" />
                <CardSkeleton />
                <CardSkeleton />
            </div>
        </div>
    );
}
