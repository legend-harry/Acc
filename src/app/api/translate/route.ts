import { NextRequest, NextResponse } from 'next/server';
import { translateWithAzure } from '@/lib/azure-translator';

type TranslateBody = {
  text?: string;
  texts?: string[];
  to?: string;
  textType?: 'plain' | 'html';
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as TranslateBody;
    const texts = body.texts ?? (body.text ? [body.text] : []);
    const to = body.to?.trim();

    if (!texts.length || !to) {
      return NextResponse.json({ error: 'Missing translation payload' }, { status: 400 });
    }

    const translatedTexts = await translateWithAzure({
      texts,
      to,
      textType: body.textType ?? 'plain',
    });

    return NextResponse.json({
      translatedText: translatedTexts[0] ?? '',
      translations: translatedTexts,
    });
  } catch (error) {
    console.error('Translation API error:', error);
    return NextResponse.json(
      { error: 'Unable to translate text right now' },
      { status: 500 }
    );
  }
}
