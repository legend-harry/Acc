import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      shrimpType,
      cycleDay,
      samplingData,     // Array of { week, avgWeightG, estimatedSurvivalPct, sampleSize }
      stockingCount,
      targetHarvestWeightG,
      farmingType,
    } = body;

    const samplingTable = (samplingData || []).map((s: any) =>
      `Week ${s.week}: Avg ${s.avgWeightG}g, Survival ${s.estimatedSurvivalPct}%, Sample n=${s.sampleSize}`
    ).join('\n');

    const prompt = `You are a shrimp growth analytics expert. Analyze the weekly sampling data and compare against ideal growth curves.

## Farm Parameters
- Species: ${shrimpType}
- Farming Type: ${farmingType}
- Current Cycle Day: ${cycleDay}
- Initial Stocking Count: ${stockingCount}
- Target Harvest Weight: ${targetHarvestWeightG}g

## Weekly Sampling Data
${samplingTable || 'No sampling data provided yet.'}

## Analysis Required
1. Compare actual growth against ideal Gompertz growth curve for ${shrimpType} shrimp
2. Calculate current estimated biomass
3. Identify if growth is on track, ahead, or behind schedule
4. Detect potential issues (underfeeding, disease stress, water quality problems)
5. Project harvest date and expected yield

Return ONLY valid JSON:
{
  "idealCurve": [
    { "week": number, "expectedWeightG": number }
  ],
  "growthStatus": "on_track" | "ahead" | "behind" | "severely_behind",
  "growthDeviationPct": number,
  "estimatedBiomassKg": number,
  "estimatedSurvivalPct": number,
  "estimatedCurrentCount": number,
  "projectedHarvestDate": { "daysFromNow": number, "atCurrentRate": boolean },
  "projectedHarvestWeightG": number,
  "projectedYieldKg": number,
  "weeklyGrowthRateG": number,
  "alerts": [
    { "severity": "critical" | "warning" | "info", "message": string }
  ],
  "recommendations": [string],
  "analysis": string
}`;

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 });
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return NextResponse.json(parsed);
  } catch (error) {
    console.error('Growth analysis error:', error);
    return NextResponse.json(
      { error: 'Growth analysis failed' },
      { status: 500 }
    );
  }
}
