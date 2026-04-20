import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { get, ref } from 'firebase/database';

// This endpoint provides AI-powered suggestions for water quality issues
export async function POST(req: NextRequest) {
  try {
    const { pondName, pondId, profile, waterParams, observations } = await req.json();

    if (!pondId || !profile) {
      return NextResponse.json(
        { error: 'Missing pondId or profile' },
        { status: 400 }
      );
    }

    const logsRef = ref(db, `shrimp/${profile}/daily-logs/${pondId}`);
    const snapshot = await get(logsRef);
    const logsData = snapshot.val();
    const missingFields: string[] = [];

    const toNumber = (value: unknown) => {
      const numeric = typeof value === 'string' ? Number(value) : Number(value);
      return Number.isFinite(numeric) ? numeric : null;
    };

    let averages: Record<string, number | null> = {
      ph: null,
      do: null,
      temperature: null,
      ammonia: null,
    };

    if (logsData) {
      const logsArray = Object.values(logsData) as any[];
      const sortedLogs = logsArray.sort((a, b) => new Date(a.date || 0).getTime() - new Date(b.date || 0).getTime());
      const recentLogs = sortedLogs.slice(-7);

      const avg = (field: string) => {
        const values = recentLogs.map((log) => toNumber(log[field])).filter((value): value is number => value !== null);
        if (values.length === 0) return null;
        return values.reduce((sum, value) => sum + value, 0) / values.length;
      };

      averages = {
        ph: avg('ph'),
        do: avg('do'),
        temperature: avg('temperature'),
        ammonia: avg('ammonia'),
      };
    }

    Object.entries(averages).forEach(([key, value]) => {
      if (value === null) missingFields.push(key);
    });

    const observationLines: string[] = [];
    const actionLines: string[] = [];

    if (observations) {
      observationLines.push(`User notes: ${observations}`);
    }

    if (averages.ph !== null) {
      observationLines.push(`Recent average pH: ${averages.ph.toFixed(2)}`);
    }
    if (averages.do !== null) {
      observationLines.push(`Recent average DO: ${averages.do.toFixed(2)} ppm`);
    }
    if (averages.temperature !== null) {
      observationLines.push(`Recent average temperature: ${averages.temperature.toFixed(1)}C`);
    }
    if (averages.ammonia !== null) {
      observationLines.push(`Recent average ammonia: ${averages.ammonia.toFixed(2)} ppm`);
    }

    if (waterParams?.do !== undefined && waterParams.do !== null && averages.do !== null && waterParams.do < averages.do) {
      actionLines.push('DO is below recent average. Increase aeration and recheck within 2 hours.');
    }
    if (waterParams?.ammonia !== undefined && waterParams.ammonia !== null && averages.ammonia !== null && waterParams.ammonia > averages.ammonia) {
      actionLines.push('Ammonia is above recent average. Review feeding and consider partial water exchange.');
    }
    if (waterParams?.ph !== undefined && waterParams.ph !== null && averages.ph !== null && Math.abs(waterParams.ph - averages.ph) > 0.3) {
      actionLines.push('pH deviates from recent average. Validate sensors and record corrective actions.');
    }
    if (actionLines.length === 0) {
      actionLines.push('Continue routine monitoring and log any changes in shrimp behavior.');
    }

    return NextResponse.json({
      suggestions: {
        observations: observationLines.join('\n') || `No historical data available for ${pondName}.`,
        actions: actionLines.join('\n'),
      },
      missingFields,
    });
  } catch (error) {
    console.error('Shrimp assist error:', error);
    return NextResponse.json(
      { error: 'Failed to generate suggestions' },
      { status: 500 }
    );
  }
}
