"use client";

import { useMemo } from "react";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { ArrowUpRight, Activity } from "lucide-react";
import { formatCurrency } from "@/lib/data";
import { useCurrency } from "@/context/currency-context";
import { cn } from "@/lib/utils";
import type { Transaction } from "@/types";

interface PremiumForecastCardsProps {
  transactions: Transaction[];
}

export function PremiumForecastCards({ transactions }: PremiumForecastCardsProps) {
  const { currency } = useCurrency();

  const { incomeTrend, expenseTrend, currentIncome, currentExpense, incomeGrowth, expenseGrowth } = useMemo(() => {
    // Basic sorting and extraction for mini sparklines
    const sorted = [...transactions]
      .filter(t => !t.status || t.status === "completed")
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Generate basic cumulative or moving series to make the chart look like a "trend"
    // Just mapping the last 10 transactions of each type for a sparkline
    const incomes = sorted.filter(t => t.type === 'income').slice(-15);
    const expenses = sorted.filter(t => t.type === 'expense').slice(-15);

    let incSum = 0;
    const incomeTrend = incomes.map((t, i) => {
      incSum += t.amount;
      return { index: i, value: t.amount, cumulative: incSum };
    });

    let expSum = 0;
    const expenseTrend = expenses.map((t, i) => {
      expSum += t.amount;
      return { index: i, value: t.amount, cumulative: expSum };
    });

    // To simulate the "growth" metric
    const incomeGrowth = incomes.length > 2 ? 
      ((incomes[incomes.length - 1].amount - incomes[incomes.length - 2].amount) / (incomes[incomes.length - 2].amount || 1)) * 100 
      : 0;

    const expenseGrowth = expenses.length > 2 ? 
      ((expenses[expenses.length - 1].amount - expenses[expenses.length - 2].amount) / (expenses[expenses.length - 2].amount || 1)) * 100 
      : 0;

    // Grab totals for the current period
    const currentIncome = incomes.reduce((s, t) => s + t.amount, 0);
    const currentExpense = expenses.reduce((s, t) => s + t.amount, 0);

    return { incomeTrend, expenseTrend, currentIncome, currentExpense, incomeGrowth, expenseGrowth };
  }, [transactions]);

  // Dummy fallback data if array is empty so the charts still look aesthetic
  const fallbackData = [
    { value: 10 }, { value: 15 }, { value: 12 }, { value: 25 }, { value: 20 }, { value: 35 }, { value: 30 }, { value: 45 }
  ];

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Top Card: Income / Forecast */}
      <div className="bg-[#A8F0B0] rounded-2xl p-6 lg:p-8 flex flex-col justify-between relative overflow-hidden h-1/2 min-h-[160px] group shadow-ambient-sm transition-all duration-250 hover:shadow-ambient hover-lift">
        <div className="z-10 relative flex justify-between items-start w-full">
           <div>
             <div className="flex items-center gap-2 mb-2">
                 <span className="bg-[#1E1E1E]/10 p-1.5 rounded-full"><Activity className="w-4 h-4 text-[#1E1E1E]" /></span>
                 <p className="text-sm font-semibold text-[#1E1E1E]/80 tracking-wide uppercase">Income Flow</p>
             </div>
             <p className="text-3xl font-extrabold tracking-tight text-[#1E1E1E]">
                {formatCurrency(currentIncome, currency)}
             </p>
           </div>
           
           <div className="bg-white/40 rounded-full px-2 py-1 text-xs font-bold text-[#1E1E1E] flex items-center shadow-sm">
             {incomeGrowth > 0 ? "+" : ""}{incomeGrowth.toFixed(1)}% 
             <ArrowUpRight className="w-3 h-3 ml-0.5" />
           </div>
        </div>

        {/* Minimalist Area Chart bottom overlay */}
        <div className="absolute bottom-0 left-0 right-0 h-[60%] z-0">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={incomeTrend.length > 2 ? incomeTrend : fallbackData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
               <defs>
                 <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                   <stop offset="5%" stopColor="#1E1E1E" stopOpacity={0.15}/>
                   <stop offset="95%" stopColor="#1E1E1E" stopOpacity={0}/>
                 </linearGradient>
               </defs>
               <Area type="basis" dataKey="value" stroke="#1E1E1E" strokeWidth={2} fillOpacity={1} fill="url(#colorIncome)" isAnimationActive={true} animationDuration={800} animationEasing="ease-out" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom Card: Expenses / Costs */}
      <div className="bg-[#B4A2F0] rounded-2xl p-6 lg:p-8 flex flex-col justify-between relative overflow-hidden h-1/2 min-h-[160px] group shadow-ambient-sm transition-all duration-250 hover:shadow-ambient hover-lift">
        <div className="z-10 relative flex justify-between items-start w-full">
           <div>
             <div className="flex items-center gap-2 mb-2">
                 <p className="text-sm font-semibold text-[#1E1E1E]/80 tracking-wide uppercase">Total Expense</p>
             </div>
             <p className="text-3xl font-extrabold tracking-tight text-[#1E1E1E]">
                {formatCurrency(currentExpense, currency)}
             </p>
           </div>
           
           <div className="bg-[#1E1E1E]/10 rounded-full w-8 h-8 flex items-center justify-center">
             <ArrowUpRight className="w-4 h-4 text-[#1E1E1E]" />
           </div>
        </div>

        {/* Timeline dots representing the graph point style from screenshot */}
        <div className="absolute bottom-16 right-12 z-20 w-3 h-3 rounded-full bg-[#A8F0B0] border border-[#1E1E1E] shadow-sm transform scale-0 group-hover:scale-100 transition-transform duration-300"></div>

        {/* Minimalist Area Chart bottom overlay */}
        <div className="absolute bottom-0 left-0 right-0 h-[60%] z-0">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={expenseTrend.length > 2 ? expenseTrend : fallbackData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
               <defs>
                 <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                   <stop offset="5%" stopColor="#1E1E1E" stopOpacity={0.15}/>
                   <stop offset="95%" stopColor="#1E1E1E" stopOpacity={0}/>
                 </linearGradient>
               </defs>
               <Area type="basis" dataKey="value" stroke="#1E1E1E" strokeWidth={2} fillOpacity={1} fill="url(#colorExpense)" isAnimationActive={true} animationDuration={800} animationEasing="ease-out" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
