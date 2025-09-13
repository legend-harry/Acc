
"use client";

import { useState, useMemo, useEffect } from 'react';
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ChevronRight, FileSpreadsheet, Sparkles } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/data";
import Link from "next/link";
import { useTransactions, useProjects } from '@/hooks/use-database';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { getCategoryBadgeColorClass } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { useSubscription } from '@/context/subscription-context';
import { useCurrency } from '@/context/currency-context';


function exportToCsv(filename: string, rows: any[][]) {
    const processRow = (row: any[]) => {
        let finalVal = '';
        for (let j = 0; j < row.length; j++) {
            let innerValue = row[j] === null || row[j] === undefined ? '' : row[j].toString();
            if (row[j] instanceof Date) {
                innerValue = row[j].toLocaleString();
            }
            let result = innerValue.replace(/"/g, '""');
            if (result.search(/("|,|\n)/g) >= 0)
                result = '"' + result + '"';
            if (j > 0)
                finalVal += ',';
            finalVal += result;
        }
        return finalVal + '\n';
    };

    let csvFile = '';
    for (let i = 0; i < rows.length; i++) {
        csvFile += processRow(rows[i]);
    }

    const blob = new Blob([csvFile], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

function ExportButton({ transactions }: { transactions: any[] }) {
    const { isPremium, openUpgradeDialog } = useSubscription();
    
    const handleExport = () => {
        if (!isPremium) {
            openUpgradeDialog("export-all");
            return;
        }

        const headers = [
            "ID", "Date", "Created At", "Title", "Description", "Category", "Amount", 
            "Type", "Status", "Vendor", "Created By", "Invoice No", "Notes", "Project ID"
        ];
        const rows = transactions.map(t => [
            t.id,
            formatDate(t.date),
            t.createdAt.toLocaleString(),
            t.title,
            t.description,
            t.category,
            t.amount,
            t.type,
            t.status,
            t.vendor,
            t.createdBy,
            t.invoiceNo,
            t.notes,
            t.projectId
        ]);
        exportToCsv('transactions.csv', [headers, ...rows]);
    };

    return (
        <Button onClick={handleExport} variant="outline">
            {!isPremium && <Sparkles className="mr-2 h-4 w-4 text-yellow-400" />}
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Export All
        </Button>
    );
}

type ProjectSummary = {
    total: number;
    count: number;
}
type MonthSummary = {
    total: number;
    count: number;
    date: Date;
    projects: Record<string, ProjectSummary>;
}


export default function ReportsPage() {
  const { transactions, loading: transactionsLoading } = useTransactions();
  const { projects, loading: projectsLoading } = useProjects();
  const { currency } = useCurrency();
  
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  
  const loading = transactionsLoading || projectsLoading;

  const { availableYears, monthWiseSummary } = useMemo(() => {
    if (loading) {
        return { availableYears: [], monthWiseSummary: {} };
    }

    const years = [...new Set(transactions.map(t => new Date(t.date).getFullYear().toString()))].sort((a,b) => Number(b) - Number(a));
    
    const summary = transactions
        .filter(t => new Date(t.date).getFullYear().toString() === selectedYear)
        .reduce((acc, t) => {
            const date = new Date(t.date);
            const monthYear = date.toLocaleString("default", {
                month: "long",
                year: "numeric",
            });

            if (!acc[monthYear]) {
                acc[monthYear] = { total: 0, count: 0, date: date, projects: {} };
            }

            acc[monthYear].total += t.amount;
            acc[monthYear].count += 1;

            const projectName = projects.find(p => p.id === t.projectId)?.name || 'Unassigned';
            if (!acc[monthYear].projects[projectName]) {
                acc[monthYear].projects[projectName] = { total: 0, count: 0 };
            }
            acc[monthYear].projects[projectName].total += t.amount;
            acc[monthYear].projects[projectName].count += 1;

            return acc;
        }, {} as Record<string, MonthSummary>);

    return { availableYears: years, monthWiseSummary: summary };
  }, [transactions, projects, selectedYear, loading]);

  const sortedMonths = useMemo(() => {
      return Object.entries(monthWiseSummary)
        .sort(([, a], [, b]) => b.date.getTime() - a.date.getTime());
  }, [monthWiseSummary]);

   const sortedTransactions = useMemo(() => {
    return [...transactions].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [transactions]);


   useEffect(() => {
        if (availableYears.length > 0 && !availableYears.includes(selectedYear)) {
            setSelectedYear(availableYears[0]);
        }
    }, [availableYears, selectedYear]);

  if (loading) {
      return (
          <div>
              <PageHeader
                title="Reports"
                description="Generate and export summaries of your expenses."
              />
               <div className="space-y-8">
                <Card>
                    <CardHeader>
                         <Skeleton className="h-8 w-48" />
                         <Skeleton className="h-4 w-64 mt-2" />
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {Array.from({length: 3}).map((_, i) => (
                                <Skeleton key={i} className="h-20 w-full rounded-lg" />
                            ))}
                        </div>
                    </CardContent>
                </Card>
               </div>
          </div>
      )
  }

  return (
    <div>
      <PageHeader
        title="Reports"
        description="Generate and export summaries of your expenses."
      />
      <div className="space-y-8">
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
              <div>
                <CardTitle>Monthly Summaries</CardTitle>
                <CardDescription>
                  A breakdown of your spending by month. Select a month to view details.
                </CardDescription>
              </div>
              <div className="flex gap-2 w-full md:w-auto">
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                    <SelectTrigger className="w-[120px]">
                        <SelectValue placeholder="Year" />
                    </SelectTrigger>
                    <SelectContent>
                        {availableYears.map(year => (
                            <SelectItem key={year} value={year}>{year}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                 <ExportButton transactions={transactions} />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
                {sortedMonths.map(([month, summary]) => {
                    const monthSlug = `${summary.date.getFullYear()}-${(summary.date.getMonth() + 1).toString().padStart(2, '0')}`;
                    return(
                    <Link href={`/reports/${monthSlug}`} key={month} className="block rounded-lg border p-4 hover:bg-muted/50 transition-colors">
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="font-medium text-lg">{month}</p>
                                <p className="text-sm text-muted-foreground">{summary.count} transactions</p>
                            </div>
                            <div className="flex items-center gap-4">
                                <p className="font-semibold text-xl">{formatCurrency(summary.total, currency)}</p>
                                <ChevronRight className="h-5 w-5 text-muted-foreground" />
                            </div>
                        </div>
                         <Separator className="my-3" />
                        <div className="space-y-2">
                            <p className="text-xs font-semibold text-muted-foreground">PROJECT BREAKDOWN</p>
                            <div className="flex flex-wrap gap-2">
                                {Object.entries(summary.projects).map(([projectName, projectSummary]) => (
                                    <Badge key={projectName} variant="outline" className={getCategoryBadgeColorClass(projectName)}>
                                        {projectName}: {formatCurrency(projectSummary.total, currency)}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    </Link>
                )})}
                 {sortedMonths.length === 0 && (
                    <div className="text-center py-10 text-muted-foreground">
                        No transactions found for the selected year.
                    </div>
                )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>Detailed Account Summary</CardTitle>
                <CardDescription>
                  A complete log of all your transactions.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
             <ul className="space-y-3">
                {sortedTransactions.slice(0, 10).map(t => (
                    <li key={t.id} className="flex justify-between items-center">
                        <div>
                            <p className="font-medium">{t.title}</p>
                            <p className="text-sm text-muted-foreground">{new Date(t.date).toLocaleDateString()}</p>
                        </div>
                        <p className="font-mono text-sm">{formatCurrency(t.amount, currency)}</p>
                    </li>
                ))}
                {sortedTransactions.length > 10 && (
                    <>
                        <Separator />
                        <li className="text-center text-sm text-muted-foreground">...and {sortedTransactions.length - 10} more transactions.</li>
                    </>
                )}
                 {sortedTransactions.length === 0 && (
                    <li className="text-center text-sm text-muted-foreground py-4">No transactions found.</li>
                )}
             </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
