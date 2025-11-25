import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { cn } from "@/lib/utils";

interface ChartDataPoint {
  name: string;
  value: number;
  color?: string;
}

interface StatusDistributionChartProps {
  data: ChartDataPoint[];
  title: string;
  description?: string;
  colors?: string[];
  height?: number;
  className?: string;
  showPercentage?: boolean;
}

const DEFAULT_COLORS = [
  "#3b82f6", // blue
  "#8b5cf6", // purple
  "#ec4899", // pink
  "#f59e0b", // amber
  "#10b981", // green
  "#ef4444", // red
  "#6366f1", // indigo
  "#14b8a6", // teal
];

export function StatusDistributionChart({
  data,
  title,
  description,
  colors = DEFAULT_COLORS,
  height = 300,
  className,
  showPercentage = true,
}: StatusDistributionChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  const dataWithColors = data.map((item, index) => ({
    ...item,
    color: item.color || colors[index % colors.length],
  }));

  const renderCustomizedLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
  }: any) => {
    if (!showPercentage || percent < 0.05) return null; // Don't show label if less than 5%

    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? "start" : "end"}
        dominantBaseline="central"
        className="text-xs font-bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <Card className={cn("", className)}>
      <CardHeader>
        <CardTitle className="text-base md:text-lg">{title}</CardTitle>
        {description && (
          <CardDescription className="text-xs md:text-sm">{description}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="pb-4">
        <ResponsiveContainer width="100%" height={height}>
          <PieChart>
            <Pie
              data={dataWithColors}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomizedLabel}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {dataWithColors.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                
                const data = payload[0].payload;
                const percentage = ((data.value / total) * 100).toFixed(1);
                
                return (
                  <div className="rounded-lg border bg-background p-3 shadow-md">
                    <div className="grid gap-2">
                      <div className="flex items-center gap-2">
                        <div 
                          className="h-3 w-3 rounded-full" 
                          style={{ backgroundColor: data.color }}
                        />
                        <span className="font-bold text-sm">{data.name}</span>
                      </div>
                      <div className="text-sm">
                        <span className="font-semibold">{data.value}</span>
                        <span className="text-muted-foreground"> ({percentage}%)</span>
                      </div>
                    </div>
                  </div>
                );
              }}
            />
            <Legend
              verticalAlign="bottom"
              height={36}
              content={({ payload }) => (
                <div className="flex flex-wrap justify-center gap-3 mt-4">
                  {payload?.map((entry, index) => (
                    <div key={`legend-${index}`} className="flex items-center gap-1.5">
                      <div 
                        className="h-3 w-3 rounded-full" 
                        style={{ backgroundColor: entry.color }}
                      />
                      <span className="text-xs text-muted-foreground">
                        {entry.value}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            />
          </PieChart>
        </ResponsiveContainer>

        {/* Stats summary */}
        <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-3 border-t pt-4">
          {dataWithColors.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <div 
                className="h-2 w-2 rounded-full flex-shrink-0" 
                style={{ backgroundColor: item.color }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground truncate">{item.name}</p>
                <p className="text-sm font-semibold">
                  {item.value}
                  <span className="text-xs text-muted-foreground ml-1">
                    ({((item.value / total) * 100).toFixed(0)}%)
                  </span>
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
