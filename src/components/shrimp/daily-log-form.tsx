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
    ph: 7.5,
    do: 5.0,
    temperature: 28,
    ammonia: 0,
    feedingAmount: 0,
    feedingConsumption: 0,
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
      <Card className="max-h-[calc(100vh-200px)] overflow-y-auto">
        <CardHeader className="sticky top-0 bg-background z-10 border-b">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <CardTitle className="text-base md:text-lg">Daily Log - {pondName}</CardTitle>
            <Button onClick={handleAIAssist} disabled={isLoading} variant="outline" size="sm" className="gap-2 w-full sm:w-auto">
              {isLoading ? <Wand2 className="h-3 w-3 animate-spin" /> : <Zap className="h-3 w-3" />}
              <span className="text-xs md:text-sm">AI Assist</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 md:space-y-6 p-4 md:p-6">
        {/* Water Parameters */}
        <div className="space-y-3 md:space-y-4">
          <h3 className="font-semibold text-base md:text-lg">Water Parameters</h3>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label className="text-sm">pH Level</Label>
              <Badge variant="outline" className="text-xs">{formData.ph.toFixed(1)}</Badge>
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
              <Label className="text-sm">Dissolved Oxygen (DO)</Label>
              <Badge variant={formData.do < 5 ? 'destructive' : 'outline'} className="text-xs">
                {formData.do.toFixed(1)} ppm
              </Badge>
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
              <Label className="text-sm">Temperature</Label>
              <Badge variant={formData.temperature < 28 || formData.temperature > 30 ? 'secondary' : 'outline'} className="text-xs">
                {formData.temperature}°C
              </Badge>
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
              <Label className="text-sm">Ammonia (NH₃)</Label>
              <Badge variant={formData.ammonia > 0.5 ? 'destructive' : 'outline'} className="text-xs">
                {formData.ammonia.toFixed(2)} ppm
              </Badge>
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
        <div className="space-y-3 md:space-y-4 pt-4 border-t">
          <h3 className="font-semibold text-base md:text-lg">Feeding</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
            <div className="space-y-2">
              <Label className="text-sm">Amount (kg)</Label>
              <Input
                type="number"
                value={formData.feedingAmount}
                onChange={(e) => setFormData({ ...formData, feedingAmount: parseFloat(e.target.value) })}
                step={1}
                className="h-10 text-base"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Consumption (%)</Label>
              <Input
                type="number"
                value={formData.feedingConsumption}
                onChange={(e) => setFormData({ ...formData, feedingConsumption: parseFloat(e.target.value) })}
                min={0}
                max={100}
                className="h-10 text-base"
              />
            </div>
          </div>
        </div>

        {/* Observations */}
        <div className="space-y-3 md:space-y-4 pt-4 border-t">
          <h3 className="font-semibold text-base md:text-lg">Observations</h3>
          <Textarea
            placeholder="Record observations: swimming activity, algae, color, behavior, etc."
            value={formData.observations}
            onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
            className="min-h-24 text-base"
          />
        </div>

        {/* AI Assist */}
        <div className="space-y-3 md:space-y-4 pt-4 border-t bg-blue-50 p-3 md:p-4 rounded-lg">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex-1">
              <h3 className="font-semibold flex items-center gap-2 text-sm md:text-base">
                <Wand2 className="h-4 w-4" />
                AI Assistant
              </h3>
              <p className="text-xs md:text-sm text-muted-foreground">Generate recommendations based on parameters</p>
            </div>
            <Button
              onClick={handleAIAssist}
              disabled={isLoading}
              className="gap-2 w-full sm:w-auto text-sm"
              size="sm"
            >
              {isLoading ? 'Analyzing...' : 'Generate'}
            </Button>
          </div>
        </div>

        {/* Recommended Actions */}
        {formData.actions && (
          <div className="space-y-3 md:space-y-4 pt-4 border-t">
            <h3 className="font-semibold text-base md:text-lg flex items-center gap-2">
              <Zap className="h-4 w-4 text-yellow-500" />
              AI Recommended Actions
            </h3>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 md:p-4 text-xs md:text-sm space-y-2">
              {formData.actions.split('\n').map((action: string, i: number) => (
                action.trim() && <p key={i} className="break-words">• {action.trim()}</p>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t">
          <Button className="flex-1 h-10 text-sm">Save Log</Button>
          <Button variant="outline" className="flex-1 h-10 text-sm">Submit to Manager</Button>
        </div>
      </CardContent>
      </Card>
    </>
  );
}
