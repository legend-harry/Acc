
"use client";

import { useState, useEffect } from "react";
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
import { db } from "@/lib/firebase";
import { ref, update } from "firebase/database";
import { getStorage, ref as storageRef, uploadString, getDownloadURL } from "firebase/storage";
import { ScrollArea } from "./ui/scroll-area";
import { useUser } from "@/context/user-context";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import type { Transaction } from "@/types";

export function EditTransactionDialog({
  transaction,
  isOpen,
  onOpenChange,
}: {
  transaction: Transaction;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [receiptPreview, setReceiptPreview] = useState<string | null>(transaction.receiptUrl || null);
  
  const { projects, loading: projectsLoading } = useProjects();
  const [selectedProjectId, setSelectedProjectId] = useState<string>(transaction.projectId);
  const { categories, loading: categoriesLoading } = useCategories(selectedProjectId);

  const { user } = useUser();
  const [transactionType, setTransactionType] = useState<'expense' | 'income'>(transaction.type);

  useEffect(() => {
    setReceiptPreview(transaction.receiptUrl || null);
    setTransactionType(transaction.type);
    setSelectedProjectId(transaction.projectId);
  }, [transaction]);

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
    // Check if the receipt has been changed
    if (receiptPreview && receiptPreview !== transaction.receiptUrl) {
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
    
    const updatedTransaction = {
        ...transaction, // Keep original data like createdAt, id
        ...data,
        amount: Number(data.amount),
        quantity: Number(data.qty) || 0,
        ratePerUnit: 0,
        date: data.date ? new Date(data.date as string).toISOString() : new Date().toISOString(),
        receiptUrl: receiptUrl,
        createdBy: user, // Or keep original creator? For now, update it
        type: data.type,
        status: data.status,
        projectId: data.projectId
    };
    
    try {
        const transactionRef = ref(db, `transactions/${transaction.id}`);
        await update(transactionRef, updatedTransaction);
        
        setIsLoading(false);
        onOpenChange(false);
        
        toast({
            title: "Transaction Updated",
            description: `Successfully updated ${formatCurrency(
            Number(data.amount)
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
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Transaction</DialogTitle>
          <DialogDescription>
            Update the details of your transaction. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <ScrollArea className="max-h-[70vh] p-1">
            <div className="grid gap-4 py-4 pr-4">
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">Type</Label>
                    <RadioGroup
                      name="type"
                      defaultValue={transaction.type}
                      className="col-span-3 flex gap-4"
                      onValueChange={(value) => setTransactionType(value as 'expense' | 'income')}
                    >
                        <div className="flex items-center space-x-2">
                        <RadioGroupItem value="expense" id="r-edit-expense" />
                        <Label htmlFor="r-edit-expense">Expense</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                        <RadioGroupItem value="income" id="r-edit-income" />
                        <Label htmlFor="r-edit-income">Income</Label>
                        </div>
                    </RadioGroup>
                </div>

                {transactionType === 'expense' && (
                  <div className="grid grid-cols-4 items-center gap-4">
                      <Label className="text-right">Status</Label>
                      <RadioGroup name="status" defaultValue={transaction.status} className="col-span-3 flex gap-4">
                          <div className="flex items-center space-x-2">
                              <RadioGroupItem value="completed" id="r-edit-completed" />
                              <Label htmlFor="r-edit-completed">Completed</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                              <RadioGroupItem value="credit" id="r-edit-credit" />
                              <Label htmlFor="r-edit-credit">Credit</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                              <RadioGroupItem value="expected" id="r-edit-expected" />
                              <Label htmlFor="r-edit-expected">Expected</Label>
                          </div>
                      </RadioGroup>
                  </div>
                )}
                 {transactionType === 'income' && (
                    <Input type="hidden" name="status" value="completed" />
                 )}


                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="date" className="text-right">
                    Date
                  </Label>
                  <Input
                    id="date"
                    name="date"
                    type="date"
                    defaultValue={new Date(transaction.date).toISOString().split("T")[0]}
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
                    defaultValue={transaction.title}
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
                    defaultValue={transaction.amount}
                    required
                    className="col-span-3"
                  />
                </div>
                 <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="project" className="text-right">
                    Project
                  </Label>
                  <Select name="projectId" defaultValue={transaction.projectId} required onValueChange={setSelectedProjectId}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select a project" />
                    </SelectTrigger>
                    <SelectContent>
                      {projectsLoading ? (
                        <SelectItem value="loading" disabled>Loading...</SelectItem>
                      ) : (
                        projects.map((project) => (
                          <SelectItem key={project.id} value={project.id}>
                            {project.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="category" className="text-right">
                    Category
                  </Label>
                  <Select name="category" defaultValue={transaction.category} required disabled={!selectedProjectId}>
                    <SelectTrigger className="col-span-3">
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
                 <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="description" className="text-right">
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    name="description"
                    defaultValue={transaction.description}
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
                    defaultValue={transaction.notes}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="vendor" className="text-right">
                    Vendor
                  </Label>
                  <Input
                    id="vendor"
                    name="vendor"
                    defaultValue={transaction.vendor}
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
                    defaultValue={transaction.invoiceNo}
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
                    defaultValue={transaction.quantity}
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
                    defaultValue={transaction.unit}
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
              <Button type="button" variant="secondary">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isLoading || categoriesLoading || projectsLoading}>
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
