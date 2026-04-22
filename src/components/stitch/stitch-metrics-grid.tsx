"use client";

import { useMemo } from "react";
import { formatCurrency } from "@/lib/data";
import { useCurrency } from "@/context/currency-context";
import { Info } from "lucide-react";
import type { Transaction } from "@/types";

interface StitchMetricsGridProps {
  transactions: Transaction[];
}

export function StitchMetricsGrid({ transactions }: StitchMetricsGridProps) {
  const { currency } = useCurrency();

  const metrics = useMemo(() => {
    const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    
    // Burn Rate (daily average)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentExpenses = transactions.filter(t => t.type === 'expense' && new Date(t.date) > thirtyDaysAgo);
    const burnRate = recentExpenses.reduce((sum, t) => sum + t.amount, 0) / 30;

    // I/E Ratio
    const ieRatio = totalExpense > 0 ? (totalIncome / totalExpense) : totalIncome > 0 ? 100 : 0;
    
    // Runway (simplified: total income - total expense / daily burn)
    // In a real app we'd look at bank balance. Let's assume current net as "runway starter"
    const netPosition = totalIncome - totalExpense;
    const runwayMonths = burnRate > 0 ? Math.max(0, (netPosition / (burnRate * 30))) : 12;

    return { burnRate, ieRatio, runwayMonths };
  }, [transactions]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Burn Rate Speedometer */}
      <div className="rounded-2xl bg-surface-container-lowest p-6 shadow-sm border border-outline-variant/10 relative overflow-hidden">
        <h3 className="text-xs font-semibold text-on-surface-variant font-label uppercase tracking-widest mb-4">Burn Rate</h3>
        <div className="flex flex-col items-center justify-center py-4">
          <div className="relative w-32 h-16 overflow-hidden mb-2">
            <div className="absolute w-32 h-32 rounded-full border-[12px] border-surface-container-low border-b-transparent border-r-transparent rotate-45"></div>
            {/* Active segment */}
            <div 
              className="absolute w-32 h-32 rounded-full border-[12px] border-secondary-container border-b-transparent border-r-transparent rotate-45 opacity-80" 
              style={{ clipPath: 'polygon(0 0, 50% 0, 50% 50%, 0 50%)' }}
            ></div>
            {/* Needle */}
            <div className="absolute bottom-0 left-1/2 w-1 h-14 bg-on-surface rounded-full origin-bottom -translate-x-1/2 -rotate-[30deg] shadow-sm transition-transform duration-1000"></div>
            <div className="absolute bottom-0 left-1/2 w-3 h-3 bg-on-surface rounded-full -translate-x-1/2 translate-y-1/2"></div>
          </div>
          <div className="text-center mt-2">
            <p className="text-2xl font-bold font-headline text-on-surface">
              {formatCurrency(metrics.burnRate, currency)}<span className="text-sm font-medium text-outline">/day</span>
            </p>
            <p className="text-[10px] text-secondary-container font-medium mt-1">High Velocity</p>
          </div>
        </div>
      </div>

      {/* I/E Ratio Donut */}
      <div className="rounded-2xl bg-surface-container-lowest p-6 shadow-sm border border-outline-variant/10 relative overflow-hidden">
        <h3 className="text-xs font-semibold text-on-surface-variant font-label uppercase tracking-widest mb-4">I/E Ratio</h3>
        <div className="flex items-center justify-center py-2 h-full">
          <div className="relative w-28 h-28 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" fill="transparent" r="15.91549430918954" stroke="hsl(var(--surface-container-low))" strokeWidth="4"></circle>
              {/* Income Arc (Emerald) */}
              <circle 
                cx="18" cy="18" fill="transparent" r="15.91549430918954" 
                stroke="hsl(var(--primary-container))" 
                strokeDasharray={`${Math.min(100, (metrics.ieRatio / (metrics.ieRatio + 1)) * 100)} ${100 - Math.min(100, (metrics.ieRatio / (metrics.ieRatio + 1)) * 100)}`} 
                strokeDashoffset="0" 
                strokeWidth="4"
              ></circle>
            </svg>
            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className="text-2xl font-bold font-headline text-on-surface">{metrics.ieRatio.toFixed(1)}<span className="text-lg text-outline">:1</span></span>
              <span className="text-[10px] font-medium text-primary-container">Healthy</span>
            </div>
          </div>
        </div>
      </div>

      {/* Runway Forecast */}
      <div className="rounded-2xl bg-surface-container-lowest p-6 shadow-sm border border-outline-variant/10 relative overflow-hidden flex flex-col">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-xs font-semibold text-on-surface-variant font-label uppercase tracking-widest">Runway Forecast</h3>
          <Info className="w-4 h-4 text-outline" />
        </div>
        <div className="mt-1 mb-4">
          <p className="text-3xl font-bold font-headline text-on-surface">{metrics.runwayMonths.toFixed(0)} <span className="text-lg font-medium text-outline">mos</span></p>
        </div>
        <div className="flex-1 relative w-full h-16 mt-auto">
          <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 200 50">
            <path d="M100 25 L 150 15 L 200 5 L 200 45 L 150 35 L 100 25 Z" fill="hsl(var(--surface-container-highest))" opacity="0.4"></path>
            <path d="M0 45 L 50 35 L 100 25" fill="none" stroke="hsl(var(--on-surface))" strokeWidth="2"></path>
            <path d="M100 25 L 150 20 L 200 15" fill="none" stroke="hsl(var(--outline))" strokeDasharray="4 4" strokeWidth="2"></path>
            <circle cx="100" cy="25" fill="hsl(var(--primary-container))" r="3"></circle>
          </svg>
          <div className="absolute bottom-0 w-full flex justify-between text-[9px] text-outline font-medium mt-1 px-1">
            <span>Past</span>
            <span>Today</span>
            <span>Future</span>
          </div>
        </div>
      </div>
    </div>
  );
}
