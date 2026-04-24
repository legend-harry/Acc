"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createClient } from '@/lib/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/data";
import { useCategories, useProjects } from "@/hooks/use-database";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useUser } from "@/context/user-context";
import { useClient } from "@/context/client-context";
import { useCurrency } from "@/context/currency-context";
import { cn } from "@/lib/utils";
import {
  Calendar,
  CreditCard,
  ShoppingCart,
  Plane,
  Cloud,
  Home,
  Utensils,
  Plus,
  Loader2,
  Brain,
  AlertCircle,
  ArrowRight
} from "lucide-react";

const VENDOR_HISTORY_KEY = "vendor-history-v1";

export function AddExpenseDialog({
  children,
  defaultType = "expense",
  open,
  onOpenChange,
  hideTrigger = false,
}: {
  children: React.ReactNode;
  defaultType?: "expense" | "income";
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  hideTrigger?: boolean;
}) {
  const router = useRouter();
  const [internalOpen, setInternalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { currency } = useCurrency();

  const { projects, loading: projectsLoading } = useProjects();
  const activeProjects = useMemo(() => projects.filter((p) => !p.archived), [projects]);

  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const { categories, loading: categoriesLoading } = useCategories(selectedProjectId);

  const { user, selectedProfile } = useUser();
  const { clientId } = useClient();
  
  const [transactionType, setTransactionType] = useState<"expense" | "income">(defaultType);
  const [amountValue, setAmountValue] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [dateValue, setDateValue] = useState(new Date().toISOString().split("T")[0]);
  const [description, setDescription] = useState("");
  
  // Advanced fields toggle
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [vendor, setVendor] = useState("");
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [vendorHistory, setVendorHistory] = useState<string[]>([]);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  const [submitError, setSubmitError] = useState<string | null>(null);

  const isControlled = typeof open === 'boolean' && typeof onOpenChange === 'function';
  const dialogOpen = isControlled ? open : internalOpen;
  const setDialogOpen = isControlled ? onOpenChange : setInternalOpen;

  useEffect(() => {
    if (dialogOpen) {
      const defaultProjectId = localStorage.getItem("defaultProjectId");
      if (defaultProjectId && defaultProjectId !== "all") {
        setSelectedProjectId(defaultProjectId);
      }

      try {
        const raw = localStorage.getItem(VENDOR_HISTORY_KEY);
        const parsed = raw ? (JSON.parse(raw) as string[]) : [];
        setVendorHistory(Array.isArray(parsed) ? parsed : []);
      } catch {
        setVendorHistory([]);
      }
    }
  }, [dialogOpen]);

  const resetDialog = () => {
    setSelectedProjectId("");
    setTransactionType("expense");
    setAmountValue("");
    setSelectedCategory("");
    setDateValue(new Date().toISOString().split("T")[0]);
    setDescription("");
    setShowAdvanced(false);
    setVendor("");
    setReceiptPreview(null);
    setSubmitError(null);
    setIsAddingCategory(false);
    setNewCategoryName("");
  };

  const persistVendorHistory = (value: string) => {
    const clean = value.trim();
    if (!clean) return;

    const next = [clean, ...vendorHistory.filter((v) => v.toLowerCase() !== clean.toLowerCase())].slice(0, 8);
    setVendorHistory(next);
    localStorage.setItem(VENDOR_HISTORY_KEY, JSON.stringify(next));
  };

  const getIconForCategory = (cat: string) => {
    const l = cat.toLowerCase();
    if (l.includes('shop') || l.includes('buy')) return <ShoppingCart className="w-3.5 h-3.5" />;
    if (l.includes('food') || l.includes('dine')) return <Utensils className="w-3.5 h-3.5" />;
    if (l.includes('travel') || l.includes('flight') || l.includes('transport')) return <Plane className="w-3.5 h-3.5" />;
    if (l.includes('home') || l.includes('rent')) return <Home className="w-3.5 h-3.5" />;
    if (l.includes('tech') || l.includes('cloud') || l.includes('soft')) return <Cloud className="w-3.5 h-3.5" />;
    return <CreditCard className="w-3.5 h-3.5" />;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError(null);
    
    if (!amountValue || isNaN(Number(amountValue)) || Number(amountValue) <= 0) {
      setSubmitError("Invalid amount format detected.");
      return;
    }
    
    if (!selectedProjectId) {
      setSubmitError("Please select a project.");
      return;
    }

    if (transactionType === "expense" && !selectedCategory) {
      setSubmitError("Please select a category.");
      return;
    }

    setIsLoading(true);
    
    // Full insert with all extended columns (requires migration to be run)
    const fullRecord = {
      client_id: clientId,
      profile_id: selectedProfile || '',
      amount: Number(amountValue),
      category: transactionType === "income" ? "Income" : selectedCategory,
      type: transactionType,
      date: new Date(dateValue).toISOString(),
      description: description || "",
      title: description.substring(0, 30) || "Manual Entry",
      vendor: vendor || "",
      status: "completed",
      notes: "",
      invoice_no: "",
      quantity: 0,
      unit: "",
      receipt_url: receiptPreview || "",
      created_by: user || "",
      projectid: selectedProjectId,
    };

    // Core-only record as fallback (matches base schema without migration)
    const coreRecord = {
      client_id: clientId,
      profile_id: selectedProfile || '',
      amount: Number(amountValue),
      category: transactionType === "income" ? "Income" : selectedCategory,
      type: transactionType,
      date: new Date(dateValue).toISOString(),
      description: `${description || "Manual Entry"}${vendor ? ` | ${vendor}` : ""}`,
    };

    try {
      const supabase = createClient();
      // Try full insert first (works after migration)
      const { error: fullError } = await supabase.from('transactions').insert([fullRecord]);
      
      if (fullError) {
        // Fallback: insert only core columns (base schema)
        console.warn("Full insert failed, trying core-only:", fullError.message);
        const { error: coreError } = await supabase.from('transactions').insert([coreRecord]);
        if (coreError) throw coreError;
      }

      persistVendorHistory(vendor);

      setIsLoading(false);
      setDialogOpen(false);
      resetDialog();
      router.refresh();

      toast({
        title: "Transaction Added",
        description: `Successfully added ${formatCurrency(Number(amountValue), currency)}.`,
      });
    } catch (error) {
      console.error("Failed to add expense:", error);
      setIsLoading(false);
      setSubmitError("Failed to record the transaction.");
    }
  };

  const handleAddCategory = async () => {
    if (!selectedProjectId) {
      setSubmitError("Please select a project first.");
      return;
    }

    if (!isAddingCategory) {
      setIsAddingCategory(true);
      setNewCategoryName("");
      return;
    }

    const categoryName = newCategoryName.trim();
    if (!categoryName) {
      setSubmitError("Please enter a category name.");
      return;
    }

    const existing = categories.find((c) => c.toLowerCase() === categoryName.toLowerCase());
    if (existing) {
      setSelectedCategory(existing);
      setIsAddingCategory(false);
      setNewCategoryName("");
      toast({ title: "Category Selected", description: `Using existing category \"${existing}\".` });
      return;
    }

    try {
      const supabase = createClient();
      const { error } = await supabase.from('budgets').insert([{
        client_id: clientId,
        profile_id: selectedProfile || '',
        category: categoryName,
        amount: 0,
        projectid: selectedProjectId,
      }]);

      if (error) throw error;

      setSelectedCategory(categoryName);
      setIsAddingCategory(false);
      setNewCategoryName("");
      toast({ title: "Category Added", description: `\"${categoryName}\" is ready to use.` });
    } catch (error) {
      console.error("Failed to add category:", error);
      toast({ variant: "destructive", title: "Error", description: "Could not add category." });
    }
  };

  return (
    <>
      <Dialog
        open={dialogOpen}
        onOpenChange={(isOpen) => {
          setDialogOpen(isOpen);
          if (!isOpen) resetDialog();
        }}
      >
        {!hideTrigger && <div onClick={() => setDialogOpen(true)}>{children}</div>}

        <DialogContent hideCloseButton className="sm:max-w-md p-0 rounded-[24px] border-0 shadow-2xl bg-background text-foreground flex max-h-[90dvh] flex-col overflow-hidden">
          <DialogDescription className="sr-only">Add a new financial transaction</DialogDescription>
          
          {/* Header */}
          <div className="px-6 pt-6 pb-2 flex items-center justify-between">
            <DialogTitle className="text-xl font-bold tracking-tight text-foreground">
              New Entry
            </DialogTitle>
          </div>

          {!selectedProjectId ? (
            <div className="p-8 text-center pb-12">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
                <Brain className="w-8 h-8 text-muted-foreground/60" />
              </div>
              <h3 className="text-lg font-bold mb-2 text-foreground">Select Project</h3>
              <p className="text-sm text-muted-foreground mb-8 max-w-xs mx-auto">
                Choose a project to load relevant categories and tags for this transaction.
              </p>
              
              {projectsLoading ? (
                <div className="flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-emerald-500"/></div>
              ) : (
                <div className="flex flex-col gap-3">
                  {activeProjects.map(p => (
                    <button 
                      key={p.id}
                      onClick={() => setSelectedProjectId(p.id)}
                      className="px-6 py-4 bg-muted/40 hover:bg-muted border border-border rounded-xl text-left font-semibold text-foreground transition flex justify-between items-center group"
                    >
                      {p.name}
                      <ArrowRight className="w-4 h-4 text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity transform -translate-x-2 group-hover:translate-x-0" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
              <ScrollArea className="h-[calc(90dvh-190px)] px-6 pb-28">
                <div className="space-y-8 py-4">
                  
                  {/* Amount Region */}
                  <div>
                    <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3 block">
                      Transaction Amount
                    </Label>
                    <div className="flex items-center">
                      <span className="text-5xl font-bold text-muted-foreground/30 mr-2 -mt-1">
                        {currency === "INR" ? "₹" : currency === "USD" ? "$" : currency}
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        autoFocus
                        placeholder="0.00"
                        value={amountValue}
                        onChange={(e) => setAmountValue(e.target.value)}
                        className="text-6xl font-bold bg-transparent border-0 p-0 text-foreground focus:ring-0 placeholder:text-muted/30 w-full outline-none"
                      />
                    </div>
                  </div>

                  {/* Type and Date Row */}
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3 block">
                        Type
                      </Label>
                       <div className="bg-muted p-[3px] rounded-[14px] flex">
                        <button
                          type="button"
                          onClick={() => setTransactionType("expense")}
                          className={cn(
                            "flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all",
                            transactionType === "expense" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                          )}
                        >
                          Expense
                        </button>
                        <button
                          type="button"
                          onClick={() => setTransactionType("income")}
                          className={cn(
                            "flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all",
                            transactionType === "income" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                          )}
                        >
                          Income
                        </button>
                      </div>
                    </div>
                    
                    <div>
                      <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3 block">
                        Date
                      </Label>
                      <div className="relative bg-muted rounded-[14px] overflow-hidden flex items-center h-[46px]">
                        <Calendar className="absolute left-4 z-10 w-4 h-4 text-muted-foreground" />
                        <Input 
                          type="date"
                          required
                          value={dateValue}
                          onChange={(e) => setDateValue(e.target.value)}
                          className="pl-10 relative z-0 bg-transparent border-0 h-full w-full text-sm font-semibold text-foreground shadow-none focus-visible:ring-0" 
                        />
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3 block">
                      Description
                    </Label>
                    <Input
                      value={description}
                      required
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="What was this for?"
                      className="bg-muted border-0 rounded-[14px] h-[52px] px-5 text-sm font-medium text-foreground placeholder:text-muted-foreground/50 focus-visible:ring-2 focus-visible:ring-emerald-500/20"
                    />
                  </div>

                  <div>
                    <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3 block">
                      Vendor
                    </Label>
                    <Input
                      list="vendor-history"
                      value={vendor}
                      onChange={(e) => setVendor(e.target.value)}
                      placeholder="Vendor / Supplier"
                      className="bg-muted border-0 rounded-[14px] h-[52px] px-5 text-sm font-medium text-foreground placeholder:text-muted-foreground/50 focus-visible:ring-2 focus-visible:ring-emerald-500/20"
                    />
                    <datalist id="vendor-history">
                      {vendorHistory.map((item) => (
                        <option key={item} value={item} />
                      ))}
                    </datalist>
                  </div>

                  {/* Category Chips */}
                  {transactionType === "expense" && (
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          Category
                        </Label>
                        {categoriesLoading && <Loader2 className="w-3 h-3 animate-spin text-slate-300" />}
                      </div>
                      
                      <div className="flex flex-wrap gap-2.5">
                        {categories.map(cat => (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => setSelectedCategory(cat)}
                            className={cn(
                              "flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold transition-all",
                              selectedCategory === cat 
                                ? "bg-[#10B981] text-white shadow-md shadow-emerald-500/20" 
                                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                            )}
                          >
                            {getIconForCategory(cat)} {cat}
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={handleAddCategory}
                          aria-label="Add category"
                          className="w-[42px] h-[42px] rounded-full border border-dashed border-slate-300 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:border-slate-400 hover:bg-slate-50 transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>

                      {isAddingCategory && (
                        <div className="mt-3 flex items-center gap-2">
                          <Input
                            value={newCategoryName}
                            onChange={(e) => setNewCategoryName(e.target.value)}
                            placeholder="New category name"
                            className="h-10 rounded-xl bg-muted border-0 text-sm"
                          />
                          <Button type="button" size="sm" onClick={handleAddCategory} className="rounded-xl">
                            Add
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setIsAddingCategory(false);
                              setNewCategoryName("");
                            }}
                            className="rounded-xl"
                          >
                            Cancel
                          </Button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Project Info Header (Click to change) */}
                  <div className="mt-8 pt-6 border-t border-slate-100 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="bg-emerald-500/10 text-emerald-600 p-1.5 rounded-md">
                        <LineChartIcon className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-semibold text-slate-500">
                        Recording into <strong className="text-slate-700">{activeProjects.find(p=>p.id === selectedProjectId)?.name}</strong>
                      </span>
                    </div>
                    <button type="button" onClick={() => setSelectedProjectId("")} className="text-xs font-bold text-slate-400 hover:text-slate-700 uppercase tracking-wider">
                      Change
                    </button>
                  </div>
                </div>
              </ScrollArea>

              {/* Error Banner */}
              {submitError && (
                <div className="mx-6 mt-4 flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 font-medium">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {submitError}
                </div>
              )}

              <div className="shrink-0 sticky bottom-0 z-10 px-6 py-6 pb-8 bg-background/95 backdrop-blur border-t border-border/60">
                <Button
                  type="submit"
                  disabled={isLoading || categoriesLoading}
                  className="w-full h-14 rounded-2xl bg-[#10B981] hover:bg-[#059669] text-white font-bold text-base shadow-xl shadow-emerald-500/20 transition-all"
                >
                  {isLoading ? (
                    <><Loader2 className="h-5 w-5 mr-3 animate-spin" /> Recording...</>
                  ) : (
                    "Record Transaction"
                  )}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function LineChartIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 3v18h18" />
      <path d="m19 9-5 5-4-4-3 3" />
    </svg>
  )
}
