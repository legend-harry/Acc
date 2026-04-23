"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/data";
import { useCurrency } from "@/context/currency-context";
import type { Transaction, BudgetSummary } from "@/types";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  PieChart,
  Pie,
  Cell,
} from "recharts";

// ─── Shared palette for category tiles ────────────────────────────────────────
const TILE_COLORS_DARK = [
  "bg-[#0a5232]",
  "bg-[#168a53]",
  "bg-[#1eb570]",
  "bg-[#5ce198]",
  "bg-[#7bf5af]",
];
const TILE_TEXT_DARK = ["text-white", "text-white", "text-white", "text-[#0a5232]", "text-[#0a5232]"];
const TILE_SUBTEXT_DARK = [
  "text-white/80",
  "text-white/80",
  "text-white/80",
  "text-[#0a5232]/80",
  "text-[#0a5232]/80",
];

const DONUT_COLORS = ["#0a5232", "#168a53", "#1eb570", "#5ce198", "#d93826", "#f59e0b"];
const BAR_COLORS   = ["#1eb570", "#d93826", "#0a5232", "#f59e0b", "#5c82e1"];

const DAY_MS = 24 * 60 * 60 * 1000;

function startOfDay(date: Date) {
  const nextDate = new Date(date);
  nextDate.setHours(0, 0, 0, 0);
  return nextDate;
}

function startOfWeek(date: Date) {
  const nextDate = startOfDay(date);
  const dayIndex = (nextDate.getDay() + 6) % 7;
  nextDate.setDate(nextDate.getDate() - dayIndex);
  return nextDate;
}

function startOfMonth(date: Date) {
  const nextDate = startOfDay(date);
  nextDate.setDate(1);
  return nextDate;
}

function formatShortDate(date: Date) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date);
}

function formatShortMonth(date: Date) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', year: '2-digit' }).format(date);
}

function getGranularity(spanDays: number) {
  if (spanDays > 90) {
    return 'month';
  }

  if (spanDays > 30) {
    return 'week';
  }

  return 'day';
}

interface WidgetProps {
  transactions: Transaction[];
}

interface BudgetWidgetProps {
  transactions: Transaction[];
  budgets: BudgetSummary[];
}

// ╔══════════════════════════════════════════════════════════════╗
//  1. Category Deep Dive  — top 5 expense categories as tiles
// ╚══════════════════════════════════════════════════════════════╝
export function CategoryDeepDive({ transactions }: WidgetProps) {
  const { currency } = useCurrency();

  const topCategories = useMemo(() => {
    const map: Record<string, number> = {};
    transactions.forEach((t) => {
      if (t.type === "expense") {
        const cat = t.category || "Uncategorized";
        map[cat] = (map[cat] ?? 0) + t.amount;
      }
    });
    return Object.entries(map)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, total]) => ({ name, total }));
  }, [transactions]);

  if (topCategories.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <h3 className="font-bold text-on-surface font-headline text-lg">Category Deep Dive</h3>
        <div className="flex items-center justify-center h-48 rounded-2xl bg-surface-container-low border border-dashed border-outline-variant/30 text-outline-variant text-sm italic">
          No expense data yet
        </div>
      </div>
    );
  }

  const [first, ...rest] = topCategories;

  return (
    <div className="flex flex-col gap-4">
      <h3 className="font-bold text-on-surface font-headline text-lg">Category Deep Dive</h3>

      {/* Top row — large hero tile + up-to-2 small tiles */}
      <div
        className={cn(
          "grid gap-3",
          rest.length >= 2 ? "grid-cols-3 grid-rows-2" : "grid-cols-1",
        )}
        style={{ height: topCategories.length >= 3 ? "16rem" : "10rem" }}
      >
        {/* Hero tile */}
        <div
          className={cn(
            "rounded-2xl p-5 flex flex-col justify-end relative overflow-hidden cursor-pointer hover:opacity-95 transition-opacity border-0",
            topCategories.length >= 3 ? "col-span-2 row-span-2" : "col-span-1 row-span-1",
            TILE_COLORS_DARK[0],
          )}
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-8 translate-x-8 blur-2xl" />
          <h4 className={cn("font-bold text-lg", TILE_TEXT_DARK[0])}>{first.name}</h4>
          <p className={cn("font-medium text-sm", TILE_SUBTEXT_DARK[0])}>
            {formatCurrency(first.total, currency)}
          </p>
        </div>

        {/* Secondary tiles */}
        {rest.slice(0, 2).map((cat, i) => (
          <div
            key={cat.name}
            className={cn(
              "rounded-2xl p-4 flex flex-col justify-end cursor-pointer hover:opacity-95 transition-opacity col-span-1 row-span-1",
              TILE_COLORS_DARK[i + 1],
            )}
          >
            <h4 className={cn("font-bold text-sm", TILE_TEXT_DARK[i + 1])}>{cat.name}</h4>
            <p className={cn("font-medium text-xs", TILE_SUBTEXT_DARK[i + 1])}>
              {formatCurrency(cat.total, currency)}
            </p>
          </div>
        ))}
      </div>

      {/* Bottom row — remaining tiles */}
      {rest.length >= 3 && (
        <div
          className="grid gap-3 h-28"
          style={{ gridTemplateColumns: `repeat(${Math.min(rest.length - 2, 3)}, 1fr)` }}
        >
          {rest.slice(2, 5).map((cat, i) => (
            <div
              key={cat.name}
              className={cn(
                "rounded-2xl p-4 flex flex-col justify-end cursor-pointer hover:opacity-95 transition-opacity",
                TILE_COLORS_DARK[i + 3],
              )}
            >
              <h4 className={cn("font-bold text-sm", TILE_TEXT_DARK[i + 3])}>{cat.name}</h4>
              <p className={cn("font-medium text-xs", TILE_SUBTEXT_DARK[i + 3])}>
                {formatCurrency(cat.total, currency)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ╔══════════════════════════════════════════════════════════════╗
//  2. Top Vendors  — aggregated spend per vendor, top 5
// ╚══════════════════════════════════════════════════════════════╝
export function TopVendors({ transactions }: WidgetProps) {
  const { currency } = useCurrency();

  const vendors = useMemo(() => {
    const map: Record<string, number> = {};
    transactions.forEach((t) => {
      if (t.type === "expense") {
        const v = t.vendor?.trim() || "Unknown Vendor";
        map[v] = (map[v] ?? 0) + t.amount;
      }
    });
    const sorted = Object.entries(map)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, spend]) => ({ name, spend }));

    const max = sorted[0]?.spend ?? 1;
    return sorted.map((v) => ({ ...v, max }));
  }, [transactions]);

  if (vendors.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        <h3 className="font-bold text-on-surface font-headline text-lg">Top Vendors</h3>
        <div className="flex items-center justify-center h-32 rounded-2xl bg-surface-container-low border border-dashed border-outline-variant/30 text-outline-variant text-sm italic">
          No vendor data yet
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <h3 className="font-bold text-on-surface font-headline text-lg">Top Vendors</h3>
      <div className="flex flex-col gap-5">
        {vendors.map((v, idx) => (
          <div key={v.name} className="flex flex-col gap-2">
            <div className="flex justify-between items-end">
              <span className="text-sm font-semibold text-on-surface truncate max-w-[60%]">{v.name}</span>
              <span className="text-sm font-bold text-on-surface">{formatCurrency(v.spend, currency)}</span>
            </div>
            <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${(v.spend / v.max) * 100}%`,
                  background: `linear-gradient(90deg, #0a5232, ${BAR_COLORS[idx % BAR_COLORS.length]})`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ╔══════════════════════════════════════════════════════════════╗
//  3. New Budget Intelligence  — budgets vs actual spend
// ╚══════════════════════════════════════════════════════════════╝
const BUDGET_STROKES = ["#1eb570", "#d93826", "#f59e0b", "#5c82e1", "#a855f7", "#06b6d4"];

export function NewBudgetIntelligence({ transactions, budgets }: BudgetWidgetProps) {
  const { currency } = useCurrency();

  const budgetItems = useMemo(() => {
    // Pre-index expenses by lower-cased trimmed category for robust matching
    const expenseByCategory: Record<string, number> = {};
    transactions.forEach((t) => {
      if (t.type === "expense") {
        const key = (t.category ?? "").trim().toLowerCase();
        expenseByCategory[key] = (expenseByCategory[key] ?? 0) + t.amount;
      }
    });

    const budgetedCategories = new Set<string>();
    const items = budgets
      .map((b, idx) => {
      const key = (b.category ?? "").trim().toLowerCase();
      const spent = expenseByCategory[key] ?? 0;
      const limit = b.budget ?? 0;
      const hasLimit = limit > 0;
      budgetedCategories.add(key);
      // When no limit, show how much was spent relative to itself (ring always full if spent > 0)
      const pct = hasLimit ? Math.min(150, (spent / limit) * 100) : (spent > 0 ? 100 : 0);
      const over = hasLimit && spent > limit;
      return { name: b.category, spent, limit, pct, over, hasLimit, stroke: BUDGET_STROKES[idx % BUDGET_STROKES.length] };
      })
      .filter((item) => item.hasLimit || item.spent > 0);

    const transactionOnlyItems = Object.entries(expenseByCategory)
      .filter(([categoryKey, spent]) => spent > 0 && categoryKey && !budgetedCategories.has(categoryKey))
      .map(([categoryKey, spent], idx) => ({
        name: categoryKey.replace(/\b\w/g, (match) => match.toUpperCase()),
        spent,
        limit: 0,
        pct: 100,
        over: false,
        hasLimit: false,
        stroke: BUDGET_STROKES[(items.length + idx) % BUDGET_STROKES.length],
      }));

    return [...items, ...transactionOnlyItems];
  }, [transactions, budgets]);

  if (budgetItems.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        <h3 className="font-bold text-on-surface font-headline text-lg">Budget Intelligence</h3>
        <div className="flex items-center justify-center h-32 rounded-2xl bg-surface-container-low border border-dashed border-outline-variant/30 text-outline-variant text-sm italic">
          No budgets configured
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <h3 className="font-bold text-on-surface font-headline text-lg">Budget Intelligence</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {budgetItems.map((b) => (
          <div
            key={b.name}
            className={cn(
              "bg-card rounded-2xl p-5 flex flex-col items-start border shadow-sm",
              b.over ? "border-red-100 bg-red-50/10 dark:border-red-900/30 dark:bg-red-900/10" : "border-outline-variant/10",
            )}
          >
            <span className={cn("text-xs font-semibold mb-4 truncate w-full leading-tight", b.over ? "text-red-600" : "text-on-surface")}>
              {b.name}
            </span>
            <div className="relative w-24 h-24 self-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" fill="none" className="stroke-muted" strokeWidth="12" />
                <circle
                  cx="50" cy="50" r="42"
                  fill="none"
                  stroke={b.over ? "#d93826" : !b.hasLimit && b.spent > 0 ? "#f59e0b" : b.stroke}
                  strokeWidth="12"
                  strokeDasharray="264"
                  strokeDashoffset={264 - (Math.min(100, b.pct) / 100) * 264}
                  strokeLinecap="round"
                  className="transition-all duration-700"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-1">
                {b.hasLimit ? (
                  <>
                    <span className={cn("text-base font-bold font-headline", b.over ? "text-red-600" : "text-on-surface")}>
                      {b.pct.toFixed(0)}%
                    </span>
                    <span className="text-[9px] font-semibold text-outline-variant mt-0.5 leading-tight">
                      {formatCurrency(b.spent, currency)}<br />
                      <span className="text-outline/60">of {formatCurrency(b.limit, currency)}</span>
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-[10px] font-bold text-outline-variant leading-tight">Spent</span>
                    <span className="text-sm font-bold font-headline text-on-surface mt-0.5">
                      {formatCurrency(b.spent, currency)}
                    </span>
                    <span className="text-[8px] font-semibold text-amber-500 mt-0.5 tracking-tight">No limit set</span>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ╔══════════════════════════════════════════════════════════════╗
//  4. Cash Flow Analysis  — adaptive income vs expense area chart
// ╚══════════════════════════════════════════════════════════════╝
export function CashFlowAnalysis({ transactions }: WidgetProps) {
  const { cashFlowData, granularity } = useMemo(() => {
    const validTransactions = transactions
      .map((transaction) => ({ ...transaction, parsedDate: new Date(transaction.date) }))
      .filter((transaction) => !isNaN(transaction.parsedDate.getTime()))
      .sort((a, b) => a.parsedDate.getTime() - b.parsedDate.getTime());

    if (validTransactions.length === 0) {
      return { cashFlowData: [], granularity: 'day' as const };
    }

    const firstDate = validTransactions[0].parsedDate;
    const lastDate = validTransactions[validTransactions.length - 1].parsedDate;
    const spanDays = Math.max(0, Math.ceil((lastDate.getTime() - firstDate.getTime()) / DAY_MS));
    const granularity = getGranularity(spanDays);

    const bucketMap = new Map<string, { sortKey: number; name: string; income: number; expense: number }>();

    validTransactions.forEach((transaction) => {
      const currentDate = transaction.parsedDate;
      let bucketKey = '';
      let bucketName = '';
      let sortKey = 0;

      if (granularity === 'day') {
        const day = startOfDay(currentDate);
        bucketKey = day.toISOString().slice(0, 10);
        bucketName = formatShortDate(day);
        sortKey = day.getTime();
      } else if (granularity === 'week') {
        const weekStart = startOfWeek(currentDate);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        bucketKey = weekStart.toISOString().slice(0, 10);
        bucketName = `${formatShortDate(weekStart)} - ${formatShortDate(weekEnd)}`;
        sortKey = weekStart.getTime();
      } else {
        const monthStart = startOfMonth(currentDate);
        bucketKey = `${monthStart.getFullYear()}-${String(monthStart.getMonth() + 1).padStart(2, '0')}`;
        bucketName = formatShortMonth(monthStart);
        sortKey = monthStart.getTime();
      }

      if (!bucketMap.has(bucketKey)) {
        bucketMap.set(bucketKey, {
          sortKey,
          name: bucketName,
          income: 0,
          expense: 0,
        });
      }

      const bucket = bucketMap.get(bucketKey)!;
      if (transaction.type === 'income') {
        bucket.income += transaction.amount;
      } else {
        bucket.expense += transaction.amount;
      }
    });

    return {
      granularity,
      cashFlowData: Array.from(bucketMap.values())
      .sort((a, b) => a.sortKey - b.sortKey)
      .map(({ name, income, expense }) => ({
        name,
        income,
        expense,
      })),
    };
  }, [transactions]);

  const chartLabel = useMemo(() => {
    if (granularity === 'month') {
      return 'Monthly income vs expense trend';
    }

    if (granularity === 'week') {
      return 'Weekly income vs expense trend';
    }

    return 'Daily income vs expense trend';
  }, [granularity]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-bold text-on-surface font-headline text-lg">Cash Flow Analysis</h3>
          <p className="text-sm text-outline-variant font-medium mt-1">{chartLabel}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-[#1eb570]" />
            <span className="text-xs font-bold text-on-surface">Income</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-[#d93826]" />
            <span className="text-xs font-bold text-on-surface">Expenses</span>
          </div>
        </div>
      </div>

      <div className="h-[280px] w-full mt-4">
        {cashFlowData.length === 0 ? (
          <div className="flex items-center justify-center h-full rounded-2xl bg-surface-container-low border border-dashed border-outline-variant/30 text-outline-variant text-sm italic">
            No transactions to display
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={cashFlowData} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="cashIncome" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1eb570" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#1eb570" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="cashExpense" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#d93826" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#d93826" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: "#8b939c", fontWeight: 600 }}
                dy={10}
                interval="preserveStartEnd"
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: "#8b939c", fontWeight: 600 }}
                tickFormatter={(v: number) =>
                  v >= 100000 ? `${(v / 100000).toFixed(0)}L` :
                  v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)
                }
                width={40}
              />
              <Tooltip
                contentStyle={{ 
                  borderRadius: "16px", 
                  border: "none", 
                  boxShadow: "0 10px 40px -10px rgba(0,0,0,0.1)", 
                  padding: "16px",
                  backgroundColor: "hsl(var(--card))",
                  color: "hsl(var(--foreground))"
                }}
                labelStyle={{ color: "#8b939c", fontWeight: 600, fontSize: "11px", marginBottom: "8px" }}
                formatter={(val: number) => [val.toLocaleString(), undefined]}
              />
              <Area type="monotone" dataKey="income" stroke="#1eb570" strokeWidth={2.5} fillOpacity={1} fill="url(#cashIncome)" dot={false} />
              <Area type="monotone" dataKey="expense" stroke="#d93826" strokeWidth={2.5} fillOpacity={1} fill="url(#cashExpense)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

// ╔══════════════════════════════════════════════════════════════╗
//  5. Spending By Category  — donut chart with % breakdown
// ╚══════════════════════════════════════════════════════════════╝
export function SpendingByCategory({ transactions }: WidgetProps) {
  const { currency } = useCurrency();

  const { donutData, totalExpense } = useMemo(() => {
    const map: Record<string, number> = {};
    let total = 0;
    transactions.forEach((t) => {
      if (t.type === "expense") {
        const cat = t.category || "Uncategorized";
        map[cat] = (map[cat] ?? 0) + t.amount;
        total += t.amount;
      }
    });
    const sorted = Object.entries(map)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);

    const data = sorted.map(([name, value], idx) => ({
      name,
      value: total > 0 ? parseFloat(((value / total) * 100).toFixed(1)) : 0,
      raw: value,
      color: DONUT_COLORS[idx % DONUT_COLORS.length],
    }));

    return { donutData: data, totalExpense: total };
  }, [transactions]);

  return (
    <div className="flex flex-col gap-6">
      <h3 className="font-bold text-on-surface font-headline text-lg">Spending by Category</h3>
      <div className="relative h-48 w-full flex items-center justify-center">
        {donutData.length === 0 ? (
          <div className="flex items-center justify-center w-full h-full rounded-2xl bg-surface-container-low border border-dashed border-outline-variant/30 text-outline-variant text-sm italic">
            No expense data yet
          </div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={donutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  stroke="none"
                  paddingAngle={2}
                  dataKey="value"
                  startAngle={90}
                  endAngle={-270}
                >
                  {donutData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xl font-bold font-headline text-on-surface">
                {formatCurrency(totalExpense, currency)}
              </span>
              <span className="text-[9px] font-bold tracking-widest uppercase text-outline-variant mt-1">
                Total Spend
              </span>
            </div>
          </>
        )}
      </div>
      <div className="flex flex-col gap-3 mt-2">
        {donutData.map((item) => (
          <div key={item.name} className="flex justify-between items-center px-2">
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: item.color }} />
              <span className="text-sm font-semibold text-on-surface truncate max-w-[150px]">{item.name}</span>
            </div>
            <span className="text-sm font-bold text-on-surface-variant">{item.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ╔══════════════════════════════════════════════════════════════╗
//  6. Top Expense Breakdown  — top 3 expense categories + bars
// ╚══════════════════════════════════════════════════════════════╝
export function TopExpenseBreakdown({ transactions }: WidgetProps) {
  const { currency } = useCurrency();

  const categories = useMemo(() => {
    const map: Record<string, number> = {};
    transactions.forEach((t) => {
      if (t.type === "expense") {
        const cat = t.category || "Uncategorized";
        map[cat] = (map[cat] ?? 0) + t.amount;
      }
    });
    const sorted = Object.entries(map)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([name, spend]) => ({ name, spend }));

    const max = sorted[0]?.spend ?? 1;
    return sorted.map((c, idx) => ({ ...c, max, color: BAR_COLORS[idx % BAR_COLORS.length] }));
  }, [transactions]);

  if (categories.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        <h3 className="font-bold text-on-surface font-headline text-lg">Top Expense Breakdown</h3>
        <div className="flex items-center justify-center h-24 rounded-2xl bg-surface-container-low border border-dashed border-outline-variant/30 text-outline-variant text-sm italic">
          No expense data yet
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <h3 className="font-bold text-on-surface font-headline text-lg">Top Expense Breakdown</h3>
      <div className="flex flex-col gap-5">
        {categories.map((c) => (
          <div key={c.name} className="flex flex-col gap-2">
            <div className="flex justify-between items-end">
              <span className="text-sm font-semibold text-on-surface truncate max-w-[60%]">{c.name}</span>
              <span className="text-sm font-bold text-on-surface">{formatCurrency(c.spend, currency)}</span>
            </div>
            <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${(c.spend / c.max) * 100}%`, backgroundColor: c.color }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
