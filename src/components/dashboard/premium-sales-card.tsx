"use client";

import { useMemo, useState } from "react";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell, CartesianGrid } from "recharts";
import { ArrowUpRight, TrendingUp } from "lucide-react";
import { formatCurrency } from "@/lib/data";
import { useCurrency } from "@/context/currency-context";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Transaction } from "@/types";

interface PremiumSalesCardProps {
  transactions: Transaction[];
  totalIncome: number;
}

export function PremiumSalesCard({ transactions, totalIncome }: PremiumSalesCardProps) {
  const { currency } = useCurrency();
  const [timeframe, setTimeframe] = useState("Monthly");

  const chartData = useMemo(() => {
    // Generate simple grouped data by month for the chart
    const monthlyData: Record<string, { income: number; expense: number }> = {};
    
    // Default to a 6-month window or just process all incoming transactions
    transactions.forEach(t => {
      if (!t.status || t.status === "completed") {
        const d = new Date(t.date);
        if (!isNaN(d.getTime())) {
          const m = d.toLocaleString('default', { month: 'short' });
          if (!monthlyData[m]) monthlyData[m] = { income: 0, expense: 0 };
          
          if (t.type === 'income') monthlyData[m].income += t.amount;
          if (t.type === 'expense') monthlyData[m].expense += t.amount;
        }
      }
    });

    // Grab the last 4 active months for aesthetic spacing like the screenshot
    const keys = Object.keys(monthlyData);
    const recentKeys = keys.slice(-4);
    
    return recentKeys.map(k => ({
      name: k,
      income: monthlyData[k].income,
      expense: monthlyData[k].expense,
      // For the visual hatched background, we place a max value marker
      maxRange: Math.max(...Object.values(monthlyData).map(v => v.income + v.expense)) * 1.2
    }));
  }, [transactions]);

  return (
    <div className="bg-[#1E1E1E] text-white p-6 md:p-8 rounded-2xl w-full flex flex-col justify-between shadow-ambient-lg relative overflow-hidden group hover-lift">
      {/* Header */}
      <div className="flex justify-between items-start z-10 relative">
        <div>
          <h3 className="text-2xl font-bold tracking-tight">Financials</h3>
          <p className="text-gray-400 text-sm mt-1">Income & Expenses</p>
        </div>
        <div className="bg-[#2A2A2A] text-white rounded-full px-4 py-1.5 text-sm border border-gray-700/50 flex items-center cursor-pointer hover:bg-[#333] transition">
          {timeframe} 
          <svg className="w-4 h-4 ml-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
        </div>
      </div>

      {/* Custom Hatched Pattern Defs for Recharts */}
      <svg width="0" height="0">
        <defs>
          <pattern id="hatched" patternUnits="userSpaceOnUse" width="8" height="8" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="8" stroke="#333333" strokeWidth="1" />
          </pattern>
        </defs>
      </svg>

      {/* Content Split */}
      <div className="flex flex-col md:flex-row mt-12 items-end justify-between z-10 relative">
        
        {/* Left Side: Big Number */}
        <div className="mb-6 md:mb-0 w-full md:w-1/3">
          <div className="flex items-center text-sm text-gray-400 mb-2">
            Net Income
            <div className="ml-2 bg-green-400/20 text-green-400 rounded-full p-1 border border-green-500/20">
              <ArrowUpRight className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-5xl lg:text-7xl font-bold tracking-tighter">
            {formatCurrency(totalIncome, currency).replace(currency, "").trim()}
            <span className="text-2xl text-white/40 font-medium ml-1">{currency}</span>
          </div>
        </div>

        {/* Right Side: Graph */}
        <div className="w-full md:w-2/3 h-[180px] md:h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 0, left: 10, bottom: 0 }} barSize={60}>
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#888', fontSize: 12 }} dy={10} />
              
              {/* Tooltip */}
              <Tooltip 
                cursor={{ fill: '#2A2A2A', radius: 16 }}
                contentStyle={{ backgroundColor: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff', boxShadow: '0 8px 32px -8px rgba(0,0,0,0.3)' }}
                itemStyle={{ color: '#fff' }}
              />

              {/* Background Hatched Bar representing scale/potential */}
              <Bar dataKey="maxRange" fill="url(#hatched)" radius={[16, 16, 0, 0]} />
              
              {/* Stacked overlapping visual: To cheat the design in Recharts, we plot the bars slightly overlapping using negative margins or composed overlapping charts, but stacked is cleanest */}
              <Bar dataKey="income" stackId="a" fill="#A8F0B0" radius={[16, 16, 0, 0]} />
              <Bar dataKey="expense" stackId="a" fill="#B4A2F0" radius={[0, 0, 16, 16]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
