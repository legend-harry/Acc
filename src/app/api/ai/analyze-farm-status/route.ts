import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { pondId, pondName, status, symptoms } = await request.json();

    // Mock AI response based on status and symptoms
    const mockRecommendations: Record<string, string> = {
      excellent: `✅ Excellent farm status for ${pondName}! Continue current management practices. Monitor parameters weekly as preventive measure.`,
      good: `👍 Good farm status for ${pondName}. ${symptoms.length > 0 ? `Address these issues: ${symptoms.join(', ')}.` : 'No critical issues detected.'} Implement corrective measures within 48 hours.`,
      fair: `⚠️ Fair farm status for ${pondName}. Issues detected: ${symptoms.join(', ')}. Immediate intervention required. Increase monitoring to 2x daily. Consider partial water exchange.`,
      poor: `🚨 CRITICAL STATUS for ${pondName}! Issues: ${symptoms.join(', ')}. EMERGENCY: Reduce stocking density, increase aeration, and perform immediate water quality tests. Contact veterinarian if mass mortality observed.`,
    };

    return NextResponse.json({
      recommendations: mockRecommendations[status] || 'Unable to analyze farm status',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to analyze farm status' },
      { status: 500 }
    );
  }
}
