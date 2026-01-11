import { NextRequest, NextResponse } from 'next/server';

type DocumentType = 'soil-testing' | 'water-testing' | 'feed-analysis' | 'health-report' | 'unknown';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const pondId = formData.get('pondId') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Mock document type detection based on filename
    const filename = file.name.toLowerCase();
    let documentType: DocumentType = 'unknown';
    let confidence = 0.75;

    if (filename.includes('soil')) {
      documentType = 'soil-testing';
      confidence = 0.95;
    } else if (filename.includes('water') || filename.includes('testing')) {
      documentType = 'water-testing';
      confidence = 0.98;
    } else if (filename.includes('feed') || filename.includes('analysis')) {
      documentType = 'feed-analysis';
      confidence = 0.88;
    } else if (filename.includes('health') || filename.includes('report')) {
      documentType = 'health-report';
      confidence = 0.92;
    } else {
      confidence = 0.60;
    }

    return NextResponse.json({
      documentType,
      confidence,
      fileName: file.name,
      fileSize: file.size,
      uploadedAt: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to process document' },
      { status: 500 }
    );
  }
}
