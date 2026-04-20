/**
 * Predictive Guidance API endpoint
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
        { alerts: [], checklist: [], reminders: [], missingFields: ['dailyLogs'] },
        { status: 200 }
      );
    }

    const logsArray = Object.values(logsData) as any[];
    const sortedLogs = logsArray.sort((a, b) => new Date(a.date || 0).getTime() - new Date(b.date || 0).getTime());
    const recentLogs = sortedLogs.slice(-7);
    const latestLog = sortedLogs[sortedLogs.length - 1] || {};

    const toNumber = (value: unknown) => {
      const numeric = typeof value === 'string' ? Number(value) : Number(value);
      return Number.isFinite(numeric) ? numeric : null;
    };

    const seriesFor = (field: string) => {
      return recentLogs
        .map((log) => toNumber(log[field]))
        .filter((value): value is number => value !== null);
    };

    const buildTrendAlert = (field: string, label: string) => {
      const values = seriesFor(field);
      if (values.length < 2) return null;
      const currentValue = values[values.length - 1];
      const slope = (values[values.length - 1] - values[0]) / (values.length - 1);
      const predictedValue = currentValue + slope * 2;
      const trend = slope > 0.01 ? 'rising' : slope < -0.01 ? 'falling' : 'stable';

      return {
        id: `${field}-trend`,
        type: trend === 'rising' ? 'warning' : 'info',
        title: `${label} trend detected`,
        description: `${label} is ${trend} based on recent logs.`,
        daysUntilIssue: null,
        recommendedAction: 'Review recent logs and adjust operations if needed.',
        priority: trend === 'rising' ? 'high' : 'medium',
        affectedPonds: [pondId],
        metric: label,
        currentValue,
        predictedValue,
        trend,
      };
    };

    const alerts = [
      buildTrendAlert('ammonia', 'Ammonia'),
      buildTrendAlert('do', 'Dissolved oxygen'),
      buildTrendAlert('ph', 'pH'),
    ].filter((item) => item !== null);

    const checklist = [] as any[];
    if (toNumber(latestLog.ph) === null) {
      checklist.push({
        id: 'record-ph',
        task: 'Record pH reading',
        priority: 'high',
        timeWindow: 'Today',
        reason: 'Latest log is missing pH.',
        completed: false,
      });
    }
    if (toNumber(latestLog.do) === null) {
      checklist.push({
        id: 'record-do',
        task: 'Record dissolved oxygen reading',
        priority: 'high',
        timeWindow: 'Today',
        reason: 'Latest log is missing DO.',
        completed: false,
      });
    }
    if (toNumber(latestLog.feedingAmount) === null) {
      checklist.push({
        id: 'record-feed',
        task: 'Record feeding amount',
        priority: 'medium',
        timeWindow: 'Today',
        reason: 'Latest log is missing feeding amount.',
        completed: false,
      });
    }

    const reminders = [] as any[];
    const lastDate = latestLog.date ? new Date(latestLog.date) : null;
    if (lastDate && Date.now() - lastDate.getTime() > 24 * 60 * 60 * 1000) {
      reminders.push({
        id: 'update-logs',
        type: 'schedule',
        title: 'Daily logs are outdated',
        message: 'No log recorded in the last 24 hours.',
        suggestedAction: 'Add a new daily log entry.',
        dueTime: 'Today',
      });
    }

    return NextResponse.json(
      {
        alerts,
        checklist,
        reminders,
        missingFields: [],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Predictive guidance error:', error);
    return NextResponse.json(
      { error: 'Failed to generate predictive guidance' },
      { status: 500 }
    );
  }
}
