/**
 * Map-Based Pond Location Selector
 * Mobile-friendly interface for selecting pond location with weather data
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  MapPin,
  Navigation,
  Thermometer,
  Droplets,
  Wind,
  Cloud,
  AlertTriangle,
  CheckCircle,
  Search,
  X,
} from 'lucide-react';

interface Location {
  latitude: number;
  longitude: number;
  area: string;
  address?: string;
}

interface WeatherData {
  temperature: number;
  humidity: number;
  windSpeed: number;
  cloudCover: number;
  precipitation: number;
  description: string;
  icon: string;
}

interface LocationSelectorProps {
  onLocationSelect: (location: Location, weather: WeatherData) => void;
  onCancel?: () => void;
  initialLocation?: Location;
}

// Mock location suggestions for demo
const LOCATION_SUGGESTIONS = [
  { latitude: 10.8075, longitude: 106.7294, area: 'Ho Chi Minh City, Vietnam', state: 'HCM' },
  { latitude: 20.8449, longitude: 106.7705, area: 'Hai Phong, Vietnam', state: 'HP' },
  { latitude: 18.7883, longitude: 105.7241, area: 'Dong Hoi, Vietnam', state: 'QBinh' },
  { latitude: 11.1694, longitude: 106.4424, area: 'Ben Tre, Vietnam', state: 'BenTre' },
  { latitude: 9.8, longitude: 105.95, area: 'Ca Mau, Vietnam', state: 'CaMau' },
];

// Mock function to fetch weather data
async function fetchWeatherData(latitude: number, longitude: number): Promise<WeatherData> {
  try {
    // In production, use real OpenWeatherMap API
    // For now, return mock data based on location
    const response = await fetch(
      `/api/weather?lat=${latitude}&lon=${longitude}`
    ).catch(() => null);

    if (response && response.ok) {
      return await response.json();
    }

    // Return mock data
    return {
      temperature: 28 + Math.random() * 5,
      humidity: 70 + Math.random() * 20,
      windSpeed: 5 + Math.random() * 8,
      cloudCover: Math.random() * 100,
      precipitation: Math.random() * 5,
      description: 'Partly cloudy',
      icon: '02d',
    };
  } catch (error) {
    console.error('Error fetching weather:', error);
    return {
      temperature: 28,
      humidity: 75,
      windSpeed: 5,
      cloudCover: 50,
      precipitation: 0,
      description: 'Unknown',
      icon: '01d',
    };
  }
}

export function MapLocationSelector({
  onLocationSelect,
  onCancel,
  initialLocation,
}: LocationSelectorProps) {
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(initialLocation || null);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredSuggestions, setFilteredSuggestions] = useState(LOCATION_SUGGESTIONS);
  const [isLoadingWeather, setIsLoadingWeather] = useState(false);
  const [mapMode, setMapMode] = useState<'search' | 'edit'>('search');

  // Filter location suggestions based on search
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredSuggestions(LOCATION_SUGGESTIONS);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredSuggestions(
        LOCATION_SUGGESTIONS.filter((loc) =>
          loc.area.toLowerCase().includes(query)
        )
      );
    }
  }, [searchQuery]);

  // Fetch weather when location changes
  useEffect(() => {
    if (selectedLocation) {
      setIsLoadingWeather(true);
      fetchWeatherData(selectedLocation.latitude, selectedLocation.longitude)
        .then((data) => {
          setWeather(data);
          setIsLoadingWeather(false);
        })
        .catch((error) => {
          console.error('Error loading weather:', error);
          setIsLoadingWeather(false);
        });
    }
  }, [selectedLocation]);

  const handleLocationSelect = (location: Location) => {
    setSelectedLocation(location);
    setMapMode('edit');
    setSearchQuery('');
  };

  const handleUseCurrentLocation = async () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location: Location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            area: 'Current Location',
            address: `${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`,
          };
          setSelectedLocation(location);
          setMapMode('edit');
        },
        (error) => {
          console.error('Error getting location:', error);
          alert('Unable to access your location. Please enable location services.');
        }
      );
    }
  };

  const handleConfirmLocation = () => {
    if (selectedLocation && weather) {
      onLocationSelect(selectedLocation, weather);
    }
  };

  const handleManualCoordinates = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const latitude = parseFloat(formData.get('latitude') as string);
    const longitude = parseFloat(formData.get('longitude') as string);
    const area = (formData.get('area') as string) || 'Custom Location';

    if (!isNaN(latitude) && !isNaN(longitude)) {
      const location: Location = {
        latitude,
        longitude,
        area,
      };
      setSelectedLocation(location);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search Mode */}
      {mapMode === 'search' && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Select Pond Location
              </CardTitle>
              <CardDescription>
                Choose from popular locations or use your current location
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Current Location Button */}
              <Button
                onClick={handleUseCurrentLocation}
                variant="outline"
                className="w-full"
              >
                <Navigation className="h-4 w-4 mr-2" />
                Use Current Location
              </Button>

              {/* Location Suggestions */}
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {filteredSuggestions.map((location) => (
                  <button
                    key={location.state}
                    onClick={() => handleLocationSelect(location)}
                    className="w-full p-3 text-left border rounded-lg hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <MapPin className="h-5 w-5 text-blue-500 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{location.area}</p>
                        <p className="text-xs text-muted-foreground">
                          {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {location.state}
                      </Badge>
                    </div>
                  </button>
                ))}

                {filteredSuggestions.length === 0 && (
                  <div className="text-center py-6 text-muted-foreground">
                    <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No locations found</p>
                  </div>
                )}
              </div>

              {/* Manual Coordinates Entry */}
              <div className="border-t pt-4">
                <p className="text-sm font-medium mb-3">Enter Coordinates Manually</p>
                <form onSubmit={handleManualCoordinates} className="space-y-3">
                  <Input name="area" placeholder="Area name (optional)" />
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      name="latitude"
                      type="number"
                      step="0.0001"
                      placeholder="Latitude"
                      required
                    />
                    <Input
                      name="longitude"
                      type="number"
                      step="0.0001"
                      placeholder="Longitude"
                      required
                    />
                  </div>
                  <Button type="submit" variant="outline" className="w-full">
                    Set Custom Location
                  </Button>
                </form>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Edit Mode - Selected Location with Weather */}
      {mapMode === 'edit' && selectedLocation && weather && (
        <>
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    Location Selected
                  </CardTitle>
                  <CardDescription>{selectedLocation.area}</CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setMapMode('search');
                    setSelectedLocation(null);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Location Details */}
              <div className="p-3 bg-muted rounded-lg">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-muted-foreground">Latitude</p>
                    <p className="font-mono font-semibold">{selectedLocation.latitude.toFixed(6)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Longitude</p>
                    <p className="font-mono font-semibold">{selectedLocation.longitude.toFixed(6)}</p>
                  </div>
                </div>
              </div>

              {/* Weather Data Section */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Cloud className="h-5 w-5" />
                  Current Weather at Location
                </h3>

                {isLoadingWeather ? (
                  <div className="text-center py-4 text-muted-foreground">
                    Loading weather data...
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {/* Main Weather Info */}
                    <Alert className="bg-blue-50 border-blue-200">
                      <Cloud className="h-4 w-4 text-blue-600" />
                      <AlertDescription className="text-blue-900">
                        {weather.description}
                      </AlertDescription>
                    </Alert>

                    {/* Weather Cards */}
                    <div className="grid grid-cols-2 gap-3">
                      {/* Temperature */}
                      <div className="p-3 rounded bg-orange-50 border border-orange-200">
                        <div className="flex items-center gap-2 mb-2">
                          <Thermometer className="h-4 w-4 text-orange-600" />
                          <span className="text-xs font-semibold text-orange-900">Temperature</span>
                        </div>
                        <p className="text-2xl font-bold text-orange-900">
                          {weather.temperature.toFixed(1)}°C
                        </p>
                      </div>

                      {/* Humidity */}
                      <div className="p-3 rounded bg-blue-50 border border-blue-200">
                        <div className="flex items-center gap-2 mb-2">
                          <Droplets className="h-4 w-4 text-blue-600" />
                          <span className="text-xs font-semibold text-blue-900">Humidity</span>
                        </div>
                        <p className="text-2xl font-bold text-blue-900">
                          {weather.humidity.toFixed(0)}%
                        </p>
                      </div>

                      {/* Wind Speed */}
                      <div className="p-3 rounded bg-cyan-50 border border-cyan-200">
                        <div className="flex items-center gap-2 mb-2">
                          <Wind className="h-4 w-4 text-cyan-600" />
                          <span className="text-xs font-semibold text-cyan-900">Wind Speed</span>
                        </div>
                        <p className="text-2xl font-bold text-cyan-900">
                          {weather.windSpeed.toFixed(1)} m/s
                        </p>
                      </div>

                      {/* Cloud Cover */}
                      <div className="p-3 rounded bg-gray-50 border border-gray-200">
                        <div className="flex items-center gap-2 mb-2">
                          <Cloud className="h-4 w-4 text-gray-600" />
                          <span className="text-xs font-semibold text-gray-900">Cloud Cover</span>
                        </div>
                        <p className="text-2xl font-bold text-gray-900">
                          {weather.cloudCover.toFixed(0)}%
                        </p>
                      </div>
                    </div>

                    {/* AI Insights */}
                    <Alert className="bg-green-50 border-green-200">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-green-900">
                        <p className="font-semibold mb-1">Optimal Conditions Assessment</p>
                        <ul className="text-xs space-y-1">
                          {weather.temperature >= 25 && weather.temperature <= 32 && (
                            <li>✓ Temperature is in ideal range for shrimp farming</li>
                          )}
                          {weather.humidity >= 70 && weather.humidity <= 90 && (
                            <li>✓ Humidity levels are suitable</li>
                          )}
                          {weather.windSpeed < 10 && (
                            <li>✓ Wind speed is manageable</li>
                          )}
                          {weather.precipitation < 3 && (
                            <li>✓ Low risk of flooding from rainfall</li>
                          )}
                        </ul>
                      </AlertDescription>
                    </Alert>

                    {/* Warnings */}
                    {(weather.temperature < 25 || weather.temperature > 32) && (
                      <Alert variant="destructive" className="bg-yellow-50 border-yellow-200 text-yellow-900">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          Temperature is outside optimal range. Consider location with 25-32°C
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                )}
              </div>

              {/* Help Text */}
              <div className="p-3 bg-muted rounded text-sm text-muted-foreground">
                <p>
                  This location data will help the AI system provide better recommendations for pond
                  management, including optimal feeding schedules and water quality monitoring based
                  on local weather patterns.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setMapMode('search');
                setSelectedLocation(null);
              }}
              className="flex-1"
            >
              Choose Different Location
            </Button>
            <Button onClick={handleConfirmLocation} className="flex-1">
              <CheckCircle className="h-4 w-4 mr-2" />
              Confirm Location
            </Button>
          </div>
        </>
      )}

      {/* Cancel Button */}
      {onCancel && (
        <Button variant="outline" onClick={onCancel} className="w-full">
          Cancel
        </Button>
      )}
    </div>
  );
}
