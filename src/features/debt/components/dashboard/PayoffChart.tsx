import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  const [strategy, setStrategy] = useState<PayoffStrategy>("avalanche");
  const projection = strategy === "avalanche" ? comparison.avalanche : comparison.snowball;

  const chartData = projection.months.map((m) => ({
    month: m.date,
    balance: m.totalBalance,
    payment: m.totalPayment,
    interest: m.totalInterest,
  }));

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg">Payoff Timeline</CardTitle>
        <Tabs value={strategy} onValueChange={(v) => setStrategy(v as PayoffStrategy)}>
          <TabsList className="h-8">
            <TabsTrigger value="avalanche" className="text-xs px-3">
              Avalanche
            </TabsTrigger>
            <TabsTrigger value="snowball" className="text-xs px-3">
              Snowball
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
              <defs>
                <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="oklch(0.75 0.18 155)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="oklch(0.75 0.18 155)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.3 0 0)" />
              <XAxis
                dataKey="month"
                stroke="oklch(0.5 0 0)"
                fontSize={11}
                tickLine={false}
                interval="preserveStartEnd"
                tickFormatter={(v: string) => {
                  const [y, m] = v.split("-");
                  return `${m}/${y.slice(2)}`;
                }}
              />
              <YAxis
                stroke="oklch(0.5 0 0)"
                fontSize={11}
                tickLine={false}
                tickFormatter={(v: number) => `£${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "oklch(0.17 0 0)",
                  border: "1px solid oklch(0.3 0 0)",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
                formatter={(value: unknown, name: unknown) => [
                  formatCurrency(Number(value)),
                  name === "balance" ? "Remaining" : name === "interest" ? "Interest" : "Payment",
                ]}
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
                stroke="oklch(0.75 0.18 155)"
                strokeWidth={2}
                fill="url(#balanceGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[280px] flex items-center justify-center text-muted-foreground">
            No projection data available
          </div>
        )}
      </CardContent>
    </Card>
  );
}
