/**
 * Unsubscribe from push notifications
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // TODO: Get user from session/token and remove their subscription
    // For now, just acknowledge the request
    
    return NextResponse.json(
      { success: true, message: 'Unsubscribed from push notifications' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Unsubscribe error:', error);
    return NextResponse.json(
      { error: 'Failed to unsubscribe' },
      { status: 500 }
    );
  }
}
