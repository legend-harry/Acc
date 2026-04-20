"use client";

import { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ComposedChart, Line, Area, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine
} from 'recharts';
import {
  Calculator, TrendingUp, DollarSign, Target, Edit2, Check, X, Sparkles,
  Calendar, Fish, Scale, Banknote, ArrowUpRight, ArrowDownRight, Info
} from 'lucide-react';

// ==========================================
// COUNT-BASED PRICING SYSTEM
// ==========================================
// "Count" = number of shrimp per kg. Lower count = bigger shrimp = higher price.
// Indian shrimp market standard: 20ct, 30ct, 40ct, 50ct, 60ct, 70ct, 80ct, 90ct, 100ct
const DEFAULT_COUNT_PRICES: Record<number, number> = {
  20: 650,
  30: 520,
  40: 440,
  50: 380,
  60: 340,
  70: 310,
  80: 280,
  90: 260,
  100: 240,
};

// Gompertz growth model parameters by species
const SPECIES_PARAMS: Record<string, { maxWeight: number; k: number; t0Shift: number; label: string }> = {
  white: { maxWeight: 35, k: 0.035, t0Shift: 0, label: 'Vannamei (White)' },
  tiger: { maxWeight: 45, k: 0.028, t0Shift: 5, label: 'Tiger Prawn' },
  giant: { maxWeight: 60, k: 0.022, t0Shift: 10, label: 'Giant Freshwater' },
};

interface ExpenseEntry {
  id: string;
  category: string;
  description: string;
  amount: number;
  date: string;
}

const EXPENSE_CATEGORIES = [
  { value: 'feed', label: 'Feed', color: '#f59e0b' },
  { value: 'seed', label: 'Seed/PL', color: '#8b5cf6' },
  { value: 'electricity', label: 'Electricity', color: '#3b82f6' },
  { value: 'labor', label: 'Labor', color: '#10b981' },
  { value: 'chemicals', label: 'Chemicals/Minerals', color: '#ef4444' },
  { value: 'equipment', label: 'Equipment', color: '#6366f1' },
  { value: 'other', label: 'Other', color: '#64748b' },
];

function getCountFromWeight(avgWeightGrams: number): number {
  if (avgWeightGrams <= 0) return 100;
  const countPerKg = Math.round(1000 / avgWeightGrams);
  // Round to nearest 10
  return Math.max(20, Math.min(100, Math.round(countPerKg / 10) * 10));
}

function getPriceForWeight(avgWeightGrams: number, priceTable: Record<number, number>): number {
  const count = getCountFromWeight(avgWeightGrams);
  // Interpolate between count brackets
  const counts = Object.keys(priceTable).map(Number).sort((a, b) => a - b);

  if (count <= counts[0]) return priceTable[counts[0]];
  if (count >= counts[counts.length - 1]) return priceTable[counts[counts.length - 1]];

  for (let i = 0; i < counts.length - 1; i++) {
    if (count >= counts[i] && count <= counts[i + 1]) {
      const ratio = (count - counts[i]) / (counts[i + 1] - counts[i]);
      return Math.round(priceTable[counts[i]] * (1 - ratio) + priceTable[counts[i + 1]] * ratio);
    }
  }
  return priceTable[counts[0]];
}

export function HarvestEstimator({
  pondName,
  shrimpType = 'white',
  initialStock = 0,
  pondArea = 0,
  cycleDay = 0,
  seedDate,
}: {
  pondName: string;
  shrimpType?: 'white' | 'tiger' | 'giant';
  initialStock?: number;
  pondArea?: number;
  cycleDay?: number;
  seedDate?: string;
}) {
  // === State ===
  const [survivalRate, setSurvivalRate] = useState(80);
  const [feedPricePerKg, setFeedPricePerKg] = useState(50);
  const [editingFeedPrice, setEditingFeedPrice] = useState(false);
  const [tempFeedPrice, setTempFeedPrice] = useState('50');
  const [fcr, setFcr] = useState(1.5);
  const [dgr, setDgr] = useState(2.5);
  const [cultureDays, setCultureDays] = useState(120);
  const [countPrices, setCountPrices] = useState<Record<number, number>>({ ...DEFAULT_COUNT_PRICES });
  const [editingCount, setEditingCount] = useState<number | null>(null);
  const [tempCountPrice, setTempCountPrice] = useState('');

  // Expense tracking
  const [expenses, setExpenses] = useState<ExpenseEntry[]>([]);
  const [newExpense, setNewExpense] = useState({ category: 'feed', description: '', amount: '' });
  const [showAddExpense, setShowAddExpense] = useState(false);

  const species = SPECIES_PARAMS[shrimpType] || SPECIES_PARAMS.white;

  // === Generate day-by-day projection ===
  const projection = useMemo(() => {
    if (initialStock <= 0) return [];

    const points: Array<{
      day: number;
      weight_g: number;
      count: number;
      biomass_kg: number;
      cumulative_feed_kg: number;
      cumulative_feed_cost: number;
      revenue_if_harvest: number;
      profit_if_harvest: number;
      count_bracket: number;
      price_per_kg: number;
    }> = [];

    const initialWeight = 0.01; // PL weight ~0.01g
    const k = (dgr / 100) * 0.8;
    const t0 = Math.log(-Math.log(initialWeight / species.maxWeight)) / k;
    const dailySurvival = Math.pow(survivalRate / 100, 1 / cultureDays);

    let cumulativeFeed = 0;
    let prevWeight = initialWeight;

    for (let day = 0; day <= cultureDays; day++) {
      const weight = species.maxWeight * Math.exp(-Math.exp(-k * (day - t0)));
      const aliveCount = Math.round(initialStock * Math.pow(dailySurvival, day));
      const biomass = (weight * aliveCount) / 1000;

      // Feed calculation
      const weightGain = day === 0 ? 0 : weight - prevWeight;
      const dailyFeed = day === 0 ? 0 : (weightGain * aliveCount / 1000) * fcr;
      cumulativeFeed += dailyFeed;
      const cumulativeFeedCost = cumulativeFeed * feedPricePerKg;

      // Revenue if harvested today (count-based pricing)
      const countBracket = getCountFromWeight(weight);
      const pricePerKg = getPriceForWeight(weight, countPrices);
      const revenue = biomass * pricePerKg;

      // Profit = revenue - total feed cost - other expenses
      const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
      const profit = revenue - cumulativeFeedCost - totalExpenses;

      points.push({
        day,
        weight_g: Math.max(0, weight),
        count: aliveCount,
        biomass_kg: Math.max(0, biomass),
        cumulative_feed_kg: cumulativeFeed,
        cumulative_feed_cost: cumulativeFeedCost,
        revenue_if_harvest: revenue,
        profit_if_harvest: profit,
        count_bracket: countBracket,
        price_per_kg: pricePerKg,
      });

      prevWeight = weight;
    }

    return points;
  }, [initialStock, survivalRate, feedPricePerKg, fcr, dgr, cultureDays, countPrices, expenses, species]);

  // === Best harvest day (max profit) ===
  const bestHarvestDay = useMemo(() => {
    if (projection.length === 0) return null;
    let maxProfit = -Infinity;
    let bestDay = 0;
    for (const p of projection) {
      if (p.profit_if_harvest > maxProfit) {
        maxProfit = p.profit_if_harvest;
        bestDay = p.day;
      }
    }
    return { day: bestDay, profit: maxProfit };
  }, [projection]);

  // Current day metrics
  const currentMetrics = useMemo(() => {
    if (projection.length === 0 || cycleDay >= projection.length) return null;
    return projection[Math.min(cycleDay, projection.length - 1)];
  }, [projection, cycleDay]);

  // End-of-cycle metrics
  const endMetrics = useMemo(() => {
    if (projection.length === 0) return null;
    return projection[projection.length - 1];
  }, [projection]);

  // Total tracked expenses
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  // === Handlers ===
  const saveFeedPrice = useCallback(() => {
    const val = parseFloat(tempFeedPrice);
    if (!isNaN(val) && val > 0) setFeedPricePerKg(val);
    setEditingFeedPrice(false);
  }, [tempFeedPrice]);

  const saveCountPrice = useCallback((count: number) => {
    const val = parseFloat(tempCountPrice);
    if (!isNaN(val) && val > 0) {
      setCountPrices(prev => ({ ...prev, [count]: val }));
    }
    setEditingCount(null);
  }, [tempCountPrice]);

  const addExpense = useCallback(() => {
    if (!newExpense.amount || !newExpense.category) return;
    const entry: ExpenseEntry = {
      id: Date.now().toString(),
      category: newExpense.category,
      description: newExpense.description || newExpense.category,
      amount: parseFloat(newExpense.amount) || 0,
      date: new Date().toISOString().split('T')[0],
    };
    setExpenses(prev => [...prev, entry]);
    setNewExpense({ category: 'feed', description: '', amount: '' });
    setShowAddExpense(false);
  }, [newExpense]);

  const removeExpense = useCallback((id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
  }, []);

  if (initialStock <= 0) {
    return (
      <Card className="border-dashed border-2 border-cyan-300">
        <CardContent className="pt-8 pb-8 text-center">
          <Fish className="h-12 w-12 text-cyan-400 mx-auto mb-4 animate-float" />
          <h3 className="text-lg font-semibold text-gray-700">No Stock Data</h3>
          <p className="text-sm text-gray-500 mt-2">Add initial stock count to your pond to unlock harvest projections</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* === Hero Banner === */}
      <div className="rounded-2xl overflow-hidden aqua-gradient-bg p-6 md:p-8 relative">
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Calculator className="h-7 w-7 text-cyan-600" />
                Harvest Estimator
              </h2>
              <p className="text-gray-600 mt-1 text-sm md:text-base">
                {pondName} • {species.label} • Day {cycleDay}/{cultureDays}
              </p>
            </div>
            {bestHarvestDay && (
              <div className="glass-card rounded-xl px-5 py-3 animate-scale-in">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Best Harvest Window</p>
                <p className="text-2xl font-bold text-emerald-600">Day {bestHarvestDay.day}</p>
                <p className="text-xs text-gray-600">Max profit: ₹{(bestHarvestDay.profit / 1000).toFixed(0)}K</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* === Current Status KPI Cards === */}
      {currentMetrics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <Card className="kpi-card hover-lift border-cyan-200 bg-gradient-to-br from-cyan-50 to-sky-50 animate-fade-up" style={{ animationDelay: '0ms' }}>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-8 rounded-lg bg-cyan-100 flex items-center justify-center">
                  <Fish className="h-4 w-4 text-cyan-600" />
                </div>
              </div>
              <p className="text-xs text-gray-500 font-medium">Est. Count</p>
              <p className="text-xl md:text-2xl font-bold text-gray-900 animate-counter-up">
                {(currentMetrics.count || 0).toLocaleString()}
              </p>
              <p className="text-xs text-cyan-600 mt-0.5">{currentMetrics.count_bracket}ct grade</p>
            </CardContent>
          </Card>

          <Card className="kpi-card hover-lift border-emerald-200 bg-gradient-to-br from-emerald-50 to-green-50 animate-fade-up" style={{ animationDelay: '75ms' }}>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <Scale className="h-4 w-4 text-emerald-600" />
                </div>
              </div>
              <p className="text-xs text-gray-500 font-medium">Avg Weight</p>
              <p className="text-xl md:text-2xl font-bold text-gray-900 animate-counter-up">
                {currentMetrics.weight_g.toFixed(1)}g
              </p>
              <p className="text-xs text-emerald-600 mt-0.5">{currentMetrics.biomass_kg.toFixed(0)} kg biomass</p>
            </CardContent>
          </Card>

          <Card className="kpi-card hover-lift border-amber-200 bg-gradient-to-br from-amber-50 to-yellow-50 animate-fade-up" style={{ animationDelay: '150ms' }}>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                  <Banknote className="h-4 w-4 text-amber-600" />
                </div>
              </div>
              <p className="text-xs text-gray-500 font-medium">Market Price</p>
              <p className="text-xl md:text-2xl font-bold text-gray-900 animate-counter-up">
                ₹{currentMetrics.price_per_kg}/kg
              </p>
              <p className="text-xs text-amber-600 mt-0.5">{currentMetrics.count_bracket} count</p>
            </CardContent>
          </Card>

          <Card className={`kpi-card hover-lift animate-fade-up ${currentMetrics.profit_if_harvest >= 0 ? 'border-green-200 bg-gradient-to-br from-green-50 to-emerald-50' : 'border-red-200 bg-gradient-to-br from-red-50 to-rose-50'}`} style={{ animationDelay: '225ms' }}>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2 mb-1">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${currentMetrics.profit_if_harvest >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                  {currentMetrics.profit_if_harvest >= 0 ?
                    <ArrowUpRight className="h-4 w-4 text-green-600" /> :
                    <ArrowDownRight className="h-4 w-4 text-red-600" />
                  }
                </div>
              </div>
              <p className="text-xs text-gray-500 font-medium">If Harvest Now</p>
              <p className={`text-xl md:text-2xl font-bold animate-counter-up ${currentMetrics.profit_if_harvest >= 0 ? 'profit-positive' : 'profit-negative'}`}>
                ₹{(Math.abs(currentMetrics.profit_if_harvest) / 1000).toFixed(0)}K
              </p>
              <p className={`text-xs mt-0.5 ${currentMetrics.profit_if_harvest >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {currentMetrics.profit_if_harvest >= 0 ? 'Profit' : 'Loss'}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* === Optimal Harvest Timing Chart === */}
      <Card className="border-slate-200 hover-lift">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="h-5 w-5 text-amber-500" />
            Optimal Harvest Timing
          </CardTitle>
          <CardDescription>
            Find the best day to harvest for maximum profit. The green peak shows your profit sweet spot.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[380px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={projection.filter((_, i) => i % 2 === 0 || i === projection.length - 1)} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                <defs>
                  <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.02}/>
                  </linearGradient>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.02}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" stroke="#e2e8f0" />
                <XAxis dataKey="day" tickFormatter={(v) => `D${v}`} tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <YAxis tickFormatter={(v) => `₹${(v/1000).toFixed(0)}K`} width={65} tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0]?.payload;
                    if (!d) return null;
                    return (
                      <div className="glass-card rounded-lg p-3 shadow-lg text-xs space-y-1 min-w-[180px]">
                        <p className="font-bold text-gray-900">Day {d.day} • {d.count_bracket}ct</p>
                        <p className="text-gray-600">Weight: {d.weight_g.toFixed(1)}g • Count: {(d.count || 0).toLocaleString()}</p>
                        <div className="border-t border-gray-200 my-1 pt-1">
                          <p className="text-blue-600">Revenue: ₹{(d.revenue_if_harvest/1000).toFixed(1)}K</p>
                          <p className="text-orange-600">Feed Cost: ₹{(d.cumulative_feed_cost/1000).toFixed(1)}K</p>
                          <p className={`font-bold ${d.profit_if_harvest >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                            Profit: ₹{(d.profit_if_harvest/1000).toFixed(1)}K
                          </p>
                        </div>
                        <p className="text-gray-500">₹{d.price_per_kg}/kg market price</p>
                      </div>
                    );
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Area type="monotone" dataKey="revenue_if_harvest" name="Revenue" fill="url(#revenueGradient)" stroke="#3b82f6" strokeWidth={2} dot={false} />
                <Area type="monotone" dataKey="profit_if_harvest" name="Profit" fill="url(#profitGradient)" stroke="#10b981" strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="cumulative_feed_cost" name="Cum. Feed Cost" stroke="#f59e0b" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                {bestHarvestDay && (
                  <ReferenceLine x={bestHarvestDay.day} stroke="#10b981" strokeWidth={2} strokeDasharray="8 4" label={{ value: `Best: D${bestHarvestDay.day}`, position: 'top', fill: '#10b981', fontSize: 11 }} />
                )}
                {cycleDay > 0 && (
                  <ReferenceLine x={cycleDay} stroke="#6366f1" strokeWidth={2} label={{ value: 'Today', position: 'top', fill: '#6366f1', fontSize: 11 }} />
                )}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* === Growth & Count Charts === */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Weight Growth Chart */}
        <Card className="border-slate-200 hover-lift">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-cyan-500" />
              Weight Growth Trajectory
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={projection.filter((_, i) => i % 3 === 0)} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="4 4" stroke="#e2e8f0" />
                  <XAxis dataKey="day" tickFormatter={(v) => `D${v}`} tick={{ fontSize: 10 }} />
                  <YAxis tickFormatter={(v) => `${v.toFixed(0)}g`} width={50} tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(v: number) => [`${v.toFixed(2)}g`, 'Weight']} labelFormatter={(v) => `Day ${v}`} />
                  <Area type="monotone" dataKey="weight_g" fill="url(#revenueGradient)" stroke="#0ea5e9" strokeWidth={2.5} dot={false} name="Avg Weight (g)" />
                  {cycleDay > 0 && <ReferenceLine x={cycleDay} stroke="#6366f1" strokeDasharray="4 4" />}
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Estimated Count Chart */}
        <Card className="border-slate-200 hover-lift">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Fish className="h-4 w-4 text-orange-500" />
              Estimated Surviving Count
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={projection.filter((_, i) => i % 3 === 0)} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="4 4" stroke="#e2e8f0" />
                  <XAxis dataKey="day" tickFormatter={(v) => `D${v}`} tick={{ fontSize: 10 }} />
                  <YAxis tickFormatter={(v) => `${(v/1000).toFixed(0)}K`} width={45} tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(v: number) => [(v || 0).toLocaleString(), 'Count']} labelFormatter={(v) => `Day ${v}`} />
                  <Area type="monotone" dataKey="count" fill="#fef3c7" stroke="#f59e0b" strokeWidth={2} dot={false} name="Surviving Count" />
                  {cycleDay > 0 && <ReferenceLine x={cycleDay} stroke="#6366f1" strokeDasharray="4 4" />}
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* === Controls Panel === */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {/* Parameters */}
        <Card className="border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">📐 Model Parameters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Survival Rate</Label>
                <Badge className="bg-cyan-100 text-cyan-800 font-bold">{survivalRate}%</Badge>
              </div>
              <Slider value={[survivalRate]} min={50} max={100} step={1} onValueChange={(v) => setSurvivalRate(v[0])} />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Feed Conversion Ratio</Label>
                <Badge className="bg-amber-100 text-amber-800 font-bold">{fcr.toFixed(2)}</Badge>
              </div>
              <Slider value={[fcr]} min={0.8} max={3} step={0.05} onValueChange={(v) => setFcr(v[0])} />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Daily Growth Rate (%)</Label>
                <Badge className="bg-emerald-100 text-emerald-800 font-bold">{dgr.toFixed(1)}%</Badge>
              </div>
              <Slider value={[dgr]} min={0.5} max={5} step={0.1} onValueChange={(v) => setDgr(v[0])} />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Culture Duration</Label>
                <Badge className="bg-purple-100 text-purple-800 font-bold">{cultureDays}d</Badge>
              </div>
              <Slider value={[cultureDays]} min={60} max={180} step={5} onValueChange={(v) => setCultureDays(v[0])} />
            </div>
          </CardContent>
        </Card>

        {/* Feed Price (Editable!) */}
        <Card className="border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center justify-between">
              <span>🌾 Feed Price</span>
              {!editingFeedPrice ? (
                <Button variant="ghost" size="sm" onClick={() => { setTempFeedPrice(feedPricePerKg.toString()); setEditingFeedPrice(true); }}>
                  <Edit2 className="h-3.5 w-3.5 mr-1" /> Edit
                </Button>
              ) : (
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={saveFeedPrice}><Check className="h-3.5 w-3.5 text-green-600" /></Button>
                  <Button variant="ghost" size="sm" onClick={() => setEditingFeedPrice(false)}><X className="h-3.5 w-3.5 text-red-500" /></Button>
                </div>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {editingFeedPrice ? (
              <div className="space-y-2">
                <Label>Price per kg (₹)</Label>
                <Input type="number" value={tempFeedPrice} onChange={(e) => setTempFeedPrice(e.target.value)} className="text-lg font-bold" autoFocus />
                <p className="text-xs text-gray-500">Feed prices vary by brand and season. Update as needed.</p>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-3xl font-bold text-gray-900">₹{feedPricePerKg}/kg</p>
                <p className="text-sm text-gray-500 mt-2">
                  Total feed cost: ₹{endMetrics ? (endMetrics.cumulative_feed_cost / 1000).toFixed(0) : '--'}K
                  <span className="text-xs text-gray-400 block">({endMetrics ? endMetrics.cumulative_feed_kg.toFixed(0) : '--'} kg over {cultureDays}d)</span>
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Count-Based Pricing Table */}
        <Card className="border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              💰 Count-Based Pricing
              <Badge variant="outline" className="text-xs">per kg</Badge>
            </CardTitle>
            <CardDescription className="text-xs">Click any price to edit. Lower count = bigger shrimp = higher price.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-1.5">
              {Object.entries(countPrices).sort(([a], [b]) => parseInt(a) - parseInt(b)).map(([count, price]) => {
                const countNum = parseInt(count);
                const isEditing = editingCount === countNum;
                const isCurrent = currentMetrics?.count_bracket === countNum;

                return (
                  <div
                    key={count}
                    className={`rounded-lg p-2 text-center cursor-pointer transition-all ${isCurrent ? 'bg-cyan-100 border-2 border-cyan-400 ring-2 ring-cyan-200' : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'}`}
                    onClick={() => {
                      if (!isEditing) {
                        setEditingCount(countNum);
                        setTempCountPrice(price.toString());
                      }
                    }}
                  >
                    <p className={`text-xs font-semibold ${isCurrent ? 'text-cyan-700' : 'text-gray-500'}`}>{count}ct</p>
                    {isEditing ? (
                      <div className="mt-1">
                        <Input
                          type="number"
                          value={tempCountPrice}
                          onChange={(e) => setTempCountPrice(e.target.value)}
                          className="h-7 text-sm text-center p-1"
                          autoFocus
                          onBlur={() => saveCountPrice(countNum)}
                          onKeyDown={(e) => { if (e.key === 'Enter') saveCountPrice(countNum); if (e.key === 'Escape') setEditingCount(null); }}
                        />
                      </div>
                    ) : (
                      <p className={`text-sm font-bold ${isCurrent ? 'text-cyan-900' : 'text-gray-900'}`}>₹{price}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* === Expense & Profit Tracker === */}
      <Card className="border-slate-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-emerald-500" />
                Expense & Profit Tracker
              </CardTitle>
              <CardDescription>Track all pond expenses to calculate true profit</CardDescription>
            </div>
            <Button size="sm" onClick={() => setShowAddExpense(!showAddExpense)} className="bg-emerald-600 hover:bg-emerald-700 gap-1">
              {showAddExpense ? <X className="h-3.5 w-3.5" /> : <DollarSign className="h-3.5 w-3.5" />}
              {showAddExpense ? 'Cancel' : 'Add Expense'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add Expense Form */}
          {showAddExpense && (
            <div className="rounded-xl bg-gray-50 border border-gray-200 p-4 space-y-3 animate-fade-up">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Category</Label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-sm"
                    value={newExpense.category}
                    onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
                  >
                    {EXPENSE_CATEGORIES.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Description</Label>
                  <Input placeholder="e.g. CP Feed 500kg" value={newExpense.description} onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Amount (₹)</Label>
                  <div className="flex gap-2">
                    <Input type="number" placeholder="Amount" value={newExpense.amount} onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })} />
                    <Button onClick={addExpense} className="bg-emerald-600 hover:bg-emerald-700 shrink-0">
                      <Check className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Expense Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="rounded-lg bg-orange-50 border border-orange-200 p-3">
              <p className="text-xs text-orange-600 font-medium">Total Expenses</p>
              <p className="text-xl font-bold text-orange-900">₹{(totalExpenses / 1000).toFixed(1)}K</p>
            </div>
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
              <p className="text-xs text-amber-600 font-medium">Feed Cost</p>
              <p className="text-xl font-bold text-amber-900">₹{endMetrics ? (endMetrics.cumulative_feed_cost / 1000).toFixed(0) : '--'}K</p>
            </div>
            <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
              <p className="text-xs text-blue-600 font-medium">Est. Revenue</p>
              <p className="text-xl font-bold text-blue-900">₹{endMetrics ? (endMetrics.revenue_if_harvest / 1000).toFixed(0) : '--'}K</p>
            </div>
            <div className={`rounded-lg p-3 ${endMetrics && endMetrics.profit_if_harvest >= 0 ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              <p className={`text-xs font-medium ${endMetrics && endMetrics.profit_if_harvest >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                Est. Profit/Loss
              </p>
              <p className={`text-xl font-bold ${endMetrics && endMetrics.profit_if_harvest >= 0 ? 'text-green-900' : 'text-red-900'}`}>
                ₹{endMetrics ? (endMetrics.profit_if_harvest / 1000).toFixed(0) : '--'}K
              </p>
            </div>
          </div>

          {/* Expense List */}
          {expenses.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-gray-700">Tracked Expenses</p>
              <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
                {expenses.map((expense) => {
                  const cat = EXPENSE_CATEGORIES.find(c => c.value === expense.category);
                  return (
                    <div key={expense.id} className="flex items-center justify-between rounded-lg bg-white border border-gray-200 px-3 py-2 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat?.color || '#64748b' }} />
                        <span className="font-medium text-gray-800">{expense.description || cat?.label}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-gray-900">₹{(expense.amount || 0).toLocaleString()}</span>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => removeExpense(expense.id)}>
                          <X className="h-3 w-3 text-gray-400 hover:text-red-500" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {expenses.length === 0 && !showAddExpense && (
            <Alert className="bg-gray-50 border-gray-200">
              <Info className="h-4 w-4 text-gray-500" />
              <AlertDescription className="text-gray-600 text-sm">
                Track expenses like seed cost, electricity, labor, and chemicals to see your true profit projection. Feed cost is calculated automatically.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* === Harvest Projection Summary === */}
      {endMetrics && bestHarvestDay && (
        <Card className="border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-cyan-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Target className="h-5 w-5 text-emerald-600" />
              Harvest Projection Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-gray-500 font-medium">Best Harvest Day</p>
                <p className="text-2xl font-bold text-emerald-700">Day {bestHarvestDay.day}</p>
                {seedDate && (
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(new Date(seedDate).getTime() + bestHarvestDay.day * 86400000).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </p>
                )}
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Harvest Count</p>
                <p className="text-2xl font-bold text-gray-900">
                  {(projection[bestHarvestDay.day]?.count || 0).toLocaleString() || '--'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {projection[bestHarvestDay.day]?.count_bracket || '--'}ct grade
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Harvest Biomass</p>
                <p className="text-2xl font-bold text-gray-900">
                  {projection[bestHarvestDay.day]?.biomass_kg.toFixed(0) || '--'} kg
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  @ {projection[bestHarvestDay.day]?.weight_g.toFixed(1) || '--'}g avg
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Max Profit</p>
                <p className="text-2xl font-bold text-emerald-700">
                  ₹{(bestHarvestDay.profit / 1000).toFixed(0)}K
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Revenue: ₹{((projection[bestHarvestDay.day]?.revenue_if_harvest || 0) / 1000).toFixed(0)}K
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
