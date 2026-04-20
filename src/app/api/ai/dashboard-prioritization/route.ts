/**
 * Dashboard Prioritization API endpoint
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { get, ref } from 'firebase/database';

export async function POST(request: NextRequest) {
  try {
    const { currentPhase, timeOfDay, profile, pondId } = await request.json();

    if (!profile) {
      return NextResponse.json(
        { error: 'Missing profile' },
        { status: 400 }
      );
    }

    const alertsRef = ref(db, `shrimp/${profile}/alerts`);
    const alertsSnapshot = await get(alertsRef);
    const alertsData = alertsSnapshot.val();
    const alertsArray = alertsData ? Object.values(alertsData) as any[] : [];
    const alertCount = pondId
      ? alertsArray.filter((alert) => alert.pondId === pondId).length
      : alertsArray.length;

    const priorities = [
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

    const focusMode =
      currentPhase === 'operation' && alertCount > 0
        ? {
            title: 'Water Quality Focus',
            description: 'Elevated alerts detected. Focus on immediate water management.',
            topPriorities: [
              'Review latest alerts and water logs',
              'Verify aeration schedule',
              'Prepare corrective actions',
            ],
            estimatedTime: '15-30 minutes',
            icon: 'alert',
          }
        : timeOfDay === 'morning'
          ? {
              title: 'Morning Setup',
              description: 'Complete daily startup tasks to ensure smooth operations.',
              topPriorities: [
                'Record water parameters',
                'Verify equipment status',
                'Review alerts and plan actions',
              ],
              estimatedTime: '20-30 minutes',
              icon: 'sun',
            }
          : null;

    return NextResponse.json(
      {
        priorities,
        focusMode,
        missingFields: alertsData ? [] : ['alerts'],
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
