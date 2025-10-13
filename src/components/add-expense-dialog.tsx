
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
import { useCategories, useProjects } from "@/hooks/use-database";
import { db } from "@/lib/firebase";
import { ref, push, set } from "firebase/database";
import { getStorage, ref as storageRef, uploadString, getDownloadURL } from "firebase/storage";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useUser } from "@/context/user-context";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { useCurrency } from "@/context/currency-context";
import { cn } from "@/lib/utils";


export function AddExpenseDialog({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { currency } = useCurrency();
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  
  const { projects, loading: projectsLoading } = useProjects();
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const { categories, loading: categoriesLoading } = useCategories(selectedProjectId);

  const { user } = useUser();
  const [transactionType, setTransactionType] = useState<'expense' | 'income' | undefined>();
  
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
    
    const newTransaction = {
        ...data,
        amount: Number(data.amount),
        quantity: Number(data.qty) || 0,
        ratePerUnit: 0, // This can be calculated or added as a field
        date: data.date ? new Date(data.date as string).toISOString() : new Date().toISOString(),
        createdAt: new Date().toISOString(),
        receiptUrl: receiptUrl,
        createdBy: user,
        type: data.type,
        status: data.type === 'income' ? 'completed' : data.status,
        category: data.type === 'income' ? 'Income' : data.category,
        projectId: data.projectId,
    };
    
    try {
        const transactionsRef = ref(db, 'transactions');
        const newTransactionRef = push(transactionsRef);
        await set(newTransactionRef, newTransaction);
        
        setIsLoading(false);
        setOpen(false);
        setReceiptPreview(null);
        setTransactionType(undefined);
        (event.target as HTMLFormElement).reset();
        
        toast({
            title: "Transaction Added",
            description: `Successfully added ${formatCurrency(
            Number(data.amount), currency
            )} for ${data.title}.`,
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

  return (
    <>
      <Dialog open={open} onOpenChange={(isOpen) => {
          setOpen(isOpen);
          if (!isOpen) {
              setTransactionType(undefined);
              setReceiptPreview(null);
          }
      }}>
        <div onClick={() => setOpen(true)}>{children}</div>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add New Transaction</DialogTitle>
            <DialogDescription>
              Enter the details of your transaction. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <ScrollArea className="h-[70vh] p-1">
              <div className="grid gap-4 py-4 pr-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="project" className="text-right">
                      Project *
                    </Label>
                    <Select name="projectId" required onValueChange={setSelectedProjectId}>
                        <SelectTrigger className={cn("col-span-3", !selectedProjectId && "text-muted-foreground")}>
                            <SelectValue>
                                {projects.find(p => p.id === selectedProjectId)?.name || 
                                <span className="bg-gray-200 text-gray-500 rounded-md px-2 py-1">Select a project</span>}
                            </SelectValue>
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
                      <Label className="text-right">Type*</Label>
                      <RadioGroup
                        name="type"
                        required
                        className="col-span-3 flex gap-4"
                        onValueChange={(value) => setTransactionType(value as 'expense' | 'income')}
                        value={transactionType}
                      >
                          <div className="flex items-center space-x-2">
                          <RadioGroupItem value="expense" id="r-expense" />
                          <Label htmlFor="r-expense">Expense</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                          <RadioGroupItem value="income" id="r-income" />
                          <Label htmlFor="r-income">Income</Label>
                          </div>
                      </RadioGroup>
                  </div>
                  
                  {transactionType && (
                      <>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="title" className="text-right">
                                Title*
                            </Label>
                            <Input
                                id="title"
                                name="title"
                                required
                                className="col-span-3"
                            />
                          </div>

                          {transactionType === 'expense' && (
                          <>
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="category" className="text-right">
                                  Category*
                              </Label>
                              <Select name="category" required disabled={!selectedProjectId}>
                                  <SelectTrigger className={cn("col-span-3", !selectedProjectId && "text-muted-foreground")}>
                                    <SelectValue>
                                        {!selectedProjectId ? 
                                            <span className="bg-gray-200 text-gray-500 rounded-md px-2 py-1">First select a project</span> : 
                                            <span className="bg-gray-200 text-gray-500 rounded-md px-2 py-1">Select a category</span>}
                                    </SelectValue>
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
                                <Label className="text-right">Status</Label>
                                <RadioGroup name="status" defaultValue="completed" className="col-span-3 flex gap-4">
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="completed" id="r-completed" />
                                        <Label htmlFor="r-completed">Completed</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="credit" id="r-credit" />
                                        <Label htmlFor="r-credit">Credit</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="expected" id="r-expected" />
                                        <Label htmlFor="r-expected">Expected</Label>
                                    </div>
                                </RadioGroup>
                            </div>
                          </>
                          )}

                          <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="date" className="text-right">
                              Date*
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
                          <Label htmlFor="amount" className="text-right">
                              Amount*
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
                      </>
                  )}
                </div>
            </ScrollArea>
            <DialogFooter className="pt-4 border-t">
              <DialogClose asChild>
                <Button type="button" variant="secondary" onClick={() => {
                    setReceiptPreview(null);
                    setTransactionType(undefined);
                }}>
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isLoading || categoriesLoading || projectsLoading || !transactionType}>
                {isLoading ? "Saving..." : "Save Transaction"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
