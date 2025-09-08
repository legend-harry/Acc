
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
import { useBudgets, useCategories } from "@/hooks/use-database";
import { db } from "@/lib/firebase";
import { ref, set, update } from "firebase/database";
import { Skeleton } from "@/components/ui/skeleton";

export default function BudgetsPage() {
  const { budgets, loading: budgetsLoading } = useBudgets();
  const { categories, loading: categoriesLoading } = useCategories();
  const [localBudgets, setLocalBudgets] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!budgetsLoading) {
      const budgetMap = budgets.reduce((acc, budget) => {
        acc[budget.category] = budget.budget;
        return acc;
      }, {} as Record<string, number>);
      setLocalBudgets(budgetMap);
    }
  }, [budgets, budgetsLoading]);

  const handleBudgetChange = (category: string, value: string) => {
    const amount = parseInt(value, 10);
    setLocalBudgets((prev) => ({
      ...prev,
      [category]: isNaN(amount) ? 0 : amount,
    }));
  };

  const handleSave = async () => {
    setIsLoading(true);
    
    // Find which budget item in the original budgets array corresponds to the updated local budget
    const updates: Record<string, any> = {};
    Object.keys(localBudgets).forEach(category => {
        const budgetItem = budgets.find(b => b.category === category);
        if (budgetItem && budgetItem.id) {
            updates[`/budgets/${budgetItem.id}/budget`] = localBudgets[category];
        }
    });

    try {
        await update(ref(db), updates);
        toast({
            title: "Budgets Saved",
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
  
  if (budgetsLoading || categoriesLoading) {
      return (
          <div>
              <PageHeader
                title="Budgets"
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
        title="Budgets"
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
          {categories.map((category) => (
            <div key={category} className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor={`budget-${category}`}>{category}</Label>
              <div className="col-span-2 flex items-center gap-2">
                <span className="text-sm text-muted-foreground">₹</span>
                <Input
                  id={`budget-${category}`}
                  type="number"
                  placeholder="e.g., 500"
                  value={localBudgets[category] || ""}
                  onChange={(e) => handleBudgetChange(category, e.target.value)}
                  className="w-full"
                />
              </div>
            </div>
          ))}
        </CardContent>
        <CardFooter className="border-t px-6 py-4">
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? "Saving..." : "Save Budgets"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
