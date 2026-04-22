"use client";

import { ArrowUpRight } from "lucide-react";
import { formatCurrency } from "@/lib/data";
import { useCurrency } from "@/context/currency-context";

interface PremiumBalanceGaugeProps {
  totalIncome: number;
  totalExpense: number;
}

export function PremiumBalanceGauge({ totalIncome, totalExpense }: PremiumBalanceGaugeProps) {
  const { currency } = useCurrency();
  
  const profit = totalIncome - totalExpense;
  const margin = totalIncome > 0 ? (profit / totalIncome) * 100 : 0;
  
  // Clamped percentage for the SVG Arc (0 to 100)
  const percentage = Math.min(Math.max(margin, 0), 100);
  
  // SVG Arc Math for a 180 degree semi-circle
  // Circumference of a half circle = PI * r
  const radius = 80;
  const circumference = Math.PI * radius;
  // Stroke offset calculates how much of the dash array to hide
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="bg-[#A8F0B0] text-black p-6 md:p-8 rounded-2xl w-full flex flex-col justify-between shadow-ambient-lg relative overflow-hidden h-[300px] hover-lift group">
      
      {/* Header */}
      <div className="flex justify-between items-start z-10 relative">
        <h3 className="text-xl font-bold tracking-tight">Overall Margin</h3>
        <div className="flex gap-2">
          <button className="w-8 h-8 rounded-full bg-black/5 flex items-center justify-center hover:bg-black/10 transition">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          <button className="w-8 h-8 rounded-full bg-white/40 flex items-center justify-center hover:bg-white/60 transition shadow-sm">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
          </button>
        </div>
      </div>

      <div className="absolute top-6 left-6 z-10 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
         <ArrowUpRight className="w-5 h-5 text-gray-700" />
      </div>

      {/* Stats overlay */}
      <div className="absolute bottom-8 left-8 z-10">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-3xl font-extrabold">{margin.toFixed(0)}%</span>
          <div className="bg-white rounded-full px-1.5 py-0.5 border border-black/5 flex items-center justify-center">
             <ArrowUpRight className="w-3 h-3 text-black" />
          </div>
        </div>
        <p className="text-sm font-medium text-black/60">Profit Margin</p>
      </div>

      {/* Absolute Centered Gauge Dial */}
      <div className="absolute bottom-6 right-6 z-0 flex items-end justify-end">
         <div className="relative w-[280px] h-[140px] overflow-hidden transform origin-bottom border-b border-black/5">
            <svg className="w-full h-[140px] absolute bottom-0 right-0" viewBox="0 0 200 100">
              
              {/* Outer Hatched Track (Represents 100%) */}
              <defs>
                <pattern id="hatched-gauge" patternUnits="userSpaceOnUse" width="4" height="4" patternTransform="rotate(45)">
                  <line x1="0" y1="0" x2="0" y2="4" stroke="rgba(0,0,0,0.2)" strokeWidth="1" />
                </pattern>
              </defs>
              <path
                d="M 20 100 A 80 80 0 0 1 180 100"
                fill="none"
                stroke="url(#hatched-gauge)"
                strokeWidth="24"
                strokeLinecap="round"
                className="transform origin-center"
              />

              {/* Inner Solid Track (Represents Current Value) */}
              <path
                d="M 20 100 A 80 80 0 0 1 180 100"
                fill="none"
                stroke="#1E1E1E"
                strokeWidth="28"
                strokeLinecap="round"
                strokeDasharray={`${circumference} ${circumference}`}
                strokeDashoffset={strokeDashoffset}
                className="transform origin-center drop-shadow-xl transition-all duration-1200 ease-precision delay-300"
              />
            </svg>

            {/* Value Display tucked under the arch */}
            <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 text-center w-full pr-12">
               <div className="text-4xl md:text-5xl font-extrabold tracking-tighter text-[#1E1E1E]">
                  {formatCurrency(profit, currency).replace(currency, "").trim()}
                  <span className="text-xl md:text-2xl ml-1">{currency}</span>
               </div>
            </div>

            {/* Little indicator point at bottom center mimicking a dial */}
            <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 w-3 h-3 rounded-full border-2 border-white bg-[#A8F0B0] shadow-md z-20"></div>
         </div>
      </div>
    </div>
  );
}
