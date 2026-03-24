import { useId, useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { formatCurrency } from "@/lib/utils";
import type { PayoffStrategy } from "../../types";
import type { compareStrategies } from "../../calculations";

interface PayoffChartProps {
  comparison: ReturnType<typeof compareStrategies>;
}

export function PayoffChart({ comparison }: PayoffChartProps) {
  const gradientId = useId();
  const [strategy, setStrategy] = useState<PayoffStrategy>("avalanche");
  const projection = strategy === "avalanche" ? comparison.avalanche : comparison.snowball;

  const chartData = projection.months.map((m) => ({
    month: m.date,
    balance: m.totalBalance,
  }));

  return (
    <div className="card-elevated rounded-2xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">Payoff Timeline</h3>
          <p className="text-xs text-muted-foreground">Projected balance over time</p>
        </div>
        <Tabs value={strategy} onValueChange={(v) => setStrategy(v as PayoffStrategy)}>
          <TabsList className="h-8 bg-background/50">
            <TabsTrigger value="avalanche" className="text-xs px-3 h-6">
              Avalanche
            </TabsTrigger>
            <TabsTrigger value="snowball" className="text-xs px-3 h-6">
              Snowball
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="oklch(0.68 0.16 250)" stopOpacity={0.25} />
                <stop offset="100%" stopColor="oklch(0.68 0.16 250)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.24 0.01 260)" vertical={false} />
            <XAxis
              dataKey="month"
              stroke="oklch(0.4 0.01 260)"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
              tickFormatter={(v: string) => {
                const [y, m] = v.split("-");
                return `${m}/${y.slice(2)}`;
              }}
            />
            <YAxis
              stroke="oklch(0.4 0.01 260)"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) =>
                v >= 1000 ? `£${(v / 1000).toFixed(0)}k` : `£${v}`
              }
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "oklch(0.18 0.015 255)",
                border: "1px solid oklch(0.28 0.015 255)",
                borderRadius: "12px",
                fontSize: "12px",
                padding: "8px 12px",
                boxShadow: "0 8px 32px oklch(0 0 0 / 0.4)",
              }}
              formatter={(value: unknown) => [formatCurrency(Number(value)), "Balance"]}
              labelFormatter={(label: unknown) => {
                const str = String(label);
                const [y, m] = str.split("-");
                return new Date(parseInt(y), parseInt(m) - 1).toLocaleDateString("en-GB", {
                  month: "long",
                  year: "numeric",
                });
              }}
            />
            <Area
              type="monotone"
              dataKey="balance"
              stroke="oklch(0.68 0.16 250)"
              strokeWidth={2.5}
              fill={`url(#${gradientId})`}
              dot={false}
              activeDot={{
                r: 4,
                fill: "oklch(0.68 0.16 250)",
                stroke: "oklch(0.18 0.015 255)",
                strokeWidth: 2,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-[260px] flex items-center justify-center text-muted-foreground text-sm">
          No projection data
        </div>
      )}
    </div>
  );
}
