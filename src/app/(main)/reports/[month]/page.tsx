
import { PageHeader } from "@/components/page-header";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AIInsights } from '@/components/dashboard/ai-insights';
import { ReportDownloadButton } from './report-download-button';
import { db } from '@/lib/firebase';
import { get, ref } from "firebase/database";
import type { Transaction, BudgetSummary } from "@/types";
import { ReportClientContent } from './report-client-content';

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

export default async function MonthlyReportPage({
  params,
}: {
  params: { month: string };
}) {
  const { month: monthSlug } = params;
  const [year, month] = monthSlug.split("-").map(Number);
  
  const transactions = await getTransactions();
  const budgets = await getBudgets();

  const monthDate = new Date(year, month - 1);

  const monthName = monthDate.toLocaleString("default", {
    month: "long",
    year: "numeric",
  });

  const monthlyTransactions = transactions.filter(
    (t) => {
        const tDate = new Date(t.date);
        return tDate.getFullYear() === year && tDate.getMonth() === month - 1
    }
  );

  const sortedTransactions = [...monthlyTransactions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div>
        <div className="flex justify-between items-center mb-4">
            <Button asChild variant="ghost">
                <Link href="/reports">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Reports
                </Link>
            </Button>
             <ReportDownloadButton 
                monthSlug={monthSlug} 
                monthName={monthName} 
                transactions={sortedTransactions} 
             />
        </div>
      <PageHeader
        title={monthName}
        description={`A detailed summary of your ${monthlyTransactions.length} transactions for ${monthName}.`}
      />

    <ReportClientContent budgets={budgets} monthlyTransactions={monthlyTransactions} sortedTransactions={sortedTransactions} monthName={monthName} />

      <div className="mt-6">
        <AIInsights transactions={monthlyTransactions}/>
      </div>
    </div>
  );
}
