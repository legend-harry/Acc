/**
 * Parameter Analysis API endpoint
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { get, ref } from 'firebase/database';

export async function POST(request: NextRequest) {
  try {
    const { pondId, profile } = await request.json();

    if (!pondId || !profile) {
      return NextResponse.json(
        { error: 'Missing pondId or profile' },
        { status: 400 }
      );
    }

    const logsRef = ref(db, `shrimp/${profile}/daily-logs/${pondId}`);
    const snapshot = await get(logsRef);
    const logsData = snapshot.val();

    if (!logsData) {
      return NextResponse.json(
        { analyses: [], historicalData: [], missingFields: ['dailyLogs'] },
        { status: 200 }
      );
    }

    const logsArray = Object.values(logsData) as any[];
    const sortedLogs = logsArray.sort((a, b) => new Date(a.date || 0).getTime() - new Date(b.date || 0).getTime());
    const recentLogs = sortedLogs.slice(-14);

    const toNumber = (value: unknown) => {
      const numeric = typeof value === 'string' ? Number(value) : Number(value);
      return Number.isFinite(numeric) ? numeric : null;
    };

    const seriesFor = (field: string) => {
      return recentLogs
        .map((log) => toNumber(log[field]))
        .filter((value): value is number => value !== null);
    };

    const buildAnalysis = (label: string, field: string) => {
      const values = seriesFor(field);
      if (values.length === 0) return null;

      const currentValue = values[values.length - 1];
      const previousAvg = values.length > 1 ? values.slice(0, -1).reduce((sum, value) => sum + value, 0) / (values.length - 1) : currentValue;
      const delta = currentValue - previousAvg;
      const trendPercentage = previousAvg === 0 ? 0 : (delta / previousAvg) * 100;
      const trend = delta > 0.02 ? 'rising' : delta < -0.02 ? 'falling' : 'stable';

      const slope = values.length > 1 ? (values[values.length - 1] - values[0]) / (values.length - 1) : 0;
      const predicted24h = currentValue + slope;
      const predicted48h = currentValue + slope * 2;
      const confidence = Math.min(95, 50 + values.length * 3);

      const autoSuggestions: string[] = [];
      if (trend === 'rising') autoSuggestions.push('Monitor closely and review feeding/aeration schedule.');
      if (trend === 'falling') autoSuggestions.push('Investigate recent operational changes and validate sensors.');
      if (autoSuggestions.length === 0) autoSuggestions.push('Continue monitoring with current schedule.');

      return {
        parameter: label,
        currentValue,
        optimalRange: null,
        trend,
        trendPercentage: Number.isFinite(trendPercentage) ? Math.round(trendPercentage) : 0,
        anomalies: [],
        prediction: {
          predicted24h,
          predicted48h,
          confidence,
        },
        historicalPattern: `Based on the last ${values.length} logs, ${label} is ${trend} (${trendPercentage.toFixed(1)}%).`,
        autoSuggestions,
      };
    };

    const parameterMap = [
      { label: 'pH Level', field: 'ph' },
      { label: 'Dissolved Oxygen (DO)', field: 'do' },
      { label: 'Ammonia (NH3)', field: 'ammonia' },
      { label: 'Temperature', field: 'temperature' },
    ];

    const analyses = parameterMap
      .map((item) => buildAnalysis(item.label, item.field))
      .filter((item) => item !== null);

    const missingFields = parameterMap
      .filter((item) => seriesFor(item.field).length === 0)
      .map((item) => item.label);

    const historicalData = recentLogs.map((log, index) => ({
      time: log.date || `Day ${index + 1}`,
      pH: toNumber(log.ph),
      DO: toNumber(log.do),
    })).filter((row) => row.pH !== null || row.DO !== null);

    return NextResponse.json(
      {
        analyses,
        historicalData,
        missingFields,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Parameter analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze parameters' },
      { status: 500 }
    );
  }
}
