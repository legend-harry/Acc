"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import type { Transaction } from "@/types";
import { formatCurrency } from "@/lib/data";
import { useCurrency } from "@/context/currency-context";

interface StitchTickerProps {
  transactions: Transaction[];
}

export function StitchTicker({ transactions }: StitchTickerProps) {
  const { currency } = useCurrency();

  const recentTransactions = useMemo(() => {
    return [...transactions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [transactions]);

  if (recentTransactions.length === 0) return null;

  return (
    <div className="w-full h-10 bg-surface-container-lowest/85 backdrop-blur-[12px] flex items-center overflow-hidden border-b border-outline-variant/15 relative z-30">
      <div className="px-4 py-1 bg-surface-container-low border-r border-outline-variant/15 flex items-center gap-2 z-10 shrink-0 h-full">
        <div className="relative w-2 h-2 rounded-full bg-primary-container animate-pulse-ring"></div>
        <span className="text-xs font-semibold text-on-surface tracking-wide uppercase font-label">Live Feed</span>
      </div>
      <div className="flex-1 overflow-hidden relative h-full flex items-center whitespace-nowrap">
        <div className="inline-flex gap-8 animate-marquee pl-8">
          {/* Duplicate items for seamless loop */}
          {[...recentTransactions, ...recentTransactions].map((t, i) => (
            <div key={`${t.id}-${i}`} className="flex items-center gap-2 text-sm text-on-surface-variant">
              <span className={cn(
                "w-1.5 h-1.5 rounded-full",
                t.type === 'income' ? "bg-primary-container" : "bg-secondary-container"
              )}></span>
              <span className="font-medium">{t.title}</span>
              <span className="font-bold text-on-surface">
                {formatCurrency(t.amount, currency)}
              </span>
              <span className="text-xs text-outline">— {new Date(t.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
