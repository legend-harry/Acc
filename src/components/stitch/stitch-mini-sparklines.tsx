"use client";

import { useMemo } from "react";
import { formatCurrency } from "@/lib/data";
import { useCurrency } from "@/context/currency-context";
import { TrendingUp, TrendingDown } from "lucide-react";
import type { BudgetSummary } from "@/types";

interface StitchMiniSparklinesProps {
  budgets: BudgetSummary[];
}

export function StitchMiniSparklines({ budgets }: StitchMiniSparklinesProps) {
  const { currency } = useCurrency();

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {budgets.slice(0, 4).map((b, i) => {
        const isUp = i % 2 === 0;
        return (
          <div key={b.category} className="rounded-xl bg-surface-container-low p-4 border border-outline-variant/10 group hover:bg-surface-container transition-colors">
            <div className="flex justify-between items-start mb-2">
              <span className="text-[10px] font-bold text-outline uppercase tracking-widest">{b.category}</span>
              {isUp ? <TrendingUp className="w-3 h-3 text-primary-container" /> : <TrendingDown className="w-3 h-3 text-secondary-container" />}
            </div>
            <p className="text-sm font-bold text-on-surface mb-2">{formatCurrency(b.budget ?? 0, currency)}</p>
            <div className="h-8 w-full mt-1">
              <svg className="w-full h-full" viewBox="0 0 100 20" preserveAspectRatio="none">
                <path 
                  d={isUp ? "M0 15 L 20 12 L 40 16 L 60 8 L 80 10 L 100 2" : "M0 2 L 20 5 L 40 2 L 60 12 L 80 8 L 100 18"} 
                  fill="none" 
                  stroke={isUp ? "hsl(var(--primary-container))" : "hsl(var(--secondary-container))"} 
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <div className="flex justify-between items-center mt-2">
              <span className="text-[9px] font-medium text-outline">Avg Position</span>
              <span className={cn("text-[10px] font-bold", isUp ? "text-primary-container" : "text-secondary-container")}>
                {isUp ? "+" : "-"}{(Math.random() * 5).toFixed(1)}%
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Utility function for conditional classes inside the component if needed, 
// though cn is imported from @/lib/utils
function cn(...classes: any[]) {
    return classes.filter(Boolean).join(' ');
}
