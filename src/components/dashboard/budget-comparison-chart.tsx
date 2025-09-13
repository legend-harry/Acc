
"use client";

import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Legend } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import type { BudgetSummary, Transaction } from "@/types";
import { formatCurrency } from "@/lib/data";
import { useCurrency } from "@/context/currency-context";

const chartConfig = {
  budget: {
    label: "Planned",
    color: "hsl(var(--chart-2))",
  },
  actual: {
    label: "Actual",
    color: "hsl(var(--chart-1))",
  },
};

interface BudgetComparisonChartProps {
  budgets: BudgetSummary[];
  transactions: Transaction[];
}

export function BudgetComparisonChart({
  budgets,
  transactions,
}: BudgetComparisonChartProps) {
  const { currency } = useCurrency();
  const data = useMemo(() => {
    // 1. Aggregate actual spending by category
    const actuals = transactions.reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

    // 2. Aggregate planned budgets by category
    const planned = budgets.reduce((acc, b) => {
        acc[b.category] = (acc[b.category] || 0) + b.budget;
        return acc;
    }, {} as Record<string, number>);

    // 3. Combine the data
    const allCategories = [...new Set([...Object.keys(planned), ...Object.keys(actuals)])];

    return allCategories
      .map((category) => ({
        category: category,
        budget: planned[category] || 0,
        actual: actuals[category] || 0,
      }))
      .filter((d) => d.budget > 0 || d.actual > 0) // Only show categories with some activity
      .sort((a,b) => b.budget - a.budget); // Sort by budget descending

  }, [budgets, transactions]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Planned vs. Actual Spending</CardTitle>
        <CardDescription>
          Comparison of your planned and actual expenses.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="w-full h-[400px]">
          <BarChart accessibilityLayer data={data} layout="vertical" margin={{ left: 20, right: 40 }}>
            <CartesianGrid horizontal={false} />
            <YAxis
              dataKey="category"
              type="category"
              tickLine={false}
              axisLine={false}
              tickMargin={10}
              width={100}
              className="text-sm"
              tickFormatter={(value) => value.length > 15 ? `${value.substring(0, 15)}...` : value}
            />
            <XAxis dataKey="budget" type="number" hide />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  formatter={(value, name) => (
                    <div className="flex flex-col">
                      <span className="capitalize">{name}</span>
                      <span className="font-bold">{formatCurrency(value as number, currency)}</span>
                    </div>
                  )}
                  indicator="dot"
                />
              }
            />
             <Legend />
            <Bar
              dataKey="budget"
              fill="var(--color-budget)"
              radius={5}
              name="Planned"
            />
            <Bar
              dataKey="actual"
              fill="var(--color-actual)"
              radius={5}
              name="Actual"
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
