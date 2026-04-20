"use client";

import { useState, useMemo, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { createClient } from '@/lib/supabase/client';
import {
  ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine, Scatter
} from 'recharts';
import {
  Sparkles, Loader2, Plus, Trash2, TrendingUp, TrendingDown,
  AlertTriangle, CheckCircle2, Target, Scale, Activity, Fish,
  Calendar, ArrowUpRight, ArrowDownRight, BarChart3
} from 'lucide-react';
import { useUser } from '@/context/user-context';

interface SamplingEntry {
  id?: string;
  week: number;
  avgWeightG: number;
  estimatedSurvivalPct: number;
  sampleSize: number;
  date: string;
  notes?: string;
}

interface GrowthAnalysis {
  idealCurve: { week: number; expectedWeightG: number }[];
  growthStatus: 'on_track' | 'ahead' | 'behind' | 'severely_behind';
  growthDeviationPct: number;
  estimatedBiomassKg: number;
  estimatedSurvivalPct: number;
  estimatedCurrentCount: number;
  projectedHarvestDate: { daysFromNow: number; atCurrentRate: boolean };
  projectedHarvestWeightG: number;
  projectedYieldKg: number;
  weeklyGrowthRateG: number;
  alerts: { severity: string; message: string }[];
  recommendations: string[];
  analysis: string;
}

// Gompertz growth model for ideal curve generation
const SPECIES_GROWTH: Record<string, { maxWeight: number; k: number; t0: number }> = {
  white: { maxWeight: 35, k: 0.035, t0: 30 },
  tiger: { maxWeight: 45, k: 0.028, t0: 35 },
  giant: { maxWeight: 60, k: 0.022, t0: 40 },
};

export function GrowthBiomassTracker({
  pondName,
  shrimpType,
  initialStock,
  cycleDay,
  pondId,
  farmingType,
  targetHarvestWeightG = 30,
}: {
  pondName: string;
  shrimpType: string;
  initialStock: number;
  cycleDay: number;
  pondId: string;
  farmingType?: string;
  targetHarvestWeightG?: number;
}) {
  const { selectedProfile } = useUser();
  const [samplingData, setSamplingData] = useState<SamplingEntry[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<GrowthAnalysis | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // New sampling form
  const [newEntry, setNewEntry] = useState<Partial<SamplingEntry>>({
    week: Math.ceil(cycleDay / 7),
    avgWeightG: 0,
    estimatedSurvivalPct: 85,
    sampleSize: 50,
    date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  // Load sampling data from Firebase
  useEffect(() => {
    if (!selectedProfile || !pondId) return;
    /* supabased ref init */
    const unsubscribe = onValue(samplingRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const entries = Object.entries(data).map(([id, entry]: [string, any]) => ({
          id,
          ...entry,
        }));
        entries.sort((a: any, b: any) => a.week - b.week);
        setSamplingData(entries);
      } else {
        setSamplingData([]);
      }
    });
    return () => unsubscribe();
  }, [selectedProfile, pondId]);

  // Generate ideal growth curve locally
  const idealCurve = useMemo(() => {
    const params = SPECIES_GROWTH[shrimpType] || SPECIES_GROWTH.white;
    const weeks: { week: number; idealWeightG: number; day: number }[] = [];
    for (let w = 0; w <= 17; w++) {
      const day = w * 7;
      const weight = params.maxWeight * Math.exp(-Math.exp(-params.k * (day - params.t0)));
      weeks.push({
        week: w,
        idealWeightG: Math.round(Math.max(0.1, weight) * 10) / 10,
        day,
      });
    }
    return weeks;
  }, [shrimpType]);

  // Combined chart data
  const chartData = useMemo(() => {
    const data = idealCurve.map((point) => {
      const actual = samplingData.find((s) => s.week === point.week);
      return {
        week: point.week,
        day: point.day,
        idealWeight: point.idealWeightG,
        actualWeight: actual ? actual.avgWeightG : undefined,
        deviation: actual
          ? Math.round(((actual.avgWeightG - point.idealWeightG) / point.idealWeightG) * 100)
          : undefined,
      };
    });
    return data;
  }, [idealCurve, samplingData]);

  // Latest biomass estimate
  const currentBiomass = useMemo(() => {
    if (samplingData.length === 0) return null;
    const latest = samplingData[samplingData.length - 1];
    const currentCount = Math.round(initialStock * (latest.estimatedSurvivalPct / 100));
    const biomassKg = (latest.avgWeightG * currentCount) / 1000;
    return {
      weightG: latest.avgWeightG,
      count: currentCount,
      biomassKg: Math.round(biomassKg),
      survivalPct: latest.estimatedSurvivalPct,
      weeklyGrowthRate: samplingData.length >= 2
        ? (samplingData[samplingData.length - 1].avgWeightG - samplingData[samplingData.length - 2].avgWeightG)
        : 0,
    };
  }, [samplingData, initialStock]);

  // Growth status
  const growthStatus = useMemo(() => {
    if (samplingData.length === 0 || !currentBiomass) return null;
    const currentWeek = Math.ceil(cycleDay / 7);
    const idealPoint = idealCurve.find((p) => p.week === currentWeek);
    if (!idealPoint) return null;

    const deviation = ((currentBiomass.weightG - idealPoint.idealWeightG) / idealPoint.idealWeightG) * 100;

    if (deviation >= 5) return { status: 'ahead', label: 'Ahead of Schedule', color: 'text-emerald-600', bg: 'bg-emerald-100', icon: ArrowUpRight, deviation };
    if (deviation >= -5) return { status: 'on_track', label: 'On Track', color: 'text-blue-600', bg: 'bg-blue-100', icon: Target, deviation };
    if (deviation >= -15) return { status: 'behind', label: 'Falling Behind', color: 'text-amber-600', bg: 'bg-amber-100', icon: ArrowDownRight, deviation };
    return { status: 'severely_behind', label: 'Severely Behind', color: 'text-red-600', bg: 'bg-red-100', icon: AlertTriangle, deviation };
  }, [samplingData, currentBiomass, cycleDay, idealCurve]);

  const handleAddSample = useCallback(async () => {
    if (!selectedProfile || !pondId) return;
    if (!newEntry.avgWeightG || newEntry.avgWeightG <= 0) return;

    /* supabased ref init */
    const newRef = push(samplingRef);
    await set(newRef, {
      week: newEntry.week || Math.ceil(cycleDay / 7),
      avgWeightG: Number(newEntry.avgWeightG),
      estimatedSurvivalPct: Number(newEntry.estimatedSurvivalPct) || 85,
      sampleSize: Number(newEntry.sampleSize) || 50,
      date: newEntry.date || new Date().toISOString().split('T')[0],
      notes: newEntry.notes || '',
    });

    setNewEntry({
      week: Math.ceil(cycleDay / 7) + 1,
      avgWeightG: 0,
      estimatedSurvivalPct: 85,
      sampleSize: 50,
      date: new Date().toISOString().split('T')[0],
      notes: '',
    });
    setShowAddForm(false);
  }, [selectedProfile, pondId, newEntry, cycleDay]);

  const handleDeleteSample = useCallback(async (sampleId: string) => {
    if (!selectedProfile || !pondId) return;
    /* supabased ref init */
    await remove(sampleRef);
  }, [selectedProfile, pondId]);

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/growth-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shrimpType,
          cycleDay,
          samplingData,
          stockingCount: initialStock,
          targetHarvestWeightG,
          farmingType: farmingType || 'semi-intensive',
        }),
      });

      if (!response.ok) throw new Error('Analysis failed');
      const data = await response.json();
      setAnalysis(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze growth');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <Card className="border-2 border-violet-200 bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50 overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center shadow-md">
                <BarChart3 className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl">Growth Curve & Biomass Tracker</CardTitle>
                <CardDescription className="text-sm mt-0.5">
                  Weekly sampling vs ideal {shrimpType} growth profile • {pondName}
                </CardDescription>
              </div>
            </div>
            {growthStatus && (
              <Badge className={`${growthStatus.bg} ${growthStatus.color} text-xs px-3 py-1 gap-1`}>
                <growthStatus.icon className="h-3 w-3" />
                {growthStatus.label} ({growthStatus.deviation > 0 ? '+' : ''}{growthStatus.deviation.toFixed(1)}%)
              </Badge>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* KPI Summary */}
      {currentBiomass && (
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-5">
          <Card className="border-cyan-200 bg-gradient-to-br from-cyan-50 to-sky-50">
            <CardContent className="pt-3 pb-3">
              <p className="text-[11px] text-gray-500 uppercase font-medium">Avg Weight</p>
              <p className="text-2xl font-bold text-gray-900">{currentBiomass.weightG.toFixed(1)}g</p>
              {currentBiomass.weeklyGrowthRate > 0 && (
                <p className="text-xs text-emerald-600 flex items-center gap-0.5">
                  <TrendingUp className="h-3 w-3" /> +{currentBiomass.weeklyGrowthRate.toFixed(1)}g/wk
                </p>
              )}
            </CardContent>
          </Card>
          <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-green-50">
            <CardContent className="pt-3 pb-3">
              <p className="text-[11px] text-gray-500 uppercase font-medium">Biomass</p>
              <p className="text-2xl font-bold text-gray-900">{(currentBiomass.biomassKg || 0).toLocaleString()} kg</p>
            </CardContent>
          </Card>
          <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
            <CardContent className="pt-3 pb-3">
              <p className="text-[11px] text-gray-500 uppercase font-medium">Est. Count</p>
              <p className="text-2xl font-bold text-gray-900">{(currentBiomass.count || 0).toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-yellow-50">
            <CardContent className="pt-3 pb-3">
              <p className="text-[11px] text-gray-500 uppercase font-medium">Survival</p>
              <p className="text-2xl font-bold text-gray-900">{currentBiomass.survivalPct}%</p>
            </CardContent>
          </Card>
          <Card className="border-violet-200 bg-gradient-to-br from-violet-50 to-purple-50">
            <CardContent className="pt-3 pb-3">
              <p className="text-[11px] text-gray-500 uppercase font-medium">Samples</p>
              <p className="text-2xl font-bold text-gray-900">{samplingData.length}</p>
              <p className="text-xs text-violet-600">data points</p>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
        {/* === Left: Chart + Analysis === */}
        <div className="space-y-4">
          {/* Growth Curve Chart */}
          <Card className="border-slate-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="h-4 w-4 text-violet-500" />
                Growth Curve — Ideal vs Actual
              </CardTitle>
              <CardDescription>
                Ideal {shrimpType} Gompertz curve (line) vs your sampling data (dots)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[340px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartData} margin={{ top: 10, right: 24, left: 0, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="4 4" stroke="#e2e8f0" />
                    <XAxis
                      dataKey="week"
                      tickFormatter={(v) => `W${v}`}
                      tick={{ fontSize: 11 }}
                    />
                    <YAxis
                      tickFormatter={(v) => `${v}g`}
                      width={50}
                      tick={{ fontSize: 11 }}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const d = payload[0]?.payload;
                        return (
                          <div className="glass-card rounded-lg p-3 shadow-lg text-xs space-y-1 min-w-[160px]">
                            <p className="font-bold text-gray-900">Week {d?.week} (Day {d?.day})</p>
                            <p className="text-violet-600">Ideal: {d?.idealWeight}g</p>
                            {d?.actualWeight && (
                              <>
                                <p className="text-emerald-600">Actual: {d.actualWeight}g</p>
                                <p className={d.deviation >= 0 ? 'text-emerald-600' : 'text-red-600'}>
                                  Deviation: {d.deviation > 0 ? '+' : ''}{d.deviation}%
                                </p>
                              </>
                            )}
                          </div>
                        );
                      }}
                    />
                    <Legend />
                    {/* Ideal growth curve */}
                    <Line
                      type="monotone"
                      dataKey="idealWeight"
                      name="Ideal Growth"
                      stroke="#8b5cf6"
                      strokeWidth={2.5}
                      strokeDasharray="6 3"
                      dot={false}
                    />
                    {/* Actual data points */}
                    <Scatter
                      dataKey="actualWeight"
                      name="Actual Weight"
                      fill="#10b981"
                      shape="circle"
                    />
                    {/* Current week reference line */}
                    <ReferenceLine
                      x={Math.ceil(cycleDay / 7)}
                      stroke="#6366f1"
                      strokeDasharray="4 4"
                      label={{ value: 'Now', position: 'top', fontSize: 11 }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* AI Analysis Results */}
          {analysis && (
            <div className="space-y-4">
              {/* Analysis Summary */}
              <Card className="border-violet-200 bg-violet-50/50">
                <CardContent className="pt-4 pb-4">
                  <div className="flex gap-3">
                    <Sparkles className="h-5 w-5 text-violet-500 flex-shrink-0 mt-0.5" />
                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-violet-900">AI Growth Analysis</p>
                      <p className="text-sm text-violet-800 leading-relaxed">{analysis.analysis}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Projections */}
              <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
                <Card className="border-emerald-200">
                  <CardContent className="pt-3 pb-3 text-center">
                    <p className="text-[11px] text-gray-500 uppercase font-medium">Harvest In</p>
                    <p className="text-2xl font-bold text-emerald-700">{analysis.projectedHarvestDate?.daysFromNow || '--'}d</p>
                  </CardContent>
                </Card>
                <Card className="border-blue-200">
                  <CardContent className="pt-3 pb-3 text-center">
                    <p className="text-[11px] text-gray-500 uppercase font-medium">Harvest Weight</p>
                    <p className="text-2xl font-bold text-blue-700">{analysis.projectedHarvestWeightG || '--'}g</p>
                  </CardContent>
                </Card>
                <Card className="border-amber-200">
                  <CardContent className="pt-3 pb-3 text-center">
                    <p className="text-[11px] text-gray-500 uppercase font-medium">Est. Yield</p>
                    <p className="text-2xl font-bold text-amber-700">{(analysis.projectedYieldKg || 0).toLocaleString()} kg</p>
                  </CardContent>
                </Card>
                <Card className="border-violet-200">
                  <CardContent className="pt-3 pb-3 text-center">
                    <p className="text-[11px] text-gray-500 uppercase font-medium">Growth Rate</p>
                    <p className="text-2xl font-bold text-violet-700">{analysis.weeklyGrowthRateG || '--'}g/wk</p>
                  </CardContent>
                </Card>
              </div>

              {/* Alerts */}
              {analysis.alerts && analysis.alerts.length > 0 && (
                <div className="space-y-2">
                  {analysis.alerts.map((alert, idx) => (
                    <Alert key={idx} variant={alert.severity === 'critical' ? 'destructive' : 'default'}
                      className={
                        alert.severity === 'critical' ? 'border-red-200 bg-red-50' :
                        alert.severity === 'warning' ? 'border-amber-200 bg-amber-50' :
                        'border-blue-200 bg-blue-50'
                      }
                    >
                      {alert.severity === 'critical' ? <AlertTriangle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                      <AlertDescription className="text-sm">{alert.message}</AlertDescription>
                    </Alert>
                  ))}
                </div>
              )}

              {/* Recommendations */}
              {analysis.recommendations && analysis.recommendations.length > 0 && (
                <Card className="border-emerald-200 bg-emerald-50/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      Recommendations
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {analysis.recommendations.map((rec, idx) => (
                        <li key={idx} className="flex gap-2 text-sm text-gray-700">
                          <span className="text-emerald-600 font-bold flex-shrink-0">{idx + 1}.</span>
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>

        {/* === Right: Sampling Input === */}
        <div className="space-y-4">
          {/* Add Sample Button */}
          <Button
            onClick={() => setShowAddForm(!showAddForm)}
            className="w-full gap-2 bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 shadow-lg shadow-violet-200"
          >
            <Plus className="h-4 w-4" />
            Add Weekly Sampling Data
          </Button>

          {/* Add Sample Form */}
          {showAddForm && (
            <Card className="border-violet-200 bg-violet-50/30 animate-in slide-in-from-top duration-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">New Sampling Entry</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Week #</Label>
                    <Input
                      type="number" min={1} max={18}
                      value={newEntry.week || ''}
                      onChange={(e) => setNewEntry({ ...newEntry, week: Number(e.target.value) })}
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Date</Label>
                    <Input
                      type="date"
                      value={newEntry.date || ''}
                      onChange={(e) => setNewEntry({ ...newEntry, date: e.target.value })}
                      className="h-9"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-violet-700">Average Weight (g) *</Label>
                  <Input
                    type="number" step="0.1" min={0}
                    value={newEntry.avgWeightG || ''}
                    onChange={(e) => setNewEntry({ ...newEntry, avgWeightG: Number(e.target.value) })}
                    className="h-9 border-violet-300"
                    placeholder="e.g. 12.5"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Survival Est. (%)</Label>
                    <Input
                      type="number" min={0} max={100}
                      value={newEntry.estimatedSurvivalPct || ''}
                      onChange={(e) => setNewEntry({ ...newEntry, estimatedSurvivalPct: Number(e.target.value) })}
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Sample Size</Label>
                    <Input
                      type="number" min={1}
                      value={newEntry.sampleSize || ''}
                      onChange={(e) => setNewEntry({ ...newEntry, sampleSize: Number(e.target.value) })}
                      className="h-9"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Notes (optional)</Label>
                  <Input
                    value={newEntry.notes || ''}
                    onChange={(e) => setNewEntry({ ...newEntry, notes: e.target.value })}
                    className="h-9"
                    placeholder="Observations..."
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleAddSample} className="flex-1 h-9 gap-1 bg-violet-600 hover:bg-violet-700">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Save
                  </Button>
                  <Button variant="outline" onClick={() => setShowAddForm(false)} className="h-9">
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Sampling History */}
          <Card className="border-gray-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Scale className="h-4 w-4 text-gray-500" /> Sampling History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {samplingData.length === 0 ? (
                <div className="text-center py-8 text-gray-400 space-y-2">
                  <Scale className="h-8 w-8 mx-auto opacity-40" />
                  <p className="text-sm">No samples recorded yet</p>
                  <p className="text-xs">Add weekly weight samples to track growth</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {samplingData.map((sample) => {
                    const idealWeight = idealCurve.find((p) => p.week === sample.week)?.idealWeightG || 0;
                    const dev = idealWeight > 0
                      ? Math.round(((sample.avgWeightG - idealWeight) / idealWeight) * 100)
                      : 0;
                    return (
                      <div key={sample.id} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg group">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 text-xs font-bold flex-shrink-0">
                            W{sample.week}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-900">{sample.avgWeightG}g</p>
                            <p className="text-[10px] text-gray-500">
                              Survival: {sample.estimatedSurvivalPct}% • n={sample.sampleSize}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={`text-[10px] ${dev >= 0 ? 'text-emerald-600 border-emerald-200' : 'text-red-600 border-red-200'}`}>
                            {dev >= 0 ? '+' : ''}{dev}%
                          </Badge>
                          <Button
                            variant="ghost" size="sm"
                            className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => sample.id && handleDeleteSample(sample.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5 text-gray-400 hover:text-red-500" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* AI Analysis Button */}
          <Button
            onClick={handleAnalyze}
            disabled={isAnalyzing || samplingData.length === 0}
            className="w-full gap-2 h-11 bg-gradient-to-r from-purple-500 to-fuchsia-500 hover:from-purple-600 hover:to-fuchsia-600 shadow-lg shadow-purple-200"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Analyzing Growth Pattern...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Run AI Growth Analysis
              </>
            )}
          </Button>

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {samplingData.length === 0 && (
            <Alert className="border-violet-200 bg-violet-50">
              <Fish className="h-4 w-4 text-violet-500" />
              <AlertDescription className="text-sm text-violet-700">
                Add at least one weekly sampling entry to enable growth curve tracking and AI analysis.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </div>
    </div>
  );
}
