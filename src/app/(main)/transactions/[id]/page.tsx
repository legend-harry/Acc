
"use client";

import { useMemo, useState } from "react";
import { useTransactions, useProjects } from "@/hooks/use-database";
import { useParams, useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, CheckCircle } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/data";
import Image from "next/image";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { db } from "@/lib/firebase";
import { ref, update } from "firebase/database";
import { useToast } from "@/hooks/use-toast";
import { getCategoryBadgeColorClass } from "@/lib/utils";
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { useCurrency } from "@/context/currency-context";

function TransactionDetailSkeleton() {
  return (
    <div>
      <Skeleton className="h-9 w-48 mb-4" />
      <Skeleton className="h-10 w-96 mb-6" />

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-7 w-1/2" />
              <Skeleton className="h-4 w-3/4" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="h-5 w-3/4" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-7 w-1/2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-48 w-full" />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-7 w-3/4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-48 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

const expenseChartConfig = {
  amount: {
    label: "Amount",
    color: "hsl(var(--chart-1))",
  },
};

const incomeChartConfig = {
  income: {
    label: "Income",
    color: "hsl(var(--chart-2))",
  },
  expense: {
    label: "Expense",
    color: "hsl(var(--chart-1))",
  },
};

export default function TransactionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { currency } = useCurrency();
  const { transactions, loading: transactionsLoading } = useTransactions();
  const { projects, loading: projectsLoading } = useProjects();
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const transactionId = params.id as string;

  const { transaction, categoryHistory, allIncome, monthlyNet } = useMemo(() => {
    const t = transactions.find((trans) => trans.id === transactionId);
    if (!t) return { transaction: null, categoryHistory: [], allIncome: [], monthlyNet: [] };

    if (t.type === 'income') {
        const incomeTxns = transactions
            .filter((hist) => hist.type === 'income')
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        const monthlyData: Record<string, { income: number; expense: number }> = {};
        transactions.forEach(txn => {
            const date = new Date(txn.date);
            if (!isNaN(date.getTime())) {
                const month = date.toLocaleString('default', { month: 'short', year: '2-digit' });
                if (!monthlyData[month]) {
                    monthlyData[month] = { income: 0, expense: 0 };
                }
                if (txn.type === 'income') {
                    monthlyData[month].income += txn.amount;
                } else {
                    monthlyData[month].expense += txn.amount;
                }
            }
        });
        
        const sortedMonths = Object.keys(monthlyData).sort((a, b) => {
            const [monthA, yearA] = a.split(' ');
            const [monthB, yearB] = b.split(' ');
            const dateA = new Date(`1 ${monthA} 20${yearA}`);
            const dateB = new Date(`1 ${monthB} 20${yearB}`);
            return dateA.getTime() - dateB.getTime();
        });

        const net = sortedMonths.map(month => ({
            month,
            income: monthlyData[month].income,
            expense: monthlyData[month].expense,
        }));
        
        return { transaction: t, categoryHistory: [], allIncome: incomeTxns, monthlyNet: net };
    } else { // It's an expense
        const history = transactions
          .filter((hist) => hist.category === t.category && hist.status === 'completed' && hist.type === 'expense')
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
          
        return { transaction: t, categoryHistory: history, allIncome: [], monthlyNet: [] };
    }
  }, [transactions, transactionId]);

  const monthlyCategoryHistory = useMemo(() => {
      if (!categoryHistory || transaction?.type === 'income') return [];
      
      const monthlySpending: Record<string, number> = {};
      
      categoryHistory.forEach(t => {
          const date = new Date(t.date);
          if (!isNaN(date.getTime())) {
              const month = date.toLocaleString('default', { month: 'short', year: '2-digit' });
              monthlySpending[month] = (monthlySpending[month] || 0) + t.amount;
          }
      });
      
      const sortedMonths = Object.keys(monthlySpending).sort((a, b) => {
          const [monthA, yearA] = a.split(' ');
          const [monthB, yearB] = b.split(' ');
          const dateA = new Date(`1 ${monthA} 20${yearA}`);
          const dateB = new Date(`1 ${monthB} 20${yearB}`);
          return dateA.getTime() - dateB.getTime();
      });

      return sortedMonths.map(month => ({
          month,
          amount: monthlySpending[month],
      }));

  }, [categoryHistory, transaction]);

  const handleMarkAsCompleted = async () => {
    if (!transaction) return;
    setIsUpdating(true);
    try {
      const transactionRef = ref(db, `transactions/${transaction.id}`);
      await update(transactionRef, { status: "completed" });
      toast({
        title: "Transaction Updated",
        description: `"${transaction.title}" has been marked as completed.`,
      });
      router.push("/transactions");
    } catch (error) {
      console.error("Failed to update status:", error);
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: "Could not update the transaction status.",
      });
    } finally {
      setIsUpdating(false);
      setShowConfirmDialog(false);
    }
  };

  const loading = transactionsLoading || projectsLoading;

  if (loading) {
    return <TransactionDetailSkeleton />;
  }

  if (!transaction) {
    return (
      <div>
        <PageHeader title="Transaction Not Found" />
        <p>The transaction you are looking for does not exist.</p>
        <Button asChild variant="link" className="px-0">
          <Link href="/transactions">
            <ArrowLeft className="mr-2 h-4 w-4" /> Go back to transactions
          </Link>
        </Button>
      </div>
    );
  }

  const projectName =
    projects.find((p) => p.id === transaction.projectId)?.name || "N/A";

  const getStatusBadge = (status: 'completed' | 'credit' | 'expected') => {
      switch(status) {
          case 'credit': return <Badge variant="destructive" className="capitalize text-base">Credit</Badge>
          case 'expected': return <Badge variant="secondary" className="capitalize text-base text-blue-600 border-blue-300 bg-blue-100">Expected</Badge>
          default: return <Badge variant="default" className="capitalize text-base bg-green-100 text-green-800 border-green-200">Completed</Badge>;
      }
  }

  return (
    <div>
      <Button asChild variant="ghost" className="mb-4">
        <Link href="/transactions">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Transactions
        </Link>
      </Button>

      <PageHeader
        title={transaction.title}
        description={`Details for transaction on ${formatDate(transaction.date)}`}
      />

      {(transaction.status === "credit" || transaction.status === "expected") && (
        <div className="mb-6">
          <Button onClick={() => setShowConfirmDialog(true)}>
            <CheckCircle className="mr-2 h-4 w-4" />
            Mark as Completed
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Transaction Details</CardTitle>
            </CardHeader>
            <CardContent className="grid sm:grid-cols-2 gap-4 text-sm">
                <div className="font-semibold">Amount</div>
                <div className="sm:text-right text-2xl font-bold text-primary">{formatCurrency(transaction.amount, currency)}</div>

                {transaction.type === 'expense' && (
                    <>
                        <div className="font-semibold">Category</div>
                        <div className="sm:text-right"><Badge variant="outline" className={getCategoryBadgeColorClass(transaction.category)}>{transaction.category}</Badge></div>
                    </>
                )}
                
                <div className="font-semibold">Project</div>
                <div className="sm:text-right">{projectName}</div>

                <div className="font-semibold">Status</div>
                <div className="sm:text-right">{getStatusBadge(transaction.status)}</div>

                <div className="font-semibold">Date</div>
                <div className="sm:text-right">{formatDate(transaction.date)}</div>

                <div className="font-semibold">Vendor</div>
                <div className="sm:text-right">{transaction.vendor || "-"}</div>
                
                <div className="font-semibold">Created By</div>
                <div className="sm:text-right">{transaction.createdBy}</div>

                <div className="font-semibold">Invoice No.</div>
                <div className="sm:text-right">{transaction.invoiceNo || "-"}</div>

                <div className="font-semibold">Quantity / Unit</div>
                <div className="sm:text-right">{transaction.quantity || "-"} {transaction.unit}</div>

                {transaction.description && <>
                    <div className="font-semibold sm:col-span-2 pt-4 border-t">Description</div>
                    <div className="sm:col-span-2 text-muted-foreground">{transaction.description}</div>
                </>}

                 {transaction.notes && <>
                    <div className="font-semibold sm:col-span-2 pt-4 border-t">Notes</div>
                    <div className="sm:col-span-2 text-muted-foreground">{transaction.notes}</div>
                </>}
            </CardContent>
          </Card>
          {transaction.receiptUrl && (
            <Card>
              <CardHeader>
                <CardTitle>Receipt</CardTitle>
              </CardHeader>
              <CardContent>
                <a href={transaction.receiptUrl} target="_blank" rel="noopener noreferrer">
                    <Image
                    src={transaction.receiptUrl}
                    alt={`Receipt for ${transaction.title}`}
                    width={800}
                    height={1200}
                    className="rounded-md w-full max-w-lg mx-auto object-contain cursor-pointer"
                    />
                </a>
              </CardContent>
            </Card>
          )}
        </div>
        <div className="space-y-6">
            {transaction.type === 'expense' ? (
                <>
                    <Card>
                        <CardHeader>
                            <CardTitle>Spending Over Time</CardTitle>
                            <CardDescription>For category: {transaction.category}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ChartContainer config={expenseChartConfig} className="w-full h-64">
                                <LineChart accessibilityLayer data={categoryHistory} margin={{ top: 20, right: 20, left: 0, bottom: 5 }}>
                                    <CartesianGrid vertical={false} />
                                    <XAxis
                                        dataKey="date"
                                        tickLine={false}
                                        axisLine={false}
                                        tickMargin={8}
                                        tickFormatter={(value) => formatDate(value)}
                                    />
                                    <YAxis
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(value) => formatCurrency(value as number, currency).slice(0, -3)}
                                    />
                                    <ChartTooltip
                                        cursor={false}
                                        content={<ChartTooltipContent formatter={(value) => formatCurrency(value as number, currency)} name="Amount" />}
                                    />
                                    <Line
                                        dataKey="amount"
                                        type="monotone"
                                        stroke="var(--color-amount)"
                                        strokeWidth={2}
                                        dot={false}
                                    />
                                </LineChart>
                            </ChartContainer>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Monthly Breakdown</CardTitle>
                            <CardDescription>For category: {transaction.category}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ChartContainer config={expenseChartConfig} className="w-full h-64">
                                <BarChart accessibilityLayer data={monthlyCategoryHistory} margin={{ top: 20, right: 20, left: 0, bottom: 5 }}>
                                    <CartesianGrid vertical={false} />
                                    <XAxis
                                        dataKey="month"
                                        tickLine={false}
                                        tickMargin={10}
                                        axisLine={false}
                                    />
                                    <YAxis
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(value) => formatCurrency(value as number, currency).slice(0, -3)}
                                    />
                                    <ChartTooltip
                                        cursor={false}
                                        content={<ChartTooltipContent formatter={(value) => formatCurrency(value as number, currency)} hideLabel />}
                                    />
                                    <Bar
                                        dataKey="amount"
                                        fill="var(--color-amount)"
                                        radius={8}
                                    />
                                </BarChart>
                            </ChartContainer>
                        </CardContent>
                    </Card>
                </>
            ) : (
                <>
                    <Card>
                        <CardHeader>
                            <CardTitle>Income Over Time</CardTitle>
                            <CardDescription>All recorded income transactions.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ChartContainer config={incomeChartConfig} className="w-full h-64">
                                <LineChart accessibilityLayer data={allIncome} margin={{ top: 20, right: 20, left: 0, bottom: 5 }}>
                                    <CartesianGrid vertical={false} />
                                    <XAxis
                                        dataKey="date"
                                        tickLine={false}
                                        axisLine={false}
                                        tickMargin={8}
                                        tickFormatter={(value) => formatDate(value)}
                                    />
                                    <YAxis
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(value) => formatCurrency(value as number, currency).slice(0, -3)}
                                    />
                                    <ChartTooltip
                                        cursor={false}
                                        content={<ChartTooltipContent formatter={(value) => formatCurrency(value as number, currency)} name="Income" />}
                                    />
                                    <Line
                                        dataKey="amount"
                                        type="monotone"
                                        stroke="var(--color-income)"
                                        strokeWidth={2}
                                        dot={false}
                                        name="Income"
                                    />
                                </LineChart>
                            </ChartContainer>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Monthly Income vs. Expense</CardTitle>
                            <CardDescription>Comparison of total income and expenses per month.</CardDescription>
                        </CardHeader>
                        <CardContent>
                             <ChartContainer config={incomeChartConfig} className="w-full h-64">
                                <BarChart accessibilityLayer data={monthlyNet} margin={{ top: 20, right: 20, left: 0, bottom: 5 }}>
                                    <CartesianGrid vertical={false} />
                                    <XAxis
                                        dataKey="month"
                                        tickLine={false}
                                        tickMargin={10}
                                        axisLine={false}
                                    />
                                    <YAxis
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(value) => formatCurrency(value as number, currency).slice(0, -3)}
                                    />
                                    <ChartTooltip
                                        cursor={false}
                                        content={<ChartTooltipContent formatter={(value, name) => `${formatCurrency(value as number, currency)}`} />}
                                    />
                                    <Legend />
                                    <Bar
                                        dataKey="income"
                                        fill="var(--color-income)"
                                        radius={4}
                                    />
                                    <Bar
                                        dataKey="expense"
                                        fill="var(--color-expense)"
                                        radius={4}
                                    />
                                </BarChart>
                            </ChartContainer>
                        </CardContent>
                    </Card>
                </>
            )}
        </div>
      </div>

      <AlertDialog
        open={showConfirmDialog}
        onOpenChange={setShowConfirmDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Status Change</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to mark this transaction as "Completed"?
              This action cannot be easily undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleMarkAsCompleted} disabled={isUpdating}>
              {isUpdating ? "Updating..." : "Yes, Mark as Completed"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
