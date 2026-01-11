import { NextRequest, NextResponse } from 'next/server';

// This endpoint generates AI design recommendations for new ponds
export async function POST(req: NextRequest) {
  try {
    const { pondName, area, productionModel, species, waterSource } = await req.json();

    const recommendations = generatePondRecommendations(
      area,
      productionModel,
      species,
      waterSource
    );

    return NextResponse.json(recommendations);
  } catch (error) {
    console.error('Pond design error:', error);
    return NextResponse.json(
      { error: 'Failed to generate design recommendations' },
      { status: 500 }
    );
  }
}

function generatePondRecommendations(
  area: number,
  productionModel: string,
  species: string,
  waterSource: string
): Record<string, any> {
  const equipment: string[] = [];
  const considerations: string[] = [];

  // Aeration equipment based on production model
  if (productionModel === 'intensive') {
    equipment.push('6-8 paddle wheel aerators (1-2 hp each)');
    equipment.push('Blower system for high-density aeration');
  } else if (productionModel === 'semi-intensive') {
    equipment.push('3-4 paddle wheel aerators (0.75-1 hp each)');
  } else {
    equipment.push('2 paddle wheel aerators (0.5 hp each)');
  }

  // Water quality equipment
  equipment.push('Digital water quality testing kit (pH, DO, ammonia, nitrite)');
  equipment.push('Backup aeration system');

  // Based on water source
  if (waterSource === 'well') {
    equipment.push('Water settling tank (pre-treatment)');
    considerations.push('Test well water for heavy metals and pathogens before use');
  } else if (waterSource === 'seawater') {
    equipment.push('Sand filter for pre-filtration');
    considerations.push('Install UV sterilization system for disease prevention');
  }

  // Species-specific considerations
  if (species === 'tiger') {
    considerations.push('Tiger shrimp are more sensitive to temperature fluctuations');
    considerations.push('Implement stricter biosecurity protocols');
  } else if (species === 'vannamei') {
    considerations.push('Vannamei are hardy and suitable for most conditions');
    considerations.push('Ensure proper nutrition with formulated feeds');
  }

  // General best practices
  considerations.push('Install reliable backup power supply for aeration');
  considerations.push('Create drainage and overflow systems for safety');
  considerations.push('Set up monitoring station for 24-hour observation');

  return {
    equipment,
    considerations,
    estimatedSetupTime: '2-3 weeks',
    staffRequired: productionModel === 'intensive' ? '2-3 people' : '1-2 people',
  };
}
