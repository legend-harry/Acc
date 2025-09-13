
"use client";

import { useMemo } from 'react';
import { formatCurrency, formatDate } from "@/lib/data";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CategoryPieChart } from "@/components/dashboard/category-pie-chart";
import { OverviewChart } from "@/components/dashboard/overview-chart";
import { BudgetComparisonChart } from '@/components/dashboard/budget-comparison-chart';
import { getCategoryColorClass, getCategoryBadgeColorClass } from '@/lib/utils';
import type { BudgetSummary, Transaction } from '@/types';
import { useCurrency } from '@/context/currency-context';

export function ReportClientContent({
    budgets,
    monthlyTransactions,
    sortedTransactions,
    monthName
}: {
    budgets: BudgetSummary[];
    monthlyTransactions: Transaction[];
    sortedTransactions: Transaction[];
    monthName: string;
}) {
  const { currency } = useCurrency();
  return (
    <>
        <div className="mt-6">
            <BudgetComparisonChart budgets={budgets} transactions={monthlyTransactions} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
            <div className="lg:col-span-2">
                <OverviewChart transactions={monthlyTransactions} />
            </div>
            <div className="space-y-6">
                <CategoryPieChart transactions={monthlyTransactions} />
            </div>
        </div>

        <Card className="mt-6">
            <CardHeader>
            <CardTitle>Transactions for {monthName}</CardTitle>
            </CardHeader>
            <CardContent>
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {sortedTransactions.map((t) => (
                    <TableRow key={t.id} className={getCategoryColorClass(t.category)}>
                    <TableCell>{formatDate(t.date)}</TableCell>
                    <TableCell>
                        <div className="font-medium">{t.title}</div>
                        <div className="hidden text-sm text-muted-foreground md:inline">
                        {t.vendor}
                        </div>
                    </TableCell>
                    <TableCell>
                        <Badge variant="outline" className={getCategoryBadgeColorClass(t.category)}>{t.category}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                        {formatCurrency(t.amount, currency)}
                    </TableCell>
                    </TableRow>
                ))}
                {sortedTransactions.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={4} className="text-center h-24">
                            No transactions for this month.
                        </TableCell>
                    </TableRow>
                )}
                </TableBody>
            </Table>
            </CardContent>
        </Card>
    </>
  )
}
