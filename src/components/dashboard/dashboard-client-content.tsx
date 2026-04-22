
"use client";

import { StitchTicker } from "@/components/stitch/stitch-ticker";
import { StitchLiveCashPosition } from "@/components/stitch/stitch-live-cash-position";
import { StitchMetricsGrid } from "@/components/stitch/stitch-metrics-grid";
import { StitchStreamVelocity } from "@/components/stitch/stitch-stream-velocity";
import { StitchAnalyticsSuite } from "@/components/stitch/stitch-analytics-suite";
import { StitchBudgetIntelligence } from "@/components/stitch/stitch-budget-intelligence";
import { StitchMiniSparklines } from "@/components/stitch/stitch-mini-sparklines";
import type { Transaction, BudgetSummary } from "@/types";
import { useMemo, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCurrency } from "@/context/currency-context";

import { CategoryDeepDive, TopVendors, NewBudgetIntelligence, CashFlowAnalysis, SpendingByCategory, TopExpenseBreakdown } from "./dashboard-widgets";

export function DashboardClientContent({
  transactions,
  budgets,
  isProjectView = false,
}: {
  transactions: Transaction[];
  budgets: BudgetSummary[];
  isProjectView?: boolean;
}) {
  const [filterYear, setFilterYear] = useState<string>("all");
  const [filterMonth, setFilterMonth] = useState<string>("all");

  const filteredTransactions = useMemo(() => {
     return transactions.filter(t => {
        const d = new Date(t.date);
        if (isNaN(d.getTime())) return false;
        const yearMatch = filterYear === "all" || d.getFullYear().toString() === filterYear;
        const monthMatch = filterMonth === "all" || (d.getMonth() + 1).toString() === filterMonth;
        return yearMatch && monthMatch;
     });
  }, [transactions, filterYear, filterMonth]);

  const availableYears = useMemo(() => {
     const years = new Set<string>();
     transactions.forEach(t => {
        const d = new Date(t.date);
        if (!isNaN(d.getTime())) years.add(d.getFullYear().toString());
     });
     return Array.from(years).sort((a,b) => parseInt(b) - parseInt(a));
  }, [transactions]);

  return (
    <div className="flex flex-col gap-8 -mt-6">
      <div className="fixed top-[64px] left-0 right-0 z-40">
         <StitchTicker transactions={filteredTransactions} />
      </div>

      <div className="mt-12 flex flex-col gap-8">
        {/* BI Toolkit Filter Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-surface-container-lowest/60 backdrop-blur-md p-5 rounded-2xl border border-outline-variant/10 shadow-sm gap-4 animate-fade-up">
          <div>
             <h2 className="font-bold text-xl font-headline text-on-surface">{isProjectView ? 'Project Monitor' : 'Financial Command Center'}</h2>
             <p className="text-sm font-medium text-on-surface-variant font-label">Precision Analytics & Live Intelligence</p>
          </div>
          <div className="flex gap-2">
             <Select value={filterYear} onValueChange={setFilterYear}>
                <SelectTrigger className="w-[120px] bg-surface-container-low border-none shadow-none font-medium">
                   <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent>
                   <SelectItem value="all">All Years</SelectItem>
                   {availableYears.map(yr => (
                      <SelectItem key={yr} value={yr}>{yr}</SelectItem>
                   ))}
                </SelectContent>
             </Select>

             <Select value={filterMonth} onValueChange={setFilterMonth}>
                <SelectTrigger className="w-[140px] bg-surface-container-low border-none shadow-none font-medium">
                   <SelectValue placeholder="Month" />
                </SelectTrigger>
                <SelectContent>
                   <SelectItem value="all">All Months</SelectItem>
                   {[...Array(12)].map((_, i) => (
                      <SelectItem key={i+1} value={(i+1).toString()}>{new Date(2000, i, 1).toLocaleString('default', { month: 'long' })}</SelectItem>
                   ))}
                </SelectContent>
             </Select>
          </div>
        </div>

        {/* HERO: Live Cash Position */}
        <div className="animate-fade-up" style={{ animationDelay: '100ms' }}>
          <StitchLiveCashPosition transactions={filteredTransactions} />
        </div>

        {/* SECTION 2: Metrics Grid */}
        <div className="animate-fade-up" style={{ animationDelay: '200ms' }}>
          <StitchMetricsGrid transactions={filteredTransactions} />
        </div>

        {/* NEW WIDGETS SECTION (From Images 3 and 4) */}
        
        {/* Image 4 Custom Dashboard Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-up" style={{ animationDelay: '300ms' }}>
          <div className="lg:col-span-2 bg-white rounded-3xl p-8 shadow-[0px_8px_32px_rgba(25,28,32,0.04)] border border-outline-variant/10">
            <CashFlowAnalysis transactions={filteredTransactions} />
          </div>
          <div className="lg:col-span-1 flex flex-col gap-6">
             <div className="bg-white rounded-3xl p-8 shadow-[0px_8px_32px_rgba(25,28,32,0.04)] border border-outline-variant/10 flex-1">
                <SpendingByCategory transactions={filteredTransactions} />
             </div>
             <div className="bg-white rounded-3xl p-8 shadow-[0px_8px_32px_rgba(25,28,32,0.04)] border border-outline-variant/10">
                <TopExpenseBreakdown transactions={filteredTransactions} />
             </div>
          </div>
        </div>

        {/* Image 3 Custom Dashboard Area */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-up" style={{ animationDelay: '400ms' }}>
           <div className="bg-white rounded-3xl p-8 shadow-[0px_8px_32px_rgba(25,28,32,0.04)] border border-outline-variant/10">
              <CategoryDeepDive transactions={filteredTransactions} />
           </div>
           <div className="bg-white rounded-3xl p-8 shadow-[0px_8px_32px_rgba(25,28,32,0.04)] border border-outline-variant/10">
              <TopVendors transactions={filteredTransactions} />
           </div>
        </div>

        <div className="animate-fade-up bg-white rounded-3xl p-8 shadow-[0px_8px_32px_rgba(25,28,32,0.04)] border border-outline-variant/10" style={{ animationDelay: '500ms' }}>
          <NewBudgetIntelligence transactions={filteredTransactions} budgets={budgets} />
        </div>

        {/* SECTION 3: Stream & Velocity */}
        <div className="animate-fade-up" style={{ animationDelay: '600ms' }}>
          <StitchStreamVelocity transactions={filteredTransactions} />
        </div>

        {/* FOOTER: Asset Sparklines */}
        <div className="animate-fade-up" style={{ animationDelay: '700ms' }}>
          <StitchMiniSparklines budgets={budgets} />
        </div>
      </div>
    </div>
  );
}