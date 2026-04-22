"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/data";
import { useCurrency } from "@/context/currency-context";
import type { Transaction } from "@/types";

interface StitchAnalyticsSuiteProps {
  transactions: Transaction[];
}

export function StitchAnalyticsSuite({ transactions }: StitchAnalyticsSuiteProps) {
  const { currency } = useCurrency();

  const heatmap = useMemo(() => {
    // Last 28 days frequency grid
    const grid: number[] = new Array(28).fill(0);
    const today = new Date();
    transactions.forEach(t => {
      const diff = Math.floor((today.getTime() - new Date(t.date).getTime()) / (1000 * 60 * 60 * 24));
      if (diff >= 0 && diff < 28) {
        grid[27 - diff]++;
      }
    });
    return grid;
  }, [transactions]);

  const treemap = useMemo(() => {
    const categories: Record<string, number> = {};
    transactions.forEach(t => {
      if (t.type === 'expense') {
        categories[t.category] = (categories[t.category] || 0) + t.amount;
      }
    });
    return Object.entries(categories)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4);
  }, [transactions]);

  const vendors = useMemo(() => {
    const vendorMap: Record<string, number> = {};
    transactions.forEach(t => {
      if (t.vendor) {
        vendorMap[t.vendor] = (vendorMap[t.vendor] || 0) + t.amount;
      }
    });
    return Object.entries(vendorMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
  }, [transactions]);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Deep Analytics Section */}
        <div className="flex flex-col gap-8">
          {/* Heatmap: Frequency */}
          <div className="rounded-2xl bg-surface-container-low p-6 shadow-sm border border-outline-variant/10">
            <h3 className="text-sm font-semibold text-on-surface font-headline uppercase tracking-tight mb-4">Expense Frequency</h3>
            <div className="flex flex-wrap gap-2">
              {heatmap.map((count, i) => (
                <div 
                  key={i} 
                  className={cn(
                    "w-4 h-4 rounded-sm transition-all duration-300",
                    count === 0 ? "bg-surface-container-high" :
                    count < 2 ? "bg-primary-container/20" :
                    count < 4 ? "bg-primary-container/50" :
                    "bg-primary-container"
                  )}
                  title={`${count} transactions`}
                ></div>
              ))}
            </div>
          </div>

          {/* Vendors */}
          <div className="rounded-2xl bg-surface-container-highest p-6 shadow-sm border border-outline-variant/10">
             <h3 className="text-sm font-semibold text-on-surface font-headline uppercase tracking-tight mb-4">Top Vendors</h3>
             <div className="space-y-3">
               {vendors.map(([name, amount], i) => (
                 <div key={name} className="flex justify-between items-center text-xs">
                   <div className="flex items-center gap-2">
                     <span className="w-4 h-1 rounded-full bg-secondary-container"></span>
                     <span className="font-medium text-on-surface">{name}</span>
                   </div>
                   <span className="font-bold text-on-surface">{formatCurrency(amount, currency)}</span>
                 </div>
               ))}
               {vendors.length === 0 && <p className="text-xs text-outline italic">No vendor data found</p>}
             </div>
          </div>
        </div>

        {/* Right: Treemap Pattern */}
        <div className="rounded-2xl bg-surface p-6 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] border border-outline-variant/10">
          <h3 className="text-sm font-semibold text-on-surface font-headline uppercase tracking-tight mb-6">Category Deep Dive</h3>
          <div className="grid grid-cols-2 grid-rows-2 gap-3 h-[280px]">
            {treemap.map(([name, amount], i) => (
               <div 
                 key={name}
                 className={cn(
                   "rounded-xl p-4 flex flex-col justify-between transition-transform hover:scale-[1.02]",
                   i === 0 ? "row-span-2 bg-primary-container text-white" : 
                   i === 1 ? "bg-surface-container-highest border border-outline-variant/20" : 
                   i === 2 ? "bg-surface-container-low border border-outline-variant/15" :
                   "bg-surface-container-lowest border border-outline-variant/10"
                 )}
               >
                 <span className={cn("text-[10px] font-bold uppercase tracking-widest", i === 0 ? "text-white/80" : "text-outline")}>{name}</span>
                 <p className={cn("text-lg font-extrabold font-headline", i === 0 ? "text-white" : "text-on-surface")}>{formatCurrency(amount, currency)}</p>
               </div>
            ))}
            {treemap.length === 0 && <div className="col-span-2 row-span-2 flex items-center justify-center text-outline italic text-sm">No spend categories yet</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
