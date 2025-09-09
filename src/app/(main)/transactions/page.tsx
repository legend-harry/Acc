
"use client";

import * as React from 'react';
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
import { ChevronRight, Receipt, User, ArrowUp, ArrowDown, AlertTriangle, Info, MoreVertical, Trash2, Edit } from 'lucide-react';
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { remove, ref } from 'firebase/database';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { EditTransactionDialog } from '@/components/edit-transaction-dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

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

const DeleteConfirmationDialog = ({
  transaction,
  onConfirm,
  isOpen,
  onOpenChange,
}: {
  transaction: Transaction;
  onConfirm: () => void;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}) => {
  const [isLocked, setIsLocked] = useState(true);

  React.useEffect(() => {
    if (isOpen) {
      setIsLocked(true);
      const timer = setTimeout(() => setIsLocked(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the transaction
            for <span className="font-bold">{transaction.title}</span> amounting to <span className="font-bold">{formatCurrency(transaction.amount)}</span>.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} disabled={isLocked}>
            {isLocked ? "Confirming..." : "Yes, delete it"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
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
    const { toast } = useToast();
    
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [sortBy, setSortBy] = useState("createdAt");
    const [visibleCount, setVisibleCount] = useState(TRANSACTIONS_PER_PAGE);

    const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
    const [deletingTransaction, setDeletingTransaction] = useState<Transaction | null>(null);

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

    const handleDelete = async () => {
      if (!deletingTransaction) return;

      try {
        await remove(ref(db, `transactions/${deletingTransaction.id}`));
        toast({
          title: "Transaction Deleted",
          description: `${deletingTransaction.title} has been successfully deleted.`,
        });
      } catch (error) {
        console.error("Failed to delete transaction:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Could not delete the transaction.",
        });
      } finally {
        setDeletingTransaction(null);
      }
    };

    const renderTransactionActions = (t: Transaction) => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => setEditingTransaction(t)}>
            <Edit className="mr-2 h-4 w-4" />
            <span>Edit</span>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setDeletingTransaction(t)} className="text-red-600">
            <Trash2 className="mr-2 h-4 w-4" />
            <span>Delete</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );

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
            {renderTransactionActions(t)}
            {t.receiptUrl && <ReceiptPreviewDialog transaction={t} />}
        </div>
    );

    const renderGroupedTransactions = (transactionsToRender: Transaction[]) => {
        const groupedByDate: Record<string, Transaction[]> = transactionsToRender.reduce((acc, t) => {
            const dateKey = formatDate(t.date);
            if (!acc[dateKey]) {
                acc[dateKey] = [];
            }
            acc[dateKey].push(t);
            return acc;
        }, {} as Record<string, Transaction[]>);

        return Object.entries(groupedByDate).flatMap(([date, dailyTransactions]) => {
            
            const completedIncome = dailyTransactions
                .filter(t => t.type === 'income' && t.status === 'completed')
                .reduce((sum, t) => sum + t.amount, 0);
            const completedExpense = dailyTransactions
                .filter(t => t.type === 'expense' && t.status === 'completed')
                .reduce((sum, t) => sum + t.amount, 0);
            const completedNet = completedIncome - completedExpense;

            const creditTotal = dailyTransactions
                .filter(t => t.status === 'credit')
                .reduce((sum, t) => sum + t.amount, 0);

            const expectedTotal = dailyTransactions
                .filter(t => t.status === 'expected')
                .reduce((sum, t) => sum + t.amount, 0);

            const separatorContent = (
                <div className="flex justify-between items-center gap-4 py-3 my-2 bg-muted/80 rounded-md px-4 w-full">
                    <span className="text-sm font-bold text-foreground">{date}</span>
                    <div className="flex items-center gap-4 text-sm">
                        {completedIncome > 0 && <span className="flex items-center font-medium text-green-600"><ArrowUp className="h-4 w-4 mr-1"/>{formatCurrency(completedIncome)}</span>}
                        {completedExpense > 0 && <span className="flex items-center font-medium text-red-600"><ArrowDown className="h-4 w-4 mr-1"/>{formatCurrency(completedExpense)}</span>}
                        
                        {(completedIncome > 0 || completedExpense > 0) && <Separator orientation="vertical" className="h-5 bg-border" />}
                        
                        <span className={`font-bold ${completedNet >= 0 ? 'text-green-700' : 'text-red-700'}`}>{formatCurrency(completedNet)}</span>

                        {(creditTotal > 0 || expectedTotal > 0) && (
                            <div className="flex items-center gap-2 pl-2 border-l">
                                {creditTotal > 0 && <span className="flex items-center text-xs font-medium text-red-600"><AlertTriangle className="h-3 w-3 mr-1" />({formatCurrency(creditTotal)})</span>}
                                {expectedTotal > 0 && <span className="flex items-center text-xs font-medium text-blue-600"><Info className="h-3 w-3 mr-1" />({formatCurrency(expectedTotal)})</span>}
                            </div>
                        )}
                    </div>
                </div>
            );
            
            const separator = isMobile ? (
                <div key={`sep-mobile-${date}`}>{separatorContent}</div>
            ) : (
                <TableRow key={`sep-desktop-${date}`} className="hover:bg-transparent">
                    <TableCell colSpan={7} className="p-0">
                       {separatorContent}
                    </TableCell>
                </TableRow>
            );

            const transactionElements = dailyTransactions.map(t => {
                if (isMobile) {
                    return (
                        <Card key={t.id}>
                            <CardContent className={`p-4 ${getCategoryColorClass(t.category)}`}>
                                {renderTransactionItem(t)}
                            </CardContent>
                        </Card>
                    );
                } else {
                    return (
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
                            <TableCell className="text-center">
                                {renderTransactionActions(t)}
                            </TableCell>
                        </TableRow>
                    );
                }
            });

            return [separator, ...transactionElements];
        });
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
                    <TableHead className="text-center w-12">Actions</TableHead>
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
                        <TableCell />
                    </TableRow>
                    ))
                ) : (
                    renderGroupedTransactions(visibleTransactions)
                )}
                {!loading && filteredTransactions.length === 0 && (
                     <TableRow>
                        <TableCell colSpan={7} className="h-24 text-center">
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

      {editingTransaction && (
        <EditTransactionDialog 
            transaction={editingTransaction}
            isOpen={!!editingTransaction}
            onOpenChange={(isOpen) => {
                if (!isOpen) setEditingTransaction(null);
            }}
        />
      )}
      {deletingTransaction && (
        <DeleteConfirmationDialog 
            transaction={deletingTransaction}
            isOpen={!!deletingTransaction}
            onOpenChange={(isOpen) => {
                if (!isOpen) setDeletingTransaction(null);
            }}
            onConfirm={handleDelete}
        />
      )}
    </div>
  );
}
