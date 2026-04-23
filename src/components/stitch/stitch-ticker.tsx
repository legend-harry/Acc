"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import type { Transaction } from "@/types";
import { formatCurrency } from "@/lib/data";
import { useCurrency } from "@/context/currency-context";
import { timeAgo } from "@/components/live-feed-ticker";

interface StitchTickerProps {
  transactions?: Transaction[];
}

export function StitchTicker({ transactions }: StitchTickerProps) {
  const { currency } = useCurrency();

  const recentTransactions = useMemo(() => {
    const safeTransactions = Array.isArray(transactions) ? transactions : [];
    return [...safeTransactions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10);
  }, [transactions]);

  if (recentTransactions.length === 0) return null;

  const TickerContent = () => (
    <div className="flex items-center whitespace-nowrap gap-8 pr-8">
      <div className="flex items-center gap-2 font-bold text-on-surface tracking-wider text-xs uppercase">
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
        </span>
        LIVE FEED
      </div>

      {recentTransactions.map((t) => {
        const isIncome = t.type === "income";
        return (
          <div key={t.id} className="flex items-center gap-2 text-sm font-medium">
            <span
              className={cn(
                "w-1.5 h-1.5 rounded-full",
                isIncome ? "bg-primary" : "bg-secondary"
              )}
            />
            <span className="text-on-surface-variant font-semibold">
              {t.title || t.category || (isIncome ? "Income" : "Expense")}
            </span>
            <span className={cn("font-bold font-headline", isIncome ? "text-primary" : "text-secondary")}>
              {formatCurrency(t.amount, currency)}
            </span>
            <span className="text-outline text-xs">&mdash; {timeAgo(String(t.date))}</span>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="w-full bg-surface-container-low/50 border-y border-outline-variant/10 overflow-hidden py-2 relative flex items-center">
      <div className="flex animate-marquee hover:[animation-play-state:paused]">
        <TickerContent />
        <TickerContent />
        <TickerContent />
      </div>

      <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-surface to-transparent pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-surface to-transparent pointer-events-none" />
    </div>
  );
}
