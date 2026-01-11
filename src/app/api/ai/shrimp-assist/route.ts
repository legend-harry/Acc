import { NextRequest, NextResponse } from 'next/server';

// This endpoint provides AI-powered suggestions for water quality issues
export async function POST(req: NextRequest) {
  try {
    const { pondName, waterParams, observations } = await req.json();

    // In production, this would call the Genkit flow from /src/ai/flows/
    // For now, return mock AI suggestions based on water parameters

    const suggestions = {
      observations: generateObservations(waterParams),
      actions: generateActions(waterParams),
    };

    return NextResponse.json(suggestions);
  } catch (error) {
    console.error('Shrimp assist error:', error);
    return NextResponse.json(
      { error: 'Failed to generate suggestions' },
      { status: 500 }
    );
  }
}

function generateObservations(waterParams: Record<string, number>): string {
  const issues: string[] = [];

  if (waterParams.ph < 7.5) {
    issues.push('pH is slightly low - consider adding lime.');
  }
  if (waterParams.do < 5) {
    issues.push('Dissolved oxygen is below optimal levels - increase aeration.');
  }
  if (waterParams.temperature > 30) {
    issues.push('Temperature is elevated - monitor for heat stress.');
  }
  if (waterParams.ammonia > 0.5) {
    issues.push('Ammonia levels are high - perform partial water change.');
  }

  return issues.length > 0
    ? issues.join('\n')
    : 'All water parameters are within optimal ranges. Continue regular monitoring.';
}

function generateActions(waterParams: Record<string, number>): string {
  const actions: string[] = [];

  actions.push('✓ Continue daily monitoring');
  actions.push('✓ Feed according to schedule');

  if (waterParams.do < 5) {
    actions.push('⚠️ Increase aeration to 6-8 hours per day');
  }
  if (waterParams.ammonia > 0.5) {
    actions.push('⚠️ Perform 30% water exchange');
  }

  return actions.join('\n');
}
