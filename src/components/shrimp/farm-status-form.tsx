'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

interface FarmStatusFormProps {
  pondName: string;
  pondId: string;
}

export function FarmStatusForm({ pondName, pondId }: FarmStatusFormProps) {
  const [status, setStatus] = useState<'excellent' | 'good' | 'fair' | 'poor' | null>(null);
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState<string>('');

  const statusOptions = [
    {
      value: 'excellent' as const,
      label: '✨ Excellent',
      description: 'Perfect conditions, no visible issues',
      color: 'bg-green-100 border-green-500 hover:bg-green-200',
      badge: 'success'
    },
    {
      value: 'good' as const,
      label: '👍 Good',
      description: 'Minor issues, manageable',
      color: 'bg-blue-100 border-blue-500 hover:bg-blue-200',
      badge: 'default'
    },
    {
      value: 'fair' as const,
      label: '⚠️ Fair',
      description: 'Several issues, needs attention',
      color: 'bg-orange-100 border-orange-500 hover:bg-orange-200',
      badge: 'secondary'
    },
    {
      value: 'poor' as const,
      label: '🚨 Poor',
      description: 'Critical issues, immediate action needed',
      color: 'bg-red-100 border-red-500 hover:bg-red-200',
      badge: 'destructive'
    }
  ];

  const symptomOptions = [
    'Algae bloom',
    'High ammonia',
    'Low dissolved oxygen',
    'Unusual behavior',
    'Mass mortality',
    'Disease signs',
    'Poor water color',
    'Odor issues',
    'Feed wastage',
    'Equipment failure'
  ];

  const toggleSymptom = (symptom: string) => {
    setSymptoms(prev =>
      prev.includes(symptom)
        ? prev.filter(s => s !== symptom)
        : [...prev, symptom]
    );
  };

  const handleAnalyze = async () => {
    if (!status) {
      alert('Please select a farm status');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/ai/analyze-farm-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pondId,
          pondName,
          status,
          symptoms,
        }),
      });

      if (!response.ok) throw new Error('Failed to analyze farm status');

      const data = await response.json();
      setAiResponse(data.recommendations);
    } catch (err) {
      setAiResponse('Failed to get recommendations. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Status Selection */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-lg">Current Farm Status - {pondName}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {statusOptions.map(option => (
              <button
                key={option.value}
                onClick={() => setStatus(option.value)}
                className={`p-3 rounded-lg border-2 transition-all font-medium text-sm text-center ${
                  status === option.value
                    ? option.color
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="font-bold">{option.label}</div>
                <div className="text-xs text-gray-600 mt-1">{option.description}</div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Symptoms Selection */}
      {status && (
        <Card className="border-purple-200 bg-purple-50">
          <CardHeader>
            <CardTitle className="text-lg">Observed Issues/Symptoms</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {symptomOptions.map(symptom => (
                <button
                  key={symptom}
                  onClick={() => toggleSymptom(symptom)}
                  className={`px-3 py-2 rounded-lg border-2 transition-all text-sm font-medium ${
                    symptoms.includes(symptom)
                      ? 'border-purple-500 bg-purple-200 text-purple-900'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-purple-300'
                  }`}
                >
                  {symptoms.includes(symptom) ? '✓ ' : ''}{symptom}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Button */}
      {status && (
        <Button
          onClick={handleAnalyze}
          disabled={loading}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Analyzing Farm Status...
            </>
          ) : (
            '🔍 Get AI Recommendations'
          )}
        </Button>
      )}

      {/* AI Response */}
      {aiResponse && (
        <Alert className={aiResponse.includes('critical') ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}>
          {aiResponse.includes('critical') ? (
            <AlertCircle className="h-4 w-4 text-red-600" />
          ) : (
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          )}
          <AlertDescription className={`ml-2 ${aiResponse.includes('critical') ? 'text-red-800' : 'text-green-800'}`}>
            {aiResponse}
          </AlertDescription>
        </Alert>
      )}

      {/* Status Badge */}
      {status && (
        <div className="flex gap-2 items-center">
          <span className="text-sm font-medium text-gray-700">Status Badge:</span>
          <Badge variant={
            status === 'excellent' ? 'default' :
            status === 'good' ? 'secondary' :
            status === 'fair' ? 'outline' : 'destructive'
          }>
            {status.charAt(0).toUpperCase() + status.slice(1)} - {symptoms.length > 0 ? `${symptoms.length} issue(s)` : 'No issues reported'}
          </Badge>
        </div>
      )}
    </div>
  );
}
