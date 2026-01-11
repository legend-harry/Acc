"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Zap, Wand2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function DailyLogForm({ pondId, pondName }: { pondId: string; pondName: string }) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    ph: 7.8,
    do: 4.2,
    temperature: 28,
    ammonia: 0.1,
    feedingAmount: 12,
    feedingConsumption: 90,
    observations: '',
    actions: '',
  });

  const handleAIAssist = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/ai/shrimp-assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pondName,
          waterParams: {
            ph: formData.ph,
            do: formData.do,
            temperature: formData.temperature,
            ammonia: formData.ammonia,
          },
          observations: formData.observations,
        }),
      });

      const data = await response.json();
      
      if (data.suggestions) {
        setFormData(prev => ({
          ...prev,
          actions: data.suggestions.actions || prev.actions,
          observations: data.suggestions.observations || prev.observations,
        }));
        
        toast({
          title: "AI Suggestions Generated",
          description: "Review and adjust recommendations as needed",
        });
      }
    } catch (error) {
      console.error('AI assist error:', error);
      toast({
        variant: "destructive",
        title: "AI Assistance Failed",
        description: "Could not generate suggestions",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Daily Log - {pondName}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
        {/* Water Parameters */}
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Water Parameters</h3>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label>pH Level</Label>
              <span className="text-sm font-semibold">{formData.ph.toFixed(1)}</span>
            </div>
            <Slider
              value={[formData.ph]}
              onValueChange={(v) => setFormData({ ...formData, ph: v[0] })}
              min={6.5}
              max={8.5}
              step={0.1}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">Optimal: 7.5-8.5</p>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label>Dissolved Oxygen (DO)</Label>
              <span className={`text-sm font-semibold ${formData.do < 5 ? 'text-orange-600' : 'text-green-600'}`}>
                {formData.do.toFixed(1)} ppm
              </span>
            </div>
            <Slider
              value={[formData.do]}
              onValueChange={(v) => setFormData({ ...formData, do: v[0] })}
              min={0}
              max={10}
              step={0.1}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">Target: &gt;5.0 ppm</p>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label>Temperature</Label>
              <span className="text-sm font-semibold">{formData.temperature}°C</span>
            </div>
            <Slider
              value={[formData.temperature]}
              onValueChange={(v) => setFormData({ ...formData, temperature: v[0] })}
              min={20}
              max={35}
              step={1}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">Optimal: 28-30°C</p>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label>Ammonia (NH₃)</Label>
              <span className="text-sm font-semibold">{formData.ammonia.toFixed(2)} ppm</span>
            </div>
            <Slider
              value={[formData.ammonia]}
              onValueChange={(v) => setFormData({ ...formData, ammonia: v[0] })}
              min={0}
              max={1}
              step={0.05}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">Good: &lt;0.5 ppm</p>
          </div>
        </div>

        {/* Feeding */}
        <div className="space-y-4 pt-4 border-t">
          <h3 className="font-semibold text-lg">Feeding</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Amount (kg)</Label>
              <Input
                type="number"
                value={formData.feedingAmount}
                onChange={(e) => setFormData({ ...formData, feedingAmount: parseFloat(e.target.value) })}
                step={1}
              />
            </div>
            <div className="space-y-2">
              <Label>Consumption (%)</Label>
              <Input
                type="number"
                value={formData.feedingConsumption}
                onChange={(e) => setFormData({ ...formData, feedingConsumption: parseFloat(e.target.value) })}
                min={0}
                max={100}
              />
            </div>
          </div>
        </div>

        {/* Observations */}
        <div className="space-y-4 pt-4 border-t">
          <h3 className="font-semibold text-lg">Observations</h3>
          <Textarea
            placeholder="Record observations: swimming activity, algae, color, behavior, etc."
            value={formData.observations}
            onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
            className="min-h-24"
          />
        </div>

        {/* AI Assist */}
        <div className="space-y-4 pt-4 border-t bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold flex items-center gap-2">
                <Wand2 className="h-4 w-4" />
                AI Assistant
              </h3>
              <p className="text-sm text-muted-foreground">Generate recommendations based on parameters</p>
            </div>
            <Button
              onClick={handleAIAssist}
              disabled={isLoading}
              className="gap-2"
            >
              {isLoading ? 'Analyzing...' : 'Generate Suggestions'}
            </Button>
          </div>
        </div>

        {/* Recommended Actions */}
        {formData.actions && (
          <div className="space-y-4 pt-4 border-t">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <Zap className="h-4 w-4 text-yellow-500" />
              AI Recommended Actions
            </h3>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm space-y-2">
              {formData.actions.split('\n').map((action: string, i: number) => (
                action.trim() && <p key={i}>• {action.trim()}</p>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4 border-t">
          <Button className="flex-1">Save Log</Button>
          <Button variant="outline" className="flex-1">Submit to Manager</Button>
        </div>
      </CardContent>
      </Card>
    </>
  );
}
