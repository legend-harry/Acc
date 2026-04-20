"use client";

import { useState, useEffect, useMemo, useRef } from "react";
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
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/data";
import { useCategories, useProjects } from "@/hooks/use-database";
import { db } from "@/lib/firebase";
import { ref, push, set } from "firebase/database";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useUser } from "@/context/user-context";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { useCurrency } from "@/context/currency-context";
import { cn } from "@/lib/utils";
import {
  Sparkles,
  Loader2,
  Zap,
  PenLine,
  CheckCircle2,
  ArrowRight,
  Brain,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  AlertTriangle,
  Wand2,
} from "lucide-react";

interface ParsedTransaction {
  title: string;
  type: "expense" | "income";
  amount: number;
  category: string;
  vendor: string;
  description: string;
  date: string;
  status: "completed" | "credit" | "expected";
  projectId: string;
  notes: string;
}

const QUICK_EXAMPLES = [
  { label: "Feed purchase ₹15,000", text: "Bought 50kg prawn feed from KS Feeds for ₹15,000 today" },
  { label: "Labour wages ₹8,000 credit", text: "Labour wages of ₹8000 for pond cleaning, payment pending" },
  { label: "Sold harvest ₹90,000", text: "Sold 200kg harvest to Metro Mart for ₹90,000" },
  { label: "Medicine ₹3,500", text: "Purchased pond medicine & antibiotics for ₹3500" },
];

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  completed: { label: "Paid", color: "text-emerald-700 bg-emerald-50 border-emerald-200" },
  credit:    { label: "Credit / Pending", color: "text-amber-700 bg-amber-50 border-amber-200" },
  expected:  { label: "Expected", color: "text-blue-700 bg-blue-50 border-blue-200" },
};

// Animated dots for loading state
function AnimatedDots() {
  return (
    <span className="inline-flex gap-0.5 items-end h-4">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-1 h-1 rounded-full bg-purple-400 animate-bounce"
          style={{ animationDelay: `${i * 0.15}s`, animationDuration: "0.8s" }}
        />
      ))}
    </span>
  );
}

export function AddExpenseDialog({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<"ai" | "manual">("ai");
  const { toast } = useToast();
  const { currency } = useCurrency();
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);

  const { projects, loading: projectsLoading } = useProjects();
  const activeProjects = useMemo(() => projects.filter((p) => !p.archived), [projects]);

  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const { categories, loading: categoriesLoading } = useCategories(selectedProjectId);

  const { user } = useUser();
  const [transactionType, setTransactionType] = useState<"expense" | "income" | undefined>();

  // AI mode state
  const [aiText, setAiText] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const [parsed, setParsed] = useState<ParsedTransaction | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);

  // Form field refs for manual population
  const titleRef = useRef<HTMLInputElement>(null);
  const amountRef = useRef<HTMLInputElement>(null);
  const vendorRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const notesRef = useRef<HTMLTextAreaElement>(null);
  const invoiceRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      const defaultProjectId = localStorage.getItem("defaultProjectId");
      if (defaultProjectId && defaultProjectId !== "all") {
        setSelectedProjectId(defaultProjectId);
      }
    }
  }, [open]);

  const resetDialog = () => {
    setMode("ai");
    setAiText("");
    setParsed(null);
    setParseError(null);
    setTransactionType(undefined);
    setSelectedProjectId("");
    setReceiptPreview(null);
  };

  const handleParseAI = async () => {
    if (!aiText.trim()) return;
    setIsParsing(true);
    setParseError(null);
    setParsed(null);

    try {
      const res = await fetch("/api/ai/parse-transaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: aiText,
          projects: activeProjects,
          categories,
        }),
      });
      const data = await res.json();

      if (data.error && !data.transaction?.title) {
        setParseError(data.error);
        setMode("manual");
      } else {
        const tx: ParsedTransaction = data.transaction;
        setParsed(tx);

        // Auto-populate state
        setTransactionType(tx.type);
        if (tx.projectId) setSelectedProjectId(tx.projectId);

        // Switch to manual so user can review/edit
        setMode("manual");

        if (data.error) {
          setParseError(data.error);
        } else {
          toast({
            title: "✨ Parsed successfully!",
            description: "AI has filled the form — review and save.",
          });
        }
      }
    } catch (err) {
      setParseError("AI parsing failed — fill in manually.");
      setMode("manual");
    } finally {
      setIsParsing(false);
    }
  };

  const handleReceiptChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setReceiptPreview(reader.result as string);
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

    const newTransaction = {
      ...data,
      amount: Number(data.amount),
      quantity: Number(data.qty) || 0,
      ratePerUnit: 0,
      date: data.date ? new Date(data.date as string).toISOString() : new Date().toISOString(),
      createdAt: new Date().toISOString(),
      receiptUrl: "",
      createdBy: user,
      type: data.type,
      status: data.type === "income" ? "completed" : data.status,
      category: data.type === "income" ? "Income" : data.category,
      projectId: data.projectId,
    };

    try {
      const transactionsRef = ref(db, "transactions");
      const newTransactionRef = push(transactionsRef);
      await set(newTransactionRef, newTransaction);

      setIsLoading(false);
      setOpen(false);
      resetDialog();
      (event.target as HTMLFormElement).reset();

      toast({
        title: "Transaction Added",
        description: `Successfully added ${formatCurrency(Number(data.amount), currency)} for ${data.title}.`,
      });
    } catch (error) {
      console.error("Failed to add expense:", error);
      setIsLoading(false);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save the transaction to the database.",
      });
    }
  };

  const effectiveType = (parsed?.type || transactionType) as "expense" | "income" | undefined;

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(isOpen) => {
          setOpen(isOpen);
          if (!isOpen) resetDialog();
        }}
      >
        <div onClick={() => setOpen(true)}>{children}</div>

        <DialogContent className="sm:max-w-xl p-0 overflow-hidden rounded-2xl border-0 shadow-2xl">
          {/* Gradient header */}
          <div
            className={cn(
              "px-6 pt-6 pb-4 transition-all duration-300",
              mode === "ai"
                ? "bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-600"
                : parsed
                ? "bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600"
                : "bg-gradient-to-br from-slate-700 via-slate-600 to-slate-700"
            )}
          >
            <div className="flex items-start justify-between">
              <div>
                <DialogTitle className="text-white text-lg font-semibold flex items-center gap-2">
                  {mode === "ai" ? (
                    <>
                      <Brain className="h-5 w-5 opacity-90" />
                      AI Transaction Parser
                    </>
                  ) : parsed ? (
                    <>
                      <CheckCircle2 className="h-5 w-5 opacity-90" />
                      Review &amp; Confirm
                    </>
                  ) : (
                    <>
                      <PenLine className="h-5 w-5 opacity-90" />
                      Manual Entry
                    </>
                  )}
                </DialogTitle>
                <DialogDescription className="text-white/70 text-xs mt-1">
                  {mode === "ai"
                    ? "Describe your transaction — AI will fill the form instantly"
                    : parsed
                    ? "AI pre-filled this form. Review and save when ready."
                    : "Enter the transaction details below."}
                </DialogDescription>
              </div>

              {/* Mode toggle pill */}
              <button
                type="button"
                onClick={() => setMode(mode === "ai" ? "manual" : "ai")}
                className="flex items-center gap-1.5 text-xs font-medium bg-white/20 hover:bg-white/30 text-white rounded-full px-3 py-1.5 transition-colors"
              >
                {mode === "ai" ? (
                  <><PenLine className="h-3 w-3" />Manual</>
                ) : (
                  <><Sparkles className="h-3 w-3" />AI Mode</>
                )}
              </button>
            </div>

            {/* AI parsed summary chips */}
            {parsed && mode === "manual" && (
              <div className="flex flex-wrap gap-2 mt-3">
                {/* Type chip */}
                <span
                  className={cn(
                    "flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full",
                    effectiveType === "income"
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-red-100 text-red-800"
                  )}
                >
                  {effectiveType === "income" ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  {effectiveType === "income" ? "Income" : "Expense"}
                </span>

                {/* Amount chip */}
                {parsed.amount > 0 && (
                  <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-white/20 text-white">
                    {formatCurrency(parsed.amount, currency)}
                  </span>
                )}

                {/* Status chip */}
                {parsed.status && effectiveType === "expense" && (
                  <span
                    className={cn(
                      "text-xs font-medium px-2.5 py-1 rounded-full border",
                      STATUS_LABELS[parsed.status]?.color
                    )}
                  >
                    {STATUS_LABELS[parsed.status]?.label ?? parsed.status}
                  </span>
                )}

                {/* Re-parse button */}
                <button
                  type="button"
                  onClick={() => {
                    setParsed(null);
                    setTransactionType(undefined);
                    setMode("ai");
                  }}
                  className="flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors ml-auto"
                >
                  <RefreshCw className="h-3 w-3" />
                  Re-parse
                </button>
              </div>
            )}
          </div>

          {/* Body */}
          <div className="bg-white">
            {/* ─── AI INPUT PANEL ─── */}
            {mode === "ai" && (
              <div className="p-6 space-y-4">
                {/* Textarea */}
                <div className="relative">
                  <Textarea
                    id="ai-description-input"
                    placeholder={`Describe your transaction in plain English…\n\ne.g. "Paid ₹12,500 to KS Feed Suppliers for 50kg prawn feed"\n     "Sold 200kg harvest to Metro Mart for ₹85,000"\n     "Labour wages ₹8000 for pond cleaning, credit pending"`}
                    value={aiText}
                    onChange={(e) => setAiText(e.target.value)}
                    className="min-h-[130px] resize-none text-sm border-2 border-slate-200 focus:border-purple-400 rounded-xl pr-4"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleParseAI();
                    }}
                  />
                  {aiText && (
                    <span className="absolute bottom-3 right-3 text-[10px] text-slate-400">
                      ⌘↵ to parse
                    </span>
                  )}
                </div>

                {/* Quick example chips */}
                <div>
                  <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wide mb-2">
                    Quick examples
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {QUICK_EXAMPLES.map(({ label, text }) => (
                      <button
                        key={label}
                        type="button"
                        onClick={() => setAiText(text)}
                        className="text-xs px-3 py-1.5 rounded-full bg-slate-100 hover:bg-purple-100 border border-slate-200 hover:border-purple-300 text-slate-600 hover:text-purple-700 transition-colors"
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {parseError && (
                  <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                    <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                    <span>{parseError}</span>
                  </div>
                )}

                {/* CTA */}
                <div className="flex gap-3">
                  <Button
                    id="ai-parse-button"
                    type="button"
                    onClick={handleParseAI}
                    disabled={!aiText.trim() || isParsing}
                    className={cn(
                      "flex-1 gap-2 rounded-xl font-semibold transition-all",
                      "bg-gradient-to-r from-violet-500 to-indigo-500 hover:from-violet-600 hover:to-indigo-600 text-white shadow-md hover:shadow-lg active:scale-[0.98]"
                    )}
                  >
                    {isParsing ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Parsing
                        <AnimatedDots />
                      </>
                    ) : (
                      <>
                        <Wand2 className="h-4 w-4" />
                        Parse with AI
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setMode("manual")}
                    className="rounded-xl border-2 text-slate-600"
                  >
                    Skip
                  </Button>
                </div>
              </div>
            )}

            {/* ─── MANUAL FORM ─── */}
            {mode === "manual" && (
              <form onSubmit={handleSubmit}>
                <ScrollArea className="h-[60vh]">
                  <div className="px-6 py-4 grid gap-5">
                    {/* Project */}
                    <FieldRow label="Project" required>
                      <Select
                        name="projectId"
                        required
                        value={selectedProjectId}
                        onValueChange={setSelectedProjectId}
                      >
                        <SelectTrigger className="w-full" id="project-select">
                          <SelectValue placeholder="Select project" />
                        </SelectTrigger>
                        <SelectContent>
                          {projectsLoading ? (
                            <SelectItem value="loading" disabled>Loading…</SelectItem>
                          ) : (
                            activeProjects.map((project) => (
                              <SelectItem key={project.id} value={project.id}>
                                {project.name}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </FieldRow>

                    {/* Type */}
                    <FieldRow label="Type" required>
                      <RadioGroup
                        name="type"
                        required
                        className="flex gap-3"
                        onValueChange={(v) => setTransactionType(v as "expense" | "income")}
                        value={effectiveType}
                      >
                        {(["expense", "income"] as const).map((t) => (
                          <label
                            key={t}
                            htmlFor={`r-type-${t}`}
                            className={cn(
                              "flex items-center gap-2 px-4 py-2 rounded-xl border-2 cursor-pointer text-sm font-medium transition-all select-none",
                              effectiveType === t
                                ? t === "expense"
                                  ? "border-red-400 bg-red-50 text-red-700"
                                  : "border-emerald-400 bg-emerald-50 text-emerald-700"
                                : "border-slate-200 text-slate-500 hover:border-slate-300"
                            )}
                          >
                            <RadioGroupItem value={t} id={`r-type-${t}`} className="sr-only" />
                            {t === "income" ? (
                              <TrendingUp className="h-4 w-4" />
                            ) : (
                              <TrendingDown className="h-4 w-4" />
                            )}
                            {t.charAt(0).toUpperCase() + t.slice(1)}
                          </label>
                        ))}
                      </RadioGroup>
                    </FieldRow>

                    {effectiveType && (
                      <>
                        {/* Title */}
                        <FieldRow label="Title" required>
                          <Input
                            id="title-input"
                            name="title"
                            required
                            ref={titleRef}
                            defaultValue={parsed?.title || ""}
                            placeholder="e.g. Prawn feed purchase"
                            className="w-full"
                          />
                        </FieldRow>

                        {/* Amount */}
                        <FieldRow label="Amount" required>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                              {currency === "INR" ? "₹" : currency === "USD" ? "$" : currency}
                            </span>
                            <Input
                              id="amount-input"
                              name="amount"
                              type="number"
                              step="0.01"
                              required
                              ref={amountRef}
                              defaultValue={parsed?.amount || ""}
                              placeholder="0.00"
                              className="pl-8 w-full"
                            />
                          </div>
                        </FieldRow>

                        {/* Category (expense only) */}
                        {effectiveType === "expense" && (
                          <>
                            <FieldRow label="Category" required>
                              <Select
                                name="category"
                                required
                                disabled={!selectedProjectId}
                                defaultValue={parsed?.category}
                              >
                                <SelectTrigger className="w-full" id="category-select">
                                  <SelectValue placeholder={parsed?.category || "Select category"} />
                                </SelectTrigger>
                                <SelectContent>
                                  {categoriesLoading ? (
                                    <SelectItem value="loading" disabled>Loading…</SelectItem>
                                  ) : (
                                    categories.map((cat) => (
                                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                    ))
                                  )}
                                  {parsed?.category && !categories.includes(parsed.category) && (
                                    <SelectItem value={parsed.category}>
                                      {parsed.category}{" "}
                                      <span className="text-purple-600">(AI suggested)</span>
                                    </SelectItem>
                                  )}
                                </SelectContent>
                              </Select>
                            </FieldRow>

                            <FieldRow label="Status">
                              <RadioGroup
                                name="status"
                                defaultValue={parsed?.status || "completed"}
                                className="flex gap-2 flex-wrap"
                              >
                                {(["completed", "credit", "expected"] as const).map((s) => (
                                  <label
                                    key={s}
                                    htmlFor={`r-status-${s}`}
                                    className={cn(
                                      "flex items-center gap-1.5 px-3 py-1.5 rounded-full border cursor-pointer text-xs font-medium transition-all select-none",
                                      "border-slate-200 text-slate-500 hover:border-slate-300 has-[:checked]:border-current",
                                      s === "completed" && "has-[:checked]:bg-emerald-50 has-[:checked]:text-emerald-700 has-[:checked]:border-emerald-400",
                                      s === "credit"    && "has-[:checked]:bg-amber-50 has-[:checked]:text-amber-700 has-[:checked]:border-amber-400",
                                      s === "expected"  && "has-[:checked]:bg-blue-50 has-[:checked]:text-blue-700 has-[:checked]:border-blue-400"
                                    )}
                                  >
                                    <RadioGroupItem value={s} id={`r-status-${s}`} className="sr-only" />
                                    {STATUS_LABELS[s].label}
                                  </label>
                                ))}
                              </RadioGroup>
                            </FieldRow>
                          </>
                        )}

                        {/* Date */}
                        <FieldRow label="Date" required>
                          <Input
                            id="date-input"
                            name="date"
                            type="date"
                            defaultValue={parsed?.date || new Date().toISOString().split("T")[0]}
                            required
                            className="w-full"
                          />
                        </FieldRow>

                        {/* Vendor */}
                        <FieldRow label="Vendor">
                          <Input
                            id="vendor-input"
                            name="vendor"
                            ref={vendorRef}
                            defaultValue={parsed?.vendor || ""}
                            placeholder="Supplier or person name"
                            className="w-full"
                          />
                        </FieldRow>

                        {/* Description */}
                        <FieldRow label="Description">
                          <Textarea
                            id="description-input"
                            name="description"
                            ref={descriptionRef}
                            defaultValue={parsed?.description || ""}
                            placeholder="Brief description"
                            className="w-full resize-none"
                            rows={2}
                          />
                        </FieldRow>

                        {/* Invoice / Qty / Unit in compact row */}
                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <Label htmlFor="invoiceNo" className="text-xs text-slate-500 mb-1 block">Invoice No</Label>
                            <Input id="invoiceNo" name="invoiceNo" ref={invoiceRef} placeholder="INV-001" className="text-sm" />
                          </div>
                          <div>
                            <Label htmlFor="qty" className="text-xs text-slate-500 mb-1 block">Quantity</Label>
                            <Input id="qty" name="qty" type="number" placeholder="0" className="text-sm" />
                          </div>
                          <div>
                            <Label htmlFor="unit" className="text-xs text-slate-500 mb-1 block">Unit</Label>
                            <Input id="unit" name="unit" placeholder="kg, bag…" className="text-sm" />
                          </div>
                        </div>

                        {/* Notes */}
                        <FieldRow label="Notes">
                          <Textarea
                            id="notes-input"
                            name="notes"
                            ref={notesRef}
                            defaultValue={parsed?.notes || ""}
                            placeholder="Any additional context"
                            className="w-full resize-none"
                            rows={2}
                          />
                        </FieldRow>

                        {/* Receipt */}
                        <FieldRow label="Receipt">
                          <Input
                            id="receipt"
                            name="receipt"
                            type="file"
                            accept="image/*"
                            className="w-full text-sm"
                            onChange={handleReceiptChange}
                          />
                        </FieldRow>

                        {receiptPreview && (
                          <div className="rounded-xl overflow-hidden border border-slate-200">
                            <img
                              src={receiptPreview}
                              alt="Receipt preview"
                              className="max-h-40 w-full object-contain bg-slate-50"
                            />
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </ScrollArea>

                {/* Footer */}
                <div className="px-6 py-4 border-t bg-slate-50 flex items-center gap-3">
                  <DialogClose asChild>
                    <Button type="button" variant="ghost" onClick={resetDialog} className="text-slate-500">
                      Cancel
                    </Button>
                  </DialogClose>
                  <Button
                    id="save-transaction-button"
                    type="submit"
                    disabled={
                      isLoading ||
                      categoriesLoading ||
                      projectsLoading ||
                      !effectiveType
                    }
                    className="ml-auto bg-gradient-to-r from-violet-500 to-indigo-500 hover:from-violet-600 hover:to-indigo-600 text-white rounded-xl px-6 font-semibold shadow-md hover:shadow-lg active:scale-[0.98] transition-all"
                  >
                    {isLoading ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving…</>
                    ) : (
                      <><CheckCircle2 className="h-4 w-4 mr-2" />Save Transaction</>
                    )}
                  </Button>
                </div>
              </form>
            )}

            {/* Footer for AI mode (no form) */}
            {mode === "ai" && (
              <div className="px-6 pb-5 flex">
                <DialogClose asChild>
                  <Button type="button" variant="ghost" onClick={resetDialog} className="text-slate-500">
                    Cancel
                  </Button>
                </DialogClose>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ── Helper: labelled field row ──────────────────────────────────────────────
function FieldRow({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-[100px_1fr] items-start gap-4">
      <label className="text-sm font-medium text-slate-600 pt-2.5 text-right">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <div>{children}</div>
    </div>
  );
}
