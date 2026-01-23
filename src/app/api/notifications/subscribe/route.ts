/**
 * Subscribe to push notifications
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { ref, set } from 'firebase/database';

export async function POST(request: NextRequest) {
  try {
    const { endpoint, keys } = await request.json();
    
    // TODO: In production, associate subscription with user from session/token
    // For now, we'll store subscriptions server-side
    
    // Validate subscription data
    if (!endpoint || !keys?.auth || !keys?.p256dh) {
      return NextResponse.json(
        { error: 'Invalid subscription data' },
        { status: 400 }
      );
    }

    // Store subscription in database (example using Firebase)
    // In production, you'd store this securely and associate with user
    const subscriptionsRef = ref(db, `subscriptions/${Date.now()}`);
    
    await set(subscriptionsRef, {
      endpoint,
      keys,
      createdAt: new Date().toISOString(),
    });

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
