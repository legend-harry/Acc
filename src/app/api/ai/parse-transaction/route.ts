import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: NextRequest) {
  try {
    const { description, projects, categories } = await req.json();

    if (!description) {
      return NextResponse.json({ error: 'Description is required' }, { status: 400 });
    }

    const today = new Date().toISOString().split('T')[0];

    const prompt = `You are a financial transaction parser for a farm management app. 
Parse the following natural language description into a structured transaction.

Description: "${description}"

Available projects: ${projects?.length ? projects.map((p: any) => `"${p.name}" (id: ${p.id})`).join(', ') : 'None'}
Available categories: ${categories?.length ? categories.join(', ') : 'Feed, Labor, Equipment, Medicine, Other'}
Today's date: ${today}

Extract and return ONLY a valid JSON object with these fields:
- title: string (concise transaction title)
- type: "expense" | "income"
- amount: number (in currency, no symbols)
- category: string (pick from available categories, or suggest a relevant one)
- vendor: string (vendor/supplier/person name, or empty string)
- description: string (brief description)
- date: string (ISO date YYYY-MM-DD, default to today if not mentioned)
- status: "completed" | "credit" | "expected" (default "completed")
- projectId: string (pick the most relevant project ID from available projects, or empty)
- notes: string (any additional context)

Important:
- If the user mentions "credit", "owe", "pending", "not paid yet" → status = "credit"
- If the user mentions "expected", "will receive", "upcoming" → status = "expected"
- If the user mentions "sold", "sold harvest", "revenue", "income" → type = "income"
- Feed purchases are usually expenses with category "Feed"
- Salary/wages are usually expenses with category "Labor"
- Harvest sales without specifying "profit" are usually income
- Match the project by name similarity if mentioned

Return ONLY the JSON, no explanation or markdown.`;

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();

    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    return NextResponse.json({ transaction: parsed });
  } catch (error) {
    console.error('parse-transaction error:', error);

    // Return a fallback structure so the UI can still work
    return NextResponse.json({
      transaction: {
        title: '',
        type: 'expense',
        amount: 0,
        category: 'Other',
        vendor: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        status: 'completed',
        projectId: '',
        notes: '',
      },
      error: 'Could not parse — please fill in fields manually',
    });
  }
}
