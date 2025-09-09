
"use client";

import { PageHeader } from "@/components/page-header";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { AIInsights } from "@/components/dashboard/ai-insights";
import { DashboardClientContent } from "@/components/dashboard/dashboard-client-content";
import { useTransactions, useBudgets } from "@/hooks/use-database";

export default function DashboardPage() {
  const { transactions, loading: transactionsLoading } = useTransactions();
  const { budgets, loading: budgetsLoading } = useBudgets();

  const loading = transactionsLoading || budgetsLoading;

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="A summary of your financial activity."
      />
      {loading ? (
         <div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Skeleton className="h-28 w-full" />
              <Skeleton className="h-28 w-full" />
              <Skeleton className="h-28 w-full" />
            </div>
            <div className="mt-6">
              <Skeleton className="h-96 w-full" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
              <div className="lg:col-span-2">
                <Skeleton className="h-96 w-full" />
              </div>
              <div className="space-y-6">
                <Skeleton className="h-96 w-full" />
              </div>
            </div>
          </div>
      ) : (
        <>
            <DashboardClientContent transactions={transactions} budgets={budgets} />
            <div className="mt-6">
                <AIInsights transactions={transactions}/>
            </div>
        </>
      )}
    </div>
  );
}

