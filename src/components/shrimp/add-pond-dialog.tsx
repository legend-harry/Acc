"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Wand2, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AddPondDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPondAdded?: (pond: { name: string; area: number; species: string }) => void;
}

export function AddPondDialog({ open, onOpenChange, onPondAdded }: AddPondDialogProps) {
  const { toast } = useToast();
  const [step, setStep] = useState(1); // 1: Basic Info, 2: Design, 3: Review
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [recommendations, setRecommendations] = useState<any>(null);

  const [formData, setFormData] = useState({
    pondName: '',
    area: 1,
    species: 'vannamei',
    productionModel: 'intensive',
    targetDensity: 80,
    waterSource: 'well',
    estimatedCost: 0,
  });

  const productionModels = [
    { id: 'extensive', label: 'Extensive', density: '10-15/m²', description: 'Low input, natural systems' },
    { id: 'semi-intensive', label: 'Semi-Intensive', density: '30-50/m²', description: 'Moderate input and density' },
    { id: 'intensive', label: 'Intensive', density: '80-150/m²', description: 'High input, high output' },
  ];

  const waterSources = [
    { id: 'well', label: 'Well Water', quality: 'Good' },
    { id: 'pond', label: 'Brackish Pond', quality: 'Variable' },
    { id: 'seawater', label: 'Seawater', quality: 'Excellent' },
    { id: 'canal', label: 'Canal/Estuary', quality: 'Mixed' },
  ];

  const handleOptimizeDesign = async () => {
    setIsOptimizing(true);
    try {
      const response = await fetch('/api/ai/optimize-pond-design', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pondName: formData.pondName,
          area: formData.area,
          productionModel: formData.productionModel,
          species: formData.species,
          waterSource: formData.waterSource,
        }),
      });

      const data = await response.json();

      if (data.recommendations) {
        setRecommendations(data.recommendations);
        toast({
          title: "Design Optimized",
          description: "AI recommendations generated based on your parameters",
        });
      }
    } catch (error) {
      console.error('Design optimization error:', error);
      toast({
        variant: "destructive",
        title: "Optimization Failed",
        description: "Could not generate recommendations",
      });
    } finally {
      setIsOptimizing(false);
    }
  };

  const calculateEstimatedCost = () => {
    const baseCost = formData.area * 50000; // $/hectare
    const modelMultiplier = {
      'extensive': 0.8,
      'semi-intensive': 1.2,
      'intensive': 1.8,
    };
    return Math.round(baseCost * modelMultiplier[formData.productionModel as keyof typeof modelMultiplier]);
  };

  const handleAddPond = () => {
    if (!formData.pondName) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please enter a pond name",
      });
      return;
    }

    if (onPondAdded) {
      onPondAdded({
        name: formData.pondName,
        area: formData.area,
        species: formData.species,
      });
    }

    toast({
      title: "Pond Added",
      description: `${formData.pondName} has been added to your farm`,
    });

    setStep(1);
    setFormData({
      pondName: '',
      area: 1,
      species: 'vannamei',
      productionModel: 'intensive',
      targetDensity: 80,
      waterSource: 'well',
      estimatedCost: 0,
    });
    setRecommendations(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Pond</DialogTitle>
          <DialogDescription>
            Step {step} of 3 - Configure your new shrimp farming pond
          </DialogDescription>
        </DialogHeader>

        {/* Step Indicator */}
        <div className="flex gap-2 mb-6">
          {[1, 2, 3].map(s => (
            <div
              key={s}
              className={`flex-1 h-2 rounded-full ${
                s <= step ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            />
          ))}
        </div>

        {/* Step 1: Basic Information */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pond-name">Pond Name</Label>
              <Input
                id="pond-name"
                placeholder="e.g., Pond A1, Main Pond"
                value={formData.pondName}
                onChange={(e) => setFormData({ ...formData, pondName: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Area (Hectares)</Label>
              <Slider
                value={[formData.area]}
                onValueChange={(v) => setFormData({ ...formData, area: v[0] })}
                min={0.1}
                max={10}
                step={0.1}
              />
              <p className="text-sm text-muted-foreground">{formData.area.toFixed(1)} ha = {(formData.area * 10000).toFixed(0)} m²</p>
            </div>

            <div className="space-y-2">
              <Label>Species</Label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'vannamei', label: 'Vannamei' },
                  { id: 'tiger', label: 'Tiger' },
                  { id: 'monodon', label: 'Monodon' },
                ].map(species => (
                  <button
                    key={species.id}
                    onClick={() => setFormData({ ...formData, species: species.id })}
                    className={`p-2 rounded border-2 text-center transition-all ${
                      formData.species === species.id
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-300'
                    }`}
                  >
                    <p className="font-semibold text-sm">{species.label}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Design & Resources */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Production Model</Label>
              <div className="grid gap-2">
                {productionModels.map(model => (
                  <button
                    key={model.id}
                    onClick={() => setFormData({ ...formData, productionModel: model.id })}
                    className={`p-3 rounded border-2 text-left transition-all ${
                      formData.productionModel === model.id
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">{model.label}</p>
                        <p className="text-xs text-muted-foreground">{model.description}</p>
                        <p className="text-xs text-blue-600 font-semibold mt-1">{model.density}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Water Source</Label>
              <div className="grid grid-cols-2 gap-2">
                {waterSources.map(source => (
                  <button
                    key={source.id}
                    onClick={() => setFormData({ ...formData, waterSource: source.id })}
                    className={`p-3 rounded border-2 text-center transition-all ${
                      formData.waterSource === source.id
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-300'
                    }`}
                  >
                    <p className="font-semibold text-sm">{source.label}</p>
                    <p className="text-xs text-muted-foreground">{source.quality}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Target Stocking Density</Label>
              <Slider
                value={[formData.targetDensity]}
                onValueChange={(v) => setFormData({ ...formData, targetDensity: v[0] })}
                min={10}
                max={200}
                step={10}
              />
              <p className="text-sm text-muted-foreground">{formData.targetDensity} PL/m²</p>
            </div>

            {/* AI Design Optimization */}
            <Button
              onClick={handleOptimizeDesign}
              disabled={isOptimizing}
              className="w-full gap-2 bg-purple-600 hover:bg-purple-700"
            >
              {isOptimizing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating Recommendations...
                </>
              ) : (
                <>
                  <Wand2 className="h-4 w-4" />
                  Get AI Design Recommendations
                </>
              )}
            </Button>

            {/* AI Recommendations */}
            {recommendations && (
              <Card className="border-purple-200 bg-purple-50">
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Wand2 className="h-4 w-4 text-purple-600" />
                    AI Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {recommendations.equipment && (
                    <div>
                      <p className="font-semibold">Recommended Equipment:</p>
                      <ul className="list-disc list-inside text-muted-foreground">
                        {recommendations.equipment.map((item: string, i: number) => (
                          <li key={i}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {recommendations.considerations && (
                    <div>
                      <p className="font-semibold">Important Considerations:</p>
                      <ul className="list-disc list-inside text-muted-foreground">
                        {recommendations.considerations.map((item: string, i: number) => (
                          <li key={i}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Step 3: Review & Confirm */}
        {step === 3 && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Pond Configuration Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Pond Name</p>
                    <p className="font-semibold text-lg">{formData.pondName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Area</p>
                    <p className="font-semibold text-lg">{formData.area} ha</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Species</p>
                    <p className="font-semibold text-lg capitalize">{formData.species}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Production Model</p>
                    <p className="font-semibold text-lg capitalize">{formData.productionModel}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Stocking Density</p>
                    <p className="font-semibold text-lg">{formData.targetDensity} PL/m²</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Water Source</p>
                    <p className="font-semibold text-lg capitalize">{formData.waterSource.replace('-', ' ')}</p>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground mb-1">Estimated Initial Cost</p>
                  <p className="text-3xl font-bold text-blue-600">${calculateEstimatedCost().toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground mt-2">Based on equipment, pond preparation, and initial stocking</p>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-sm font-semibold mb-2">✓ Ready to Create</p>
                  <p className="text-xs text-muted-foreground">All information validated. You can proceed with creating this pond.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex gap-2 pt-4 border-t">
          {step > 1 && (
            <Button variant="outline" onClick={() => setStep(step - 1)}>
              Back
            </Button>
          )}
          <div className="flex-1" />
          {step < 3 ? (
            <Button
              onClick={() => setStep(step + 1)}
              className="gap-2"
            >
              Continue
            </Button>
          ) : (
            <Button
              onClick={handleAddPond}
              className="bg-green-600 hover:bg-green-700"
            >
              Create Pond
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
