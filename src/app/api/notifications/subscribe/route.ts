/**
 * Subscribe to push notifications
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { endpoint, keys } = await request.json();
    
    // Validate subscription data
    if (!endpoint || !keys?.auth || !keys?.p256dh) {
      return NextResponse.json(
        { error: 'Invalid subscription data' },
        { status: 400 }
      );
    }

    // TODO: Migrate to Supabase - store subscription with user association
    console.log('Push subscription received:', endpoint);

    return NextResponse.json(
      { success: true, message: 'Subscribed to push notifications' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Subscription error:', error);
    return NextResponse.json(
      { error: 'Failed to subscribe' },
      { status: 500 }
    );
  }
}
