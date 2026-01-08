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

const chartConfig = {
  budget: {
    label: "Budget",
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
  const data = useMemo(() => {
    const actuals = transactions.reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

    return budgets
      .map((budget) => ({
        category: budget.category,
        budget: budget.budget,
        actual: actuals[budget.category] || 0,
      }))
      .filter((d) => d.budget > 0 || d.actual > 0);
  }, [budgets, transactions]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Budget vs. Actual Spending</CardTitle>
        <CardDescription>
          Comparison of your budgeted and actual expenses.
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
            />
            <XAxis dataKey="budget" type="number" hide />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  formatter={(value, name) => (
                    <div className="flex flex-col">
                      <span className="capitalize">{name}</span>
                      <span className="font-bold">{formatCurrency(value as number)}</span>
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
              name="Budget"
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
