
"use client";

import { useEffect, useMemo, useState } from "react";
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
import { useCategories } from "@/hooks/use-database";
import { db } from "@/lib/firebase";
import { ref, push, set } from "firebase/database";
import { getStorage, ref as storageRef, uploadString, getDownloadURL } from "firebase/storage";
import { ScrollArea } from "./ui/scroll-area";
import { useUser } from "@/context/user-context";
import { Progress } from "@/components/ui/progress";
import { Loader2, Sparkles, Wand2, CheckCircle2, Clock3 } from "lucide-react";
import Image from "next/image";


export function AddExpenseDialog({
  children,
}: {
  children: React.ReactNode;
}) {
  const defaultDate = new Date().toISOString().split("T")[0];
  const emptyForm = useMemo(() => ({
    date: defaultDate,
    title: "",
    amount: "",
    category: "",
    vendor: "",
    invoiceNo: "",
    glCode: "",
    qty: "",
    unit: "",
    description: "",
    notes: "",
  }), [defaultDate]);

  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [justSaved, setJustSaved] = useState(false);
  const { toast } = useToast();
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const { categories, loading: categoriesLoading } = useCategories();
  const { user } = useUser();
  const [formValues, setFormValues] = useState(emptyForm);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiConfidence, setAiConfidence] = useState<number | null>(null);

  useEffect(() => {
    if (!open) {
      setFormValues({ ...emptyForm, date: defaultDate });
      setReceiptPreview(null);
      setAiPrompt("");
      setAiConfidence(null);
      setProgress(0);
      setJustSaved(false);
      setIsLoading(false);
    }
  }, [open, defaultDate, emptyForm]);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | undefined;
    if (isLoading) {
      setProgress(12);
      timer = setInterval(() => {
        setProgress((prev) => Math.min(prev + 12, 82));
      }, 200);
    } else if (justSaved) {
      setProgress(100);
      const reset = setTimeout(() => setProgress(0), 1200);
      return () => clearTimeout(reset);
    } else {
      setProgress(0);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isLoading, justSaved]);

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

  const fillFromAi = (suggestion: Partial<typeof emptyForm> & { amount?: number; confidence?: number }) => {
    setFormValues((prev) => ({
      ...prev,
      title: suggestion.title ?? prev.title,
      amount: suggestion.amount !== undefined ? String(suggestion.amount) : prev.amount,
      category: suggestion.category ?? prev.category,
      vendor: suggestion.vendor ?? prev.vendor,
      invoiceNo: suggestion.invoiceNo ?? prev.invoiceNo,
      glCode: suggestion.glCode ?? prev.glCode,
      qty: suggestion.qty ?? prev.qty,
      unit: suggestion.unit ?? prev.unit,
      description: suggestion.description ?? prev.description,
      notes: suggestion.notes ?? prev.notes,
      date: suggestion.date ? suggestion.date.slice(0, 10) : prev.date,
    }));

    setAiConfidence(suggestion.confidence ?? null);
  };

  const handleAiAssist = async () => {
    if (!aiPrompt.trim()) return;
    setAiLoading(true);
    setAiConfidence(null);
    try {
      const response = await fetch("/api/ai/transaction-assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: aiPrompt, categories }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || "AI request failed");
      }

      fillFromAi(payload);
      toast({
        title: "AI filled the form",
        description: "Review the suggestion, tweak if needed, then save.",
      });
    } catch (error) {
      console.error("AI assist failed", error);
      toast({
        variant: "destructive",
        title: "AI assist unavailable",
        description: "Could not generate a suggestion right now.",
      });
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setJustSaved(false);

    if (!formValues.category) {
        toast({
            variant: "destructive",
            title: "Category missing",
            description: "Choose a category before saving.",
        });
        setIsLoading(false);
        return;
    }

    const amountNumber = Number(formValues.amount);
    if (Number.isNaN(amountNumber)) {
        toast({
            variant: "destructive",
            title: "Invalid amount",
            description: "Enter a valid number for amount.",
        });
        setIsLoading(false);
        return;
    }
    
    let receiptUrl = "";
    if (receiptPreview) {
        try {
            const storage = getStorage();
            const newReceiptRef = storageRef(storage, `receipts/${new Date().getTime()}`);
            await uploadString(newReceiptRef, receiptPreview, 'data_url');
            receiptUrl = await getDownloadURL(newReceiptRef);
        } catch (error) {
            console.error("Error uploading receipt:", error);
            toast({
                variant: "destructive",
                title: "Receipt Upload Failed",
                description: "There was an error uploading your receipt image.",
            });
            setIsLoading(false);
            return;
        }
    }
    
    const newExpense = {
        ...formValues,
        amount: amountNumber,
        quantity: Number(formValues.qty) || 0,
        ratePerUnit: 0, // This can be calculated or added as a field
        date: formValues.date ? new Date(formValues.date).toISOString() : new Date().toISOString(),
        createdAt: new Date().toISOString(),
        receiptUrl: receiptUrl,
        createdBy: user,
    };
    
    try {
        const transactionsRef = ref(db, 'transactions');
        const newTransactionRef = push(transactionsRef);
        await set(newTransactionRef, newExpense);
        
        setIsLoading(false);
        setJustSaved(true);
        setFormValues({ ...emptyForm, date: defaultDate });
        setAiPrompt("");
        setAiConfidence(null);
        setReceiptPreview(null);
        (event.target as HTMLFormElement).reset();
        
        toast({
            title: "Expense Added",
          description: `Successfully added ${formatCurrency(
          Number(amountNumber)
          )} for ${formValues.title || "this expense"}.`,
        });

        setTimeout(() => setOpen(false), 350);

    } catch (error) {
        console.error("Failed to add expense:", error);
        setIsLoading(false);
        toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to save the expense to the database.",
        });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <div onClick={() => setOpen(true)}>{children}</div>
      <DialogContent className="sm:max-w-lg animate-in fade-in slide-in-from-bottom-3 duration-300">
        <DialogHeader>
          <DialogTitle>Add New Expense</DialogTitle>
          <DialogDescription>
            Enter the details of your expense. Use the AI helper to auto-fill from a quick note.
          </DialogDescription>
        </DialogHeader>
        {progress > 0 && (
            <div className="mt-2 space-y-1">
                <Progress value={progress} className="h-2" />
                <p className="text-xs text-muted-foreground flex items-center gap-2">
                    {justSaved ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> : <Clock3 className="h-3.5 w-3.5" />}
                    {justSaved ? "Saved and syncing across devices." : "Recording transaction with a smooth handoff..."}
                </p>
            </div>
        )}
        <form onSubmit={handleSubmit}>
          <ScrollArea className="max-h-[70vh] p-1">
            <div className="grid gap-4 py-4 pr-4">
                <div className="rounded-lg border bg-muted/40 p-3 space-y-3 transition-all duration-300">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Sparkles className="h-4 w-4 text-primary" />
                      AI quick fill
                    </div>
                    {aiConfidence !== null && (
                      <span className="text-xs text-muted-foreground">Confidence: {(aiConfidence * 100).toFixed(0)}%</span>
                    )}
                  </div>
                  <Textarea
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="e.g. Yesterday: lunch with team at Green Bowl for 24.50, category meals"
                    className="min-h-[90px]"
                  />
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={handleAiAssist}
                      disabled={aiLoading || !aiPrompt.trim()}
                      className="flex items-center gap-2"
                    >
                      {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                      {aiLoading ? "Thinking..." : "Fill with AI"}
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      Paste a quick note and let AI map it to the form.
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="date" className="text-right">
                    Date
                  </Label>
                  <Input
                    id="date"
                    name="date"
                    type="date"
                    value={formValues.date}
                    onChange={(e) => setFormValues((prev) => ({ ...prev, date: e.target.value }))}
                    required
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="title" className="text-right">
                    Title
                  </Label>
                  <Input
                    id="title"
                    name="title"
                    value={formValues.title}
                    onChange={(e) => setFormValues((prev) => ({ ...prev, title: e.target.value }))}
                    required
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="amount" className="text-right">
                    Amount (₹)
                  </Label>
                  <Input
                    id="amount"
                    name="amount"
                    type="number"
                    step="0.01"
                    value={formValues.amount}
                    onChange={(e) => setFormValues((prev) => ({ ...prev, amount: e.target.value }))}
                    required
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="category" className="text-right">
                    Category
                  </Label>
                  <Select
                    name="category"
                    required
                    value={formValues.category}
                    onValueChange={(value) => setFormValues((prev) => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select a category" />
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
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="vendor" className="text-right">
                    Vendor
                  </Label>
                  <Input
                    id="vendor"
                    name="vendor"
                    value={formValues.vendor}
                    onChange={(e) => setFormValues((prev) => ({ ...prev, vendor: e.target.value }))}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="invoiceNo" className="text-right">
                    Invoice No
                  </Label>
                  <Input
                    id="invoiceNo"
                    name="invoiceNo"
                    value={formValues.invoiceNo}
                    onChange={(e) => setFormValues((prev) => ({ ...prev, invoiceNo: e.target.value }))}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="glCode" className="text-right">
                    G/L Code
                  </Label>
                  <Input
                    id="glCode"
                    name="glCode"
                    value={formValues.glCode}
                    onChange={(e) => setFormValues((prev) => ({ ...prev, glCode: e.target.value }))}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="qty" className="text-right">
                    Quantity
                  </Label>
                  <Input
                    id="qty"
                    name="qty"
                    type="number"
                    value={formValues.qty}
                    onChange={(e) => setFormValues((prev) => ({ ...prev, qty: e.target.value }))}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="unit" className="text-right">
                    Unit
                  </Label>
                  <Input
                    id="unit"
                    name="unit"
                    value={formValues.unit}
                    onChange={(e) => setFormValues((prev) => ({ ...prev, unit: e.target.value }))}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="description" className="text-right">
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formValues.description}
                    onChange={(e) => setFormValues((prev) => ({ ...prev, description: e.target.value }))}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="notes" className="text-right">
                    Notes
                  </Label>
                  <Textarea
                    id="notes"
                    name="notes"
                    value={formValues.notes}
                    onChange={(e) => setFormValues((prev) => ({ ...prev, notes: e.target.value }))}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="receipt" className="text-right">
                    Receipt
                  </Label>
                  <Input
                    id="receipt"
                    name="receipt"
                    type="file"
                    accept="image/*"
                    className="col-span-3"
                    onChange={handleReceiptChange}
                  />
                </div>
                {receiptPreview && (
                  <div className="grid grid-cols-4 items-start gap-4">
                    <div className="col-start-2 col-span-3">
                      <Image
                        src={receiptPreview}
                        alt="Receipt preview"
                        width={320}
                        height={320}
                        unoptimized
                        className="rounded-md max-h-40 w-auto object-contain"
                      />
                    </div>
                  </div>
                )}
              </div>
          </ScrollArea>
          <DialogFooter className="pt-4 border-t">
            <DialogClose asChild>
              <Button type="button" variant="secondary" onClick={() => setReceiptPreview(null)}>
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isLoading || categoriesLoading}>
              {isLoading ? "Saving..." : "Save Expense"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
