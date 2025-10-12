
"use client";

import { useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHead,
  TableRow,
} from "@/components/ui/table";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatCurrency, formatDate } from "@/lib/data";
import { useCurrency } from "@/context/currency-context";
import type { Transaction } from "@/types";
import { cn } from "@/lib/utils";

interface CategoryDetailDialogProps {
  category: string;
  transactions: Transaction[];
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

const chartConfig = {
  amount: {
    label: "Amount",
    color: "hsl(var(--chart-1))",
  },
};

export function CategoryDetailDialog({
  category,
  transactions,
  isOpen,
  onOpenChange,
}: CategoryDetailDialogProps) {
  const { currency } = useCurrency();

  const { monthlySpending, totalSpend, sortedTransactions } = useMemo(() => {
    const spending: Record<string, number> = {};
    let total = 0;

    transactions.forEach((t) => {
      const month = new Date(t.date).toLocaleString("default", {
        month: "short",
        year: "2-digit",
      });
      spending[month] = (spending[month] || 0) + t.amount;
      total += t.amount;
    });

    const monthlyData = Object.entries(spending)
      .map(([month, amount]) => ({ month, amount }))
      .sort((a, b) => {
          const [monthA, yearA] = a.month.split(' ');
          const [monthB, yearB] = b.month.split(' ');
          const dateA = new Date(`1 ${monthA} 20${yearA}`);
          const dateB = new Date(`1 ${monthB} 20${yearB}`);
          return dateA.getTime() - dateB.getTime();
      });
    
    const sorted = [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
    return { monthlySpending: monthlyData, totalSpend: total, sortedTransactions: sorted };
  }, [transactions]);


  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Spending Details: {category}</DialogTitle>
          <DialogDescription>
            Total spend for this category is <span className="font-bold text-foreground">{formatCurrency(totalSpend, currency)}</span>.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6">
          <div>
            <h3 className="text-sm font-medium mb-2">Monthly Spending</h3>
            <ChartContainer config={chartConfig} className="w-full h-52">
              <BarChart accessibilityLayer data={monthlySpending}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                  tickFormatter={(value) => value}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) =>
                    formatCurrency(value as number, currency).slice(0, -3)
                  }
                />
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      formatter={(value) => formatCurrency(value as number, currency)}
                      hideLabel
                    />
                  }
                />
                <Bar dataKey="amount" fill="var(--color-amount)" radius={4} />
              </BarChart>
            </ChartContainer>
          </div>
          <div>
            <h3 className="text-sm font-medium mb-2">Transactions</h3>
            <ScrollArea className="h-64">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedTransactions.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell>{formatDate(t.date)}</TableCell>
                      <TableCell>
                        <div className="font-medium">{t.title}</div>
                        <div className="text-xs text-muted-foreground">{t.vendor}</div>
                      </TableCell>
                      <TableCell className={cn('text-right font-mono', t.type === 'income' ? 'text-green-600' : 'text-red-600')}>
                         {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount, currency)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
