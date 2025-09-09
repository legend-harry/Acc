
"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { DollarSign, Activity, CreditCard, AlertTriangle, Info } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/data";
import { OverviewChart } from "@/components/dashboard/overview-chart";
import { CategoryPieChart } from "@/components/dashboard/category-pie-chart";
import { BudgetComparisonChart } from "@/components/dashboard/budget-comparison-chart";
import type { Transaction, BudgetSummary } from "@/types";

export function DashboardClientContent({ transactions, budgets }: { transactions: Transaction[], budgets: BudgetSummary[] }) {

  const completedTransactions = transactions.filter(t => t.status === 'completed');
  const totalSpending = completedTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const transactionCount = completedTransactions.length;

  const mostRecentTransaction = completedTransactions.length > 0 ? completedTransactions.reduce((latest, current) => {
    return new Date(latest.date) > new Date(current.date) ? latest : current;
  }) : null;

  const creditTransactions = transactions.filter(t => t.status === 'credit');
  const expectedTransactions = transactions.filter(t => t.status === 'expected');

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spending</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalSpending)}</div>
            <p className="text-xs text-muted-foreground">
              Across all completed transactions
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Transactions
            </CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{transactionCount}</div>
            <p className="text-xs text-muted-foreground">
              Number of completed expenses
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Expense</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {mostRecentTransaction ? (
              <>
                <div className="text-2xl font-bold">{formatCurrency(mostRecentTransaction.amount)}</div>
                <p className="text-xs text-muted-foreground">
                  On {formatDate(mostRecentTransaction.date)} for {mostRecentTransaction.category}
                </p>
              </>
            ) : (
              <div className="text-2xl font-bold">-</div>
            )}
          </CardContent>
        </Card>
      </div>

      {creditTransactions.length > 0 && (
         <Card className="mt-6 border-red-500/50 bg-red-500/5">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                    <AlertTriangle className="h-5 w-5" />
                    Credit Reminders
                </CardTitle>
                <CardDescription className="text-red-600/80">You have outstanding credit payments.</CardDescription>
            </CardHeader>
            <CardContent>
                <ul className="space-y-2 text-sm">
                    {creditTransactions.map(t => (
                        <li key={t.id} className="flex justify-between items-center">
                            <span>{t.title} ({t.vendor})</span>
                            <span className="font-bold">{formatCurrency(t.amount)}</span>
                        </li>
                    ))}
                </ul>
            </CardContent>
         </Card>
      )}

       {expectedTransactions.length > 0 && (
         <Card className="mt-6 border-blue-500/50 bg-blue-500/5">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-600">
                    <Info className="h-5 w-5" />
                    Expected Transactions
                </CardTitle>
                <CardDescription className="text-blue-600/80">These are upcoming or planned transactions.</CardDescription>
            </CardHeader>
            <CardContent>
                <ul className="space-y-2 text-sm">
                    {expectedTransactions.map(t => (
                        <li key={t.id} className="flex justify-between items-center">
                            <span>{t.title} (due {formatDate(t.date)})</span>
                            <span className="font-bold">{formatCurrency(t.amount)}</span>
                        </li>
                    ))}
                </ul>
            </CardContent>
         </Card>
      )}


       <div className="mt-6">
        <BudgetComparisonChart budgets={budgets} transactions={completedTransactions} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <div className="lg:col-span-2">
            <OverviewChart transactions={completedTransactions} />
        </div>
        <div className="space-y-6">
            <CategoryPieChart transactions={completedTransactions} />
        </div>
      </div>
    </>
  );
}
