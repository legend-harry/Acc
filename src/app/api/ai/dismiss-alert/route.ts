/**
 * Dismiss Alert endpoint
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { alertId } = await request.json();

    // TODO: Store dismissed alerts to avoid repetition
    // Track for analytics

    return NextResponse.json(
      { success: true, message: 'Alert dismissed' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Dismiss alert error:', error);
    return NextResponse.json(
      { error: 'Failed to dismiss alert' },
      { status: 500 }
    );
  }
}
