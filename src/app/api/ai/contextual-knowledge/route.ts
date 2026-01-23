/**
 * Contextual Knowledge API endpoint
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { waterParams, phaseDay } = await request.json();

    // TODO: Integrate with knowledge base and ML model
    // Use water parameters and phase to recommend articles

    const mockArticles = [
      {
        id: '1',
        title: 'Managing Ammonia Spikes',
        summary: 'How to identify and resolve ammonia accumulation in your ponds',
        category: 'Water Quality',
        readTime: 5,
        relevanceScore: 0.95,
        trigger: 'Ammonia levels detected above 0.3 ppm',
        keywords: ['ammonia', 'water quality', 'emergency'],
        icon: '🐠',
        content: `Ammonia (NH₃) is a toxic compound produced from shrimp waste. High levels can cause stress and disease.

Key Management Steps:
1. Reduce feeding immediately (50-75% of normal)
2. Increase aeration to boost nitrification
3. Perform 20-30% water exchange
4. Monitor ammonia every 4-6 hours for 48 hours
5. Resume normal feeding after levels drop below 0.25 ppm

Prevention:
- Maintain stocking density within recommended ranges
- Use efficient aerators sized for your ponds
- Establish regular water testing schedule
- Track feeding amounts and adjust based on consumption`,
      },
      {
        id: '2',
        title: 'Mid-Cycle Disease Prevention',
        summary: 'Best practices for disease prevention during operation phase',
        category: 'Health Management',
        readTime: 8,
        relevanceScore: 0.85,
        trigger: `You're at day ${phaseDay} of the cycle - peak disease risk period`,
        keywords: ['disease', 'prevention', 'health', 'cycle'],
        icon: '🛡️',
        content: `At mid-cycle, shrimp immunity is most vulnerable. Focus on prevention.

Critical Actions:
1. Daily water quality testing (pH, DO, Ammonia, Temperature)
2. Visual health inspections every morning
3. Maintain consistent feeding schedule
4. Monitor for unusual behavior or mortality
5. Keep biosecurity protocols strict

Warning Signs:
- Sudden mortality increase (>5% daily)
- Loss of appetite or uneven feeding
- Discoloration or shell abnormalities
- Clustering at pond edges
- Erratic swimming behavior

Immediate Response:
- Stop feeding if mortality detected
- Test water immediately
- Consult veterinarian
- Consider partial water exchange`,
      },
      {
        id: '3',
        title: 'Aerator Maintenance Schedule',
        summary: 'Keep your aerators operating at peak efficiency',
        category: 'Equipment Maintenance',
        readTime: 6,
        relevanceScore: 0.78,
        trigger: 'Preventive maintenance recommended for your farm size',
        keywords: ['maintenance', 'aerator', 'equipment', 'efficiency'],
        icon: '⚙️',
        content: `Aerators are critical for maintaining dissolved oxygen and nitrification.

Monthly Maintenance:
- Clean intake filters
- Check bearing lubrication
- Inspect for mechanical wear
- Test output capacity
- Record operating hours

Quarterly Service:
- Professional inspection
- Replace worn bearings/seals
- Check motor efficiency
- Clean impellers thoroughly

Signs of Declining Efficiency:
- DO levels dropping despite full operation
- Increased vibration or noise
- Higher current draw
- Visible rust or corrosion

Emergency Replacement:
- Maintain 1 backup aerator for critical ponds
- Know equipment supplier contact information
- Have spare parts on hand`,
      },
    ];

    const mockMicroLearnings = [
      {
        id: '1',
        type: 'tip',
        title: 'Temperature Impact on Feeding',
        content:
          'Shrimp feed less efficiently when water temperature drops below 24°C. Monitor feeding consumption carefully and adjust amounts accordingly.',
        icon: '🌡️',
      },
      {
        id: '2',
        type: 'definition',
        title: 'What is FCR?',
        content:
          'Feed Conversion Ratio (FCR) = kg of feed / kg of biomass gained. Lower is better. Typical range: 1.3-1.8. Target: <1.5 for intensive systems.',
        icon: '📊',
      },
      {
        id: '3',
        type: 'best-practice',
        title: 'Best Time for Water Testing',
        content:
          'Test water quality just before afternoon feeding and again at dawn. This captures peak stress periods when parameters fluctuate most.',
        icon: '🕒',
      },
    ];

    return NextResponse.json(
      {
        articles: mockArticles,
        microLearnings: mockMicroLearnings,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Contextual knowledge error:', error);
    return NextResponse.json(
      { error: 'Failed to load knowledge articles' },
      { status: 500 }
    );
  }
}
