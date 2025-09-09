
"use client";

import { useState, useMemo, ReactNode } from 'react';
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
import { ChevronRight, Receipt, User, ArrowUp, ArrowDown } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import Image from 'next/image';
import { Transaction } from '@/types';
import { getCategoryColorClass, getCategoryBadgeColorClass } from '@/lib/utils';
import { useTransactions, useCategories } from '@/hooks/use-database';
import { Skeleton } from '@/components/ui/skeleton';
import { useIsMobile } from '@/hooks/use-mobile';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';


const TRANSACTIONS_PER_PAGE = 20;

const ReceiptPreviewDialog = ({ transaction }: { transaction: Transaction }) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Receipt for {transaction.title}</DialogTitle>
           <DialogDescription>
            Viewing the receipt image for the transaction: {transaction.title} dated {formatDate(transaction.date)}.
          </DialogDescription>
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

const isToday = (someDate: Date | string) => {
    const today = new Date();
    const date = typeof someDate === 'string' ? new Date(someDate) : someDate;
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
};

const getStatusBadge = (status: 'completed' | 'credit' | 'expected') => {
    switch(status) {
        case 'credit': return <Badge variant="destructive" className="capitalize text-xs">Credit</Badge>
        case 'expected': return <Badge variant="secondary" className="capitalize text-xs text-blue-600 border-blue-300 bg-blue-100">Expected</Badge>
        default: return null;
    }
}

export default function TransactionsPage() {
    const { transactions, loading } = useTransactions();
    const { categories } = useCategories();
    const isMobile = useIsMobile();
    
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [sortBy, setSortBy] = useState("createdAt");
    const [visibleCount, setVisibleCount] = useState(TRANSACTIONS_PER_PAGE);

    const filteredTransactions = useMemo(() => 
        [...transactions]
        .filter(t => {
            const searchTermLower = searchTerm.toLowerCase();
            const matchesCategory = selectedCategory === 'all' || t.category === selectedCategory;
            const matchesSearch = searchTerm.trim() === '' ||
                t.title.toLowerCase().includes(searchTermLower) ||
                t.vendor.toLowerCase().includes(searchTermLower) ||
                (t.description && t.description.toLowerCase().includes(searchTermLower));
            return matchesCategory && matchesSearch;
        })
        .sort((a, b) => {
            if (sortBy === 'createdAt') {
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            }
            return new Date(b.date).getTime() - new Date(a.date).getTime();
        }),
        [transactions, searchTerm, selectedCategory, sortBy]
    );

    const visibleTransactions = filteredTransactions.slice(0, visibleCount);

    const loadMore = () => {
        setVisibleCount(prevCount => prevCount + TRANSACTIONS_PER_PAGE);
    };

    const renderTransactionItem = (t: Transaction) => (
        <div key={t.id} className="flex justify-between items-center py-3">
            <div className="flex-1">
                <div className="font-medium flex items-center gap-2">{t.title} {t.type === 'expense' && getStatusBadge(t.status)}</div>
                <div className="text-sm text-muted-foreground">{t.vendor}</div>
                 <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                    <div className="flex items-center gap-2">
                         {isToday(t.createdAt) && (
                            <Badge variant="secondary" className="px-1.5 py-0.5 text-xs">Today</Badge>
                        )}
                    </div>
                    <span className='flex items-center gap-1'><User className='h-3 w-3' />{t.createdBy}</span>
                </div>
            </div>
            <div className="flex flex-col items-end ml-4">
                <div className={`font-medium text-lg ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(t.amount)}</div>
                <Badge variant="outline" className={`mt-1 text-xs ${getCategoryBadgeColorClass(t.category)}`}>{t.category}</Badge>
            </div>
            {t.receiptUrl && <ReceiptPreviewDialog transaction={t} />}
        </div>
    );

    const renderGroupedTransactions = (transactionsToRender: Transaction[]) => {
        const grouped: React.ReactNode[] = [];
        let lastDate: string | null = null;
        let dailyIncome = 0;
        let dailyExpense = 0;
        
        const renderSeparator = (date: string, income: number, expense: number) => {
             const separatorContent = (
                <div className="flex items-center gap-4 py-3 my-2 bg-muted/80 rounded-md px-4 w-full">
                    <span className="text-sm font-bold text-foreground">{date}</span>
                    <Separator className="flex-1 bg-border" orientation="vertical" />
                    <div className="flex gap-4 text-sm">
                        {income > 0 && <span className="flex items-center font-medium text-green-600"><ArrowUp className="h-4 w-4 mr-1"/> Received: {formatCurrency(income)}</span>}
                        {expense > 0 && <span className="flex items-center font-medium text-red-600"><ArrowDown className="h-4 w-4 mr-1"/> Spent: {formatCurrency(expense)}</span>}
                    </div>
                </div>
            );
            
            if (isMobile) {
                return <div key={`sep-mobile-${date}`}>{separatorContent}</div>
            }

            return (
                <TableRow key={`sep-desktop-${date}`} className="hover:bg-transparent">
                    <TableCell colSpan={6} className="p-0">
                       {separatorContent}
                    </TableCell>
                </TableRow>
            )
        }

        transactionsToRender.forEach((t, index) => {
            const currentDate = formatDate(t.date);
            if (currentDate !== lastDate) {
                if(lastDate) {
                    grouped.push(renderSeparator(lastDate, dailyIncome, dailyExpense));
                }
                lastDate = currentDate;
                dailyIncome = 0;
                dailyExpense = 0;
            }

            if(t.type === 'income') dailyIncome += t.amount;
            else if (t.status === 'completed') dailyExpense += t.amount;

            if (isMobile) {
                 grouped.push(
                    <Card key={t.id}>
                        <CardContent className={`p-4 ${getCategoryColorClass(t.category)}`}>
                            {renderTransactionItem(t)}
                        </CardContent>
                    </Card>
                );
            } else {
                 grouped.push(
                    <TableRow key={t.id} className={getCategoryColorClass(t.category)}>
                        <TableCell>
                            <div className="font-medium flex items-center gap-2">
                                {t.title} 
                                {getStatusBadge(t.status)}
                            </div>
                            <div className="hidden text-sm text-muted-foreground md:inline">
                                {t.vendor}
                            </div>
                        </TableCell>
                        <TableCell>{t.createdBy}</TableCell>
                        <TableCell>
                        <Badge variant="outline" className={getCategoryBadgeColorClass(t.category)}>{t.category}</Badge>
                        </TableCell>
                        <TableCell className={`text-right font-medium ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                             {t.type === 'income' ? '+' : '-'} {formatCurrency(t.amount)}
                        </TableCell>
                         <TableCell className="text-center">
                            {isToday(t.createdAt) && <Badge variant="secondary" className="px-1.5 py-0.5 text-xs">Today</Badge>}
                        </TableCell>
                        <TableCell className="text-center">
                        {t.receiptUrl && <ReceiptPreviewDialog transaction={t} />}
                        </TableCell>
                    </TableRow>
                 )
            }
        });
        
        if (lastDate) {
            grouped.push(renderSeparator(lastDate, dailyIncome, dailyExpense));
        }

        return grouped;
    }

  return (
    <div>
      <PageHeader
        title="Transactions"
        description="A detailed list of all your expenses."
      />

    <Card className="mb-6">
        <CardContent className="p-4 flex flex-col md:flex-row gap-4">
            <Input 
                placeholder="Search by title, vendor, description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
            />
            <div className='flex gap-4'>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-full md:w-[200px]">
                        <SelectValue placeholder="Filter by category" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {categories.map(cat => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-full md:w-[180px]">
                        <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="createdAt">Date Added</SelectItem>
                        <SelectItem value="date">Expense Date</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </CardContent>
    </Card>

      {isMobile ? (
         <div className="space-y-4">
            {loading ? (
                Array.from({ length: 10 }).map((_, i) => (
                    <Card key={i}><CardContent className="p-4"><Skeleton className="h-16 w-full" /></CardContent></Card>
                ))
            ) : (
                renderGroupedTransactions(visibleTransactions)
            )}
             {visibleCount < filteredTransactions.length && (
                <div className="text-center mt-4">
                <Button onClick={loadMore} variant="outline">Load More</Button>
                </div>
            )}
            {!loading && filteredTransactions.length === 0 && (
                <div className="text-center py-10 text-muted-foreground">
                    No transactions match your search.
                </div>
            )}
         </div>
      ) : (
        <Card>
            <CardHeader>
            <CardTitle>All Expenses</CardTitle>
            </CardHeader>
            <CardContent>
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>Description</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-center">Date Added</TableHead>
                    <TableHead className="text-center w-12">Receipt</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {loading ? (
                    Array.from({ length: 10 }).map((_, i) => (
                    <TableRow key={i}>
                        <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-5 w-16 float-right" /></TableCell>
                        <TableCell />
                        <TableCell />
                    </TableRow>
                    ))
                ) : (
                    renderGroupedTransactions(visibleTransactions)
                )}
                {!loading && filteredTransactions.length === 0 && (
                     <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center">
                            No transactions match your filters.
                        </TableCell>
                    </TableRow>
                )}
                </TableBody>
            </Table>
            {visibleCount < filteredTransactions.length && !loading && (
                <div className="text-center mt-4 pt-4 border-t">
                <Button onClick={loadMore} variant="outline">Load More</Button>
                </div>
            )}
            </CardContent>
        </Card>
      )}
    </div>
  );
}
