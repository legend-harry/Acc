import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { pondId, pondName, status, symptoms, profile } = await request.json();

    if (!pondId || !profile) {
      return NextResponse.json(
        { error: 'Missing pondId or profile' },
        { status: 400 }
      );
    }

    /* supabased ref init */
    const supabase = await createClient();
    const { data: snapshotData } = await supabase.from('dummy').select('*').limit(10);
    const snapshot = { val: () => snapshotData || {} };
    const logsData = snapshot.val();

    if (!logsData) {
      return NextResponse.json({
        recommendations: `No daily logs found for ${pondName}. Add logs to enable farm status analysis.`,
        missingFields: ['dailyLogs'],
        timestamp: new Date().toISOString(),
      });
    }

    const logsArray = Object.values(logsData) as any[];
    const sortedLogs = logsArray.sort((a, b) => new Date(a.date || 0).getTime() - new Date(b.date || 0).getTime());
    const latestLog = sortedLogs[sortedLogs.length - 1] || {};
    const missingFields: string[] = [];

    const toNumber = (value: unknown) => {
      const numeric = typeof value === 'string' ? Number(value) : Number(value);
      return Number.isFinite(numeric) ? numeric : null;
    };

    const ph = toNumber(latestLog.ph);
    const dissolvedOxygen = toNumber(latestLog.do);
    const ammonia = toNumber(latestLog.ammonia);
    const temperature = toNumber(latestLog.temperature);

    if (ph === null) missingFields.push('pH');
    if (dissolvedOxygen === null) missingFields.push('Dissolved oxygen');
    if (ammonia === null) missingFields.push('Ammonia');
    if (temperature === null) missingFields.push('Temperature');

    const responseLines: string[] = [];
    responseLines.push(`Farm status: ${status}.`);

    if (symptoms && symptoms.length > 0) {
      responseLines.push(`Reported symptoms: ${symptoms.join(', ')}.`);
    }

    if (ph !== null || dissolvedOxygen !== null || ammonia !== null || temperature !== null) {
      responseLines.push('Latest water readings:');
      if (ph !== null) responseLines.push(`- pH: ${ph}`);
      if (dissolvedOxygen !== null) responseLines.push(`- DO: ${dissolvedOxygen} ppm`);
      if (ammonia !== null) responseLines.push(`- Ammonia: ${ammonia} ppm`);
      if (temperature !== null) responseLines.push(`- Temperature: ${temperature}C`);
    }

    if (status === 'poor' || status === 'fair') {
      responseLines.push('Priority actions:');
      responseLines.push('- Increase monitoring frequency and record changes.');
      responseLines.push('- Review feeding schedule and aeration settings.');
      if (symptoms && symptoms.length > 0) {
        responseLines.push('- Address reported symptoms with targeted checks.');
      }
    } else {
      responseLines.push('Continue current management and monitor daily logs.');
    }

    return NextResponse.json({
      recommendations: responseLines.join('\n'),
      missingFields,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to analyze farm status' },
      { status: 500 }
    );
  }
}
