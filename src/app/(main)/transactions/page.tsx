
"use client";

import { useState, useMemo } from 'react';
import { PageHeader } from "@/components/page-header";
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
import { formatCurrency, formatDate } from "@/lib/data";
import { Button } from '@/components/ui/button';
import { ChevronRight, Receipt } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import Image from 'next/image';
import { Transaction } from '@/types';
import { getCategoryColorClass, getCategoryBadgeColorClass } from '@/lib/utils';
import { useTransactions } from '@/hooks/use-database';
import { Skeleton } from '@/components/ui/skeleton';


const TRANSACTIONS_PER_PAGE = 20;

const ReceiptPreviewDialog = ({ transaction }: { transaction: Transaction }) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-6 w-6">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Receipt for {transaction.title}</DialogTitle>
        </DialogHeader>
        <div className="mt-4 overflow-auto">
          <div className="w-full min-w-[600px] relative group">
            {transaction.receiptUrl ? (
                <Image
                    src={transaction.receiptUrl}
                    alt={`Receipt for ${transaction.title}`}
                    width={1200}
                    height={1600}
                    className="w-full h-auto object-contain transition-transform duration-300 ease-in-out group-hover:scale-125"
                />
            ) : (
                <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                    <Receipt className="h-12 w-12 mb-4" />
                    <p>No receipt image available.</p>
                </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};


export default function TransactionsPage() {
    const { transactions, loading } = useTransactions();
    const sortedTransactions = useMemo(() => 
        [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
        [transactions]
    );
    const [visibleCount, setVisibleCount] = useState(TRANSACTIONS_PER_PAGE);

    const visibleTransactions = sortedTransactions.slice(0, visibleCount);

    const loadMore = () => {
        setVisibleCount(prevCount => prevCount + TRANSACTIONS_PER_PAGE);
    };

  return (
    <div>
      <PageHeader
        title="Transactions"
        description="A detailed list of all your expenses."
      />
      <Card>
        <CardHeader>
          <CardTitle>All Expenses</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="w-12">Receipt</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-5 w-16 float-right" /></TableCell>
                    <TableCell />
                  </TableRow>
                ))
              ) : (
                visibleTransactions.map((t) => (
                  <TableRow key={t.id} className={getCategoryColorClass(t.category)}>
                    <TableCell>{formatDate(t.date)}</TableCell>
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
                    <TableCell className="text-center">
                      {t.receiptUrl && <ReceiptPreviewDialog transaction={t} />}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
           {visibleCount < sortedTransactions.length && (
            <div className="text-center mt-4">
              <Button onClick={loadMore} variant="outline">Load More</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
