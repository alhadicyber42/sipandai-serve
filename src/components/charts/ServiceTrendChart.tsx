import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";

interface ChartDataPoint {
  name: string;
  value: number;
  [key: string]: string | number;
}

interface ServiceTrendChartProps {
  data: ChartDataPoint[];
  title: string;
  description?: string;
  type?: "line" | "area" | "bar";
  dataKey?: string;
  xAxisKey?: string;
  colors?: string[];
  height?: number;
  className?: string;
}

export function ServiceTrendChart({
  data,
  title,
  description,
  type = "area",
  dataKey = "value",
  xAxisKey = "name",
  colors = ["#3b82f6", "#8b5cf6", "#ec4899"],
  height = 300,
  className,
}: ServiceTrendChartProps) {
  const renderChart = () => {
    const commonProps = {
      data,
      margin: { top: 5, right: 10, left: 0, bottom: 5 },
    };

    const xAxis = (
      <XAxis 
        dataKey={xAxisKey} 
        stroke="#888888"
        fontSize={12}
        tickLine={false}
        axisLine={false}
      />
    );

    const yAxis = (
      <YAxis
        stroke="#888888"
        fontSize={12}
        tickLine={false}
        axisLine={false}
        tickFormatter={(value) => `${value}`}
      />
    );

    const grid = <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />;
    
    const tooltip = (
      <Tooltip
        content={({ active, payload }) => {
          if (!active || !payload?.length) return null;
          
          return (
            <div className="rounded-lg border bg-background p-2 shadow-md">
              <div className="grid gap-2">
                <div className="flex flex-col">
                  <span className="text-[0.70rem] uppercase text-muted-foreground">
                    {payload[0].payload[xAxisKey]}
                  </span>
                  {payload.map((item, index) => (
                    <span key={index} className="font-bold text-sm" style={{ color: item.color }}>
                      {item.name}: {item.value}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          );
        }}
      />
    );

    switch (type) {
      case "line":
        return (
          <LineChart {...commonProps}>
            {grid}
            {xAxis}
            {yAxis}
            {tooltip}
            <Line
              type="monotone"
              dataKey={dataKey}
              stroke={colors[0]}
              strokeWidth={2}
              dot={{ fill: colors[0], r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        );

      case "bar":
        return (
          <BarChart {...commonProps}>
            {grid}
            {xAxis}
            {yAxis}
            {tooltip}
            <Bar
              dataKey={dataKey}
              fill={colors[0]}
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        );

      case "area":
      default:
        return (
          <AreaChart {...commonProps}>
            {grid}
            {xAxis}
            {yAxis}
            {tooltip}
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={colors[0]} stopOpacity={0.8}/>
                <stop offset="95%" stopColor={colors[0]} stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey={dataKey}
              stroke={colors[0]}
              strokeWidth={2}
              fill="url(#colorValue)"
            />
          </AreaChart>
        );
    }
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
          {renderChart()}
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// Multi-line chart untuk membandingkan beberapa data
interface MultiLineChartProps {
  data: ChartDataPoint[];
  title: string;
  description?: string;
  lines: Array<{
    dataKey: string;
    name: string;
    color: string;
  }>;
  xAxisKey?: string;
  height?: number;
  className?: string;
}

export function MultiLineChart({
  data,
  title,
  description,
  lines,
  xAxisKey = "name",
  height = 300,
  className,
}: MultiLineChartProps) {
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
          <LineChart
            data={data}
            margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey={xAxisKey} 
              stroke="#888888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#888888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                
                return (
                  <div className="rounded-lg border bg-background p-2 shadow-md">
                    <div className="grid gap-2">
                      <div className="flex flex-col">
                        <span className="text-[0.70rem] uppercase text-muted-foreground">
                          {payload[0].payload[xAxisKey]}
                        </span>
                        {payload.map((item, index) => (
                          <span key={index} className="font-bold text-sm" style={{ color: item.color }}>
                            {item.name}: {item.value}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              }}
            />
            <Legend 
              wrapperStyle={{ fontSize: "12px" }}
              iconType="circle"
            />
            {lines.map((line) => (
              <Line
                key={line.dataKey}
                type="monotone"
                dataKey={line.dataKey}
                name={line.name}
                stroke={line.color}
                strokeWidth={2}
                dot={{ fill: line.color, r: 3 }}
                activeDot={{ r: 5 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
