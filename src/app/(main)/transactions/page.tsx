
"use client";

import * as React from 'react';
import { useState, useMemo, useEffect, ReactNode } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
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
import { Receipt, User, ArrowUp, ArrowDown, AlertTriangle, Info, MoreVertical, Trash2, Edit, SlidersHorizontal, X } from 'lucide-react';
import { Transaction, Project } from '@/types';
import { getCategoryColorClass, getCategoryBadgeColorClass } from '@/lib/utils';
import { useTransactions, useCategories, useProjects } from '@/hooks/use-database';
import { Skeleton } from '@/components/ui/skeleton';
import { useIsMobile } from '@/hooks/use-mobile';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { EditTransactionDialog } from '@/components/edit-transaction-dialog';
import { AddExpenseDialog } from '@/components/add-expense-dialog';
import { LiveFeedTicker } from '@/components/live-feed-ticker';
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
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useProjectFilter } from '@/context/project-filter-context';
import { useCurrency } from '@/context/currency-context';


const TRANSACTIONS_PER_PAGE = 20;

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
  const { currency } = useCurrency();
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
            for <span className="font-bold">{transaction.title}</span> amounting to <span className="font-bold">{formatCurrency(transaction.amount, currency)}</span>.
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

const isToday = (someDate: Date | string | undefined | null) => {
    if (!someDate) return false;
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
    const { currency } = useCurrency();

    const { totalNet } = useMemo(() => {
        const income = transactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);
        
        const expense = transactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);
            
        return { totalNet: income - expense };
    }, [transactions]);

    if (transactions.length === 0) return null;

    return (
      <div className="fixed bottom-8 right-8 z-50 flex flex-col items-end gap-3">
            {/* Main FAB showing Net Balance */}
        <div className="bg-primary text-white rounded-2xl flex items-center justify-center shadow-[0px_8px_32px_rgba(var(--primary-rgb),0.3)] cursor-pointer h-16 px-6 relative z-10 hover:shadow-[0px_12px_40px_rgba(var(--primary-rgb),0.4)] transition-shadow">
                <div className="flex flex-col text-center leading-tight">
            <span className="text-[10px] uppercase font-bold tracking-widest opacity-90 text-white">Net Balance</span>
            <span className="font-bold text-xl text-white">{totalNet >= 0 ? '+' : ''}{formatCurrency(totalNet, currency)}</span>
                </div>
            </div>
        </div>
    );
};


function TransactionsPageContent() {
    const { transactions, loading } = useTransactions();
    const { selectedProjectId, setSelectedProjectId } = useProjectFilter();
    const { categories } = useCategories(selectedProjectId === 'all' ? undefined : selectedProjectId);
    const { projects } = useProjects();
    const isMobile = useIsMobile();
    const { toast } = useToast();
    const searchParams = useSearchParams();
    const router = useRouter();
    const { currency } = useCurrency();

    // Filter States
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
    
    // This state will now be used for the multi-select in the popover
    const [popoverSelectedProjects, setPopoverSelectedProjects] = useState<string[]>([]);
    
    const [selectedDate, setSelectedDate] = useState<Date | undefined>();
    const [sortBy, setSortBy] = useState("date");
    
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

    // Reset pagination whenever any filter or sort changes
    useEffect(() => {
        setVisibleCount(TRANSACTIONS_PER_PAGE);
    }, [searchTerm, selectedCategories, selectedStatuses, selectedProjectId, popoverSelectedProjects, sortBy, selectedDate]);

    useEffect(() => {
        // Sync the popover multi-select with the global single select
        if (selectedProjectId === 'all') {
            setPopoverSelectedProjects([]);
        } else {
            setPopoverSelectedProjects([selectedProjectId]);
        }
    }, [selectedProjectId]);


    const isFilterActive = useMemo(() => 
        selectedCategories.length > 0 || 
        selectedStatuses.length > 0 || 
        popoverSelectedProjects.length > 0 || 
        !!selectedDate,
    [selectedCategories, selectedStatuses, popoverSelectedProjects, selectedDate]);

    const filteredTransactions = useMemo(() => {
        let currentProjects = selectedProjectId === 'all' ? popoverSelectedProjects : [selectedProjectId];
        if (popoverSelectedProjects.length > 0) {
            currentProjects = popoverSelectedProjects;
        }

        return [...transactions]
        .filter(t => {
            const searchTermLower = searchTerm.toLowerCase();
            const matchesSearch = searchTerm.trim() === '' ||
                (t.description && t.description.toLowerCase().includes(searchTermLower)) ||
                (t.category && t.category.toLowerCase().includes(searchTermLower));

            const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(t.category);
            const matchesStatus = selectedStatuses.length === 0 || selectedStatuses.includes(t.status) || (selectedStatuses.includes('income') && t.type === 'income') || (selectedStatuses.includes('expense') && t.type === 'expense');
            const matchesProject = currentProjects.length === 0 || currentProjects.includes(t.projectid);
            
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
                return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            }
            if (sortBy === 'amountDesc') {
                return b.amount - a.amount;
            }
            if (sortBy === 'amountAsc') {
                return a.amount - b.amount;
            }
            if (sortBy === 'project') {
                const projectA = projects.find(p => p.id === a.projectid)?.name || '';
                const projectB = projects.find(p => p.id === b.projectid)?.name || '';
                return projectA.localeCompare(projectB);
            }
            // Default: sort by transaction date desc
            return new Date(b.date).getTime() - new Date(a.date).getTime();
        })
    },
        [transactions, searchTerm, selectedCategories, selectedStatuses, selectedProjectId, popoverSelectedProjects, sortBy, selectedDate, projects]
    );

    const visibleTransactions = filteredTransactions.slice(0, visibleCount);

    const loadMore = () => {
        setVisibleCount(prevCount => prevCount + TRANSACTIONS_PER_PAGE);
    };

    const handleDelete = async () => {
      if (!deletingTransaction) return;

      try {
        const supabase = createClient();
        // Fallback to ensuring clientId logic (ideally we grab it from context via useClient)
        // But since this is global transaction scope, their table has it
        await supabase.from('transactions').delete().eq('id', deletingTransaction.id);
        
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
        setPopoverSelectedProjects([]);
        setSelectedDate(undefined);
        setSortBy("createdAt");
    }

    const handleMultiSelect = (setter: React.Dispatch<React.SetStateAction<string[]>>) => (value: string) => {
        setter(prev => prev.includes(value) ? prev.filter(item => item !== value) : [...prev, value]);
    };

    const handleSingleProjectSelect = (projectId: string) => {
        setSelectedProjectId(projectId);
        if (projectId === 'all') {
            setPopoverSelectedProjects([]);
        } else {
            setPopoverSelectedProjects([projectId]);
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
                .filter(t => t.type === 'income' && (!t.status || t.status === 'completed'))
                .reduce((sum, t) => sum + t.amount, 0);
            const completedExpense = dailyTransactions
                .filter(t => t.type === 'expense' && (!t.status || t.status === 'completed'))
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
                        {completedIncome > 0 && <span className="flex items-center font-medium text-green-600"><ArrowUp className="h-4 w-4 mr-1"/>+{formatCurrency(completedIncome, currency)}</span>}
                        {completedExpense > 0 && <span className="flex items-center font-medium text-red-600"><ArrowDown className="h-4 w-4 mr-1"/>-{formatCurrency(completedExpense, currency)}</span>}
                        
                        {(completedIncome > 0 || completedExpense > 0) && <Separator orientation="vertical" className="h-5 bg-border" />}
                        
                        <span className={cn('font-mono font-bold', completedNet >= 0 ? 'text-green-700' : 'text-red-700')}>{completedNet >= 0 ? '+' : ''}{formatCurrency(completedNet, currency)}</span>

                        {(creditTotal > 0 || expectedTotal > 0) && (
                            <div className="flex items-center gap-2 pl-2 border-l">
                                {creditTotal > 0 && <span className="flex items-center text-xs font-medium text-red-600"><AlertTriangle className="h-3 w-3 mr-1" />({formatCurrency(creditTotal, currency)})</span>}
                                {expectedTotal > 0 && <span className="flex items-center text-xs font-medium text-blue-600"><Info className="h-3 w-3 mr-1" />({formatCurrency(expectedTotal, currency)})</span>}
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
                const handleRowClick = () => router.push(`/transactions/${t.id}`);
                if (isMobile) {
                    return (
                        <Card key={t.id} onClick={handleRowClick} className="cursor-pointer">
                            <CardContent className={`p-4 ${getCategoryColorClass(t.category)}`}>
                               <div className="flex justify-between items-center py-3">
                                  <div className="flex-1">
                                      <div className="font-medium flex items-center gap-2">{t.description || 'Transaction'} {t.type === 'expense' && getStatusBadge(t.status)}</div>
                                      <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                                          <div className="flex items-center gap-2">
                                              {isToday(t.created_at) && (
                                                  <Badge variant="secondary" className="px-1.5 py-0.5 text-xs">Today</Badge>
                                              )}
                                          </div>
                                      </div>
                                  </div>
                                  <div className="flex flex-col items-end ml-4">
                                      <div className={cn('font-mono font-medium text-lg', t.type === 'income' ? 'text-green-600' : 'text-red-600')}>{t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount, currency)}</div>
                                      <Badge variant="outline" className={`mt-1 text-xs ${getCategoryBadgeColorClass(t.category)}`}>{t.category}</Badge>
                                  </div>
                                   <div onClick={(e) => e.stopPropagation()}>{renderTransactionActions(t)}</div>
                              </div>
                            </CardContent>
                        </Card>
                    );
                } else {
                    return (
                        <TableRow key={t.id} onClick={handleRowClick} className={cn("cursor-pointer", getCategoryColorClass(t.category))}>
                            <TableCell>
                                <div className="font-medium flex items-center gap-2">
                                    {t.description || 'Transaction'} 
                                    {getStatusBadge(t.status)}
                                </div>
                            </TableCell>
                            <TableCell>
                                <Badge variant="outline" className={getCategoryBadgeColorClass(t.category)}>{t.category}</Badge>
                            </TableCell>
                            <TableCell className={cn('text-right font-mono font-medium', t.type === 'income' ? 'text-green-600' : 'text-red-600')}>
                                 {t.type === 'income' ? '+' : '-'} {formatCurrency(t.amount, currency)}
                            </TableCell>
                             <TableCell className="text-center">
                                {isToday(t.created_at) && <Badge variant="secondary" className="px-1.5 py-0.5 text-xs">Today</Badge>}
                            </TableCell>
                             <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                                <div className="flex justify-center">
                                    {t.receiptUrl ? <Receipt className="h-4 w-4 text-muted-foreground" /> : <div className="w-4 h-4" />}
                                </div>
                            </TableCell>
                            <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                                {renderTransactionActions(t)}
                            </TableCell>
                        </TableRow>
                    );
                }
            });

            return [separator, ...transactionElements];
        });
    }

  const [isAddRecordOpen, setIsAddRecordOpen] = useState(false);

  return (
    <div className="flex-1 flex flex-col min-h-screen relative w-full lg:max-w-[calc(100vw-256px)] xl:max-w-[calc(100vw-280px)] mx-auto">
      <LiveFeedTicker />
      <div className="p-4 md:p-6 lg:p-10 space-y-8 w-full max-w-[1400px] mx-auto">
        {/* Page Header Area */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div>
            <h2 className="text-3xl lg:text-4xl font-headline font-bold text-on-surface tracking-tight">Transactions</h2>
            <p className="text-on-surface-variant mt-1 text-lg">A detailed list of all your financial movements</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" className="px-5 py-2.5 bg-surface-container-lowest text-on-surface font-semibold rounded-xl flex items-center gap-2 shadow-sm hover:shadow-md transition-shadow h-auto">
              <span className="material-symbols-outlined text-[20px]">file_download</span>
              Export
            </Button>
            <AddExpenseDialog>
              <Button className="px-5 py-2.5 bg-primary text-white font-semibold rounded-xl flex items-center gap-2 shadow-lg shadow-primary/15 hover:opacity-90 transition-opacity h-auto">
                <span className="material-symbols-outlined text-[20px]">add</span>
                Add Record
              </Button>
            </AddExpenseDialog>
          </div>
        </div>

        {/* Precision Prism Search & Filter Bar */}
        <div className="bg-surface-container-lowest p-2 rounded-2xl shadow-sm flex flex-col md:flex-row items-center gap-2">
          <div className="relative flex-1 w-full">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline">search</span>
            <input 
              className="w-full pl-12 pr-4 py-3 bg-transparent border-none focus:ring-2 focus:ring-primary/20 rounded-xl text-on-surface outline-none"
              placeholder="Search by title, vendor..." 
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="h-10 w-[1px] bg-outline-variant/30 hidden md:block"></div>
          <div className="relative w-full md:w-64">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline">location_on</span>
            <select 
              className="w-full pl-12 pr-10 py-3 bg-transparent border-none focus:ring-2 focus:ring-primary/20 rounded-xl appearance-none text-on-surface font-medium cursor-pointer outline-none"
              value={selectedProjectId}
              onChange={(e) => handleSingleProjectSelect(e.target.value)}
            >
              <option value="all">All Projects</option>
              {projects.map((p: Project) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <span className="absolute right-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline pointer-events-none">expand_more</span>
          </div>

          <Popover open={isFilterMenuOpen} onOpenChange={setIsFilterMenuOpen}>
            <PopoverTrigger asChild>
              <button className={cn("w-full md:w-auto px-6 py-3 font-bold rounded-xl flex items-center justify-center gap-2 transition-colors", 
                  isFilterActive ? "bg-primary/10 text-primary border border-primary/20" : "bg-surface-container-high text-on-surface hover:bg-surface-container-highest")}>
                <span className="material-symbols-outlined">tune</span>
                Filter
              </button>
            </PopoverTrigger>
            <PopoverContent className={cn("w-[calc(100vw-2rem)] md:w-80 p-0", isMobile ? "max-h-[75dvh]" : "")} align="end">
              <ScrollArea className={cn(isMobile ? "h-[65dvh]" : "h-96")}>
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
                            setSelectedDate(date || undefined);
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
                            <Checkbox id={`project-${project.id}`} checked={popoverSelectedProjects.includes(project.id)} onCheckedChange={() => handleMultiSelect(setPopoverSelectedProjects)(project.id)} />
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
                    <Label className="text-sm font-semibold">Sort By</Label>
                    <RadioGroup value={sortBy} onValueChange={setSortBy} className="gap-1">
                      <div className="flex items-center space-x-2 py-1 px-2 rounded hover:bg-muted cursor-pointer">
                          <RadioGroupItem value="date" id="sort-date" />
                          <Label htmlFor="sort-date" className="font-normal cursor-pointer">Transaction Date (newest first)</Label>
                      </div>
                      <div className="flex items-center space-x-2 py-1 px-2 rounded hover:bg-muted cursor-pointer">
                          <RadioGroupItem value="createdAt" id="sort-createdAt" />
                          <Label htmlFor="sort-createdAt" className="font-normal cursor-pointer">Date Added (newest first)</Label>
                      </div>
                      <div className="flex items-center space-x-2 py-1 px-2 rounded hover:bg-muted cursor-pointer">
                          <RadioGroupItem value="amountDesc" id="sort-amountDesc" />
                          <Label htmlFor="sort-amountDesc" className="font-normal cursor-pointer">Amount (highest first)</Label>
                      </div>
                      <div className="flex items-center space-x-2 py-1 px-2 rounded hover:bg-muted cursor-pointer">
                          <RadioGroupItem value="amountAsc" id="sort-amountAsc" />
                          <Label htmlFor="sort-amountAsc" className="font-normal cursor-pointer">Amount (lowest first)</Label>
                      </div>
                      <div className="flex items-center space-x-2 py-1 px-2 rounded hover:bg-muted cursor-pointer">
                          <RadioGroupItem value="project" id="sort-project" />
                          <Label htmlFor="sort-project" className="font-normal cursor-pointer">Project (A–Z)</Label>
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
        </div>

        {/* Transaction Table (Glass & Tonal Layering) */}
        <div className="bg-surface-container-lowest rounded-3xl overflow-hidden shadow-[0px_8px_32px_rgba(25,28,32,0.04)]">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low/50">
                  <th className="px-6 py-5 text-xs font-bold uppercase tracking-[0.1em] text-outline">Description</th>
                  <th className="px-6 py-5 text-xs font-bold uppercase tracking-[0.1em] text-outline hidden md:table-cell">Category</th>
                  <th className="px-6 py-5 text-xs font-bold uppercase tracking-[0.1em] text-outline">Amount</th>
                  <th className="px-6 py-5 text-xs font-bold uppercase tracking-[0.1em] text-outline hidden sm:table-cell">Date Added</th>
                  <th className="px-6 py-5 text-xs font-bold uppercase tracking-[0.1em] text-outline hidden lg:table-cell w-20">Receipt</th>
                  <th className="px-6 py-5 text-xs font-bold uppercase tracking-[0.1em] text-outline text-right w-20">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container-low">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                       <td className="px-6 py-6"><Skeleton className="h-10 w-40" /></td>
                       <td className="px-6 py-6 hidden md:table-cell"><Skeleton className="h-6 w-24 rounded-full" /></td>
                       <td className="px-6 py-6"><Skeleton className="h-8 w-24" /></td>
                       <td className="px-6 py-6 hidden sm:table-cell"><Skeleton className="h-4 w-20" /></td>
                       <td className="px-6 py-6 hidden lg:table-cell"><Skeleton className="h-8 w-8" /></td>
                       <td className="px-6 py-6 text-right"><Skeleton className="h-8 w-8 ml-auto" /></td>
                    </tr>
                  ))
                ) : visibleTransactions.length === 0 ? (
                  <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-outline-variant font-medium">No transactions found matching your filters.</td>
                  </tr>
                ) : (
                  visibleTransactions.map(t => {
                    const isIncome = t.type === 'income';
                    
                    let iconName = 'receipt_long';
                    if (isIncome) iconName = 'payments';
                    else if (t.category?.toLowerCase().includes('feed')) iconName = 'restaurant';
                    else if (t.category?.toLowerCase().includes('util')) iconName = 'bolt';
                    else if (t.category?.toLowerCase().includes('maint')) iconName = 'build';
                    else if (t.category?.toLowerCase().includes('tech')) iconName = 'devices';
                    else if (t.category?.toLowerCase().includes('sec')) iconName = 'security';

                    const colorTheme = isIncome 
                        ? { bg: 'bg-primary-container/10', text: 'text-primary', badge: 'bg-primary-container/10 text-primary border-primary/10' }
                        : { bg: 'bg-secondary-container/10', text: 'text-secondary', badge: 'bg-surface-container text-on-surface-variant border-outline-variant/20' };

                    return (
                        <tr key={t.id} className="hover:bg-surface-container-low/30 transition-colors group cursor-pointer" onClick={() => router.push(`/transactions/${t.id}`)}>
                            <td className="px-6 py-6">
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-full flex shrink-0 items-center justify-center ${colorTheme.bg} ${colorTheme.text}`}>
                                        <span className="material-symbols-outlined">{iconName}</span>
                                    </div>
                                    <div className="truncate max-w-[200px] sm:max-w-xs md:max-w-[250px]">
                                        <p className="font-semibold text-on-surface truncate">{t.description || t.category || (isIncome ? 'Income' : 'Expense')} {t.status === 'credit' && <Badge variant="destructive" className="ml-2 text-[10px]">Credit</Badge>}</p>
                                        <p className="text-xs text-on-surface-variant max-w-[200px] truncate">{t.title || t.vendor || t.notes}</p>
                                    </div>
                                </div>
                            </td>
                            <td className="px-6 py-6 hidden md:table-cell">
                                <span className={`px-3 py-1 text-[11px] font-bold rounded-full border truncate max-w-[150px] inline-block ${colorTheme.badge}`}>
                                    {t.category || (isIncome ? 'Income' : 'Uncategorized')}
                                </span>
                            </td>
                            <td className="px-6 py-6">
                                <span className={`font-headline font-bold whitespace-nowrap ${colorTheme.text}`}>
                                    {isIncome ? '+' : '-'}{formatCurrency(t.amount, currency)}
                                </span>
                            </td>
                            <td className="px-6 py-6 text-sm text-on-surface-variant font-medium hidden sm:table-cell whitespace-nowrap">
                                {new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </td>
                            <td className="px-6 py-6 hidden lg:table-cell" onClick={(e) => e.stopPropagation()}>
                                {t.receiptUrl ? (
                                    <a href={t.receiptUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:bg-primary/5 p-2 rounded-lg transition-colors inline-flex">
                                        <span className="material-symbols-outlined">receipt</span>
                                    </a>
                                ) : (
                                    <span className="text-outline-variant/40 font-semibold tracking-widest text-xs flex items-center gap-1 cursor-not-allowed">
                                        <X className="w-3 h-3" /> N/A
                                    </span>
                                )}
                            </td>
                            <td className="px-6 py-6 text-right" onClick={(e) => e.stopPropagation()}>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <button className="p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <span className="material-symbols-outlined text-outline">more_vert</span>
                                        </button>
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
                            </td>
                        </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 bg-surface-container-low/30 rounded-xl">
          <p className="text-sm text-on-surface-variant">Showing <span className="font-semibold text-on-surface">{Math.min(visibleCount, filteredTransactions.length)}</span> of {filteredTransactions.length} results</p>
          {visibleCount < filteredTransactions.length && (
            <div className="flex gap-2 w-full sm:w-auto">
              <Button variant="secondary" className="w-full sm:w-auto" onClick={loadMore}>
                  Load More
              </Button>
            </div>
          )}
        </div>
      </div>

      {!loading && <FloatingSum transactions={filteredTransactions} />}
      <AddExpenseDialog>
        <Button
          className="md:hidden fixed bottom-24 right-4 z-50 h-14 w-14 rounded-full p-0 shadow-xl shadow-primary/25"
          aria-label="Add transaction"
        >
          <span className="material-symbols-outlined">add</span>
        </Button>
      </AddExpenseDialog>

      {editingTransaction && (
        <EditTransactionDialog 
            transaction={editingTransaction}
            isOpen={!!editingTransaction}
            onOpenChange={(isOpen) => {
                if (!isOpen) setEditingTransaction(null);
            }}
            allTransactions={transactions}
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
