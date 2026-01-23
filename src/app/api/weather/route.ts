/**
 * Weather API Route
 * Provides weather data for specific coordinates
 * Can be integrated with OpenWeatherMap or similar service
 */

import { NextRequest, NextResponse } from 'next/server';

// Mock weather data based on location
function generateMockWeather(latitude: number, longitude: number) {
  // Simulate regional variations
  const baseTemp = 28 + (Math.sin(latitude / 10) * 4); // Varies by latitude
  const baseHumidity = 75 + (Math.cos(longitude / 10) * 15); // Varies by longitude

  return {
    temperature: baseTemp + (Math.random() - 0.5) * 2,
    humidity: Math.max(50, Math.min(95, baseHumidity + (Math.random() - 0.5) * 10)),
    windSpeed: 3 + Math.random() * 8,
    cloudCover: Math.random() * 100,
    precipitation: Math.random() > 0.8 ? Math.random() * 5 : 0,
    description: ['Clear', 'Partly cloudy', 'Cloudy', 'Rainy'][Math.floor(Math.random() * 4)],
    icon: ['01d', '02d', '03d', '09d'][Math.floor(Math.random() * 4)],
    location: {
      latitude,
      longitude,
    },
    timestamp: new Date().toISOString(),
  };
}

/**
 * GET /api/weather?lat=10.8075&lon=106.7294
 * Returns current weather data for specified coordinates
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = parseFloat(searchParams.get('lat') || '0');
    const lon = parseFloat(searchParams.get('lon') || '0');

    // Validate coordinates
    if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      return NextResponse.json({ error: 'Invalid coordinates' }, { status: 400 });
    }

    // In production, call real weather API
    // Example: https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={API_KEY}
    // For now, generate mock data

    const weatherData = generateMockWeather(lat, lon);

    return NextResponse.json(weatherData, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    console.error('Weather API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch weather data' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/weather/batch
 * Get weather for multiple locations at once
 */
export async function POST(request: NextRequest) {
  try {
    const { locations } = await request.json();

    if (!Array.isArray(locations) || locations.length === 0) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const weatherDataList = locations.map((loc: any) =>
      generateMockWeather(loc.latitude, loc.longitude)
    );

    return NextResponse.json({ data: weatherDataList });
  } catch (error) {
    console.error('Batch weather API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch weather data' },
      { status: 500 }
    );
  }
}
