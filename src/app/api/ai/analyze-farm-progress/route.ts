import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      pondName,
      currentStage,
      daysInCycle,
      stockHealth,
      waterQuality,
      feedingStatus,
      farmingType,
      observations,
    } = body;

    const prompt = `You are an expert aquaculture and shrimp farming consultant. Analyze the following progress assessment for a pond and provide insights and actionable recommendations.

## Pond Progress Data
- Pond Name: ${pondName || 'Unknown'}
- Farming Type: ${farmingType || 'Unknown'}
- Current Stage: ${currentStage || 'Unknown'}
- Days in Cycle: ${daysInCycle || 0}
- Stock Health: ${stockHealth || 'Unknown'}
- Water Quality: ${waterQuality || 'Unknown'}
- Feeding Status: ${feedingStatus || 'Unknown'}
- Direct Observations: ${observations || 'None'}

## Analysis Required
1. Evaluate whether the reported conditions match what is expected for the given stage and days in cycle.
2. Identify immediate risks based on stock health, water quality, and feeding status.
3. Recommend priority interventions or adjustments (e.g., to feeding, aeration, monitoring).
4. Provide a summarized checklist of next steps.

Return ONLY valid JSON with this structure:
{
  "statusSummary": "Short 1-2 sentence summary of overall pond trajectory",
  "riskLevel": "low" | "medium" | "high" | "critical",
  "expectedDeltas": "What parameters normally look like at this stage",
  "alerts": [
    { "severity": "info" | "warning" | "critical", "message": "Clear specific issue" }
  ],
  "recommendations": [
    "Actionable step 1",
    "Actionable step 2"
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
