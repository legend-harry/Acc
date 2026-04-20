"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Slider } from "@/components/ui/slider";
import { CheckCircle, ArrowRight, Lightbulb } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface FeedChartData {
  day: string;
  feedQty: number;
  consumption: number;
  wastage: number;
}

interface QuestionnaireData {
  pondName: string;
  currentStock: number;
  pondArea: number;
  farmingType: 'extensive' | 'semi-intensive' | 'intensive';
  cycleDay: number;
  targetConsumption: number;
}

export function FeedChartQuestionnaire({ 
  pondId, 
  pondName, 
  currentStock,
  pondArea,
  farmingType,
  cycleDay,
  onDataSubmit 
}: { 
  pondId: string;
  pondName: string;
  currentStock?: number;
  pondArea?: number;
  farmingType?: 'extensive' | 'semi-intensive' | 'intensive';
  cycleDay?: number;
  onDataSubmit?: (data: QuestionnaireData & { feedChart: FeedChartData[] }) => void;
}) {
  const [step, setStep] = useState<'info' | 'parameters' | 'design'>('info');
  const [formData, setFormData] = useState<QuestionnaireData>({
    pondName: pondName || '',
    currentStock: currentStock || 50000,
    pondArea: pondArea || 1000,
    farmingType: farmingType || 'semi-intensive',
    cycleDay: cycleDay || 30,
    targetConsumption: 90,
  });

  const [feedChart, setFeedChart] = useState<FeedChartData[]>([]);

  const calculateDensity = () => {
    return formData.pondArea > 0 ? (formData.currentStock / formData.pondArea).toFixed(1) : '0';
  };

  const calculateBaseFeedQuantity = () => {
    // Feed quantity calculation based on density and farming type
    const density = formData.currentStock / (formData.pondArea || 1);
    const baseMultiplier = {
      'extensive': 0.1,
      'semi-intensive': 0.25,
      'intensive': 0.4,
    }[formData.farmingType] || 0.25;
    
    return Math.round(formData.currentStock * baseMultiplier / 100);
  };

  const generateFeedChart = () => {
    const baseFeed = calculateBaseFeedQuantity();
    const chart: FeedChartData[] = [];
    
    // Generate chart for next 30 days from current cycle day
    for (let i = 0; i < 30; i++) {
      const day = formData.cycleDay + i;
      // Gradually increase feed as shrimp grow
      const growthFactor = 1 + (i / 30) * 0.3;
      const feedQty = Math.round(baseFeed * growthFactor);
      const consumption = formData.targetConsumption + (Math.random() * 10 - 5); // ±5% variation
      const wastage = 100 - consumption;
      
      chart.push({
        day: `D${day}`,
        feedQty: Math.round(feedQty),
        consumption: Math.round(consumption),
        wastage: Math.round(wastage),
      });
    }
    
    setFeedChart(chart);
    setStep('design');
  };

  const handleSubmit = () => {
    if (onDataSubmit) {
      onDataSubmit({
        ...formData,
        feedChart,
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Step Indicator */}
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${step === 'info' ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'}`}>
              {step !== 'info' ? <CheckCircle className="h-4 w-4" /> : '1'}
            </div>
            <span className="text-sm font-medium">Pond Info</span>
          </div>
        </div>
        <ArrowRight className="h-4 w-4 text-gray-400" />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${step === 'parameters' ? 'bg-blue-600 text-white' : step === 'design' ? 'bg-gray-300 text-gray-600' : 'bg-gray-200 text-gray-400'}`}>
              {step === 'design' ? <CheckCircle className="h-4 w-4" /> : '2'}
            </div>
            <span className="text-sm font-medium">Parameters</span>
          </div>
        </div>
        <ArrowRight className="h-4 w-4 text-gray-400" />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${step === 'design' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-400'}`}>
              3
            </div>
            <span className="text-sm font-medium">Feed Chart</span>
          </div>
        </div>
      </div>

      {/* Step 1: Pond Information */}
      {step === 'info' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Pond Information for {pondName}
            </CardTitle>
            <CardDescription>Confirm your pond details to design an optimal feed chart</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert className="bg-blue-50 border-blue-200">
              <Lightbulb className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-900">
                These details will help us design a customized feed chart based on your pond's specific conditions.
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Pond Name</Label>
                <Input
                  value={formData.pondName}
                  onChange={(e) => setFormData({ ...formData, pondName: e.target.value })}
                  className="bg-gray-50"
                />
              </div>

              <div className="space-y-2">
                <Label>Current Stock</Label>
                <Input
                  type="number"
                  value={formData.currentStock}
                  onChange={(e) => setFormData({ ...formData, currentStock: parseInt(e.target.value) || 0 })}
                  className="bg-gray-50"
                />
                <p className="text-xs text-gray-600">shrimp count</p>
              </div>

              <div className="space-y-2">
                <Label>Pond Area</Label>
                <Input
                  type="number"
                  value={formData.pondArea}
                  onChange={(e) => setFormData({ ...formData, pondArea: parseInt(e.target.value) || 0 })}
                  className="bg-gray-50"
                />
                <p className="text-xs text-gray-600">m²</p>
              </div>

              <div className="space-y-2">
                <Label>Farming Type</Label>
                <select
                  value={formData.farmingType}
                  onChange={(e) => setFormData({ ...formData, farmingType: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                >
                  <option value="extensive">Extensive</option>
                  <option value="semi-intensive">Semi-Intensive</option>
                  <option value="intensive">Intensive</option>
                </select>
              </div>
            </div>

            {/* Calculated Metrics */}
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200 rounded-lg p-4 space-y-2">
              <p className="text-sm font-semibold text-gray-900">Calculated Metrics</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-600">Stocking Density</p>
                  <p className="text-lg font-bold text-blue-600">{calculateDensity()} shrimp/m²</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Base Feed (daily)</p>
                  <p className="text-lg font-bold text-blue-600">{calculateBaseFeedQuantity()} kg</p>
                </div>
              </div>
            </div>

            <Button onClick={() => setStep('parameters')} className="w-full bg-blue-600 hover:bg-blue-700">
              Continue to Parameters
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Feed Parameters */}
      {step === 'parameters' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Feed Parameters for {pondName}
            </CardTitle>
            <CardDescription>Set your target feed consumption rate</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert className="bg-green-50 border-green-200">
              <Lightbulb className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-900">
                Optimal consumption rate is 90-95%. Too low indicates underfeeding, too high indicates waste.
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <Label className="text-base">Target Consumption Rate</Label>
                  <Badge className="bg-blue-100 text-blue-800 text-lg font-bold px-3 py-1">
                    {formData.targetConsumption}%
                  </Badge>
                </div>
                <Slider
                  value={[formData.targetConsumption]}
                  onValueChange={(v) => setFormData({ ...formData, targetConsumption: v[0] })}
                  min={70}
                  max={100}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-600">
                  <span>70%</span>
                  <span>100%</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Current Cycle Day</Label>
                <Input
                  type="number"
                  value={formData.cycleDay}
                  onChange={(e) => setFormData({ ...formData, cycleDay: parseInt(e.target.value) || 0 })}
                  className="bg-gray-50"
                />
                <p className="text-xs text-gray-600">Day of the current production cycle</p>
              </div>
            </div>

            <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-4 space-y-2">
              <p className="text-sm font-semibold text-gray-900">Summary</p>
              <ul className="text-sm space-y-1 text-gray-700">
                <li>Stocking: {calculateDensity()} shrimp/m²</li>
                <li>Base Daily Feed: {calculateBaseFeedQuantity()} kg</li>
                <li>Target Consumption: {formData.targetConsumption}%</li>
                <li>Starting From: Day {formData.cycleDay}</li>
              </ul>
            </div>

            <div className="flex gap-2">
              <Button onClick={() => setStep('info')} variant="outline" className="flex-1">
                Back
              </Button>
              <Button onClick={generateFeedChart} className="flex-1 bg-blue-600 hover:bg-blue-700">
                Generate Feed Chart
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Feed Chart Design */}
      {step === 'design' && feedChart.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Optimized Feed Chart for {pondName}
            </CardTitle>
            <CardDescription>Review and save your customized feeding schedule</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-900">
                Feed chart generated based on your pond's specific parameters. Monitor actual consumption and adjust as needed.
              </AlertDescription>
            </Alert>

            {/* Chart */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={feedChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                  <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                  <YAxis yAxisId="left" label={{ value: 'Feed Qty (kg)', angle: -90, position: 'insideLeft' }} />
                  <YAxis yAxisId="right" orientation="right" label={{ value: 'Consumption (%)', angle: 90, position: 'insideRight' }} />
                  <Tooltip />
                  <Legend />
                  <Line yAxisId="left" type="monotone" dataKey="feedQty" stroke="#3b82f6" name="Daily Feed (kg)" strokeWidth={2} dot={false} />
                  <Line yAxisId="right" type="monotone" dataKey="consumption" stroke="#10b981" name="Consumption (%)" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Chart Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-gray-600">Avg Daily Feed</p>
                <p className="text-lg font-bold text-blue-600">
                  {Math.round(feedChart.reduce((sum, d) => sum + d.feedQty, 0) / feedChart.length)} kg
                </p>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-xs text-gray-600">Avg Consumption</p>
                <p className="text-lg font-bold text-green-600">
                  {Math.round(feedChart.reduce((sum, d) => sum + d.consumption, 0) / feedChart.length)}%
                </p>
              </div>
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                <p className="text-xs text-gray-600">Total Feed (30d)</p>
                <p className="text-lg font-bold text-orange-600">
                  {feedChart.reduce((sum, d) => sum + d.feedQty, 0)} kg
                </p>
              </div>
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                <p className="text-xs text-gray-600">Period</p>
                <p className="text-lg font-bold text-purple-600">
                  {feedChart.length} days
                </p>
              </div>
            </div>

            <Alert className="bg-yellow-50 border-yellow-200">
              <Lightbulb className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-900">
                This is an initial recommendation. Adjust feed quantities based on actual shrimp behavior, water quality, and growth observations.
              </AlertDescription>
            </Alert>

            <div className="flex gap-2">
              <Button onClick={() => setStep('parameters')} variant="outline" className="flex-1">
                Adjust Parameters
              </Button>
              <Button onClick={handleSubmit} className="flex-1 bg-green-600 hover:bg-green-700">
                Save Feed Chart
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
