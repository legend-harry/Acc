"use client";

import { useMemo } from 'react';
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
import { ArrowLeft, Download } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AIInsights } from '@/components/dashboard/ai-insights';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { BudgetComparisonChart } from '@/components/dashboard/budget-comparison-chart';
import { jsPDF } from "jspdf";
import "jspdf-autotable";

async function generatePdf(month: string, monthName: string, monthlyTransactions: any[], insights: string) {
    const doc = new jsPDF();

    doc.setFontSize(22);
    doc.text(`Expense Report: ${monthName}`, 14, 20);
    
    doc.setFontSize(12);
    doc.text(`Total Transactions: ${monthlyTransactions.length}`, 14, 30);

    const tableColumn = ["Date", "Description", "Category", "Amount"];
    const tableRows: (string|number)[][] = [];

    monthlyTransactions.forEach(ticket => {
        const ticketData = [
            ticket.date.toLocaleDateString(),
            ticket.title,
            ticket.category,
            formatCurrency(ticket.amount)
        ];
        tableRows.push(ticketData);
    });

    (doc as any).autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 40,
    });
    
    const finalY = (doc as any).lastAutoTable.finalY;

    doc.setFontSize(16);
    doc.text("AI Insights", 14, finalY + 15);
    doc.setFontSize(10);
    doc.text(insights, 14, finalY + 22, { maxWidth: 180 });

    doc.save(`report-${month}.pdf`);
}


export default function MonthlyReportPage({
  params,
}: {
  params: { month: string };
}) {
  const { month: monthSlug } = params;
  const [year, month] = monthSlug.split("-").map(Number);
  const monthDate = new Date(year, month - 1);

  const monthName = monthDate.toLocaleString("default", {
    month: "long",
    year: "numeric",
  });

  const monthlyTransactions = useMemo(() => transactions.filter(
    (t) =>
      t.date.getFullYear() === year && t.date.getMonth() === month - 1
  ), [year, month]);

  const sortedTransactions = useMemo(() => [...monthlyTransactions].sort(
    (a, b) => b.date.getTime() - a.date.getTime()
  ), [monthlyTransactions]);

  const handleDownload = async () => {
      // Dummy insights for now, ideally this would be a fresh fetch for the month
      const insights = "Monthly spending was high on Bore Construction. Consider reviewing vendor contracts for potential savings.";
      await generatePdf(monthSlug, monthName, sortedTransactions, insights);
  };

  return (
    <div>
        <div className="flex justify-between items-center mb-4">
            <Button asChild variant="ghost">
                <Link href="/reports">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Reports
                </Link>
            </Button>
             <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="mr-2 h-4 w-4" />
                Download PDF
            </Button>
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
                <TableRow key={t.id}>
                  <TableCell>{t.date.toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="font-medium">{t.title}</div>
                    <div className="hidden text-sm text-muted-foreground md:inline">
                      {t.vendor}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{t.category}</Badge>
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
