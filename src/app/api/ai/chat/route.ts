/**
 * Conversational AI Chat endpoint
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { query, conversationHistory } = await request.json();

    // TODO: Integrate with Genkit/Claude for actual AI responses
    // Build prompt from conversation history

    const mockResponses: Record<string, string> = {
      'high': 'A high FCR (Feed Conversion Ratio) typically indicates that your shrimp are not efficiently converting feed to biomass. Common causes include: 1) Poor water quality (check ammonia and DO levels), 2) Incorrect feeding schedule or amount, 3) Health issues in the shrimp population, 4) Temperature fluctuations. I recommend checking your water parameters first, then adjusting your feeding protocol.',
      'dead': 'Finding dead shrimp is concerning. First, check your water quality parameters immediately - look for ammonia spikes, low dissolved oxygen, or pH changes. Examine the dead shrimp for signs of disease. Consider: 1) Increase aeration, 2) Perform a 20-30% water change, 3) Reduce feeding to 50%, 4) Monitor closely for the next 24 hours. Would you like specific guidance on disease diagnosis?',
      'attention': 'Based on your current data, ponds A1 and C3 need immediate attention. Pond A1 has rising ammonia levels, and Pond C3 shows low DO. I recommend: Morning - Check aeration in C3, reduce feeding in both. Afternoon - Water parameter testing. Would you like detailed action plans?',
      'reduce': 'To reduce production costs, focus on these high-impact areas: 1) Optimize feeding (20-30% of costs) - adjust based on consumption rates, 2) Improve FCR through water quality management, 3) Preventive maintenance to avoid equipment failures, 4) Energy efficiency - check aerator efficiency. Small changes in these areas can save 5-15% on costs. Which area interests you most?',
      'best practices': 'For your farm size, focus on: 1) Consistent daily monitoring - establish morning and evening routines, 2) Preventive health management - regular water testing, 3) Optimal stocking density - avoid overcrowding, 4) Feed quality - use trusted suppliers. I can provide a customized checklist based on your specific pond sizes and farming type. Would that help?',
      'degrading': 'Water quality degradation is critical. Take these immediate actions: 1) Check all readings (pH, DO, ammonia, temperature), 2) Increase aeration if DO is low, 3) Perform 20-30% water change if ammonia is high, 4) Reduce feeding by 50%, 5) Monitor every 4-6 hours for next 48 hours. Which parameter is most concerning?',
    };

    // Find best matching response
    let response = 'I understand. Let me help you with that. Could you provide more details about your specific situation? For example, which ponds are affected, what are your current water parameters, or what symptoms are you observing?';

    for (const [key, value] of Object.entries(mockResponses)) {
      if (query.toLowerCase().includes(key)) {
        response = value;
        break;
      }
    }

    const suggestedNextQuestions = [
      'Show me my current water quality readings',
      'What should I do next?',
      'How do I prevent this in the future?',
    ];

    return NextResponse.json(
      {
        response,
        suggestedNextQuestions,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json(
      { error: 'Failed to process chat message' },
      { status: 500 }
    );
  }
}
