
"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import type { Transaction } from "@/types";
import { useMemo } from "react";
import { formatCurrency } from "@/lib/data";
import { useCurrency } from "@/context/currency-context"

const chartConfig = {
  amount: {
    label: "Amount",
    color: "hsl(var(--chart-1))",
  },
}

interface OverviewChartProps {
    transactions: Transaction[];
}

export function OverviewChart({ transactions }: OverviewChartProps) {
    const { currency } = useCurrency();
    const data = useMemo(() => {
        const monthlySpending: Record<string, number> = {};
        
        transactions.forEach(t => {
            const date = new Date(t.date);
            // Ensure date is valid before processing
            if (!isNaN(date.getTime())) {
                const month = date.toLocaleString('default', { month: 'short', year: '2-digit' });
                monthlySpending[month] = (monthlySpending[month] || 0) + t.amount;
            }
        });
        
        const sortedMonths = Object.keys(monthlySpending).sort((a, b) => {
            const [monthA, yearA] = a.split(' ');
            const [monthB, yearB] = b.split(' ');
            const dateA = new Date(`1 ${monthA} 20${yearA}`);
            const dateB = new Date(`1 ${monthB} 20${yearB}`);
            return dateA.getTime() - dateB.getTime();
        });

        return sortedMonths.map(month => ({
            month,
            amount: monthlySpending[month],
        }));

    }, [transactions]);


  return (
    <Card>
      <CardHeader>
        <CardTitle>Monthly Overview</CardTitle>
        <CardDescription>Your spending summary for the last few months.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart accessibilityLayer data={data} margin={{ top: 20, right: 20, left: 20, bottom: 5 }}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
            />
             <YAxis
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => formatCurrency(value as number, currency).slice(0, -3)}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent formatter={(value) => formatCurrency(value as number, currency)} hideLabel />}
            />
            <Bar
              dataKey="amount"
              fill="var(--color-amount)"
              radius={8}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
