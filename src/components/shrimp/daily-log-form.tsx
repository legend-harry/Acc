"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Zap, Wand2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/context/user-context';
import { db } from '@/lib/firebase';
import { onValue, push, ref, set } from 'firebase/database';

export function DailyLogForm({ pondId, pondName }: { pondId: string; pondName: string }) {
  const { toast } = useToast();
  const { selectedProfile } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [prediction, setPrediction] = useState<Record<string, number> | null>(null);
  const [predictedFromDays, setPredictedFromDays] = useState(0);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    date: '',
    ph: '',
    do: '',
    temperature: '',
    ammonia: '',
    feedingAmount: '',
    feedingConsumption: '',
    observations: '',
    actions: '',
  });

  useEffect(() => {
    if (!selectedProfile || !pondId) return;
    const logsRef = ref(db, `shrimp/${selectedProfile}/daily-logs/${pondId}`);
    const unsubscribe = onValue(logsRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        setRecentLogs([]);
        return;
      }
      const logsArray = Object.values(data) as any[];
      const sortedLogs = logsArray.sort((a, b) => new Date(a.date || 0).getTime() - new Date(b.date || 0).getTime());
      setRecentLogs(sortedLogs.slice(-10));
    });

    return () => unsubscribe();
  }, [selectedProfile, pondId]);

  const handleAIAssist = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/ai/shrimp-assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile: selectedProfile,
          pondId,
          pondName,
          waterParams: {
            ph: Number(formData.ph),
            do: Number(formData.do),
            temperature: Number(formData.temperature),
            ammonia: Number(formData.ammonia),
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

      if (data.missingFields && data.missingFields.length > 0) {
        toast({
          variant: "destructive",
          title: "Missing data",
          description: `Add logs for: ${data.missingFields.join(', ')}`,
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

  const getAverageFromLogs = (field: string) => {
    const values = recentLogs
      .map((log) => Number(log[field]))
      .filter((value) => Number.isFinite(value));
    if (values.length === 0) return null;
    return values.reduce((sum, value) => sum + value, 0) / values.length;
  };

  const handlePredictFromHistory = () => {
    if (recentLogs.length === 0) {
      toast({
        variant: 'destructive',
        title: 'No history available',
        description: 'Add daily logs before generating predictions.',
      });
      return;
    }

    const predicted = {
      ph: getAverageFromLogs('ph'),
      do: getAverageFromLogs('do'),
      temperature: getAverageFromLogs('temperature'),
      ammonia: getAverageFromLogs('ammonia'),
      feedingAmount: getAverageFromLogs('feedingAmount'),
      feedingConsumption: getAverageFromLogs('feedingConsumption'),
    };

    const hasValues = Object.values(predicted).some((value) => value !== null);
    if (!hasValues) {
      toast({
        variant: 'destructive',
        title: 'Not enough data',
        description: 'Historical logs are missing numeric values for prediction.',
      });
      return;
    }

    setPrediction(predicted as Record<string, number>);
    setPredictedFromDays(recentLogs.length);
  };

  const applyPrediction = () => {
    if (!prediction) return;
    setFormData((prev) => ({
      ...prev,
      ph: prediction.ph?.toFixed(2) ?? prev.ph,
      do: prediction.do?.toFixed(2) ?? prev.do,
      temperature: prediction.temperature?.toFixed(1) ?? prev.temperature,
      ammonia: prediction.ammonia?.toFixed(2) ?? prev.ammonia,
      feedingAmount: prediction.feedingAmount?.toFixed(1) ?? prev.feedingAmount,
      feedingConsumption: prediction.feedingConsumption?.toFixed(1) ?? prev.feedingConsumption,
    }));
    setPrediction(null);
  };

  const handleSaveLog = async () => {
    if (!selectedProfile) {
      toast({ variant: 'destructive', title: 'No profile selected' });
      return;
    }

    const missingFields = [] as string[];
    if (!formData.date) missingFields.push('Date');
    if (!formData.ph) missingFields.push('pH');
    if (!formData.do) missingFields.push('DO');
    if (!formData.temperature) missingFields.push('Temperature');
    if (!formData.ammonia) missingFields.push('Ammonia');
    if (!formData.feedingAmount) missingFields.push('Feeding amount');
    if (!formData.feedingConsumption) missingFields.push('Feeding consumption');

    if (missingFields.length > 0) {
      toast({
        variant: 'destructive',
        title: 'Missing required fields',
        description: missingFields.join(', '),
      });
      return;
    }

    setSaving(true);
    try {
      const logsRef = ref(db, `shrimp/${selectedProfile}/daily-logs/${pondId}`);
      const newLogRef = push(logsRef);
      await set(newLogRef, {
        date: formData.date,
        ph: Number(formData.ph),
        do: Number(formData.do),
        temperature: Number(formData.temperature),
        ammonia: Number(formData.ammonia),
        feedingAmount: Number(formData.feedingAmount),
        feedingConsumption: Number(formData.feedingConsumption),
        observations: formData.observations || '',
        actions: formData.actions || '',
        createdAt: new Date().toISOString(),
      });

      toast({ title: 'Daily log saved' });
    } catch (error) {
      console.error('Save log error:', error);
      toast({
        variant: 'destructive',
        title: 'Save failed',
        description: 'Could not save daily log. Try again.',
      });
    } finally {
      setSaving(false);
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
            <div className="space-y-2">
              <Label className="text-sm">Date</Label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="h-10 text-base"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm">pH Level</Label>
              <Input
                type="number"
                value={formData.ph}
                onChange={(e) => setFormData({ ...formData, ph: e.target.value })}
                step={0.1}
                className="h-10 text-base"
              />
              <p className="text-xs text-muted-foreground">Optimal: 7.5-8.5</p>
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Dissolved Oxygen (DO)</Label>
              <Input
                type="number"
                value={formData.do}
                onChange={(e) => setFormData({ ...formData, do: e.target.value })}
                step={0.1}
                className="h-10 text-base"
              />
              <p className="text-xs text-muted-foreground">Target: {'>'} 5.0 ppm</p>
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Temperature</Label>
              <Input
                type="number"
                value={formData.temperature}
                onChange={(e) => setFormData({ ...formData, temperature: e.target.value })}
                step={0.1}
                className="h-10 text-base"
              />
              <p className="text-xs text-muted-foreground">Optimal: 28-30C</p>
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Ammonia (NH3)</Label>
              <Input
                type="number"
                value={formData.ammonia}
                onChange={(e) => setFormData({ ...formData, ammonia: e.target.value })}
                step={0.01}
                className="h-10 text-base"
              />
              <p className="text-xs text-muted-foreground">Good: {'<'} 0.5 ppm</p>
            </div>
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
                onChange={(e) => setFormData({ ...formData, feedingAmount: e.target.value })}
                step={1}
                className="h-10 text-base"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Consumption (%)</Label>
              <Input
                type="number"
                value={formData.feedingConsumption}
                onChange={(e) => setFormData({ ...formData, feedingConsumption: e.target.value })}
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
            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              <Button
                onClick={handlePredictFromHistory}
                disabled={isLoading}
                className="gap-2 text-sm"
                size="sm"
                variant="outline"
              >
                Predict from history
              </Button>
              <Button
                onClick={handleAIAssist}
                disabled={isLoading}
                className="gap-2 text-sm"
                size="sm"
              >
                {isLoading ? 'Analyzing...' : 'Generate'}
              </Button>
            </div>
          </div>
        </div>

        {prediction && (
          <div className="space-y-3 md:space-y-4 pt-4 border-t">
            <h3 className="font-semibold text-base md:text-lg">Review predicted values</h3>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 md:p-4 text-xs md:text-sm space-y-2">
              <p>Generated from last {predictedFromDays} logs.</p>
              <p>pH: {prediction.ph?.toFixed(2) ?? '--'} | DO: {prediction.do?.toFixed(2) ?? '--'} | Temp: {prediction.temperature?.toFixed(1) ?? '--'}C</p>
              <p>Ammonia: {prediction.ammonia?.toFixed(2) ?? '--'} | Feed: {prediction.feedingAmount?.toFixed(1) ?? '--'} kg | Consumption: {prediction.feedingConsumption?.toFixed(1) ?? '--'}%</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={applyPrediction} className="flex-1">Accept prediction</Button>
              <Button onClick={() => setPrediction(null)} variant="outline" className="flex-1">Reject</Button>
            </div>
          </div>
        )}

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
          <Button className="flex-1 h-10 text-sm" onClick={handleSaveLog} disabled={saving}>
            {saving ? 'Saving...' : 'Save Log'}
          </Button>
          <Button variant="outline" className="flex-1 h-10 text-sm" disabled>Submit to Manager</Button>
        </div>
      </CardContent>
      </Card>
    </>
  );
}
