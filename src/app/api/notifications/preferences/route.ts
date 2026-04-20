/**
 * Save notification preferences
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const preferences = await request.json();

    // TODO: Get user ID from session/token
    // For now, store preferences generically
    
    const preferencesRef = ref(db, `notificationPreferences/${Date.now()}`);
    
    await set(preferencesRef, {
      ...preferences,
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json(
      { success: true, message: 'Preferences saved' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Preferences error:', error);
    return NextResponse.json(
      { error: 'Failed to save preferences' },
      { status: 500 }
    );
  }
}
