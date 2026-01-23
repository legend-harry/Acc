/**
 * Automated Parameter Analysis Component
 * Smart anomaly detection and trend prediction
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { AlertTriangle, TrendingUp, TrendingDown, Zap, Lightbulb } from 'lucide-react';

interface ParameterData {
  timestamp: string;
  value: number;
  optimal: number;
  anomaly: boolean;
}

interface ParameterAnalysis {
  parameter: string;
  currentValue: number;
  optimalRange: [number, number];
  trend: 'rising' | 'falling' | 'stable';
  trendPercentage: number;
  anomalies: ParameterData[];
  prediction: {
    predicted24h: number;
    predicted48h: number;
    confidence: number;
  };
  historicalPattern: string;
  autoSuggestions: string[];
}

export function AutomatedParameterAnalysis({ pondId }: { pondId?: string }) {
  const [analyses, setAnalyses] = useState<ParameterAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [historicalData, setHistoricalData] = useState<any[]>([]);

  useEffect(() => {
    loadParameterAnalysis();
  }, [pondId]);

  const loadParameterAnalysis = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/ai/parameter-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pondId }),
      });

      if (!response.ok) throw new Error('Failed to load analysis');

      const data = await response.json();
      setAnalyses(data.analyses || []);
      setHistoricalData(data.historicalData || []);
    } catch (error) {
      console.error('Error loading parameter analysis:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (
    value: number,
    optimal: [number, number]
  ): 'default' | 'destructive' | 'secondary' => {
    if (value < optimal[0] - optimal[0] * 0.1 || value > optimal[1] + optimal[1] * 0.1) {
      return 'destructive';
    }
    if (value < optimal[0] || value > optimal[1]) {
      return 'secondary';
    }
    return 'default';
  };

  const getTrendIcon = (trend: string) => {
    if (trend === 'rising') return <TrendingUp className="h-4 w-4 text-orange-600" />;
    if (trend === 'falling') return <TrendingDown className="h-4 w-4 text-blue-600" />;
    return <Zap className="h-4 w-4 text-green-600" />;
  };

  if (loading) {
    return <Card><CardContent className="pt-6 text-center text-muted-foreground">Loading analysis...</CardContent></Card>;
  }

  return (
    <div className="space-y-6">
      {/* Trend Chart */}
      {historicalData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Parameter Trends (Last 7 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={historicalData}>
                <defs>
                  <linearGradient id="colorPH" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorDO" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#82ca9d" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" stroke="#888" style={{ fontSize: '12px' }} />
                <YAxis stroke="#888" style={{ fontSize: '12px' }} />
                <Tooltip />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="pH"
                  stroke="#8884d8"
                  fillOpacity={1}
                  fill="url(#colorPH)"
                />
                <Area
                  type="monotone"
                  dataKey="DO"
                  stroke="#82ca9d"
                  fillOpacity={1}
                  fill="url(#colorDO)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Parameter Analyses */}
      {analyses.map((analysis) => (
        <Card key={analysis.parameter}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CardTitle className="text-lg">{analysis.parameter}</CardTitle>
                <Badge variant={getStatusColor(analysis.currentValue, analysis.optimalRange)}>
                  {analysis.currentValue.toFixed(2)}
                </Badge>
                {getTrendIcon(analysis.trend)}
              </div>
              <Badge variant="outline">{analysis.trendPercentage > 0 ? '+' : ''}{analysis.trendPercentage}%</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Status */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-lg bg-muted">
                <p className="text-xs text-muted-foreground mb-1">Optimal Range</p>
                <p className="font-semibold">
                  {analysis.optimalRange[0].toFixed(1)} - {analysis.optimalRange[1].toFixed(1)}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-muted">
                <p className="text-xs text-muted-foreground mb-1">Current Trend</p>
                <p className="font-semibold capitalize">{analysis.trend}</p>
              </div>
            </div>

            {/* Prediction */}
            <div className="border rounded-lg p-3 space-y-2">
              <h4 className="font-medium text-sm">24-Hour Prediction</h4>
              <p className="text-sm text-muted-foreground">
                Predicted value: <span className="font-semibold">{analysis.prediction.predicted24h.toFixed(2)}</span>
                {' '}
                (confidence: {analysis.prediction.confidence}%)
              </p>
              <p className="text-sm text-muted-foreground">
                48-Hour forecast: <span className="font-semibold">{analysis.prediction.predicted48h.toFixed(2)}</span>
              </p>
            </div>

            {/* Historical Pattern */}
            <div className="border rounded-lg p-3">
              <p className="text-sm text-muted-foreground mb-2">
                <Lightbulb className="h-4 w-4 inline mr-1" />
                Historical Pattern
              </p>
              <p className="text-sm">{analysis.historicalPattern}</p>
            </div>

            {/* Auto Suggestions */}
            {analysis.autoSuggestions.length > 0 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <p className="font-medium mb-2">Automated Suggestions:</p>
                  <ul className="text-sm space-y-1 ml-4 list-disc">
                    {analysis.autoSuggestions.map((suggestion, idx) => (
                      <li key={idx}>{suggestion}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {/* Anomaly Detection */}
            {analysis.anomalies.length > 0 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <p className="font-medium mb-1">
                    {analysis.anomalies.length} anomalies detected
                  </p>
                  <p className="text-sm">
                    Unusual readings found. Review these spikes for potential equipment issues or data entry errors.
                  </p>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
