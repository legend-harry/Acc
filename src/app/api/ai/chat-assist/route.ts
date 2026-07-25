import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: NextRequest) {
  try {
    const { message, profile, pondId, pondContext } = await req.json();

    if (!profile || !pondId) {
      return NextResponse.json(
        { response: 'Missing profile or pond selection. Select a pond and try again.', missingFields: ['profile', 'pondId'] },
        { status: 200 }
      );
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    
    let systemPrompt = `You are an expert aquaculture and shrimp farming assistant.`;
    if (pondContext) {
      systemPrompt += ` You are currently assisting with a pond named "${pondContext.name}". 
      Context: ${pondContext.farmingType} farming of ${pondContext.shrimpType} shrimp. 
      Day in cycle: ${pondContext.cycleDay}. Current Stock: ${pondContext.currentStock}. 
      Use this context to give highly specific and relevant advice. Keep responses helpful but concise.`;
    }

    const chat = model.startChat({
      systemInstruction: systemPrompt,
    });

    const result = await chat.sendMessage(message);
    const responseText = result.response.text();

    return NextResponse.json({ response: responseText });
  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    );
  }
}
