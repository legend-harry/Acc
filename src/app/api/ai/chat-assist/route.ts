import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json();

    // In production, this would call Gemini API or Claude
    const response = generateResponse(message);

    return NextResponse.json({ response });
  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    );
  }
}

function generateResponse(message: string): string {
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes('fcr') || lowerMessage.includes('conversion')) {
    return `Feed Conversion Ratio (FCR) tips:
• FCR of 1.4-1.5 is good for shrimp farming
• Reduce FCR by using high-quality feed
• Adjust feeding based on water temperature
• Monitor consumption rates daily
• Better FCR = higher profitability`;
  }

  if (lowerMessage.includes('ammonia') || lowerMessage.includes('high')) {
    return `Ammonia Management:
• Ammonia over 0.5 ppm is problematic
• Actions: Perform 25-30% water exchange immediately
• Increase aeration to boost bacterial conversion
• Check if overstocked or overfeeding
• Monitor daily until ammonia < 0.2 ppm`;
  }

  if (lowerMessage.includes('disease') || lowerMessage.includes('sick')) {
    return `Disease Warning Signs:
• White spots = possible WSSV (critical)
• Soft shell or discoloration = health stress
• Lethargy or unusual behavior = immediate action needed
• Isolate affected ponds
• Consult veterinarian if outbreak suspected`;
  }

  if (lowerMessage.includes('feeding') || lowerMessage.includes('schedule')) {
    return `Feeding Schedule Guidelines:
• Feed 2-3 times daily (morning, noon, evening)
• Amount: 3-5% of shrimp biomass daily
• Adjust based on consumption rate (aim for 80-95%)
• Reduce feeding if ammonia rising
• Monitor water temperature - reduce feeding if <25°C`;
  }

  return `I will only use the information you provide (text, uploaded documents, or images). If details are missing, I'll ask for them instead of assuming.

Tell me what you need help with and include any readings (pH/DO/ammonia), stocking density, pond size, or symptoms. If you have reports/images, mention them and I’ll ask for specifics.

Areas I can assist:
• Water quality (pH, DO, ammonia, temp) and corrective actions
• Feeding/FCR and biomass-based rationing
• Disease signs and triage steps
• Cost/ROI levers and scheduling
What would you like to focus on?`;
}
