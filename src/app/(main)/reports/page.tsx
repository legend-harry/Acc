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
import { Download, ChevronRight } from "lucide-react";
import { transactions, formatCurrency } from "@/lib/data";
import Link from "next/link";

export default function ReportsPage() {
  const monthWiseSummary = transactions.reduce((acc, t) => {
    const monthYear = t.date.toLocaleString("default", {
      month: "long",
      year: "numeric",
    });
    if (!acc[monthYear]) {
      acc[monthYear] = { total: 0, count: 0, date: t.date };
    }
    acc[monthYear].total += t.amount;
    acc[monthYear].count += 1;
    return acc;
  }, {} as Record<string, { total: number; count: number, date: Date }>);

  const sortedMonths = Object.entries(monthWiseSummary).sort(([, a], [, b]) => {
      return b.date.getTime() - a.date.getTime();
  });

  return (
    <div>
      <PageHeader
        title="Reports"
        description="Generate and export summaries of your expenses."
      />
      <div className="space-y-8">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>Monthly Summaries</CardTitle>
                <CardDescription>
                  A breakdown of your spending by month. Select a month to view details.
                </CardDescription>
              </div>
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Export All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
                {sortedMonths.map(([month, summary]) => {
                    const monthSlug = `${summary.date.getFullYear()}-${(summary.date.getMonth() + 1).toString().padStart(2, '0')}`;
                    return(
                    <Link href={`/reports/${monthSlug}`} key={month} className="flex justify-between items-center rounded-lg border p-4 hover:bg-muted/50 transition-colors">
                        <div>
                            <p className="font-medium">{month}</p>
                            <p className="text-sm text-muted-foreground">{summary.count} transactions</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <p className="font-semibold text-lg">{formatCurrency(summary.total)}</p>
                            <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        </div>
                    </Link>
                )})}
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
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Export Log
              </Button>
            </div>
          </CardHeader>
          <CardContent>
             <ul className="space-y-3">
                {transactions.slice(0, 10).map(t => (
                    <li key={t.id} className="flex justify-between items-center">
                        <div>
                            <p className="font-medium">{t.title}</p>
                            <p className="text-sm text-muted-foreground">{t.date.toLocaleDateString()}</p>
                        </div>
                        <p className="font-mono text-sm">{formatCurrency(t.amount)}</p>
                    </li>
                ))}
                {transactions.length > 10 && (
                    <>
                        <Separator />
                        <li className="text-center text-sm text-muted-foreground">...and {transactions.length - 10} more transactions.</li>
                    </>
                )}
             </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
