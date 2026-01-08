
"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DollarSign, Activity, CreditCard } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/data";
import { OverviewChart } from "@/components/dashboard/overview-chart";
import { CategoryPieChart } from "@/components/dashboard/category-pie-chart";
import { BudgetComparisonChart } from "@/components/dashboard/budget-comparison-chart";
import type { Transaction, BudgetSummary } from "@/types";

export function DashboardClientContent({ transactions, budgets }: { transactions: Transaction[], budgets: BudgetSummary[] }) {

  const totalSpending = transactions.reduce((sum, t) => sum + t.amount, 0);
  const transactionCount = transactions.length;

  const mostRecentTransaction = transactions.length > 0 ? transactions.reduce((latest, current) => {
    return new Date(latest.date) > new Date(current.date) ? latest : current;
  }) : null;

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
              Across all transactions
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
              Number of recorded expenses
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
       <div className="mt-6">
        <BudgetComparisonChart budgets={budgets} transactions={transactions} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <div className="lg:col-span-2">
            <OverviewChart transactions={transactions} />
        </div>
        <div className="space-y-6">
            <CategoryPieChart transactions={transactions} />
        </div>
      </div>
    </>
  );
}
