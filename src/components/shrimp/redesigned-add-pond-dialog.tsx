/**
 * Redesigned Add Pond Dialog - 5 Stage Setup (Planning & Design removed)
 * Streamlined pond setup wizard with location selection and weather integration
 */

'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  ArrowRight,
  CheckCircle,
  MapPin,
  Droplets,
  Fish,
  Calendar,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { MapLocationSelector } from './map-location-selector';

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

interface AddPondDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddPond: (pond: any) => Promise<void>;
}

type Stage = 'location' | 'dimensions' | 'species' | 'farming-type' | 'stocking' | 'review';

const STAGES: { id: Stage; name: string; icon: any }[] = [
  { id: 'location', name: 'Location', icon: MapPin },
  { id: 'dimensions', name: 'Dimensions', icon: Droplets },
  { id: 'species', name: 'Species', icon: Fish },
  { id: 'farming-type', name: 'Farming Type', icon: AlertTriangle },
  { id: 'stocking', name: 'Stocking', icon: Calendar },
  { id: 'review', name: 'Review', icon: CheckCircle },
];

export function AddPondDialog({ open, onOpenChange, onAddPond }: AddPondDialogProps) {
  const [currentStage, setCurrentStage] = useState<Stage>('location');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    name: '',
    location: null as Location | null,
    weather: null as WeatherData | null,
    length: 0,
    width: 0,
    depth: 0,
    area: 0,
    species: 'vannamei' as 'vannamei' | 'tiger' | 'monodon',
    farmingType: 'semi-intensive' as 'extensive' | 'semi-intensive' | 'intensive',
    targetDensity: 0,
    seedAmount: 0,
    expectedCount: 0,
    waterSource: '',
  });

  const stageIndex = STAGES.findIndex((s) => s.id === currentStage);
  const progress = ((stageIndex + 1) / STAGES.length) * 100;

  const handleLocationSelect = (location: Location, weather: WeatherData) => {
    setFormData({ ...formData, location, weather });
    goToStage('dimensions');
  };

  const handleDimensionsChange = (field: string, value: number) => {
    const updated = { ...formData, [field]: value };

    // Calculate area if length and width are provided
    if (field === 'length' || field === 'width') {
      if (updated.length && updated.width) {
        updated.area = (updated.length * updated.width) / 10000; // Convert to hectares
      }
    }

    setFormData(updated);
  };

  const handleNextStage = async () => {
    // Validate current stage
    if (!validateStage(currentStage)) {
      alert(`Please complete the ${currentStage} stage before proceeding`);
      return;
    }

    const nextIndex = stageIndex + 1;
    if (nextIndex < STAGES.length) {
      setCurrentStage(STAGES[nextIndex].id);
    }
  };

  const handlePreviousStage = () => {
    const prevIndex = stageIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStage(STAGES[prevIndex].id);
    }
  };

  const goToStage = (stage: Stage) => {
    setCurrentStage(stage);
  };

  const validateStage = (stage: Stage): boolean => {
    switch (stage) {
      case 'location':
        return formData.location !== null;
      case 'dimensions':
        return formData.length > 0 && formData.width > 0 && formData.depth > 0;
      case 'species':
        return !!formData.species;
      case 'farming-type':
        return !!formData.farmingType;
      case 'stocking':
        return formData.seedAmount > 0;
      case 'review':
        return !!formData.name;
      default:
        return true;
    }
  };

  const handleSubmit = async () => {
    if (!validateStage('review')) {
      alert('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const pond = {
        name: formData.name,
        area: formData.area,
        length: formData.length,
        width: formData.width,
        depth: formData.depth,
        shrimpType: formData.species,
        farmingType: formData.farmingType,
        targetDensity: formData.targetDensity || 0,
        seedAmount: formData.seedAmount,
        expectedCount: formData.expectedCount || 0,
        waterSource: formData.waterSource,
        location: formData.location,
        weather: formData.weather,
        currentStock: 0,
        status: 'preparing',
        currentPhase: 'setup',
        cycleDay: 0,
        linkedProjectId: null,
      };

      await onAddPond(pond);
      onOpenChange(false);
      setFormData({
        name: '',
        location: null,
        weather: null,
        length: 0,
        width: 0,
        depth: 0,
        area: 0,
        species: 'vannamei',
        farmingType: 'semi-intensive',
        targetDensity: 0,
        seedAmount: 0,
        expectedCount: 0,
        waterSource: '',
      });
      setCurrentStage('location');
    } catch (error) {
      console.error('Error adding pond:', error);
      alert('Failed to add pond');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Fish className="h-5 w-5" />
            Add New Pond
          </DialogTitle>
          <DialogDescription>Set up a new shrimp farming pond in 5 steps</DialogDescription>
        </DialogHeader>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">
              Step {stageIndex + 1} of {STAGES.length}
            </span>
            <span className="text-sm text-muted-foreground">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Stage Indicators */}
        <div className="flex gap-1 mb-6 overflow-x-auto pb-2">
          {STAGES.map((stage, idx) => {
            const Icon = stage.icon;
            const isCompleted = idx < stageIndex;
            const isCurrent = stage.id === currentStage;
            const isValid = validateStage(stage.id);

            return (
              <button
                key={stage.id}
                onClick={() => idx <= stageIndex && goToStage(stage.id)}
                className={`flex flex-col items-center gap-1 px-3 py-2 rounded transition-all flex-shrink-0 ${
                  isCurrent
                    ? 'bg-primary text-primary-foreground'
                    : isCompleted && isValid
                      ? 'bg-green-100 text-green-800 cursor-pointer hover:bg-green-200'
                      : 'bg-muted text-muted-foreground'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="text-xs font-medium text-center whitespace-nowrap">
                  {stage.name}
                </span>
              </button>
            );
          })}
        </div>

        {/* Stage Content */}
        <div className="min-h-64 space-y-4">
          {/* Stage 1: Location */}
          {currentStage === 'location' && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Select Pond Location</h3>
              <MapLocationSelector
                onLocationSelect={handleLocationSelect}
                initialLocation={formData.location || undefined}
              />
            </div>
          )}

          {/* Stage 2: Dimensions */}
          {currentStage === 'dimensions' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-4">Pond Dimensions</h3>
                <Alert className="mb-4 bg-blue-50 border-blue-200">
                  <Info className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-900">
                    Dimensions are used to calculate pond area and help AI system optimize feeding
                  </AlertDescription>
                </Alert>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="length">Length (meters)</Label>
                  <Input
                    id="length"
                    type="number"
                    placeholder="0"
                    value={formData.length || ''}
                    onChange={(e) => handleDimensionsChange('length', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="width">Width (meters)</Label>
                  <Input
                    id="width"
                    type="number"
                    placeholder="0"
                    value={formData.width || ''}
                    onChange={(e) => handleDimensionsChange('width', parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="depth">Depth (meters)</Label>
                <Input
                  id="depth"
                  type="number"
                  placeholder="0"
                  value={formData.depth || ''}
                  onChange={(e) => handleDimensionsChange('depth', parseFloat(e.target.value) || 0)}
                />
              </div>

              {formData.area > 0 && (
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="pt-4">
                    <p className="text-sm text-muted-foreground">Calculated Pond Area</p>
                    <p className="text-2xl font-bold text-blue-900">
                      {formData.area.toFixed(3)} hectares
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Stage 3: Species */}
          {currentStage === 'species' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Shrimp Species</h3>
              <div className="space-y-3">
                {[
                  {
                    value: 'vannamei',
                    label: 'Whiteleg Shrimp (Vannamei)',
                    description: 'Most popular, good for beginners, disease resistant',
                  },
                  {
                    value: 'tiger',
                    label: 'Black Tiger Shrimp',
                    description: 'Premium price, requires careful management',
                  },
                  {
                    value: 'monodon',
                    label: 'Giant Tiger Shrimp',
                    description: 'Largest size, highest profit potential',
                  },
                ].map((species) => (
                  <div
                    key={species.value}
                    onClick={() => setFormData({ ...formData, species: species.value as any })}
                    className={`p-3 border rounded-lg cursor-pointer transition-all ${
                      formData.species === species.value
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {formData.species === species.value && (
                        <CheckCircle className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                      )}
                      <div className="flex-1">
                        <p className="font-semibold">{species.label}</p>
                        <p className="text-sm text-muted-foreground">{species.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Stage 4: Farming Type */}
          {currentStage === 'farming-type' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Farming Type</h3>
              <div className="space-y-3">
                {[
                  {
                    value: 'extensive',
                    label: 'Extensive',
                    description: 'Low density, minimal inputs, traditional method',
                    density: '5,000-10,000/ha',
                  },
                  {
                    value: 'semi-intensive',
                    label: 'Semi-Intensive',
                    description: 'Moderate density, balanced approach, most common',
                    density: '25,000-50,000/ha',
                  },
                  {
                    value: 'intensive',
                    label: 'Intensive',
                    description: 'High density, requires advanced management',
                    density: '100,000+/ha',
                  },
                ].map((type) => (
                  <div
                    key={type.value}
                    onClick={() =>
                      setFormData({
                        ...formData,
                        farmingType: type.value as any,
                        targetDensity:
                          type.value === 'extensive'
                            ? 7500
                            : type.value === 'semi-intensive'
                              ? 37500
                              : 150000,
                      })
                    }
                    className={`p-3 border rounded-lg cursor-pointer transition-all ${
                      formData.farmingType === type.value
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {formData.farmingType === type.value && (
                        <CheckCircle className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                      )}
                      <div className="flex-1">
                        <p className="font-semibold">{type.label}</p>
                        <p className="text-sm text-muted-foreground">{type.description}</p>
                        <Badge variant="outline" className="mt-2">
                          {type.density}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Stage 5: Stocking */}
          {currentStage === 'stocking' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Stocking Details</h3>

              <div className="space-y-2">
                <Label htmlFor="seedAmount">Number of Seeds/Postlarvae</Label>
                <Input
                  id="seedAmount"
                  type="number"
                  placeholder="0"
                  value={formData.seedAmount || ''}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value) || 0;
                    setFormData({
                      ...formData,
                      seedAmount: value,
                      expectedCount: Math.round(value * 0.85), // 85% expected survival
                    });
                  }}
                />
                <p className="text-xs text-muted-foreground">
                  Total number of seeds/postlarvae to be stocked
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="waterSource">Water Source</Label>
                <Select
                  value={formData.waterSource}
                  onValueChange={(value) =>
                    setFormData({ ...formData, waterSource: value })
                  }
                >
                  <SelectTrigger id="waterSource">
                    <SelectValue placeholder="Select water source" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="well">Well</SelectItem>
                    <SelectItem value="river">River</SelectItem>
                    <SelectItem value="canal">Canal</SelectItem>
                    <SelectItem value="rain">Rainwater</SelectItem>
                    <SelectItem value="mixed">Mixed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.seedAmount > 0 && (
                <Card className="bg-green-50 border-green-200">
                  <CardContent className="pt-4 space-y-2">
                    <p className="text-sm text-muted-foreground">Expected Harvest</p>
                    <p className="text-2xl font-bold text-green-900">
                      {(formData.expectedCount / 1000).toFixed(1)}K shrimp
                    </p>
                    <p className="text-xs text-green-800">
                      Based on 85% survival rate assumption
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Stage 6: Review */}
          {currentStage === 'review' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Review Pond Details</h3>

              <div className="space-y-2">
                <Label htmlFor="pondName">Pond Name</Label>
                <Input
                  id="pondName"
                  placeholder="e.g., Pond A, East Field"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="grid gap-4">
                {[
                  { label: 'Location', value: formData.location?.area || 'Not set' },
                  { label: 'Area', value: `${formData.area.toFixed(3)} hectares` },
                  { label: 'Dimensions', value: `${formData.length}m × ${formData.width}m × ${formData.depth}m` },
                  { label: 'Species', value: formData.species.charAt(0).toUpperCase() + formData.species.slice(1) },
                  { label: 'Farming Type', value: formData.farmingType },
                  { label: 'Initial Stock', value: `${(formData.seedAmount / 1000).toFixed(1)}K` },
                  { label: 'Expected Harvest', value: `${(formData.expectedCount / 1000).toFixed(1)}K` },
                  { label: 'Water Source', value: formData.waterSource || 'Not specified' },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex justify-between items-center p-2 rounded bg-muted"
                  >
                    <span className="text-sm text-muted-foreground">{item.label}</span>
                    <span className="font-semibold">{item.value}</span>
                  </div>
                ))}
              </div>

              {formData.weather && (
                <Card className="bg-blue-50 border-blue-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Location Weather</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div>
                        <p className="text-muted-foreground">Temperature</p>
                        <p className="font-semibold">{formData.weather.temperature.toFixed(1)}°C</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Humidity</p>
                        <p className="font-semibold">{formData.weather.humidity.toFixed(0)}%</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Wind</p>
                        <p className="font-semibold">{formData.weather.windSpeed.toFixed(1)} m/s</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex gap-3 justify-between pt-4">
          <Button
            variant="outline"
            onClick={handlePreviousStage}
            disabled={stageIndex === 0}
          >
            Previous
          </Button>

          {currentStage !== 'review' ? (
            <Button onClick={handleNextStage}>
              Next <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !formData.name}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSubmitting ? 'Creating Pond...' : 'Create Pond'}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
