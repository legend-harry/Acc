import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      cycleDay,
      shrimpType,
      estimatedBiomassKg,
      currentAvgWeightG,
      waterTemp,
      ammonia,
      ph,
      dissolvedOxygen,
      weather,
      historicalFCR,
      previousFeedKg,
      survivalRate,
      stockCount,
      pondAreaHa,
    } = body;

    const prompt = `You are an expert shrimp aquaculture feed optimization AI.

Given the following real-time pond conditions, calculate the optimal daily feed ration.

## Current Pond Data
- Cycle Day: ${cycleDay}
- Shrimp Species: ${shrimpType}
- Estimated Biomass: ${estimatedBiomassKg} kg
- Current Avg Weight: ${currentAvgWeightG} g
- Stock Count (est.): ${stockCount}
- Pond Area: ${pondAreaHa} ha
- Survival Rate: ${survivalRate}%
- Previous Day Feed Given: ${previousFeedKg} kg
- Historical Baseline FCR: ${historicalFCR}

## Water Quality (Today)
- Temperature: ${waterTemp}°C
- Ammonia (NH3): ${ammonia} ppm
- pH: ${ph}
- Dissolved Oxygen: ${dissolvedOxygen} ppm
- Weather: ${weather}

## Rules
1. Base feed = estimated biomass × feed rate percentage (varies by growth stage)
2. Adjust DOWN if: ammonia > 0.5ppm (-20%), temperature < 26°C or > 32°C (-15%), cloudy/rainy weather (-10%), DO < 4ppm (-25%)
3. Adjust UP if: feed consumption yesterday was 100% and water quality is excellent (+5%)
4. FCR target should trend toward the historical baseline of ${historicalFCR}
5. Split feed into 4 meals: 6AM (20%), 10AM (30%), 2PM (30%), 6PM (20%)

Return ONLY valid JSON:
{
  "dailyFeedKg": number,
  "feedRatePercent": number,
  "mealSchedule": [
    { "time": "06:00", "amountKg": number, "label": "Morning" },
    { "time": "10:00", "amountKg": number, "label": "Mid-Morning" },
    { "time": "14:00", "amountKg": number, "label": "Afternoon" },
    { "time": "18:00", "amountKg": number, "label": "Evening" }
  ],
  "adjustments": [
    { "factor": string, "impact": string, "percentChange": number }
  ],
  "projectedFCR": number,
  "alerts": [string],
  "recommendation": string,
  "confidenceScore": number
}`;

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 });
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return NextResponse.json(parsed);
  } catch (error) {
    console.error('Feed optimization error:', error);
    return NextResponse.json(
      { error: 'Feed optimization failed' },
      { status: 500 }
    );
  }
}
