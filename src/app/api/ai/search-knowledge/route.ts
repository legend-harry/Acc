import { NextRequest, NextResponse } from 'next/server';

// This endpoint provides AI-powered search for the knowledge base
export async function POST(req: NextRequest) {
  try {
    const { query, currentWaterParams } = await req.json();

    // Simulate AI semantic search that matches query to knowledge base articles
    const relevantArticles = searchKnowledge(query, currentWaterParams);

    return NextResponse.json({
      matchCount: relevantArticles.length,
      topResults: relevantArticles.slice(0, 5),
      recommendations: generateRecommendations(query, currentWaterParams),
    });
  } catch (error) {
    console.error('Knowledge search error:', error);
    return NextResponse.json(
      { error: 'Failed to search knowledge base' },
      { status: 500 }
    );
  }
}

function searchKnowledge(query: string, currentWaterParams: Record<string, number>) {
  const queryLower = query.toLowerCase();
  const articles: any[] = [];

  // AI-powered semantic matching
  if (
    queryLower.includes('ammonia') ||
    queryLower.includes('high ammonia') ||
    currentWaterParams.ammonia > 0.5
  ) {
    articles.push({
      title: 'Ammonia Management in Intensive Farms',
      relevance: 95,
      reason: 'Directly matches your current water parameters',
    });
  }

  if (
    queryLower.includes('oxygen') ||
    queryLower.includes('low do') ||
    queryLower.includes('aeration') ||
    currentWaterParams.do < 5
  ) {
    articles.push({
      title: 'Dissolved Oxygen Crisis Response',
      relevance: 90,
      reason: 'Your current DO level suggests this article is relevant',
    });
  }

  if (queryLower.includes('white spot') || queryLower.includes('wssv')) {
    articles.push({
      title: 'White Spot Syndrome Virus (WSSV) - Identification & Management',
      relevance: 98,
      reason: 'Matches your search query exactly',
    });
  }

  if (queryLower.includes('disease') || queryLower.includes('sick')) {
    articles.push(
      {
        title: 'White Spot Syndrome Virus (WSSV) - Identification & Management',
        relevance: 85,
      },
      {
        title: 'Early Mortality Syndrome (EMS) - Treatment Protocol',
        relevance: 82,
      }
    );
  }

  if (queryLower.includes('fcr') || queryLower.includes('feed')) {
    articles.push({
      title: 'Optimizing Feed Conversion Ratio (FCR)',
      relevance: 88,
      reason: 'Helps improve production efficiency',
    });
  }

  return articles.length > 0
    ? articles
    : [
        {
          title: 'Best Practices: Biosecurity & Disease Prevention',
          relevance: 70,
          reason: 'General best practice for all farms',
        },
      ];
}

function generateRecommendations(
  query: string,
  currentWaterParams: Record<string, number>
): string[] {
  const recommendations: string[] = [];

  if (currentWaterParams.ammonia > 0.5) {
    recommendations.push('Your ammonia levels are elevated. Perform a partial water exchange.');
  }
  if (currentWaterParams.do < 5) {
    recommendations.push('Increase aeration to maintain dissolved oxygen above 5 ppm.');
  }
  if (currentWaterParams.temperature > 30) {
    recommendations.push('Consider shade structures to reduce temperature stress.');
  }

  return recommendations;
}
