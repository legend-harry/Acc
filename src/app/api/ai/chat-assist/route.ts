import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { get, ref } from 'firebase/database';

export async function POST(req: NextRequest) {
  try {
    const { message, profile, pondId } = await req.json();

    if (!profile || !pondId) {
      return NextResponse.json(
        { response: 'Missing profile or pond selection. Select a pond and try again.', missingFields: ['profile', 'pondId'] },
        { status: 200 }
      );
    }

    const knowledgeRef = ref(db, `shrimp/${profile}/knowledge/${pondId}`);
    const snapshot = await get(knowledgeRef);
    const knowledgeData = snapshot.val();

    if (!knowledgeData) {
      return NextResponse.json({
        response: 'No knowledge base entries found for this pond. Upload documents or add notes to enable responses.',
        missingFields: ['knowledgeBase'],
      });
    }

    const entries = Object.values(knowledgeData) as any[];
    const query = String(message || '').toLowerCase();
    const matches = entries.filter((entry) =>
      String(entry.title || '').toLowerCase().includes(query) ||
      String(entry.content || '').toLowerCase().includes(query)
    );

    const topEntries = (matches.length > 0 ? matches : entries).slice(0, 3);
    const responseLines = topEntries.map((entry) => `- ${entry.title || 'Untitled'}: ${String(entry.content || '').slice(0, 160)}`);

    const response = responseLines.length > 0
      ? `Based on stored knowledge entries:\n${responseLines.join('\n')}`
      : 'No matching knowledge entries found. Add more documents or notes.';

    return NextResponse.json({ response });
  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    );
  }
}
