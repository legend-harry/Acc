"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/data";
import { useCurrency } from "@/context/currency-context";
import type { BudgetSummary } from "@/types";

interface StitchBudgetIntelligenceProps {
  budgets: BudgetSummary[];
}

export function StitchBudgetIntelligence({ budgets }: StitchBudgetIntelligenceProps) {
  const { currency } = useCurrency();

  const displayBudgets = useMemo(() => {
    return budgets.slice(0, 3);
  }, [budgets]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-semibold text-on-surface font-headline uppercase tracking-tight">Budget Intelligence</h3>
        <span className="text-[10px] font-bold text-primary-container uppercase tracking-widest bg-primary-container/10 px-2 py-0.5 rounded">Active Monitoring</span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {displayBudgets.map((budget) => {
          const percentage = Math.min(100, (budget.spent / budget.amount) * 100);
          const isOver = budget.spent > budget.amount;
          
          return (
            <div key={budget.category} className="rounded-2xl bg-surface-container-low p-6 shadow-sm border border-outline-variant/10 flex flex-col items-center text-center group transition-all hover:bg-surface-container">
              <div className="relative w-24 h-24 mb-4">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="45" fill="none" stroke="hsl(var(--surface-container-high))" strokeWidth="8"></circle>
                  <circle 
                    cx="50" cy="50" r="45" 
                    fill="none" 
                    stroke={isOver ? "hsl(var(--secondary-container))" : "hsl(var(--primary-container))"} 
                    strokeWidth="8"
                    strokeDasharray="283"
                    strokeDashoffset={283 - (percentage / 100) * 283}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-in-out"
                  ></circle>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className={cn("text-lg font-bold font-headline", isOver ? "text-secondary-container" : "text-on-surface")}>
                    {percentage.toFixed(0)}%
                  </span>
                </div>
              </div>
              
              <h4 className="text-sm font-bold text-on-surface mb-1">{budget.category}</h4>
              <div className="flex flex-col gap-0.5">
                 <p className="text-xs text-on-surface-variant font-medium">
                    {formatCurrency(budget.spent, currency)} <span className="text-outline">of</span> {formatCurrency(budget.amount, currency)}
                 </p>
                 <p className={cn("text-[10px] font-bold uppercase tracking-wider mt-1", isOver ? "text-secondary-container" : "text-primary-container")}>
                   {isOver ? "Limit Exceeded" : `${(budget.amount - budget.spent) > 0 ? formatCurrency(budget.amount - budget.spent, currency) : '0'} remaining`}
                 </p>
              </div>
            </div>
          );
        })}
        {displayBudgets.length === 0 && (
           <div className="col-span-3 py-12 bg-surface-container-low rounded-2xl border border-dashed border-outline-variant/30 text-center text-outline text-sm italic">
             No budgets configured for current period
           </div>
        )}
      </div>
    </div>
  );
}
