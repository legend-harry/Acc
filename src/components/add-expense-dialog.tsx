
"use client";

import { useState } from "react";
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


export function AddExpenseDialog({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const { categories, loading: categoriesLoading } = useCategories();

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
        ...data,
        amount: Number(data.amount),
        quantity: Number(data.qty) || 0,
        ratePerUnit: 0, // This can be calculated or added as a field
        date: data.date ? new Date(data.date as string).toISOString() : new Date().toISOString(),
        createdAt: new Date().toISOString(),
        receiptUrl: receiptUrl,
    };
    
    try {
        const transactionsRef = ref(db, 'transactions');
        const newTransactionRef = push(transactionsRef);
        await set(newTransactionRef, newExpense);
        
        setIsLoading(false);
        setOpen(false);
        setReceiptPreview(null);
        (event.target as HTMLFormElement).reset();
        
        toast({
            title: "Expense Added",
            description: `Successfully added ${formatCurrency(
            Number(data.amount)
            )} for ${data.title}.`,
        });

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
      <Button asChild>
        <div onClick={() => setOpen(true)}>{children}</div>
      </Button>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add New Expense</DialogTitle>
          <DialogDescription>
            Enter the details of your expense. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <ScrollArea className="max-h-[70vh] p-1">
            <div className="grid gap-4 py-4 pr-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="date" className="text-right">
                    Date
                  </Label>
                  <Input
                    id="date"
                    name="date"
                    type="date"
                    defaultValue={new Date().toISOString().split("T")[0]}
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
                    required
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="category" className="text-right">
                    Category
                  </Label>
                  <Select name="category" required>
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
                            <img src={receiptPreview} alt="Receipt preview" className="rounded-md max-h-40 object-contain" />
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
