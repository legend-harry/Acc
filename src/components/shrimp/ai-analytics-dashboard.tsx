"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter } from 'recharts';
import { TrendingUp, TrendingDown, AlertTriangle, Zap, CheckCircle, Info, Lightbulb } from 'lucide-react';
import { useUser } from '@/context/user-context';
import { FeedChartQuestionnaire } from './feed-chart-questionnaire';
import { createClient } from '@/lib/supabase/client';

const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

interface AnalyticsData {
  pondId: string;
  pondName: string;
  daysCycle: number;
  avgFeedQuantity: number | null;
  avgConsumption: number | null;
  avgWastage: number | null;
  avgWaterQuality: {
    ph: number | null;
    do: number | null;
    ammonia: number | null;
    temp: number | null;
  };
  trends: Array<{
    day: string;
    feedQty: number | null;
    consumption: number | null;
    wastage: number | null;
    growth: number | null;
  }>;
  healthIndicators: {
    score: number | null;
    status: 'excellent' | 'good' | 'fair' | 'poor' | 'unknown';
    issues: string[];
  };
  recommendations: Array<{
    type: 'optimization' | 'warning' | 'suggestion';
    title: string;
    description: string;
    impact: 'high' | 'medium' | 'low';
  }>;
  predictedYield: number | null;
  currentRoi: number | null;
}

export function AIAnalyticsDashboard({ 
  pondId, 
  pondName,
  currentStock,
  pondArea,
  farmingType,
  cycleDay,
}: { 
  pondId: string; 
  pondName: string;
  currentStock: number;
  pondArea: number;
  farmingType: 'extensive' | 'semi-intensive' | 'intensive';
  cycleDay: number;
}) {
  const { selectedProfile } = useUser();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [missingFields, setMissingFields] = useState<string[]>([]);

  useEffect(() => {
    if (!selectedProfile || !pondId) {
      setError('No profile or pond selected');
      setLoading(false);
      return;
    }

    // Fetch daily logs for this specific pond
    /* supabased ref init */
    
    const unsubscribe = onValue(dailyLogsRef, (snapshot) => {
      try {
        const logsData = snapshot.val();
        
        if (!logsData || Object.keys(logsData).length === 0) {
          // No data available yet
          setAnalytics(null);
          setMissingFields([]);
          setLoading(false);
          return;
        }

        // Convert logs object to array and sort by date
        const logsArray = Object.values(logsData) as any[];
        const sortedLogs = logsArray.sort((a, b) => new Date(a.date || 0).getTime() - new Date(b.date || 0).getTime());

        const totalLogs = sortedLogs.length;
        const toNumber = (value: unknown) => {
          const numeric = typeof value === 'string' ? Number(value) : Number(value);
          return Number.isFinite(numeric) ? numeric : null;
        };

        const averageOf = (field: string) => {
          const values = sortedLogs
            .map((log) => toNumber(log[field]))
            .filter((value): value is number => value !== null);
          if (values.length === 0) return null;
          return values.reduce((sum, value) => sum + value, 0) / values.length;
        };

        const avgFeedQuantity = averageOf('feedingAmount');
        const avgConsumption = averageOf('feedingConsumption');
        const avgWastage = avgConsumption === null ? null : 100 - avgConsumption;
        const avgWaterQuality = {
          ph: averageOf('ph'),
          do: averageOf('do'),
          ammonia: averageOf('ammonia'),
          temp: averageOf('temperature'),
        };

        // Create trends from actual database data (last 10 logs)
        const trends = sortedLogs.slice(-10).map((log, index) => {
          const feedQty = toNumber(log.feedingAmount);
          const consumption = toNumber(log.feedingConsumption);
          const wastage = consumption === null ? null : 100 - consumption;
          const growth = toNumber(log.avgWeight ?? log.growthWeight);

          return {
            day: `D${index + 1}`,
            feedQty,
            consumption,
            wastage,
            growth,
          };
        });

        // Calculate health score based on actual parameters
        let healthScore: number | null = 100;
        let issues: string[] = [];

        if (
          avgWaterQuality.ph === null ||
          avgWaterQuality.do === null ||
          avgWaterQuality.ammonia === null ||
          avgWaterQuality.temp === null ||
          avgConsumption === null
        ) {
          healthScore = null;
          issues.push('Insufficient water quality or feeding data');
        } else {
          if (avgWaterQuality.ph < 7.0 || avgWaterQuality.ph > 8.5) {
            healthScore -= 15;
            issues.push('pH levels outside optimal range');
          }
          if (avgWaterQuality.do < 4) {
            healthScore -= 20;
            issues.push('Dissolved oxygen critically low');
          }
          if (avgWaterQuality.ammonia > 0.5) {
            healthScore -= 15;
            issues.push('Ammonia levels elevated');
          }
          if (avgWaterQuality.temp < 27 || avgWaterQuality.temp > 31) {
            healthScore -= 10;
            issues.push('Temperature outside optimal range');
          }
          if (avgConsumption < 85) {
            healthScore -= 10;
            issues.push('Feed consumption below target');
          }

          healthScore = Math.max(0, Math.min(100, healthScore));
        }

        // Determine health status
        let healthStatus: 'excellent' | 'good' | 'fair' | 'poor' | 'unknown' = 'unknown';
        if (healthScore !== null) {
          if (healthScore >= 90) healthStatus = 'excellent';
          else if (healthScore >= 75) healthStatus = 'good';
          else if (healthScore >= 60) healthStatus = 'fair';
          else healthStatus = 'poor';
        }

        // Generate recommendations based on actual data
        const recommendations = [];
        
        if (avgConsumption !== null && avgConsumption < 90) {
          recommendations.push({
            type: 'optimization' as const,
            title: 'Optimize Feeding Schedule',
            description: `Current consumption is ${avgConsumption.toFixed(1)}%. Increase feed quantity by 2-3% to reach 95% consumption.`,
            impact: 'high' as const,
          });
        }
        
        if (avgWaterQuality.ammonia !== null && avgWaterQuality.ammonia > 0.3) {
          recommendations.push({
            type: 'warning' as const,
            title: 'Water Quality Alert',
            description: `Ammonia levels at ${avgWaterQuality.ammonia.toFixed(2)} ppm. Increase aeration and check filtration.`,
            impact: 'high' as const,
          });
        }
        
        if (avgWaterQuality.do !== null && avgWaterQuality.do < 5) {
          recommendations.push({
            type: 'warning' as const,
            title: 'Low Dissolved Oxygen',
            description: `DO at ${avgWaterQuality.do.toFixed(1)} ppm. Enhance aeration immediately.`,
            impact: 'high' as const,
          });
        }

        if (recommendations.length === 0 && healthScore !== null) {
          recommendations.push({
            type: 'suggestion' as const,
            title: 'Continue Current Management',
            description: 'All parameters are within optimal ranges. Maintain current practices.',
            impact: 'low' as const,
          });
        }

        const predictedYield = null;
        const currentRoi = null;

        const missing: string[] = [];
        if (avgWaterQuality.ph === null) missing.push('pH');
        if (avgWaterQuality.do === null) missing.push('DO');
        if (avgWaterQuality.ammonia === null) missing.push('Ammonia');
        if (avgWaterQuality.temp === null) missing.push('Temperature');
        if (avgFeedQuantity === null) missing.push('Feed quantity');
        if (avgConsumption === null) missing.push('Feed consumption');
        setMissingFields(missing);

        const calculatedAnalytics: AnalyticsData = {
          pondId,
          pondName,
          daysCycle: totalLogs,
          avgFeedQuantity: avgFeedQuantity === null ? null : Math.round(avgFeedQuantity * 100) / 100,
          avgConsumption: avgConsumption === null ? null : Math.round(avgConsumption * 100) / 100,
          avgWastage: avgWastage === null ? null : Math.round(avgWastage * 100) / 100,
          avgWaterQuality: {
            ph: avgWaterQuality.ph === null ? null : Math.round(avgWaterQuality.ph * 10) / 10,
            do: avgWaterQuality.do === null ? null : Math.round(avgWaterQuality.do * 10) / 10,
            ammonia: avgWaterQuality.ammonia === null ? null : Math.round(avgWaterQuality.ammonia * 100) / 100,
            temp: avgWaterQuality.temp === null ? null : Math.round(avgWaterQuality.temp),
          },
          trends,
          healthIndicators: {
            score: healthScore,
            status: healthStatus,
            issues,
          },
          recommendations,
          predictedYield,
          currentRoi,
        };

        setAnalytics(calculatedAnalytics);
        setLoading(false);
      } catch (err) {
        console.error('Error processing analytics:', err);
        setError('Error processing data from database');
        setLoading(false);
      }
    }, (error) => {
      console.error('Database error:', error);
      setError('Unable to fetch data from database');
      setLoading(false);
    });

    return unsubscribe;
  }, [pondId, selectedProfile]);

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center h-40">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-sm text-gray-600">🤖 Analyzing {pondName} data from database...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!analytics) {
    return (
      <Card>
        <CardContent className="pt-6 space-y-4">
          <Alert>
            <AlertDescription>
              No daily logs found for {pondName}. Add logs to unlock analytics.
            </AlertDescription>
          </Alert>
          {DEMO_MODE && (
            <div className="space-y-3">
              <Alert className="border border-amber-200 bg-amber-50">
                <AlertDescription>
                  Demo mode: preview-only feed chart shown. Disable by setting NEXT_PUBLIC_DEMO_MODE=false.
                </AlertDescription>
              </Alert>
              <FeedChartQuestionnaire
                pondId={pondId}
                pondName={pondName}
                currentStock={currentStock}
                pondArea={pondArea}
                farmingType={farmingType}
                cycleDay={cycleDay}
                onDataSubmit={(data) => {
                  console.log('Feed chart designed:', data);
                }}
              />
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  const getHealthColor = (status: string) => {
    switch (status) {
      case 'excellent':
        return 'bg-green-100 border-green-300 text-green-800';
      case 'good':
        return 'bg-blue-100 border-blue-300 text-blue-800';
      case 'fair':
        return 'bg-yellow-100 border-yellow-300 text-yellow-800';
      case 'poor':
        return 'bg-red-100 border-red-300 text-red-800';
      case 'unknown':
        return 'bg-gray-100 border-gray-300 text-gray-800';
      default:
        return 'bg-gray-100 border-gray-300 text-gray-800';
    }
  };

  const getRecommendationIcon = (type: string) => {
    switch (type) {
      case 'optimization':
        return <Zap className="h-4 w-4" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4" />;
      case 'suggestion':
        return <Lightbulb className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const formatMetric = (value: number | null, suffix = '') => {
    if (value === null) return `--${suffix}`;
    return `${value}${suffix}`;
  };

  const hasFeedTrend = analytics.trends.some((item) => item.feedQty !== null || item.consumption !== null);
  const hasGrowthTrend = analytics.trends.some((item) => item.growth !== null);

  return (
    <div className="space-y-6">
      {/* Header with Pond Identifier */}
      <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-cyan-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">🤖 AI-Powered Analytics</CardTitle>
              <CardDescription className="mt-1">
                Automated analysis of {pondName} • Cycle Day {analytics.daysCycle}/120
              </CardDescription>
            </div>
            <Badge className="bg-blue-600 text-white text-sm px-3 py-1">
              {pondName}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Health Score Card */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className={`${getHealthColor(analytics.healthIndicators.status)} border-2`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pond Health Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {analytics.healthIndicators.score === null ? '--' : `${analytics.healthIndicators.score}/100`}
            </div>
            <div className="flex items-center gap-1 mt-2">
              <CheckCircle className="h-4 w-4" />
              <p className="text-xs capitalize font-medium">{analytics.healthIndicators.status}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">📊 Avg Feed Qty</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{formatMetric(analytics.avgFeedQuantity, ' kg')}</div>
            <p className="text-xs text-gray-600 mt-1">Daily average</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">✅ Consumption Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{formatMetric(analytics.avgConsumption, '%')}</div>
            <p className="text-xs text-gray-600 mt-1">Based on recorded logs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">🎯 Predicted Yield</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {analytics.predictedYield === null ? '--' : `${(analytics.predictedYield / 1000).toFixed(0)}K`}
            </div>
            <p className="text-xs text-gray-600 mt-1">Requires yield data</p>
          </CardContent>
        </Card>
      </div>

      {missingFields.length > 0 && (
        <Alert className="border border-amber-200 bg-amber-50">
          <AlertDescription>
            Missing data: {missingFields.join(', ')}. Add daily logs or upload documents to fill these fields.
          </AlertDescription>
        </Alert>
      )}

      {/* Water Quality Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            💧 Water Quality Summary - {pondName}
          </CardTitle>
          <CardDescription>Average values from daily monitoring</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-xs text-gray-600 uppercase font-semibold">pH Level</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">{formatMetric(analytics.avgWaterQuality.ph)}</p>
              <p className="text-xs text-gray-500 mt-1">Optimal: 7.5-8.5</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg border border-green-200">
              <p className="text-xs text-gray-600 uppercase font-semibold">DO (ppm)</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{formatMetric(analytics.avgWaterQuality.do)}</p>
              <p className="text-xs text-gray-500 mt-1">Optimal: {'>'} 4 ppm</p>
            </div>
            <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
              <p className="text-xs text-gray-600 uppercase font-semibold">Ammonia (ppm)</p>
              <p className="text-2xl font-bold text-orange-600 mt-1">{formatMetric(analytics.avgWaterQuality.ammonia)}</p>
              <p className="text-xs text-gray-500 mt-1">Optimal: {'<'} 0.5 ppm</p>
            </div>
            <div className="p-3 bg-red-50 rounded-lg border border-red-200">
              <p className="text-xs text-gray-600 uppercase font-semibold">Temp (°C)</p>
              <p className="text-2xl font-bold text-red-600 mt-1">{formatMetric(analytics.avgWaterQuality.temp)}</p>
              <p className="text-xs text-gray-500 mt-1">Optimal: 28-30°C</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Feed Performance Trend */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📈 Feed Performance Trend - {pondName}
          </CardTitle>
          <CardDescription>Daily feed quantity and consumption tracking</CardDescription>
        </CardHeader>
        <CardContent>
          {hasFeedTrend ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics.trends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} stroke="#666" />
                <YAxis yAxisId="left" label={{ value: 'Feed (kg)', angle: -90, position: 'insideLeft' }} stroke="#666" />
                <YAxis yAxisId="right" orientation="right" label={{ value: 'Consumption %', angle: 90, position: 'insideRight' }} stroke="#666" />
                <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc' }} />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="feedQty" stroke="#3b82f6" name="Feed Qty (kg)" strokeWidth={2} dot={{ r: 3 }} />
                <Line yAxisId="right" type="monotone" dataKey="consumption" stroke="#10b981" name="Consumption %" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-sm text-muted-foreground">No feed trend data available yet.</div>
          )}
        </CardContent>
      </Card>

      {/* Growth vs Feed Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📊 Growth Trajectory - {pondName}
          </CardTitle>
          <CardDescription>Shrimp growth progression correlated with feeding</CardDescription>
        </CardHeader>
        <CardContent>
          {hasGrowthTrend ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics.trends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} stroke="#666" />
                <YAxis label={{ value: 'Average Weight (g)', angle: -90, position: 'insideLeft' }} stroke="#666" />
                <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc' }} formatter={(value) => `${value}g`} />
                <Legend />
                <Line type="monotone" dataKey="growth" stroke="#8b5cf6" name="Avg Weight" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-sm text-muted-foreground">No growth data recorded yet.</div>
          )}
        </CardContent>
      </Card>

      {/* AI Recommendations */}
      <Card className="border-2 border-purple-200 bg-purple-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            💡 AI Recommendations for {pondName}
          </CardTitle>
          <CardDescription>Intelligent suggestions based on collected data analysis</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {analytics.recommendations.length > 0 ? (
            analytics.recommendations.map((rec, idx) => (
              <Alert key={idx} className={`border-2 ${
                rec.type === 'optimization' ? 'border-yellow-300 bg-yellow-50' :
                rec.type === 'warning' ? 'border-red-300 bg-red-50' :
                'border-blue-300 bg-blue-50'
              }`}>
                <div className="flex gap-3 items-start">
                  <div className={`mt-1 ${
                    rec.type === 'optimization' ? 'text-yellow-600' :
                    rec.type === 'warning' ? 'text-red-600' :
                    'text-blue-600'
                  }`}>
                    {getRecommendationIcon(rec.type)}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900 flex items-center gap-2">
                      {rec.title}
                      <Badge variant="outline" className={`text-xs ${
                        rec.impact === 'high' ? 'bg-red-100 text-red-800' :
                        rec.impact === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {rec.impact} impact
                      </Badge>
                    </div>
                    <AlertDescription className="mt-1 text-sm text-gray-700">
                      {rec.description}
                    </AlertDescription>
                  </div>
                </div>
              </Alert>
            ))
          ) : (
            <div className="p-3 bg-green-50 rounded border border-green-200">
              <p className="text-sm text-green-800 flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                No recommendations available yet. Add more logs to enable analysis.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Financial Projection */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">📈 Predicted Yield</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {analytics.predictedYield === null ? '--' : `${(analytics.predictedYield / 1000).toFixed(0)}K`}
            </div>
            <p className="text-xs text-gray-600 mt-1">Requires yield data</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">💰 Current ROI</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {analytics.currentRoi === null ? '--' : `${analytics.currentRoi}%`}
            </div>
            <p className="text-xs text-gray-600 mt-1">Requires cost data</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">🎯 Days Remaining</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{120 - analytics.daysCycle}</div>
            <p className="text-xs text-gray-600 mt-1">Until harvest</p>
          </CardContent>
        </Card>
      </div>

      {/* Auto-Generated Insights */}
      <Alert className="border-2 border-cyan-200 bg-cyan-50">
        <Info className="h-4 w-4 text-cyan-600" />
        <AlertDescription className="ml-2">
          <p className="font-semibold text-gray-900">📊 System Insights</p>
          <p className="text-sm text-gray-700 mt-2">
            Analytics are generated only from recorded daily logs for {pondName}. Missing fields will appear
            as placeholders until data is added.
          </p>
        </AlertDescription>
      </Alert>
    </div>
  );
}
