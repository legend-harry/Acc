
"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useBudgets } from "@/hooks/use-database";
import { db } from "@/lib/firebase";
import { ref, set, update, push, remove } from "firebase/database";
import { Skeleton } from "@/components/ui/skeleton";
import { PlusCircle, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
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
import type { BudgetSummary } from "@/types";

function DeleteCategoryDialog({
  category,
  onConfirm,
  isOpen,
  onOpenChange,
}: {
  category: BudgetSummary;
  onConfirm: () => void;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the 
            <span className="font-bold"> "{category.category}"</span> category and its budget. 
            Existing transactions will not be affected.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>
            Yes, delete it
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};


function AddCategoryDialog({ onSave }: { onSave: () => void }) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [categoryName, setCategoryName] = useState("");
  const [budget, setBudget] = useState("");
  const { toast } = useToast();

  const handleSave = async () => {
    if (!categoryName.trim()) {
        toast({
            variant: "destructive",
            title: "Error",
            description: "Category name is required.",
        });
        return;
    }
    
    setIsLoading(true);
    try {
        const budgetsRef = ref(db, 'budgets');
        const newBudgetRef = push(budgetsRef);
        await set(newBudgetRef, {
            category: categoryName.trim(),
            budget: Number(budget) || 0,
            glCode: "" // You may want to add a field for this
        });
        toast({
            title: "Category Added",
            description: `Successfully added the "${categoryName.trim()}" category.`,
        });
        setOpen(false);
        setCategoryName("");
        setBudget("");
        onSave();
    } catch (error) {
        console.error("Failed to add category:", error);
        toast({
            variant: "destructive",
            title: "Error",
            description: "Could not save the new category.",
        });
    } finally {
        setIsLoading(false);
    }
  };
  
  return (
      <Dialog open={open} onOpenChange={setOpen}>
          <Button variant="outline" onClick={() => setOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add New Category
          </Button>
          <DialogContent>
              <DialogHeader>
                  <DialogTitle>Add New Category</DialogTitle>
                  <DialogDescription>
                      Create a new category for your transactions and set an optional monthly budget for it.
                  </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="category-name" className="text-right">
                          Name
                      </Label>
                      <Input
                          id="category-name"
                          value={categoryName}
                          onChange={(e) => setCategoryName(e.target.value)}
                          className="col-span-3"
                          placeholder="e.g., Groceries"
                      />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="budget-amount" className="text-right">
                          Budget (₹)
                      </Label>
                      <Input
                          id="budget-amount"
                          type="number"
                          value={budget}
                          onChange={(e) => setBudget(e.target.value)}
                          className="col-span-3"
                          placeholder="e.g., 10000 (optional)"
                      />
                  </div>
              </div>
              <DialogFooter>
                  <DialogClose asChild>
                      <Button type="button" variant="secondary">
                          Cancel
                      </Button>
                  </DialogClose>
                  <Button onClick={handleSave} disabled={isLoading}>
                      {isLoading ? "Saving..." : "Save Category"}
                  </Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>
  );
}


export default function PlannerPage() {
  const { budgets, loading: budgetsLoading } = useBudgets();
  const [localBudgets, setLocalBudgets] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [deletingCategory, setDeletingCategory] = useState<BudgetSummary | null>(null);


  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!budgetsLoading) {
      const budgetMap = budgets.reduce((acc, budget) => {
        acc[budget.category] = budget.budget;
        return acc;
      }, {} as Record<string, number>);
      setLocalBudgets(budgetMap);
    }
  }, [budgets, budgetsLoading, refreshKey]);

  const handleBudgetChange = (category: string, value: string) => {
    const amount = parseInt(value, 10);
    setLocalBudgets((prev) => ({
      ...prev,
      [category]: isNaN(amount) ? 0 : amount,
    }));
  };

  const handleSave = async () => {
    setIsLoading(true);
    
    const updates: Record<string, any> = {};
    Object.keys(localBudgets).forEach(category => {
        const budgetItem = budgets.find(b => b.category === category);
        if (budgetItem && budgetItem.id && budgetItem.budget !== localBudgets[category]) {
            updates[`/budgets/${budgetItem.id}/budget`] = localBudgets[category];
        }
    });

    if (Object.keys(updates).length === 0) {
        toast({
            title: "No Changes",
            description: "There were no changes to save.",
        });
        setIsLoading(false);
        return;
    }

    try {
        await update(ref(db), updates);
        toast({
            title: "Planner Saved",
            description: "Your new budget goals have been updated.",
        });
    } catch (error) {
        console.error("Failed to save budgets:", error);
        toast({
            variant: "destructive",
            title: "Error",
            description: "Could not save budgets.",
        });
    } finally {
        setIsLoading(false);
    }
  };

  const handleDeleteCategory = async () => {
    if (!deletingCategory) return;
    try {
        await remove(ref(db, `budgets/${deletingCategory.id}`));
        toast({
            title: "Category Deleted",
            description: `The "${deletingCategory.category}" category has been deleted.`,
        });
        setDeletingCategory(null);
        setRefreshKey(k => k + 1); // Force a refresh
    } catch (error) {
        console.error("Failed to delete category:", error);
        toast({
            variant: "destructive",
            title: "Error",
            description: "Could not delete the category.",
        });
    }
  }
  
  if (budgetsLoading) {
      return (
          <div>
              <PageHeader
                title="Planner"
                description="Set and manage your monthly spending goals."
              />
              <Card>
                <CardHeader>
                  <CardTitle>Category Budgets</CardTitle>
                  <CardDescription>
                    Define a monthly budget for each category to track your spending.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-6">
                    {Array.from({length: 5}).map((_, i) => (
                        <div key={i} className="grid grid-cols-3 items-center gap-4">
                            <Skeleton className="h-6 w-24" />
                            <div className="col-span-2">
                                <Skeleton className="h-10 w-full" />
                            </div>
                        </div>
                    ))}
                </CardContent>
              </Card>
          </div>
      )
  }

  return (
    <div>
      <PageHeader
        title="Planner"
        description="Set and manage your monthly spending goals."
      />
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
                <CardTitle>Category Budgets</CardTitle>
                <CardDescription>
                  Define a monthly budget for each category to track your spending.
                </CardDescription>
            </div>
            <AddCategoryDialog onSave={() => setRefreshKey(k => k + 1)} />
          </div>
        </CardHeader>
        <CardContent className="grid gap-6">
          {budgets.map((budget) => (
            <div key={budget.id} className="grid grid-cols-[1fr_auto_auto] items-center gap-4">
              <Label htmlFor={`budget-${budget.category}`}>{budget.category}</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">₹</span>
                <Input
                  id={`budget-${budget.category}`}
                  type="number"
                  placeholder="e.g., 500"
                  value={localBudgets[budget.category] || ""}
                  onChange={(e) => handleBudgetChange(budget.category, e.target.value)}
                  className="w-full"
                />
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => setDeletingCategory(budget)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
           {budgets.length === 0 && (
              <p className="text-muted-foreground text-center col-span-3">No categories found. Add one to get started.</p>
           )}
        </CardContent>
        <CardFooter className="border-t px-6 py-4">
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? "Saving..." : "Save Budgets"}
          </Button>
        </CardFooter>
      </Card>
      {deletingCategory && (
        <DeleteCategoryDialog 
            category={deletingCategory}
            isOpen={!!deletingCategory}
            onOpenChange={(isOpen) => {
                if (!isOpen) setDeletingCategory(null);
            }}
            onConfirm={handleDeleteCategory}
        />
      )}
    </div>
  );
}
