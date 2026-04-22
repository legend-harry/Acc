import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const TYPE_NAMES: Record<string, string> = {
    "arable": "Arable Farm",
    "horticulture": "Horticulture Farm",
    "ruminants": "Ruminants Farm",
    "monogastrics": "Poultry/Swine Farm",
    "cea": "CEA Greenhouse",
    "aquaculture": "Aquaculture Farm",
    "apiculture": "Apiary Farm",
    "standard": "General Business Ledger"
};

export async function POST(request: NextRequest) {
  try {
    const { primaryFocus, industryId, selectedCategories, clientId, profileId } = await request.json();
    const supabase = await createClient();

    if (!clientId || !profileId) {
        return NextResponse.json({ error: 'Missing auth context' }, { status: 400 });
    }

    if (industryId === 'custom') {
        // Just return success, redirection happens on frontend
        return NextResponse.json({ success: true });
    }

    const projectName = TYPE_NAMES[industryId] || (primaryFocus === 'farm' ? "My Farm" : "Business Ledger");

    // 1. Create Project
    const { data: project, error: projError } = await supabase.from('projects').insert({
        name: projectName,
        client_id: clientId,
        profile_id: profileId
    }).select().single();

    if (projError) throw projError;

    // 2. Create Categories if provided
    if (selectedCategories && selectedCategories.length > 0) {
        const budgetsToInsert = selectedCategories.map((cat: string) => ({
            category: cat,
            amount: 0,
            projectid: project.id,
            client_id: clientId,
            profile_id: profileId,
        }));

        const { error: budgError } = await supabase.from('budgets').insert(budgetsToInsert);
        if (budgError) throw budgError;
    }

    return NextResponse.json(
      { success: true, message: 'Onboarding data initialized' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Onboarding bulk API error:', error);
    return NextResponse.json(
      { error: 'Failed to complete project initialization' },
      { status: 500 }
    );
  }
}
