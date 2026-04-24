
"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from '@/lib/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/data";
import { useCategories, useProjects } from "@/hooks/use-database";
import { ScrollArea } from "./ui/scroll-area";
import { useUser } from "@/context/user-context";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import type { Transaction } from "@/types";
import { useCurrency } from "@/context/currency-context";
import { Edit, Receipt } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

export function EditTransactionDialog({
  transaction,
  isOpen,
  onOpenChange,
  allTransactions = [],
}: {
  transaction: Transaction;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  allTransactions?: Transaction[];
}) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { currency } = useCurrency();
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  
  const { projects, loading: projectsLoading } = useProjects();
  const activeProjects = useMemo(() => projects.filter(p => !p.archived), [projects]);

  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const { categories, loading: categoriesLoading } = useCategories(selectedProjectId);

  const { user } = useUser();
  const [transactionType, setTransactionType] = useState<'expense' | 'income' | undefined>(undefined);
  const [isInitialized, setIsInitialized] = useState(false);

  // Category performance analysis
  const categoryStats = useMemo(() => {
    if (!transaction || !allTransactions.length) return null;
    const sameCategory = allTransactions.filter(t => t.category === transaction.category && t.type === transaction.type);
    const total = sameCategory.reduce((sum, t) => sum + t.amount, 0);
    const avg = total / (sameCategory.length || 1);
    const isHigherThanAvg = transaction.amount > avg;
    
    // Simple 5-point sparkline
    const trend = sameCategory.slice(-5).map(t => t.amount);
    return { avg, isHigherThanAvg, trend };
  }, [transaction, allTransactions]);

  useEffect(() => {
    if (isOpen && transaction) {
        setReceiptPreview(transaction.receiptUrl || null);
        setTransactionType(transaction.type);
        setSelectedProjectId(transaction.projectid);
        setIsInitialized(true);
    } else if (!isOpen) {
        setIsInitialized(false);
    }
  }, [isOpen, transaction]);

  const handleReceiptChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setReceiptPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
        setReceiptPreview(null);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    const formData = new FormData(event.currentTarget);
    const data = Object.fromEntries(formData.entries());

     if (!data.projectId) {
        toast({
            variant: "destructive",
            title: "Project Required",
            description: "Please select a project for this transaction.",
        });
        setIsLoading(false);
        return;
    }
    
    let receiptUrl = transaction.receiptUrl || "";
    
    const updatedTransaction = {
        ...transaction,
        ...data,
        amount: Number(data.amount),
        quantity: Number(data.qty) || 0,
        ratePerUnit: 0,
        date: data.date ? new Date(data.date as string).toISOString() : new Date().toISOString(),
        receiptUrl: receiptUrl,
        createdBy: user,
        type: data.type,
        status: data.type === 'income' ? 'completed' : data.status,
        category: data.type === 'income' ? 'Income' : data.category,
        projectid: data.projectId
    };
    
    try {
        const supabase = createClient();
        // Full update (requires extended columns from migration)
        const fullUpdate = {
            title: updatedTransaction.title,
            amount: updatedTransaction.amount,
            type: updatedTransaction.type,
            category: updatedTransaction.category,
            date: updatedTransaction.date,
            description: updatedTransaction.description,
            vendor: updatedTransaction.vendor,
            invoice_no: updatedTransaction.invoiceNo,
            quantity: updatedTransaction.quantity,
            unit: updatedTransaction.unit,
            notes: updatedTransaction.notes,
            status: updatedTransaction.status,
            projectid: updatedTransaction.projectid,
            receipt_url: updatedTransaction.receiptUrl,
        };
        // Core update (base schema only)
        const coreUpdate = {
            amount: updatedTransaction.amount,
            type: updatedTransaction.type,
            category: updatedTransaction.category,
            date: updatedTransaction.date,
            description: updatedTransaction.description,
        };

        const { error } = await supabase.from('transactions').update(fullUpdate).eq('id', transaction.id);
        if (error) {
            console.warn("Full update failed, trying core-only:", error.message);
            const { error: coreError } = await supabase.from('transactions').update(coreUpdate).eq('id', transaction.id);
            if (coreError) throw coreError;
        }
        
        setIsLoading(false);
        onOpenChange(false);
        
        toast({
            title: "Transaction Updated",
            description: `Successfully updated ${formatCurrency(
            Number(data.amount), currency
            )} for ${data.title}.`,
        });

    } catch (error) {
        console.error("Failed to update transaction:", error);
        setIsLoading(false);
        toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to save the transaction to the database.",
        });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl bg-surface flex max-h-[90dvh] flex-col overflow-hidden">
        <DialogHeader className="bg-primary/5 -m-6 mb-0 p-6 rounded-t-lg border-b border-primary/10">
          <DialogTitle className="font-headline text-2xl font-bold flex items-center gap-2">
             <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Edit className="w-4 h-4 text-primary" />
             </div>
             Edit Transaction
          </DialogTitle>
          <DialogDescription className="font-label font-medium text-on-surface-variant">
            Precision adjustment of financial records.
          </DialogDescription>
        </DialogHeader>

        {!isInitialized ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
        <form onSubmit={handleSubmit} className="mt-4 flex min-h-0 flex-1 flex-col">
          <ScrollArea className="min-h-0 flex-1 -mx-6 px-6">
            <div className="grid gap-6 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="project" className="text-right font-label font-bold text-xs uppercase tracking-wider text-outline">
                    Project
                  </Label>
                  <Select name="projectId" defaultValue={transaction.projectid} required onValueChange={setSelectedProjectId}>
                    <SelectTrigger className="col-span-3 bg-surface-container-low border-none shadow-none font-medium">
                      <SelectValue placeholder="Select a project" />
                    </SelectTrigger>
                    <SelectContent>
                      {projectsLoading ? (
                        <SelectItem value="loading" disabled>Loading...</SelectItem>
                      ) : (
                        activeProjects.map((project) => (
                          <SelectItem key={project.id} value={project.id}>
                            {project.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right font-label font-bold text-xs uppercase tracking-wider text-outline">Type</Label>
                    <RadioGroup
                      name="type"
                      value={transactionType}
                      className="col-span-3 flex gap-6"
                      onValueChange={(value) => setTransactionType(value as 'expense' | 'income')}
                      required
                    >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="expense" id="r-edit-expense" className="border-secondary text-secondary" />
                          <Label htmlFor="r-edit-expense" className="font-bold text-sm">Expense</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="income" id="r-edit-income" className="border-primary text-primary" />
                          <Label htmlFor="r-edit-income" className="font-bold text-sm">Income</Label>
                        </div>
                    </RadioGroup>
                </div>
                
                 {transactionType && (
                    <>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="title" className="text-right font-label font-bold text-xs uppercase tracking-wider text-outline">
                                Title
                            </Label>
                            <Input
                                id="title"
                                name="title"
                                defaultValue={transaction.title}
                                required
                                className="col-span-3 bg-surface-container-low border-none focus-visible:ring-primary/20 font-bold"
                            />
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="amount" className="text-right font-label font-bold text-xs uppercase tracking-wider text-outline">
                                Amount
                            </Label>
                            <div className="col-span-3 relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-on-surface-variant/50">$</span>
                                <Input
                                    id="amount"
                                    name="amount"
                                    type="number"
                                    step="0.01"
                                    defaultValue={transaction.amount}
                                    required
                                    className="pl-8 bg-surface-container-low border-none font-extrabold text-lg text-on-surface"
                                />
                            </div>
                        </div>

                        {transactionType === 'expense' && (
                        <>
                          <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="category" className="text-right font-label font-bold text-xs uppercase tracking-wider text-outline">
                                  Category
                              </Label>
                              <Select name="category" defaultValue={transaction.category} required disabled={!selectedProjectId}>
                                  <SelectTrigger className="col-span-3 bg-surface-container-low border-none">
                                  <SelectValue placeholder={!selectedProjectId ? "First select a project" : "Select a category"} />
                                  </SelectTrigger>
                                  <SelectContent>
                                  {categoriesLoading ? (
                                      <SelectItem value="loading" disabled>Loading...</SelectItem>
                                  ) : (
                                      categories.map((category) => (
                                      <SelectItem key={category} value={category}>
                                          {category}
                                      </SelectItem>
                                      ))
                                  )}
                                  </SelectContent>
                              </Select>
                          </div>
                   
                          {/* Category Performance Analytics */}
                          {categoryStats && (
                            <div className="col-span-4 bg-surface-container-low/50 rounded-xl p-4 mt-2 border border-outline-variant/10">
                                <div className="flex justify-between items-center mb-3">
                                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-outline">Category Context</h4>
                                    <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded", categoryStats.isHigherThanAvg ? "bg-secondary-container/10 text-secondary-container" : "bg-primary-container/10 text-primary-container")}>
                                        {categoryStats.isHigherThanAvg ? "Above Average" : "Below Average"}
                                    </span>
                                </div>
                                <div className="flex items-end gap-6">
                                    <div className="flex-1 h-12">
                                        <svg className="w-full h-full" viewBox="0 0 100 40" preserveAspectRatio="none">
                                            <path 
                                                d={`M ${categoryStats.trend.map((val, i) => `${i * 25} ${40 - (val / Math.max(...categoryStats.trend, 1)) * 35}`).join(' L ')}`}
                                                fill="none"
                                                stroke="hsl(var(--primary-container))"
                                                strokeWidth="3"
                                                strokeLinecap="round"
                                            />
                                        </svg>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className="text-xs font-bold text-on-surface">Avg Spend</p>
                                        <p className="text-sm font-extrabold text-primary">{formatCurrency(categoryStats.avg, currency)}</p>
                                    </div>
                                </div>
                            </div>
                          )}

                          <div className="grid grid-cols-4 items-center gap-4">
                              <Label className="text-right font-label font-bold text-xs uppercase tracking-wider text-outline">Status</Label>
                              <div className="col-span-3 flex flex-wrap gap-2">
                                  {['completed', 'credit', 'expected'].map(s => (
                                      <button 
                                        key={s}
                                        type="button"
                                        onClick={() => {
                                            const el = document.getElementById(`edit-status-${s}`) as HTMLInputElement;
                                            if (el) el.click();
                                        }}
                                        className={cn(
                                            "px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-all",
                                            transaction.status === s ? "bg-primary text-white border-primary" : "bg-surface-container-low text-on-surface-variant border-outline-variant/20 hover:border-outline-variant"
                                        )}
                                      >
                                        <input type="radio" name="status" id={`edit-status-${s}`} value={s} defaultChecked={transaction.status === s} className="hidden" />
                                        {s}
                                      </button>
                                  ))}
                              </div>
                          </div>
                        </>
                        )}
                        
                        <Separator className="col-span-4 my-2 opacity-50" />

                        <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="date" className="text-right font-label font-bold text-xs uppercase tracking-wider text-outline">
                            Date
                        </Label>
                        <Input
                            id="date"
                            name="date"
                            type="date"
                            defaultValue={new Date(transaction.date).toISOString().split("T")[0]}
                            required
                            className="col-span-3 bg-surface-container-low border-none"
                        />
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="description" className="text-right font-label font-bold text-xs uppercase tracking-wider text-outline">
                            Notes
                        </Label>
                        <Textarea
                            id="description"
                            name="description"
                            defaultValue={transaction.description}
                            className="col-span-3 bg-surface-container-low border-none resize-none"
                            placeholder="Add a memo..."
                        />
                        </div>
                        
                        <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="vendor" className="text-right font-label font-bold text-xs uppercase tracking-wider text-outline">
                            Vendor
                        </Label>
                        <Input
                            id="vendor"
                            name="vendor"
                            defaultValue={transaction.vendor}
                            className="col-span-3 bg-surface-container-low border-none"
                        />
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="receipt" className="text-right font-label font-bold text-xs uppercase tracking-wider text-outline">
                            Invoice
                        </Label>
                        <div className="col-span-3 flex items-center gap-4">
                            <Input
                                id="receipt"
                                name="receipt"
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleReceiptChange}
                            />
                            <Button 
                                type="button" 
                                variant="outline" 
                                className="bg-surface-container-low border-none w-full justify-start text-on-surface-variant font-medium h-12"
                                onClick={() => document.getElementById('receipt')?.click()}
                            >
                                <Receipt className="w-4 h-4 mr-2" />
                                {receiptPreview ? "Update Documents" : "Attach Invoice/Receipt"}
                            </Button>
                        </div>
                        </div>

                        {receiptPreview && (
                            <div className="grid grid-cols-4 items-start gap-4">
                                <div className="col-start-2 col-span-3">
                                    <div className="relative group rounded-xl overflow-hidden border border-outline-variant/30">
                                        <img src={receiptPreview} alt="Receipt preview" className="w-full h-auto max-h-60 object-contain bg-surface-container-lowest" />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <Button variant="secondary" size="sm" type="button" onClick={() => setReceiptPreview(null)}>Remove</Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                 )}
              </div>
          </ScrollArea>
          <DialogFooter className="shrink-0 pt-6 mt-6 border-t border-outline-variant/10">
            <DialogClose asChild>
              <Button type="button" variant="ghost" className="font-bold text-outline">
                Cancel
              </Button>
            </DialogClose>
            <Button 
                type="submit" 
                disabled={isLoading || categoriesLoading || projectsLoading || !transactionType}
                className="bg-primary hover:bg-primary/90 text-white font-bold px-8 rounded-xl shadow-lg shadow-primary/20"
            >
              {isLoading ? "Saving Analysis..." : "Save Record"}
            </Button>
          </DialogFooter>
        </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
