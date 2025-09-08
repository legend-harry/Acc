
import { use, useMemo } from 'react';
import { PageHeader } from "@/components/page-header";
import { transactions, formatCurrency, budgets } from "@/lib/data";
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
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AIInsights } from '@/components/dashboard/ai-insights';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { BudgetComparisonChart } from '@/components/dashboard/budget-comparison-chart';
import { ReportDownloadButton } from './report-download-button';
import { getCategoryColorClass, getCategoryBadgeColorClass } from '@/lib/utils';


export default function MonthlyReportPage({
  params,
}: {
  params: Promise<{ month: string }>;
}) {
  const { month: monthSlug } = use(params);
  const [year, month] = monthSlug.split("-").map(Number);

  const monthDate = useMemo(() => new Date(year, month - 1), [year, month]);

  const monthName = useMemo(() => monthDate.toLocaleString("default", {
    month: "long",
    year: "numeric",
  }), [monthDate]);

  const monthlyTransactions = useMemo(() => transactions.filter(
    (t) =>
      t.date.getFullYear() === year && t.date.getMonth() === month - 1
  ), [year, month]);

  const sortedTransactions = useMemo(() => [...monthlyTransactions].sort(
    (a, b) => b.date.getTime() - a.date.getTime()
  ), [monthlyTransactions]);


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
                  <TableCell>{t.date.toLocaleDateString()}</TableCell>
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
                    {formatCurrency(t.amount)}
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
      <div className="mt-6">
        <Suspense fallback={<Skeleton className="h-48 w-full" />}>
            <AIInsights transactions={monthlyTransactions}/>
        </Suspense>
      </div>
    </div>
  );
}
