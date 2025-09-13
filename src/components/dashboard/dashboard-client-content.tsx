
"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  DollarSign,
  Activity,
  CreditCard,
  AlertTriangle,
  Info,
  TrendingUp,
  TrendingDown,
  Scale,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/data";
import { OverviewChart } from "@/components/dashboard/overview-chart";
import { CategoryPieChart } from "@/components/dashboard/category-pie-chart";
import { BudgetComparisonChart } from "@/components/dashboard/budget-comparison-chart";
import type { Transaction, BudgetSummary } from "@/types";
import { useMemo } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useCurrency } from "@/context/currency-context";

type TransactionStatus = "completed" | "credit" | "expected";

export function DashboardClientContent({
  transactions,
  budgets,
  isProjectView = false,
}: {
  transactions: Transaction[];
  budgets: BudgetSummary[];
  isProjectView?: boolean;
}) {
  const { currency } = useCurrency();
  // ✅ Pre-compute values efficiently with useMemo
  const {
    completedTransactions,
    creditTransactions,
    expectedTransactions,
    totalSpending,
    totalCredit,
    totalExpected,
    transactionCount,
    mostRecentTransaction,
    totalIncome,
    totalExpense,
    projectProfitability,
  } = useMemo(() => {
    const completed = transactions.filter((t) => t.status === "completed");
    const credit = transactions.filter((t) => t.status === "credit");
    const expected = transactions.filter((t) => t.status === "expected");

    const spending = transactions
      .filter(
        (t) =>
          t.type === "expense" &&
          (t.status === "completed" || t.status === "credit")
      )
      .reduce((sum, t) => sum + t.amount, 0);
    
    const income = transactions.filter(t => t.type === 'income' && t.status === 'completed').reduce((sum, t) => sum + t.amount, 0);
    
    // Updated expense calculation to include 'completed' and 'credit'
    const expense = transactions
      .filter(t => t.type === 'expense' && (t.status === 'completed' || t.status === 'credit'))
      .reduce((sum, t) => sum + t.amount, 0);


    const creditSum = credit.reduce((sum, t) => sum + t.amount, 0);
    const expectedSum = expected.reduce((sum, t) => sum + t.amount, 0);

    const mostRecent =
      completed.length > 0
        ? completed.reduce((latest, current) =>
            new Date(latest.date) > new Date(current.date) ? latest : current
          )
        : null;

    return {
      completedTransactions: completed,
      creditTransactions: credit,
      expectedTransactions: expected,
      totalSpending: spending,
      totalCredit: creditSum,
      totalExpected: expectedSum,
      transactionCount: completed.length,
      mostRecentTransaction: mostRecent,
      totalIncome: income,
      totalExpense: expense,
      projectProfitability: income - expense, // Profitability is now based on the updated expense
    };
  }, [transactions]);

  const tileLinkClasses = "hover:bg-muted/50 transition-colors";

  return (
    <>
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        
        {isProjectView ? (
           <>
            {/* Project: Total Income */}
            <Card className="h-full">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-green-600">Total Income</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{formatCurrency(totalIncome, currency)}</div>
                <p className="text-xs text-muted-foreground">From all sources</p>
              </CardContent>
            </Card>

            {/* Project: Total Expense */}
            <Card className="h-full">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-red-600">Total Expense</CardTitle>
                <TrendingDown className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{formatCurrency(totalExpense, currency)}</div>
                 <p className="text-xs text-muted-foreground">Includes completed & credit</p>
              </CardContent>
            </Card>

             {/* Project: Profitability */}
            <Card className={cn(
                "h-full",
                projectProfitability >= 0 ? "bg-green-500/10 border-green-500/20" : "bg-red-500/10 border-red-500/20"
            )}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className={cn("text-sm font-medium", projectProfitability >= 0 ? "text-green-700" : "text-red-700")}>
                    Project Profitability
                </CardTitle>
                <Scale className={cn("h-4 w-4", projectProfitability >= 0 ? "text-green-600" : "text-red-600")} />
              </CardHeader>
              <CardContent>
                <div className={cn("text-2xl font-bold", projectProfitability >= 0 ? "text-green-700" : "text-red-700")}>
                    {formatCurrency(projectProfitability, currency)}
                </div>
                 <p className={cn("text-xs", projectProfitability >= 0 ? "text-green-700/80" : "text-red-700/80")}>Net income vs expense</p>
              </CardContent>
            </Card>

           </>
        ) : (
            <>
                {/* Global: Total Spending */}
                <Link href="/transactions">
                    <Card className={cn(tileLinkClasses, "h-full")}>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">
                            Total Spending
                        </CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                        <div className="text-2xl font-bold">
                            {formatCurrency(totalSpending, currency)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Includes completed and credit transactions
                        </p>
                        </CardContent>
                    </Card>
                </Link>
            </>
        )}

        {/* Credit Due */}
        <Link href="/transactions?status=credit">
          <Card
            className={cn(
              "bg-red-500/10 border-red-500/20 h-full",
              tileLinkClasses
            )}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-red-700">
                Credit Due
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-700">
                {formatCurrency(totalCredit, currency)}
              </div>
              <p className="text-xs text-red-700/80">
                Across {creditTransactions.length} transactions
              </p>
            </CardContent>
          </Card>
        </Link>

        {/* Expected Transactions */}
        <Link href="/transactions?status=expected">
          <Card
            className={cn(
              "bg-blue-500/10 border-blue-500/20 h-full",
              tileLinkClasses
            )}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-blue-700">
                Expected
              </CardTitle>
              <Info className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-700">
                {formatCurrency(totalExpected, currency)}
              </div>
              <p className="text-xs text-blue-700/80">
                Across {expectedTransactions.length} transactions
              </p>
            </CardContent>
          </Card>
        </Link>
        
        {!isProjectView && (
             <>
                 {/* Global: Last Expense */}
                <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Last Expense</CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    {mostRecentTransaction ? (
                    <>
                        <div className="text-2xl font-bold">
                        {formatCurrency(mostRecentTransaction.amount, currency)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                        On {formatDate(mostRecentTransaction.date)} for{" "}
                        {mostRecentTransaction.category ?? "Uncategorized"}
                        </p>
                    </>
                    ) : (
                    <div className="text-2xl font-bold">-</div>
                    )}
                </CardContent>
                </Card>

                {/* Global: Completed Transactions Count */}
                <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">
                    Completed Txns
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
            </>
        )}
      </div>

      {/* Credit Reminders */}
      {creditTransactions.length > 0 && (
        <Card className="mt-6 border-red-500/50 bg-red-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Credit Reminders
            </CardTitle>
            <CardDescription className="text-red-600/80">
              You have outstanding credit payments.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1 text-sm">
              {creditTransactions
                .sort(
                  (a, b) =>
                    new Date(a.date).getTime() - new Date(b.date).getTime()
                ) // sort by date
                .map((t) => (
                  <li key={t.id}>
                    <Link
                      href={`/transactions?status=credit`}
                      className="block p-2 -m-2 rounded-md hover:bg-red-500/10 transition-colors"
                    >
                      <div className="flex justify-between items-center">
                        <span>
                          {t.title} ({t.vendor})
                        </span>
                        <span className="font-bold">
                          {formatCurrency(t.amount, currency)}
                        </span>
                      </div>
                    </Link>
                  </li>
                ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Expected Transactions */}
      {expectedTransactions.length > 0 && (
        <Card className="mt-6 border-blue-500/50 bg-blue-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-600">
              <Info className="h-5 w-5" />
              Expected Transactions
            </CardTitle>
            <CardDescription className="text-blue-600/80">
              These are upcoming or planned transactions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1 text-sm">
              {expectedTransactions
                .sort(
                  (a, b) =>
                    new Date(a.date).getTime() - new Date(b.date).getTime()
                )
                .map((t) => (
                  <li key={t.id}>
                    <Link
                      href={`/transactions?status=expected`}
                      className="block p-2 -m-2 rounded-md hover:bg-blue-500/10 transition-colors"
                    >
                      <div className="flex justify-between items-center">
                        <span>
                          {t.title} (due {formatDate(t.date)})
                        </span>
                        <span className="font-bold">
                          {formatCurrency(t.amount, currency)}
                        </span>
                      </div>
                    </Link>
                  </li>
                ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Budget Comparison Chart */}
      <div className="mt-6">
        {budgets.length > 0 ? (
          <BudgetComparisonChart
            budgets={budgets}
            transactions={completedTransactions}
          />
        ) : (
          <p className="text-sm text-muted-foreground text-center">
            No budget data available.
          </p>
        )}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <div className="lg:col-span-2">
          {completedTransactions.length > 0 ? (
            <OverviewChart transactions={completedTransactions} />
          ) : (
            <p className="text-sm text-muted-foreground text-center">
              No transaction history yet.
            </p>
          )}
        </div>
        <div className="space-y-6">
          {completedTransactions.length > 0 ? (
            <CategoryPieChart transactions={completedTransactions} />
          ) : (
            <p className="text-sm text-muted-foreground text-center">
              No category data available.
            </p>
          )}
        </div>
      </div>
    </>
  );
}

    