"use client";

import { useMemo } from "react";
import { Landmark, PiggyBank, ShoppingCart, Wallet, CircleCheck } from "lucide-react";

type Tx = {
  amount: number;
  type: "income" | "expense";
  date: Date | string;
};

function toMonthKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth()}`;
}

function formatInr(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

function percentChange(current: number, previous: number) {
  if (previous === 0) return current === 0 ? 0 : 100;
  return ((current - previous) / Math.abs(previous)) * 100;
}

function clamp(value: number, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value));
}

export function FinancialSummaryCards({ transactions = [] }: { transactions?: Tx[] }) {
  const safeTransactions = Array.isArray(transactions) ? transactions : [];

  const metrics = useMemo(() => {
    const income = safeTransactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    const expense = safeTransactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    const net = income - expense;
    const savingsRate = income > 0 ? (net / income) * 100 : 0;

    const now = new Date();
    const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const currentKey = toMonthKey(now);
    const previousKey = toMonthKey(prev);

    let currentIncome = 0;
    let previousIncome = 0;
    let currentExpense = 0;
    let previousExpense = 0;

    for (const t of safeTransactions) {
      const d = new Date(t.date);
      if (Number.isNaN(d.getTime())) continue;
      const key = toMonthKey(d);
      const amount = Number(t.amount) || 0;
      if (t.type === "income") {
        if (key === currentKey) currentIncome += amount;
        if (key === previousKey) previousIncome += amount;
      } else {
        if (key === currentKey) currentExpense += amount;
        if (key === previousKey) previousExpense += amount;
      }
    }

    const currentNet = currentIncome - currentExpense;
    const previousNet = previousIncome - previousExpense;

    const incomeChange = percentChange(currentIncome, previousIncome);
    const expenseChange = percentChange(currentExpense, previousExpense);
    const netChange = percentChange(currentNet, previousNet);

    const totalFlow = income + expense;
    const incomeBar = totalFlow > 0 ? clamp((income / totalFlow) * 100) : 0;
    const expenseBar = totalFlow > 0 ? clamp((expense / totalFlow) * 100) : 0;
    const netBar = income > 0 ? clamp((Math.max(net, 0) / income) * 100) : 0;
    const savingsBar = clamp(savingsRate);

    return {
      income,
      expense,
      net,
      savingsRate,
      incomeChange,
      expenseChange,
      netChange,
      incomeBar,
      expenseBar,
      netBar,
      savingsBar,
    };
  }, [safeTransactions]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      <article className="rounded-2xl bg-surface-container-lowest border border-outline-variant/20 p-5 shadow-[0_8px_24px_rgba(25,28,32,0.04)]">
        <div className="flex items-start justify-between">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
            <Wallet className="w-6 h-6 text-emerald-700" />
          </div>
          <p className="text-emerald-700 font-bold text-xl leading-none">↗ {metrics.incomeChange >= 0 ? "+" : ""}{metrics.incomeChange.toFixed(1)}%</p>
        </div>
        <p className="mt-5 text-sm uppercase tracking-[0.08em] text-on-surface-variant font-extrabold">Total Income</p>
        <p className="mt-2 text-4xl font-extrabold text-on-surface tracking-tight">{formatInr(metrics.income)}</p>
        <div className="mt-6 h-3 rounded-full bg-emerald-100 overflow-hidden">
          <div className="h-full rounded-full bg-emerald-700" style={{ width: `${metrics.incomeBar}%` }} />
        </div>
      </article>

      <article className="rounded-2xl bg-surface-container-lowest border border-outline-variant/20 p-5 shadow-[0_8px_24px_rgba(25,28,32,0.04)]">
        <div className="flex items-start justify-between">
          <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
            <ShoppingCart className="w-6 h-6 text-red-700" />
          </div>
          <p className="text-red-700 font-bold text-xl leading-none">↗ {metrics.expenseChange >= 0 ? "+" : ""}{metrics.expenseChange.toFixed(1)}%</p>
        </div>
        <p className="mt-5 text-sm uppercase tracking-[0.08em] text-on-surface-variant font-extrabold">Total Expenses</p>
        <p className="mt-2 text-4xl font-extrabold text-on-surface tracking-tight">{formatInr(metrics.expense)}</p>
        <div className="mt-6 h-3 rounded-full bg-red-100 overflow-hidden">
          <div className="h-full rounded-full bg-red-700" style={{ width: `${metrics.expenseBar}%` }} />
        </div>
      </article>

      <article className="rounded-2xl bg-surface-container-lowest border border-outline-variant/20 p-5 shadow-[0_8px_24px_rgba(25,28,32,0.04)]">
        <div className="flex items-start justify-between">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
            <PiggyBank className="w-6 h-6 text-emerald-700" />
          </div>
          <p className="text-emerald-700 font-bold text-xl leading-none">↗ {metrics.netChange >= 0 ? "+" : ""}{metrics.netChange.toFixed(1)}%</p>
        </div>
        <p className="mt-5 text-sm uppercase tracking-[0.08em] text-on-surface-variant font-extrabold">Net Profit</p>
        <p className="mt-2 text-4xl font-extrabold text-on-surface tracking-tight">{formatInr(metrics.net)}</p>
        <div className="mt-6 h-3 rounded-full bg-emerald-100 overflow-hidden">
          <div className="h-full rounded-full bg-emerald-500" style={{ width: `${metrics.netBar}%` }} />
        </div>
      </article>

      <article className="rounded-2xl bg-surface-container-lowest border border-outline-variant/20 p-5 shadow-[0_8px_24px_rgba(25,28,32,0.04)]">
        <div className="flex items-start justify-between">
          <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
            <Landmark className="w-6 h-6 text-blue-700" />
          </div>
          <p className="text-emerald-700 font-bold text-xl leading-none flex items-center gap-2">
            <CircleCheck className="w-5 h-5" />
            {metrics.savingsRate >= 30 ? "Target" : "Below"}
          </p>
        </div>
        <p className="mt-5 text-sm uppercase tracking-[0.08em] text-on-surface-variant font-extrabold">Savings Rate</p>
        <p className="mt-2 text-4xl font-extrabold text-on-surface tracking-tight">{metrics.savingsRate.toFixed(1)}%</p>
        <div className="mt-6 h-3 rounded-full bg-blue-100 overflow-hidden">
          <div className="h-full rounded-full bg-blue-500" style={{ width: `${metrics.savingsBar}%` }} />
        </div>
      </article>
    </div>
  );
}
