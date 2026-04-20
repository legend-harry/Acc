/**
 * Onboarding complete endpoint
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const preferences = await request.json();

    // TODO: Get user ID from session/token
    // Store onboarding preferences in database
    const preferencesRef = ref(db, `onboardingPreferences/${Date.now()}`);

    await set(preferencesRef, {
      ...preferences,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json(
      { success: true, message: 'Onboarding completed' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Onboarding error:', error);
    return NextResponse.json(
      { error: 'Failed to complete onboarding' },
      { status: 500 }
    );
  }
}
