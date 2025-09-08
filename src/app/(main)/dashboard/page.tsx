
import { PageHeader } from "@/components/page-header";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { AIInsights } from "@/components/dashboard/ai-insights";
import { db } from "@/lib/firebase";
import { get, ref } from "firebase/database";
import type { Transaction, BudgetSummary } from "@/types";
import { DashboardClientContent } from "@/components/dashboard/dashboard-client-content";

async function getTransactions(): Promise<Transaction[]> {
  const transactionsRef = ref(db, 'transactions');
  const snapshot = await get(transactionsRef);
  const data = snapshot.val();
  if (data) {
    return Object.keys(data).map(key => ({
      ...data[key],
      id: key,
      date: new Date(data[key].date),
    }));
  }
  return [];
}

async function getBudgets(): Promise<BudgetSummary[]> {
    const budgetsRef = ref(db, 'budgets');
    const snapshot = await get(budgetsRef);
    const data = snapshot.val();
    if (data) {
        return Object.keys(data).map(key => ({
            ...data[key],
            id: key,
        }));
    }
    return [];
}


export default async function DashboardPage() {
  const transactions = await getTransactions();
  const budgets = await getBudgets();

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="A summary of your financial activity."
      />
      <Suspense fallback={
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
      }>
        <DashboardClientContent transactions={transactions} budgets={budgets} />
      </Suspense>
       <div className="mt-6">
            <AIInsights transactions={transactions}/>
       </div>
    </div>
  );
}
