
"use client";

import * as React from 'react';
import { useState, useMemo, useEffect, ReactNode } from 'react';
import { useSearchParams } from 'next/navigation';
import { PageHeader } from "@/components/page-header";
import {
  Card,
  CardContent,
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
import { ChevronRight, Receipt, User, ArrowUp, ArrowDown, AlertTriangle, Info, MoreVertical, Trash2, Edit, Calendar as CalendarIcon, SlidersHorizontal, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import Image from 'next/image';
import { Transaction, Project } from '@/types';
import { getCategoryColorClass, getCategoryBadgeColorClass } from '@/lib/utils';
import { useTransactions, useCategories, useProjects } from '@/hooks/use-database';
import { Skeleton } from '@/components/ui/skeleton';
import { useIsMobile } from '@/hooks/use-mobile';
import { Input } from '@/components/ui/input';
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';


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

const FloatingSum = ({ transactions }: { transactions: Transaction[] }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const netSum = useMemo(() => {
        return transactions.reduce((sum, t) => {
            if (t.type === 'income') {
                return sum + t.amount;
            }
            if (t.type === 'expense') {
                return sum - t.amount;
            }
            return sum;
        }, 0);
    }, [transactions]);

    if (transactions.length === 0) return null;

    const NetSumDisplay = () => {
      const isNegative = netSum < 0;
      const formattedSum = formatCurrency(Math.abs(netSum));
      
      return (
        <span className="font-bold text-lg text-white">
          {isNegative ? '-' : ''}{formattedSum}
        </span>
      )
    };

    return (
        <div className="fixed bottom-6 right-6 z-50">
            <div 
                className={cn(
                    "bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-lg cursor-pointer transition-all duration-300 ease-in-out",
                    isExpanded ? "h-16 w-auto px-6" : "h-16 w-16"
                )}
                onClick={() => setIsExpanded(!isExpanded)}
            >
                {isExpanded ? (
                     <div className="flex flex-col text-center leading-tight">
                        <span className="text-xs">Net Sum</span>
                        <NetSumDisplay />
                    </div>
                ) : (
                    <span className="font-semibold">Total</span>
                )}
            </div>
        </div>
    );
};


function TransactionsPageContent() {
    const { transactions, loading } = useTransactions();
    const { categories } = useCategories();
    const { projects } = useProjects();
    const isMobile = useIsMobile();
    const { toast } = useToast();
    const searchParams = useSearchParams();

    // Filter States
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
    const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
    const [selectedDate, setSelectedDate] = useState<Date | undefined>();
    const [sortBy, setSortBy] = useState("createdAt");
    
    // Other States
    const [visibleCount, setVisibleCount] = useState(TRANSACTIONS_PER_PAGE);
    const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
    const [deletingTransaction, setDeletingTransaction] = useState<Transaction | null>(null);
    const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);

    useEffect(() => {
        const statusFromUrl = searchParams.get('status');
        if (statusFromUrl) {
            setSelectedStatuses(prev => [...new Set([...prev, statusFromUrl])]);
        }
    }, [searchParams]);

    const isFilterActive = useMemo(() => 
        selectedCategories.length > 0 || 
        selectedStatuses.length > 0 || 
        selectedProjects.length > 0 || 
        !!selectedDate,
    [selectedCategories, selectedStatuses, selectedProjects, selectedDate]);

    const filteredTransactions = useMemo(() => 
        [...transactions]
        .filter(t => {
            const searchTermLower = searchTerm.toLowerCase();
            const matchesSearch = searchTerm.trim() === '' ||
                t.title.toLowerCase().includes(searchTermLower) ||
                t.vendor.toLowerCase().includes(searchTermLower) ||
                (t.description && t.description.toLowerCase().includes(searchTermLower));

            const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(t.category);
            const matchesStatus = selectedStatuses.length === 0 || selectedStatuses.includes(t.status) || (selectedStatuses.includes('income') && t.type === 'income') || (selectedStatuses.includes('expense') && t.type === 'expense');
            const matchesProject = selectedProjects.length === 0 || selectedProjects.includes(t.projectId);
            
            const tDate = new Date(t.date);
            const matchesDate = !selectedDate || (
                tDate.getFullYear() === selectedDate.getFullYear() &&
                tDate.getMonth() === selectedDate.getMonth() &&
                tDate.getDate() === selectedDate.getDate()
            );

            return matchesCategory && matchesSearch && matchesDate && matchesStatus && matchesProject;
        })
        .sort((a, b) => {
            if (sortBy === 'createdAt') {
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            }
            if (sortBy === 'project') {
                const projectA = projects.find(p => p.id === a.projectId)?.name || '';
                const projectB = projects.find(p => p.id === b.projectId)?.name || '';
                return projectA.localeCompare(projectB);
            }
            return new Date(b.date).getTime() - new Date(a.date).getTime();
        }),
        [transactions, searchTerm, selectedCategories, selectedStatuses, selectedProjects, sortBy, selectedDate, projects]
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
    
    const resetFilters = () => {
        setSelectedCategories([]);
        setSelectedStatuses([]);
        setSelectedProjects([]);
        setSelectedDate(undefined);
        setSortBy("createdAt");
    }

    const handleMultiSelect = (setter: React.Dispatch<React.SetStateAction<string[]>>) => (value: string) => {
        setter(prev => prev.includes(value) ? prev.filter(item => item !== value) : [...prev, value]);
    };

    const handleSingleProjectSelect = (projectId: string) => {
        if (projectId === 'all') {
            setSelectedProjects([]);
        } else {
            setSelectedProjects([projectId]);
        }
    }

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
        <CardContent className="p-4 flex items-center gap-4">
             <Input 
                placeholder="Search by title, vendor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
            />
             <Select value={selectedProjects.length === 1 ? selectedProjects[0] : "all"} onValueChange={handleSingleProjectSelect}>
                <SelectTrigger className="w-[180px] bg-card">
                    <SelectValue placeholder="Select a project" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Projects</SelectItem>
                    {projects.map((project: Project) => (
                        <SelectItem key={project.id} value={project.id}>
                            {project.name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <Popover open={isFilterMenuOpen} onOpenChange={setIsFilterMenuOpen}>
                <PopoverTrigger asChild>
                    <Button variant="outline" className={cn(isFilterActive && "border-yellow-400 bg-yellow-50 text-yellow-900 hover:bg-yellow-100")}>
                        <SlidersHorizontal className="mr-2 h-4 w-4" />
                        Filter
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80" align="end">
                    <ScrollArea className="h-96">
                        <div className="grid gap-4 p-4">
                            <h4 className="font-medium leading-none">Filters & Sort</h4>
                            
                            <div className="grid gap-2">
                                <Label>Status</Label>
                                <div className="flex flex-wrap gap-2">
                                    {['income', 'expense', 'credit', 'expected'].map(status => (
                                        <div key={status} className="flex items-center space-x-2">
                                            <Checkbox id={`status-${status}`} checked={selectedStatuses.includes(status)} onCheckedChange={() => handleMultiSelect(setSelectedStatuses)(status)} />
                                            <Label htmlFor={`status-${status}`} className="font-normal capitalize">{status}</Label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <Separator />
                             <div className="grid gap-2">
                                <Label>Date</Label>
                                <Calendar
                                    mode="single"
                                    selected={selectedDate}
                                    onSelect={(date) => {
                                        setSelectedDate(date);
                                    }}
                                    className="p-0"
                                />
                                {selectedDate && <Button variant="ghost" size="sm" onClick={() => setSelectedDate(undefined)}>Clear Date</Button>}
                            </div>
                            <Separator />
                            <div className="grid gap-2">
                                <Label>Projects</Label>
                                <div className="flex flex-col gap-2">
                                {projects.map((project: Project) => (
                                    <div key={project.id} className="flex items-center space-x-2">
                                        <Checkbox id={`project-${project.id}`} checked={selectedProjects.includes(project.id)} onCheckedChange={() => handleMultiSelect(setSelectedProjects)(project.id)} />
                                        <Label htmlFor={`project-${project.id}`} className="font-normal">{project.name}</Label>
                                    </div>
                                ))}
                                </div>
                            </div>

                             <Separator />

                             <div className="grid gap-2">
                                <Label>Categories</Label>
                                <div className="flex flex-col gap-2">
                                {categories.map(cat => (
                                    <div key={cat} className="flex items-center space-x-2">
                                        <Checkbox id={`cat-${cat}`} checked={selectedCategories.includes(cat)} onCheckedChange={() => handleMultiSelect(setSelectedCategories)(cat)} />
                                        <Label htmlFor={`cat-${cat}`} className="font-normal">{cat}</Label>
                                    </div>
                                ))}
                                </div>
                            </div>

                             <Separator />

                            <div className="grid gap-2">
                                <Label>Sort By</Label>
                                <RadioGroup value={sortBy} onValueChange={setSortBy}>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="createdAt" id="sort-createdAt" />
                                        <Label htmlFor="sort-createdAt" className="font-normal">Date Added</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="date" id="sort-date" />
                                        <Label htmlFor="sort-date" className="font-normal">Expense Date</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="project" id="sort-project" />
                                        <Label htmlFor="sort-project" className="font-normal">Project</Label>
                                    </div>
                                </RadioGroup>
                            </div>

                        </div>
                    </ScrollArea>
                    <Separator />
                     <div className="p-4 flex justify-between items-center">
                        <Button variant="ghost" onClick={resetFilters} disabled={!isFilterActive}>
                            <X className="mr-2 h-4 w-4"/>
                            Reset
                        </Button>
                        <p className="text-sm text-muted-foreground">{filteredTransactions.length} results</p>
                    </div>
                </PopoverContent>
            </Popover>
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
                    No transactions match your filters.
                </div>
            )}
         </div>
      ) : (
        <Card>
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

      {!loading && <FloatingSum transactions={filteredTransactions} />}

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

export default function TransactionsPage() {
    return (
        <React.Suspense fallback={<div>Loading...</div>}>
            <TransactionsPageContent />
        </React.Suspense>
    )
}
