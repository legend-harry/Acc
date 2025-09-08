"use client";

import { useState } from "react";
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
import { categories, formatCurrency } from "@/lib/data";
import { useToast } from "@/hooks/use-toast";

// Mock budgets for demonstration
const initialBudgets: Record<string, number> = {
  "Bore": 150000,
  "Road": 70000,
  "Labour": 30000,
};

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState<Record<string, number>>(initialBudgets);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleBudgetChange = (category: string, value: string) => {
    const amount = parseInt(value, 10);
    setBudgets((prev) => ({
      ...prev,
      [category]: isNaN(amount) ? 0 : amount,
    }));
  };

  const handleSave = () => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: "Budgets Saved",
        description: "Your new budget goals have been updated.",
      });
    }, 1000);
  };

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
                <span className="text-sm text-muted-foreground">$</span>
                <Input
                  id={`budget-${category}`}
                  type="number"
                  placeholder="e.g., 500"
                  value={budgets[category] || ""}
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
