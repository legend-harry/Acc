
"use client";
import * as React from "react";
import { Pie, PieChart, Cell } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import type { Transaction } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/data";
import { useCurrency } from "@/context/currency-context";
import { CategoryDetailDialog } from "./category-detail-dialog";
import { cn } from "@/lib/utils";

const chartColors = [
    "hsl(var(--chart-1))",
    "hsl(var(--chart-2))",
    "hsl(var(--chart-3))",
    "hsl(var(--chart-4))",
    "hsl(var(--chart-5))",
    "hsl(var(--chart-6))",
  ];
  
interface CategoryPieChartProps {
  transactions: Transaction[];
}

export function CategoryPieChart({ transactions }: CategoryPieChartProps) {
  const { currency } = useCurrency();
  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(null);

  const { data, config, total } = React.useMemo(() => {
    const expenseTransactions = transactions.filter(t => t.type === 'expense');
    const categorySpending = expenseTransactions.reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);
    
    const chartTotal = Object.values(categorySpending).reduce((acc, amount) => acc + amount, 0);

    const chartData = Object.entries(categorySpending)
      .map(([category, amount]) => ({
        name: category,
        value: amount,
      }))
      .sort((a, b) => b.value - a.value);

    const chartConfig: ChartConfig = chartData.reduce((acc, item, index) => {
      acc[item.name] = {
        label: item.name,
        color: chartColors[index % chartColors.length],
      };
      return acc;
    }, {} as ChartConfig);

    return { data: chartData, config: chartConfig, total: chartTotal };
  }, [transactions]);
  
  const handlePieClick = (data: any) => {
    setSelectedCategory(data.name);
  };

  const selectedCategoryTransactions = React.useMemo(() => {
    if (!selectedCategory) return [];
    return transactions.filter(t => t.category === selectedCategory && t.type === 'expense');
  }, [selectedCategory, transactions]);


  if (transactions.filter(t=>t.type === 'expense').length === 0) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Spending by Category</CardTitle>
                <CardDescription>No expense transactions for this period.</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-center h-[280px]">
                <p className="text-muted-foreground">No data to display</p>
            </CardContent>
        </Card>
    );
  }

  return (
    <>
      <Card className="flex flex-col">
        <CardHeader>
          <CardTitle>Spending by Category</CardTitle>
          <CardDescription>Distribution of your expenses across categories. Click a slice for details.</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 pb-0">
          <ChartContainer
            config={config}
            className="mx-auto aspect-square max-h-[350px]"
          >
            <PieChart>
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent formatter={(value) => formatCurrency(value as number, currency)} hideLabel />}
              />
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                innerRadius={60}
                strokeWidth={2}
                onClick={handlePieClick}
                className="cursor-pointer"
              >
                  {data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={config[entry.name]?.color || chartColors[index % chartColors.length]} />
                  ))}
              </Pie>
              <ChartLegend
                content={
                  <ChartLegendContent
                    formatter={(value, entry) => {
                      const itemValue = entry.payload.value;
                      const percentage = total > 0 ? (itemValue / total) * 100 : 0;
                      return (
                          <div 
                              className="flex w-full justify-between cursor-pointer p-1 -m-1 rounded-md hover:bg-muted"
                              onClick={() => setSelectedCategory(value)}
                          >
                              <span>{value}</span>
                              <span>{formatCurrency(itemValue, currency)} ({percentage.toFixed(0)}%)</span>
                          </div>
                      );
                    }}
                  />
                }
                verticalAlign="bottom"
                height={50}
                wrapperStyle={{overflow: 'auto'}}
              />
            </PieChart>
          </ChartContainer>
        </CardContent>
      </Card>
       {selectedCategory && (
        <CategoryDetailDialog
          category={selectedCategory}
          transactions={selectedCategoryTransactions}
          isOpen={!!selectedCategory}
          onOpenChange={() => setSelectedCategory(null)}
        />
      )}
    </>
  );
}
