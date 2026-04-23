"use client";

import { useMemo, useState } from "react";
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { formatCurrency } from "@/lib/data";
import { useCurrency } from "@/context/currency-context";
import { TrendingUp, Move } from "lucide-react";
import type { Transaction } from "@/types";
import { format } from "date-fns";

interface StitchLiveCashPositionProps {
  transactions?: Transaction[];
}

export function StitchLiveCashPosition({ transactions }: StitchLiveCashPositionProps) {
  const { currency } = useCurrency();
  const [selectedWindow, setSelectedWindow] = useState<"all" | "1w" | "1m" | "1y">("all");

  const { chartData, currentBalance, growthPercentage } = useMemo(() => {
    const safeTransactions = Array.isArray(transactions) ? transactions : [];
    const resolvedTransactions = [...safeTransactions]
      .map((transaction) => {
        const timestamp = new Date(transaction.created_at || transaction.date).getTime();
        return { ...transaction, timestamp };
      })
      .filter((transaction) => !Number.isNaN(transaction.timestamp))
      .sort((a, b) => a.timestamp - b.timestamp);

    const latestTimestamp = resolvedTransactions.length > 0
      ? resolvedTransactions[resolvedTransactions.length - 1].timestamp
      : Date.now();
    const windowMs: Record<"1w" | "1m" | "1y", number> = {
      "1w": 7 * 24 * 60 * 60 * 1000,
      "1m": 30 * 24 * 60 * 60 * 1000,
      "1y": 365 * 24 * 60 * 60 * 1000,
    };
    const visibleTransactions = selectedWindow === "all"
      ? resolvedTransactions
      : resolvedTransactions.filter((transaction) => transaction.timestamp >= latestTimestamp - windowMs[selectedWindow]);
    
    let cumulative = 0;
    const chartData = visibleTransactions.map((t) => {
      cumulative += t.type === 'income' ? t.amount : -t.amount;
      return {
        time: format(
          new Date(t.timestamp),
          selectedWindow === "1w" ? "EEE, h:mm a" : selectedWindow === "1m" ? "MMM d" : "MMM yyyy"
        ),
        value: cumulative,
        income: t.type === 'income' ? t.amount : 0,
        expense: t.type === 'expense' ? t.amount : 0,
      };
    });

    const currentBalance = cumulative;
    const prevBalance = chartData.length > 1 ? chartData[chartData.length - 2].value : 0;
    const growthPercentage = prevBalance !== 0 ? ((currentBalance - prevBalance) / Math.abs(prevBalance)) * 100 : 0;

    return { chartData, currentBalance, growthPercentage };
  }, [transactions, selectedWindow]);

  return (
    <section className="w-full rounded-2xl bg-surface-container-lowest/40 backdrop-blur-[20px] shadow-[0_8px_32px_0_rgba(25,28,32,0.06)] border border-outline-variant/15 relative overflow-hidden flex flex-col p-6">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-sm font-semibold text-on-surface-variant font-label uppercase tracking-widest mb-1">Live Cash Position</h3>
          <div className="flex items-baseline gap-3">
            <h2 className="text-5xl font-extrabold font-headline text-on-surface tracking-tight">
              {formatCurrency(currentBalance, currency)}
            </h2>
            <span className="text-sm font-medium text-primary-container flex items-center bg-primary-container/10 px-2 py-0.5 rounded-md">
              <TrendingUp className="w-4 h-4 mr-1" />
              {growthPercentage > 0 ? "+" : ""}{growthPercentage.toFixed(1)}%
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex bg-surface-container-low rounded-lg p-1">
            {[
              { value: "all", label: "All" },
              { value: "1w", label: "1W" },
              { value: "1m", label: "1M" },
              { value: "1y", label: "1Y" },
            ].map((windowOption) => (
              <button
                key={windowOption.value}
                type="button"
                onClick={() => setSelectedWindow(windowOption.value as "all" | "1w" | "1m" | "1y")}
                className={
                  windowOption.value === selectedWindow
                    ? "px-3 py-1.5 text-xs font-semibold rounded-md bg-surface-container-lowest shadow-sm text-on-surface"
                    : "px-3 py-1.5 text-xs font-medium rounded-md text-on-surface-variant hover:text-on-surface"
                }
              >
                {windowOption.label}
              </button>
            ))}
          </div>
          <button className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high transition-colors">
            <Move className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="w-full h-[320px] relative mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(var(--outline-variant))" opacity={0.1} />
            <XAxis 
              dataKey="time" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 10, fill: 'hsl(var(--outline))' }} 
              dy={10}
              minTickGap={28}
            />
            <YAxis hide domain={['auto', 'auto']} />
            <Tooltip 
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="p-3 rounded-xl bg-surface-container-lowest/85 backdrop-blur-[12px] shadow-[0_8px_32px_0_rgba(25,28,32,0.06)] border border-outline-variant/15 z-30">
                      <p className="text-[10px] font-semibold text-outline uppercase tracking-wider mb-2">{payload[0].payload.time}</p>
                      <div className="space-y-1.5 text-xs">
                        <div className="flex justify-between items-center gap-4">
                          <span className="text-on-surface-variant">Income</span>
                          <span className="font-medium text-primary-container">+{formatCurrency(payload[0].payload.income, currency)}</span>
                        </div>
                        <div className="flex justify-between items-center gap-4">
                          <span className="text-on-surface-variant">Expense</span>
                          <span className="font-medium text-secondary-container">-{formatCurrency(payload[0].payload.expense, currency)}</span>
                        </div>
                        <div className="w-full border-t border-outline-variant/20 my-1"></div>
                        <div className="flex justify-between items-center font-bold">
                          <span className="text-on-surface">Net Position</span>
                          <span className="text-primary">{formatCurrency(payload[0].value as number, currency)}</span>
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area 
              type="monotone" 
              dataKey="value" 
              stroke="hsl(var(--primary))" 
              strokeWidth={4} 
              fillOpacity={1} 
              fill="url(#colorNet)" 
              animationDuration={1500}
            />
          </AreaChart>
        </ResponsiveContainer>
        
        {/* Pulse Indicator at current value (simulated on right edge) */}
        <div className="absolute right-0 top-[40px] w-4 h-4 translate-x-1/2 rounded-full bg-surface-container-lowest border-2 border-primary shadow-[0_0_15px_rgba(16,185,129,0.8)] z-20">
          <div className="absolute inset-0 rounded-full bg-primary-container opacity-50 animate-pulse-ring"></div>
        </div>
      </div>
    </section>
  );
}
