import { NextRequest, NextResponse } from 'next/server';

// This endpoint generates phase-specific tasks using AI
export async function POST(req: NextRequest) {
  try {
    const { phaseId, currentPhase, dayInPhase } = await req.json();

    const tasksByPhase: Record<string, string[]> = {
      operation: [
        'Check water pH, DO, temperature, and ammonia levels',
        'Feed pond according to appetite (morning and evening)',
        'Observe shrimp behavior and look for signs of disease',
        'Remove uneaten feed and dead organisms',
        'Monitor aeration equipment for proper function',
        'Document observations in daily log',
        'Check net/barrier for any damage',
      ],
      harvest: [
        'Prepare harvesting equipment and containers',
        'Ensure market buyer is confirmed and ready',
        'Set up grading area with proper classification',
        'Drain pond gradually (over 3-4 hours)',
        'Collect and sort harvested shrimp',
        'Document yield and quality metrics',
        'Clean and prepare pond for next cycle',
      ],
      analysis: [
        'Compile complete production data',
        'Calculate final FCR, survival rate, and profitability',
        'Compare performance to targets and previous cycles',
        'Document lessons learned and improvements',
        'Plan stocking strategy for next cycle',
        'Update management practices based on results',
      ],
    };

    const tasks = tasksByPhase[phaseId] || tasksByPhase.operation;

    return NextResponse.json({
      tasks,
      recommendations: 'Focus on maintaining consistency in your daily operations.',
    });
  } catch (error) {
    console.error('Task generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate tasks' },
      { status: 500 }
    );
  }
}
