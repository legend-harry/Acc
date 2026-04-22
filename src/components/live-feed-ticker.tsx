import React from 'react';
import { useTransactions } from '@/hooks/use-database';
import { formatCurrency } from '@/lib/data';
import { useCurrency } from '@/context/currency-context';

export function timeAgo(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return `${Math.max(1, seconds)} sec ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.floor(hours / 24);
  return `${days} days ago`;
}

export function LiveFeedTicker() {
  const { transactions, isLoading } = useTransactions();
  const { currency } = useCurrency();

  if (isLoading || !transactions || transactions.length === 0) {
    return null; // or a skeleton
  }

  // Get the 10 most recent transactions
  const recentTx = [...transactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10);

  const TickerContent = () => (
    <div className="flex items-center whitespace-nowrap gap-8 pr-8">
      <div className="flex items-center gap-2 font-bold text-on-surface tracking-wider text-xs">
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
        </span>
        LIVE FEED
      </div>
      
      {recentTx.map((tx) => {
        const isIncome = tx.type === 'income';
        const colorClass = isIncome ? 'text-primary' : 'text-secondary';
        const dotClass = isIncome ? 'bg-primary' : 'bg-secondary';

        return (
          <div key={tx.id} className="flex items-center gap-2 text-sm font-medium">
            <span className={`w-1.5 h-1.5 rounded-full ${dotClass}`} />
            <span className="text-on-surface-variant font-semibold">
              {tx.title || tx.category || (isIncome ? 'Income' : 'Expense')}
            </span>
            <span className={`${colorClass} font-bold font-headline`}>
              {formatCurrency(tx.amount, currency)}
            </span>
            <span className="text-outline text-xs">&mdash; {timeAgo(tx.date)}</span>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="w-full bg-surface-container-low/50 border-y border-outline-variant/10 overflow-hidden py-2 relative flex items-center">
      {/* 
        To make an infinite seamless marquee, we render the content twice.
        The container must have flex, and the children animate.
        Often Tailwind marquees use group hover to pause.
      */}
      <div className="flex animate-marquee hover:[animation-play-state:paused]">
        <TickerContent />
        <TickerContent />
        <TickerContent />
      </div>
      
      {/* Fading edges */}
      <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-surface to-transparent pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-surface to-transparent pointer-events-none" />
    </div>
  );
}
