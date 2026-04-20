"use client";

import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { createClient } from '@/lib/supabase/client';
import {
  Sparkles, Loader2, AlertTriangle, CheckCircle2, Clock,
  Droplets, Thermometer, Wind, CloudRain, Sun, Cloud,
  TrendingDown, TrendingUp, Utensils, Zap, ArrowDown, ArrowUp,
  Info
} from 'lucide-react';
import { useUser } from '@/context/user-context';

interface MealSchedule {
  time: string;
  amountKg: number;
  label: string;
}

interface Adjustment {
  factor: string;
  impact: string;
  percentChange: number;
}

interface FeedResult {
  dailyFeedKg: number;
  feedRatePercent: number;
  mealSchedule: MealSchedule[];
  adjustments: Adjustment[];
  projectedFCR: number;
  alerts: string[];
  recommendation: string;
  confidenceScore: number;
}

const WEATHER_OPTIONS = [
  { value: 'sunny', label: 'Sunny / Clear', icon: Sun },
  { value: 'partly_cloudy', label: 'Partly Cloudy', icon: Cloud },
  { value: 'cloudy', label: 'Overcast / Cloudy', icon: Cloud },
  { value: 'rainy', label: 'Rainy', icon: CloudRain },
  { value: 'stormy', label: 'Stormy / Heavy Rain', icon: Wind },
];

export function FCREngine({
  pondName,
  shrimpType,
  initialStock,
  pondArea,
  cycleDay,
  pondId,
}: {
  pondName: string;
  shrimpType: string;
  initialStock: number;
  pondArea: number;
  cycleDay: number;
  pondId: string;
}) {
  const { selectedProfile } = useUser();
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [result, setResult] = useState<FeedResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);

  // Form state
  const [waterTemp, setWaterTemp] = useState('29');
  const [ammonia, setAmmonia] = useState('0.2');
  const [ph, setPh] = useState('7.8');
  const [dissolvedOxygen, setDissolvedOxygen] = useState('6.0');
  const [weather, setWeather] = useState('sunny');
  const [previousFeedKg, setPreviousFeedKg] = useState('');
  const [historicalFCR, setHistoricalFCR] = useState('1.38');

  // Derived estimates
  const survivalRate = useMemo(() => {
    const baseSurvival = shrimpType === 'white' ? 85 : shrimpType === 'tiger' ? 78 : 75;
    const dailyDecay = Math.pow(baseSurvival / 100, 1 / 120);
    return Math.round(Math.pow(dailyDecay, cycleDay) * 100);
  }, [shrimpType, cycleDay]);

  const estimatedCount = useMemo(() => {
    return Math.round(initialStock * (survivalRate / 100));
  }, [initialStock, survivalRate]);

  const estimatedAvgWeight = useMemo(() => {
    const maxW = shrimpType === 'white' ? 35 : shrimpType === 'tiger' ? 45 : 60;
    const k = shrimpType === 'white' ? 0.035 : shrimpType === 'tiger' ? 0.028 : 0.022;
    const t0 = 30;
    return Math.round(maxW * Math.exp(-Math.exp(-k * (cycleDay - t0))) * 10) / 10;
  }, [shrimpType, cycleDay]);

  const estimatedBiomass = useMemo(() => {
    return Math.round((estimatedAvgWeight * estimatedCount) / 1000);
  }, [estimatedAvgWeight, estimatedCount]);

  // Load recent daily logs
  useEffect(() => {
    if (!selectedProfile || !pondId) return;
    // const logsRef = ref(db, `shrimp/${selectedProfile}/daily-logs/${pondId}`);
    // const unsubscribe = onValue(logsRef, (snapshot) => {
    //  ...
    // });
    // return () => unsubscribe();
    setRecentLogs([]);
  }, [selectedProfile, pondId]);

  const handleOptimize = async () => {
    setIsOptimizing(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/feed-optimization', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cycleDay,
          shrimpType,
          estimatedBiomassKg: estimatedBiomass,
          currentAvgWeightG: estimatedAvgWeight,
          waterTemp: Number(waterTemp),
          ammonia: Number(ammonia),
          ph: Number(ph),
          dissolvedOxygen: Number(dissolvedOxygen),
          weather,
          historicalFCR: Number(historicalFCR),
          previousFeedKg: Number(previousFeedKg) || 0,
          survivalRate,
          stockCount: estimatedCount,
          pondAreaHa: pondArea,
        }),
      });

      if (!response.ok) throw new Error('Optimization failed');
      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to optimize feed');
    } finally {
      setIsOptimizing(false);
    }
  };

  const getWaterQualityStatus = () => {
    const temp = Number(waterTemp);
    const amm = Number(ammonia);
    const doVal = Number(dissolvedOxygen);
    const phVal = Number(ph);

    let score = 100;
    if (temp < 26 || temp > 32) score -= 20;
    if (amm > 0.5) score -= 30;
    if (doVal < 4) score -= 25;
    if (phVal < 7 || phVal > 9) score -= 15;

    if (score >= 80) return { label: 'Excellent', color: 'text-emerald-600', bg: 'bg-emerald-100', score };
    if (score >= 60) return { label: 'Good', color: 'text-blue-600', bg: 'bg-blue-100', score };
    if (score >= 40) return { label: 'Fair', color: 'text-amber-600', bg: 'bg-amber-100', score };
    return { label: 'Poor', color: 'text-red-600', bg: 'bg-red-100', score };
  };

  const waterQuality = getWaterQualityStatus();

  return (
    <div className="space-y-5">
      {/* Header */}
      <Card className="border-2 border-orange-200 bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center shadow-md">
                <Zap className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl">FCR Engine — Dynamic Feed Optimizer</CardTitle>
                <CardDescription className="text-sm mt-0.5">
                  AI-powered daily rations for {pondName} • Day {cycleDay}
                </CardDescription>
              </div>
            </div>
            <Badge className="bg-orange-600 text-white text-xs px-3 py-1">
              Baseline FCR: {historicalFCR}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-5 xl:grid-cols-[380px_1fr]">
        {/* === Left: Inputs === */}
        <div className="space-y-4">
          {/* Estimated Stats */}
          <Card className="border-cyan-200 bg-cyan-50/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Info className="h-4 w-4 text-cyan-500" /> Auto-Estimated Values
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg bg-white p-2.5 border border-cyan-200">
                  <p className="text-[11px] text-gray-500 uppercase font-medium">Biomass</p>
                  <p className="text-lg font-bold text-gray-900">{(estimatedBiomass || 0).toLocaleString()} kg</p>
                </div>
                <div className="rounded-lg bg-white p-2.5 border border-cyan-200">
                  <p className="text-[11px] text-gray-500 uppercase font-medium">Avg Weight</p>
                  <p className="text-lg font-bold text-gray-900">{estimatedAvgWeight}g</p>
                </div>
                <div className="rounded-lg bg-white p-2.5 border border-cyan-200">
                  <p className="text-[11px] text-gray-500 uppercase font-medium">Est. Count</p>
                  <p className="text-lg font-bold text-gray-900">{(estimatedCount || 0).toLocaleString()}</p>
                </div>
                <div className="rounded-lg bg-white p-2.5 border border-cyan-200">
                  <p className="text-[11px] text-gray-500 uppercase font-medium">Survival</p>
                  <p className="text-lg font-bold text-gray-900">{survivalRate}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Water Quality Inputs */}
          <Card className="border-blue-200">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Droplets className="h-4 w-4 text-blue-500" /> Water Quality (Today)
                </CardTitle>
                <Badge variant="outline" className={`${waterQuality.bg} ${waterQuality.color} text-xs`}>
                  {waterQuality.label} — {waterQuality.score}%
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs text-gray-600 flex items-center gap-1">
                    <Thermometer className="h-3 w-3" /> Temperature (°C)
                  </Label>
                  <Input
                    type="number" step="0.1" value={waterTemp}
                    onChange={(e) => setWaterTemp(e.target.value)}
                    className="h-9"
                  />
                  <p className="text-[10px] text-gray-400">Optimal: 28-30°C</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-gray-600">Ammonia NH₃ (ppm)</Label>
                  <Input
                    type="number" step="0.01" value={ammonia}
                    onChange={(e) => setAmmonia(e.target.value)}
                    className="h-9"
                  />
                  <p className="text-[10px] text-gray-400">Safe: &lt; 0.5 ppm</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-gray-600">pH</Label>
                  <Input
                    type="number" step="0.1" value={ph}
                    onChange={(e) => setPh(e.target.value)}
                    className="h-9"
                  />
                  <p className="text-[10px] text-gray-400">Optimal: 7.5-8.5</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-gray-600">
                    <span className="flex items-center gap-1">DO (ppm)</span>
                  </Label>
                  <Input
                    type="number" step="0.1" value={dissolvedOxygen}
                    onChange={(e) => setDissolvedOxygen(e.target.value)}
                    className="h-9"
                  />
                  <p className="text-[10px] text-gray-400">Target: &gt; 5.0 ppm</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Weather + Previous Feed */}
          <Card className="border-amber-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <CloudRain className="h-4 w-4 text-amber-500" /> Conditions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs text-gray-600">Weather Today</Label>
                <Select value={weather} onValueChange={setWeather}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {WEATHER_OPTIONS.map((w) => (
                      <SelectItem key={w.value} value={w.value}>{w.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs text-gray-600">Previous Feed (kg)</Label>
                  <Input
                    type="number" step="0.1" value={previousFeedKg}
                    onChange={(e) => setPreviousFeedKg(e.target.value)}
                    className="h-9" placeholder="Yesterday"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-gray-600">Baseline FCR</Label>
                  <Input
                    type="number" step="0.01" value={historicalFCR}
                    onChange={(e) => setHistoricalFCR(e.target.value)}
                    className="h-9"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Optimize Button */}
          <Button
            onClick={handleOptimize}
            disabled={isOptimizing}
            className="w-full gap-2 h-12 text-base bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-lg shadow-orange-200"
          >
            {isOptimizing ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Calculating Optimal Feed...
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5" />
                Optimize Today&apos;s Feed
              </>
            )}
          </Button>
        </div>

        {/* === Right: Results === */}
        <div className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {!result && !isOptimizing && (
            <Card className="border-dashed border-2 border-gray-200">
              <CardContent className="py-16">
                <div className="text-center space-y-3 text-gray-400">
                  <Utensils className="h-12 w-12 mx-auto opacity-40" />
                  <p className="font-medium text-gray-500">No optimization run yet</p>
                  <p className="text-sm">Enter today&apos;s water parameters and click &quot;Optimize&quot; to get AI-calculated feed rations</p>
                </div>
              </CardContent>
            </Card>
          )}

          {isOptimizing && (
            <Card>
              <CardContent className="py-12">
                <div className="text-center space-y-4">
                  <div className="relative w-16 h-16 mx-auto">
                    <div className="absolute inset-0 rounded-full border-4 border-orange-100" />
                    <div className="absolute inset-0 rounded-full border-4 border-t-orange-500 animate-spin" />
                    <Zap className="absolute inset-0 m-auto h-6 w-6 text-orange-500" />
                  </div>
                  <p className="text-gray-600 font-medium">Analyzing water quality, biomass & weather...</p>
                  <p className="text-sm text-gray-400">Computing optimal feed rations with FCR targeting</p>
                </div>
              </CardContent>
            </Card>
          )}

          {result && (
            <>
              {/* Daily Feed Hero */}
              <Card className="border-2 border-emerald-300 bg-gradient-to-br from-emerald-50 to-green-50 overflow-hidden">
                <CardContent className="pt-5 pb-5">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="space-y-1">
                      <p className="text-sm text-emerald-600 font-medium uppercase tracking-wide">Recommended Daily Feed</p>
                      <p className="text-5xl font-bold text-gray-900">{result.dailyFeedKg.toFixed(1)} <span className="text-lg text-gray-500 font-normal">kg</span></p>
                      <p className="text-sm text-gray-600">Feed rate: {result.feedRatePercent.toFixed(2)}% of biomass</p>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <div className="w-20 h-20 rounded-full border-4 border-emerald-400 flex items-center justify-center bg-white shadow-sm">
                        <div className="text-center">
                          <p className="text-xl font-bold text-emerald-700">{result.projectedFCR.toFixed(2)}</p>
                          <p className="text-[9px] text-gray-500 uppercase">FCR</p>
                        </div>
                      </div>
                      <Badge className={`text-xs ${result.projectedFCR <= Number(historicalFCR) ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                        {result.projectedFCR <= Number(historicalFCR) ? '✓ On Target' : '⚠ Above Baseline'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Meal Schedule */}
              <Card className="border-amber-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Clock className="h-4 w-4 text-amber-500" /> 4-Meal Schedule
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {(result.mealSchedule || []).map((meal, idx) => (
                      <div key={idx} className="rounded-xl bg-gradient-to-b from-amber-50 to-orange-50 border border-amber-200 p-3 text-center">
                        <p className="text-xs text-gray-500 font-medium">{meal.label}</p>
                        <p className="text-sm font-bold text-amber-800 mt-0.5">{meal.time}</p>
                        <div className="mt-2 pt-2 border-t border-amber-200">
                          <p className="text-2xl font-bold text-gray-900">{meal.amountKg.toFixed(1)}</p>
                          <p className="text-[10px] text-gray-500">kg</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Adjustments */}
              {result.adjustments && result.adjustments.length > 0 && (
                <Card className="border-purple-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <TrendingDown className="h-4 w-4 text-purple-500" /> Feed Adjustments Applied
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {result.adjustments.map((adj, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-2">
                            {adj.percentChange < 0 ? (
                              <ArrowDown className="h-4 w-4 text-red-500" />
                            ) : (
                              <ArrowUp className="h-4 w-4 text-emerald-500" />
                            )}
                            <span className="text-sm font-medium text-gray-700">{adj.factor}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">{adj.impact}</span>
                            <Badge variant="outline" className={
                              adj.percentChange < 0 ? 'text-red-600 border-red-200' : 'text-emerald-600 border-emerald-200'
                            }>
                              {adj.percentChange > 0 ? '+' : ''}{adj.percentChange}%
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Alerts */}
              {result.alerts && result.alerts.length > 0 && (
                <div className="space-y-2">
                  {result.alerts.map((alert, idx) => (
                    <Alert key={idx} variant="destructive" className="border-red-200 bg-red-50">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription className="text-sm">{alert}</AlertDescription>
                    </Alert>
                  ))}
                </div>
              )}

              {/* AI Recommendation */}
              <Card className="border-blue-200 bg-blue-50/50">
                <CardContent className="pt-4 pb-4">
                  <div className="flex gap-3">
                    <Sparkles className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-blue-900 mb-1">AI Recommendation</p>
                      <p className="text-sm text-blue-800 leading-relaxed">{result.recommendation}</p>
                    </div>
                  </div>
                  {result.confidenceScore && (
                    <div className="mt-3 flex items-center gap-2">
                      <p className="text-xs text-gray-500">Confidence:</p>
                      <Progress value={result.confidenceScore} className="h-2 flex-1" />
                      <p className="text-xs font-bold text-gray-700">{result.confidenceScore}%</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
