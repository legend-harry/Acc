/**
 * Dashboard Prioritization API endpoint
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { currentPhase, timeOfDay, alertCount } = await request.json();

    // TODO: Integrate with actual user role and preferences
    // Use ML to determine optimal dashboard ordering

    const mockPriorities = [
      {
        componentId: 'water-quality',
        title: 'Water Quality Monitor',
        priority: alertCount > 2 ? 1 : 3,
        reason: 'Critical for shrimp health',
        phase: 'always',
        urgency: alertCount > 2 ? 'critical' : 'medium',
      },
      {
        componentId: 'daily-log',
        title: 'Daily Log Form',
        priority: timeOfDay === 'morning' ? 1 : 4,
        reason: 'Essential morning task',
        phase: timeOfDay === 'morning' ? 'morning' : 'always',
        urgency: 'high',
      },
      {
        componentId: 'feeding-schedule',
        title: 'Feeding Schedule',
        priority: timeOfDay === 'afternoon' ? 2 : 5,
        reason: 'Afternoon feeding preparation',
        phase: 'afternoon',
        urgency: 'medium',
      },
    ];

    const mockFocusMode =
      currentPhase === 'operation' && alertCount > 0
        ? {
            title: 'Water Quality Crisis Mode',
            description: 'Elevated alerts detected. Focus on immediate water management.',
            topPriorities: [
              'Check all aerators and DO levels',
              'Reduce feeding to 50%',
              'Prepare emergency water change',
            ],
            estimatedTime: '15-30 minutes',
            icon: '⚠️',
          }
        : timeOfDay === 'morning'
          ? {
              title: 'Morning Setup',
              description: 'Complete daily startup tasks to ensure smooth operations.',
              topPriorities: [
                'Test water parameters (pH, DO, Ammonia)',
                'Verify all equipment is operating normally',
                'Review overnight alerts and prepare action plan',
              ],
              estimatedTime: '20-30 minutes',
              icon: '☀️',
            }
          : null;

    return NextResponse.json(
      {
        priorities: mockPriorities,
        focusMode: mockFocusMode,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Dashboard prioritization error:', error);
    return NextResponse.json(
      { error: 'Failed to calculate priorities' },
      { status: 500 }
    );
  }
}
