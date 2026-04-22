"use client";

import { StitchMetricsGrid } from "@/components/stitch/stitch-metrics-grid";
import { StitchAnalyticsSuite } from "@/components/stitch/stitch-analytics-suite";
import { StitchBudgetIntelligence } from "@/components/stitch/stitch-budget-intelligence";
import { useCurrency } from "@/context/currency-context";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn, getCategoryColorClass, getCategoryBadgeColorClass } from "@/lib/utils";
import { formatCurrency, formatDate } from "@/lib/data";
import type { Transaction, BudgetSummary } from "@/types";

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
    <div className="flex flex-col gap-10 mt-6 animate-fade-up">
        {/* Monthly Summary Metrics */}
        <section>
            <h2 className="text-xl font-bold font-headline text-on-surface mb-6 flex items-center gap-2">
                <span className="w-2 h-6 bg-primary-container rounded-full"></span>
                Executive Summary — {monthName}
            </h2>
            <StitchMetricsGrid transactions={monthlyTransactions} />
        </section>

        {/* Intelligence & Budgets */}
        <section>
            <StitchBudgetIntelligence budgets={budgets} />
        </section>

        {/* Deep Analytics */}
        <section>
             <h2 className="text-xl font-bold font-headline text-on-surface mb-6">Categorical Intelligence</h2>
            <StitchAnalyticsSuite transactions={monthlyTransactions} />
        </section>

        {/* Detailed Ledger */}
        <section>
            <div className="rounded-2xl bg-surface-container-lowest shadow-sm border border-outline-variant/10 overflow-hidden">
                <div className="p-6 border-b border-outline-variant/10 bg-surface-container-low/50">
                    <h3 className="text-lg font-bold font-headline text-on-surface">Monthly Ledger</h3>
                    <p className="text-sm text-outline font-medium">Detailed transaction log for {monthName}</p>
                </div>
                <Table>
                    <TableHeader className="bg-surface-container-low/30 text-[10px] uppercase font-bold tracking-widest text-outline">
                    <TableRow className="hover:bg-transparent border-outline-variant/10">
                        <TableHead className="pl-6">Date</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead className="text-right pr-6">Amount</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {sortedTransactions.map((t) => (
                        <TableRow key={t.id} className={cn("hover:bg-surface-container-low transition-colors border-outline-variant/5", getCategoryColorClass(t.category))}>
                        <TableCell className="pl-6 font-medium text-xs">{formatDate(t.date)}</TableCell>
                        <TableCell>
                            <div className="font-bold text-sm text-on-surface">{t.title}</div>
                            <div className="text-[10px] text-outline font-medium">
                            {t.vendor || 'Point of Sale'}
                            </div>
                        </TableCell>
                        <TableCell>
                            <Badge variant="outline" className={cn("text-[10px] uppercase tracking-tighter border-none bg-surface-container font-bold", getCategoryBadgeColorClass(t.category))}>{t.category}</Badge>
                        </TableCell>
                        <TableCell className={cn("text-right font-bold pr-6", t.type === 'income' ? 'text-primary-container' : 'text-on-surface')}>
                            {t.type === 'income' ? '+' : ''}{formatCurrency(t.amount, currency)}
                        </TableCell>
                        </TableRow>
                    ))}
                    {sortedTransactions.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={4} className="text-center h-48 text-outline italic text-sm">
                                No activity recorded during this period.
                            </TableCell>
                        </TableRow>
                    )}
                    </TableBody>
                </Table>
            </div>
        </section>
    </div>
  )
}
