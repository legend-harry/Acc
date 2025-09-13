
"use client";

import { useMemo } from 'react';
import { PageHeader } from "@/components/page-header";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AIInsights } from '@/components/dashboard/ai-insights';
import { Skeleton } from '@/components/ui/skeleton';
import { ReportDownloadButton } from './report-download-button';
import { ReportClientContent } from './report-client-content';
import { useTransactions, useBudgets } from '@/hooks/use-database';

export default function MonthlyReportPage({
  params,
}: {
  params: { month: string };
}) {
  const { month: monthSlug } = params;
  const [year, month] = (monthSlug || '').split("-").map(Number);
  
  const { transactions, loading: transactionsLoading } = useTransactions();
  const { budgets, loading: budgetsLoading } = useBudgets();

  const loading = transactionsLoading || budgetsLoading;

  const monthDate = new Date(year, month - 1);

  const monthName = monthDate.toLocaleString("default", {
    month: "long",
    year: "numeric",
  });

  const { monthlyTransactions, sortedTransactions } = useMemo(() => {
    const filtered = transactions.filter(
      (t) => {
          const tDate = new Date(t.date);
          return tDate.getFullYear() === year && tDate.getMonth() === month - 1
      }
    );
    const sorted = [...filtered].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    return { monthlyTransactions: filtered, sortedTransactions: sorted };
  }, [transactions, year, month]);
  

  if (loading) {
    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <Button asChild variant="ghost">
                    <Link href="/reports">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Reports
                    </Link>
                </Button>
                 <Skeleton className="h-9 w-32" />
            </div>
          <PageHeader
            title={monthName}
            description={`A detailed summary of your transactions for ${monthName}.`}
          />
          <Skeleton className="h-96 w-full" />
           <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
              <div className="lg:col-span-2">
                <Skeleton className="h-96 w-full" />
              </div>
              <div className="space-y-6">
                <Skeleton className="h-96 w-full" />
              </div>
            </div>
        </div>
      );
  }

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
