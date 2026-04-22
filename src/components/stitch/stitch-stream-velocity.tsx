"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/data";
import { useCurrency } from "@/context/currency-context";
import { ShoppingCart, CreditCard, Cloud, Plane, Filter, MoveUp } from "lucide-react";
import type { Transaction } from "@/types";

interface StitchStreamVelocityProps {
  transactions: Transaction[];
}

export function StitchStreamVelocity({ transactions }: StitchStreamVelocityProps) {
  const { currency } = useCurrency();

  const feed = useMemo(() => {
    return [...transactions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 4);
  }, [transactions]);

  const velocity = useMemo(() => {
    const categories: Record<string, number> = {};
    // Calculate spend per category in the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    transactions
      .filter(t => t.type === 'expense' && new Date(t.date) > sevenDaysAgo)
      .forEach(t => {
        categories[t.category] = (categories[t.category] || 0) + t.amount;
      });

    const sorted = Object.entries(categories)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4);
    
    const max = sorted[0]?.[1] || 1;
    return sorted.map(([name, amount]) => ({
      name,
      amount,
      percentage: (amount / max) * 100
    }));
  }, [transactions]);

  const getIcon = (category: string) => {
    const c = category.toLowerCase();
    if (c.includes('food') || c.includes('meal')) return <ShoppingCart className="w-5 h-5" />;
    if (c.includes('infra') || c.includes('cloud')) return <Cloud className="w-5 h-5" />;
    if (c.includes('travel')) return <Plane className="w-5 h-5" />;
    return <CreditCard className="w-5 h-5" />;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
      {/* Left: Live Transaction Feed (60%) */}
      <div className="lg:col-span-3 rounded-2xl bg-surface-container-lowest p-6 shadow-sm border border-outline-variant/10 flex flex-col h-[400px]">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-sm font-semibold text-on-surface font-headline uppercase tracking-tight">Live Transaction Feed</h3>
          <div className="flex gap-2">
            <span className="px-2 py-1 rounded-md bg-surface-container-low text-[10px] font-medium text-on-surface-variant border border-outline-variant/20">Auto-scroll</span>
            <button className="text-outline hover:text-on-surface"><Filter className="w-4 h-4" /></button>
          </div>
        </div>
        <div className="flex-1 overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-8 bg-gradient-to-b from-white to-transparent z-10 pointer-events-none"></div>
          <div className="space-y-4 pt-2">
            {feed.map((t, i) => (
              <div key={t.id} className={cn(
                "flex items-center justify-between p-3 rounded-xl transition-colors",
                i === 0 ? "bg-surface-container-low border border-outline-variant/20" : "hover:bg-surface-container-low/50"
              )}>
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center",
                    t.type === 'income' ? "bg-primary-container/10 text-primary-container" : "bg-surface-container-highest text-on-surface-variant"
                  )}>
                    {getIcon(t.category)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-on-surface">{t.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] font-medium text-outline">
                        {new Date(t.date).toLocaleDateString()}
                      </span>
                      <span className="w-1 h-1 rounded-full bg-outline-variant"></span>
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-surface-container text-on-surface-variant">{t.category}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className={cn(
                    "text-sm font-bold",
                    t.type === 'income' ? "text-primary-container" : "text-secondary-container"
                  )}>
                    {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount, currency)}
                  </p>
                  <p className="text-[10px] text-outline">{t.vendor || 'Personal'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right: Category Velocity (40%) */}
      <div className="lg:col-span-2 rounded-2xl bg-surface-container p-6 shadow-sm flex flex-col h-[400px] border border-outline-variant/5">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-sm font-semibold text-on-surface font-headline uppercase tracking-tight">Category Velocity</h3>
          <span className="text-[10px] uppercase font-bold text-outline tracking-wider">Top Moving</span>
        </div>
        <div className="flex-1 flex flex-col gap-5 justify-center">
          {velocity.map((v, i) => (
            <div key={v.name} className="relative w-full">
              <div className="flex justify-between text-xs mb-1.5">
                <span className="font-medium text-on-surface">{v.name}</span>
                <span className="font-bold text-secondary-container">{formatCurrency(v.amount, currency)}</span>
              </div>
              <div className="w-full bg-surface-container-high rounded-full h-2.5 overflow-hidden">
                <div 
                  className={cn(
                    "h-full rounded-full transition-all duration-1000 ease-out",
                    i === 0 ? "bg-secondary-container" : i === 1 ? "bg-tertiary-container" : "bg-outline"
                  )} 
                  style={{ width: `${v.percentage}%` }}
                ></div>
              </div>
            </div>
          ))}
          {velocity.length === 0 && (
             <div className="text-center py-8 text-outline text-sm italic">No recent velocity data</div>
          )}
        </div>
      </div>
    </div>
  );
}
