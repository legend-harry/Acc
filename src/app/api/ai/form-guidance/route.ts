/**
 * Form Guidance API endpoint
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { formType, fieldName, currentValues } = await request.json();

    // TODO: Integrate with Genkit for intelligent guidance generation
    // Use form type and field context to provide relevant help

    const guidanceMap: Record<string, any> = {
      'daily-log': {
        'water-pH': {
          description: 'Measure the acidity/alkalinity of your water',
          whyItMatters:
            'pH affects shrimp health, feed efficiency, and nitrification. Optimal range: 7.0-8.5',
          historicalAverage: 7.8,
          validRange: [6.5, 9.0],
          suggestedValue: 7.8,
          examples: ['7.2 (slightly acidic)', '7.8 (neutral)', '8.2 (slightly alkaline)'],
        },
        'dissolved-oxygen': {
          description: 'How much oxygen is dissolved in your water',
          whyItMatters:
            'Low oxygen causes stress and disease. Minimum safe level: 5 ppm. Critical: >3 ppm',
          historicalAverage: 5.4,
          validRange: [2, 10],
          examples: ['3.5 ppm (emergency level)', '5.0 ppm (acceptable)', '7.5 ppm (good)'],
        },
        'ammonia': {
          description: 'Toxic waste product from shrimp and decomposition',
          whyItMatters:
            'Even 0.5+ ppm can stress shrimp. Daily testing essential. Ideal: <0.1 ppm',
          historicalAverage: 0.2,
          validRange: [0, 2],
          examples: ['0.1 ppm (good)', '0.3 ppm (warning)', '0.8 ppm (critical)'],
        },
        'temperature': {
          description: 'Water temperature in your pond',
          whyItMatters:
            'Vannamei thrive at 26-32°C. Outside range affects feeding and immunity',
          historicalAverage: 28.5,
          validRange: [20, 35],
          examples: ['22°C (winter, low feeding)', '28°C (optimal)', '32°C (hot, high stress)'],
        },
      },
      'pond-setup': {
        'pond-area': {
          description: 'Total surface area of your pond',
          whyItMatters: 'Determines stocking density and oxygen requirements',
          validRange: [0.1, 100],
          examples: ['0.5 ha (small test pond)', '2 ha (medium farm)', '5 ha (large operation)'],
        },
        'stocking-density': {
          description: 'Number of shrimp per square meter',
          whyItMatters: 'Affects survival rate, disease risk, and feed efficiency. Too many = poor FCR',
          validRange: [10, 150],
          examples: [
            '15/m² (extensive - low input)',
            '50/m² (semi-intensive)',
            '100/m² (intensive - high input)',
          ],
        },
      },
    };

    const formGuidance = guidanceMap[formType]?.[fieldName];

    if (!formGuidance) {
      return NextResponse.json(
        {
          guidance: {
            fieldName,
            label: fieldName,
            description: 'Enter the appropriate value for this field',
            whyItMatters: 'This data helps optimize farm management',
          },
          warnings: [],
        },
        { status: 200 }
      );
    }

    // Check for warnings based on current values
    const warnings = [];

    if (fieldName === 'dissolved-oxygen' && currentValues['dissolved-oxygen'] < 3) {
      warnings.push({
        fieldName: 'dissolved-oxygen',
        message: 'Critical dissolved oxygen level detected',
        severity: 'error',
        suggestion: 'Immediately increase aeration. This is an emergency situation.',
      });
    }

    if (fieldName === 'ammonia' && currentValues['ammonia'] > 0.5) {
      warnings.push({
        fieldName: 'ammonia',
        message: 'Ammonia level is high',
        severity: 'warning',
        suggestion: 'Consider reducing feeding and performing partial water change',
      });
    }

    return NextResponse.json(
      {
        guidance: formGuidance,
        warnings,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Form guidance error:', error);
    return NextResponse.json(
      { error: 'Failed to get form guidance' },
      { status: 500 }
    );
  }
}
