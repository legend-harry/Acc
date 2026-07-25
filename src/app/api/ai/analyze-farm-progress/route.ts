import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      pondName,
      currentStage,
      cycleDay,
      totalCycleDays,
      farmingType,
      shrimpType,
      currentStock,
      recentLogs
    } = body;

    const prompt = `You are an expert aquaculture and shrimp farming consultant. You act as the daily assistant for a farmer. Analyze the current pond context and generate a strict, concise daily briefing and schedule. Do NOT use lengthy paragraphs or repetitive language. Be direct, factual, and stick to hardcoded operational instructions.

## Pond Context
- Pond Name: ${pondName || 'Unknown'}
- Farming Type: ${farmingType || 'Unknown'}
- Shrimp Species: ${shrimpType || 'Unknown'}
- Current Stage: ${currentStage || 'Unknown'}
- Day in Cycle: ${cycleDay || 0} out of ${totalCycleDays || 120}
- Current Stock (PL): ${currentStock || 'Unknown'}
- Recent Data/Logs: ${recentLogs ? JSON.stringify(recentLogs) : 'No recent logs provided'}

## Analysis Required
1. Generate a VERY brief statusSummary (max 1 sentence) stating facts about today's stage.
2. Evaluate current risk levels.
3. Identify expected parameters for this specific day/stage in short bullet-point format.
4. Provide a strict time-based schedule for the day (e.g., exact feeding times, when to test DO/pH, when to clean trays).
5. Recommend 2 specific, concise actionable steps for today (e.g. "Apply 10kg Vitamin C").
6. CRITICAL: Analyze the correlation between the current day and the Moon cycle. If it's a New Moon or Full Moon phase, specifically instruct the farmer on moulting risks and mineral supplementation in the recommendations.

Return ONLY valid JSON with this exact structure:
{
  "statusSummary": "One short, direct sentence (e.g. 'Day 45: Transitioning to intensive feed schedule.')",
  "riskLevel": "low" | "medium" | "high" | "critical",
  "expectedDeltas": "Weight: ~5g | FCR: 1.2 | DO: >4.5 mg/L",
  "dailySchedule": [
    { "time": "06:00 AM", "task": "Check DO, Apply Morning Feed", "type": "feed" | "test" | "observe" | "maintenance" }
  ],
  "recommendations": [
    "Apply probiotic mix A",
    "Monitor tray consumption 1hr after feeding"
  ]
}`;

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 });
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return NextResponse.json(parsed);
  } catch (error) {
    console.error('Farm progress analysis error:', error);
    return NextResponse.json(
      { error: 'Farm progress analysis failed' },
      { status: 500 }
    );
  }
}
