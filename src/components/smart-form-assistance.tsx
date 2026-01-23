/**
 * Smart Form Assistance Component
 * AI-powered form guidance and auto-completion
 */

'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Info,
  HelpCircle,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Lightbulb,
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface FieldGuidance {
  fieldName: string;
  label: string;
  description: string;
  whyItMatters: string;
  suggestedValue?: string;
  historicalAverage?: number;
  validRange?: [number, number];
  examples?: string[];
}

interface FormWarning {
  fieldName: string;
  message: string;
  severity: 'warning' | 'error' | 'info';
  suggestion: string;
}

export function SmartFormAssistance({
  formType,
  currentValues,
  onFieldUpdate,
}: {
  formType: 'daily-log' | 'pond-setup' | 'batch-entry';
  currentValues: Record<string, any>;
  onFieldUpdate: (fieldName: string, value: any) => void;
}) {
  const [activeField, setActiveField] = useState<string | null>(null);
  const [fieldGuidance, setFieldGuidance] = useState<FieldGuidance | null>(null);
  const [warnings, setWarnings] = useState<FormWarning[]>([]);
  const [showAutoComplete, setShowAutoComplete] = useState(false);

  const getFieldGuidance = async (fieldName: string) => {
    try {
      const response = await fetch('/api/ai/form-guidance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formType,
          fieldName,
          currentValues,
        }),
      });

      if (!response.ok) throw new Error('Failed to get guidance');

      const data = await response.json();
      setFieldGuidance(data.guidance);
      setWarnings(data.warnings || []);
    } catch (error) {
      console.error('Error getting field guidance:', error);
    }
  };

  const handleFieldFocus = (fieldName: string) => {
    setActiveField(fieldName);
    getFieldGuidance(fieldName);
  };

  const applyAutoCompletion = async () => {
    try {
      const response = await fetch('/api/ai/auto-complete-form', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formType,
          currentValues,
        }),
      });

      if (!response.ok) throw new Error('Failed to auto-complete');

      const data = await response.json();
      Object.entries(data.suggestions).forEach(([field, value]) => {
        onFieldUpdate(field, value);
      });

      setShowAutoComplete(false);
    } catch (error) {
      console.error('Error auto-completing form:', error);
    }
  };

  const applyBatchEntry = async () => {
    try {
      const response = await fetch('/api/ai/batch-entry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentValues,
          applySameValuesToAllPonds: true,
        }),
      });

      if (!response.ok) throw new Error('Failed to apply batch entry');

      // Handle response...
    } catch (error) {
      console.error('Error with batch entry:', error);
    }
  };

  return (
    <div className="space-y-4">
      {/* Field-Level Guidance */}
      {fieldGuidance && activeField && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Info className="h-4 w-4 text-blue-600" />
              About {fieldGuidance.label}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm font-medium mb-1">What This Means</p>
              <p className="text-sm text-muted-foreground">{fieldGuidance.description}</p>
            </div>

            <div>
              <p className="text-sm font-medium mb-1">Why It Matters</p>
              <p className="text-sm text-muted-foreground">{fieldGuidance.whyItMatters}</p>
            </div>

            {fieldGuidance.historicalAverage !== undefined && (
              <div className="p-2 rounded-lg bg-white">
                <p className="text-xs text-muted-foreground">Your Average</p>
                <p className="text-lg font-semibold">{fieldGuidance.historicalAverage}</p>
              </div>
            )}

            {fieldGuidance.validRange && (
              <div className="p-2 rounded-lg bg-white">
                <p className="text-xs text-muted-foreground">Valid Range</p>
                <p className="font-semibold">
                  {fieldGuidance.validRange[0]} - {fieldGuidance.validRange[1]}
                </p>
              </div>
            )}

            {fieldGuidance.suggestedValue && (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    onFieldUpdate(activeField, fieldGuidance.suggestedValue);
                  }}
                >
                  <Copy className="h-3 w-3 mr-1" />
                  Use Suggested Value
                </Button>
              </div>
            )}

            {fieldGuidance.examples && (
              <div>
                <p className="text-sm font-medium mb-2">Examples</p>
                <div className="space-y-1">
                  {fieldGuidance.examples.map((example, idx) => (
                    <div key={idx} className="text-xs p-1 rounded bg-white text-muted-foreground">
                      • {example}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Form Warnings */}
      {warnings.length > 0 && (
        <div className="space-y-2">
          {warnings.map((warning, idx) => (
            <Alert
              key={idx}
              variant={warning.severity === 'error' ? 'destructive' : 'default'}
            >
              {warning.severity === 'warning' && (
                <AlertTriangle className="h-4 w-4" />
              )}
              {warning.severity === 'error' && <AlertTriangle className="h-4 w-4" />}
              {warning.severity === 'info' && <Info className="h-4 w-4" />}
              <AlertDescription>
                <p className="font-medium text-sm mb-1">{warning.message}</p>
                <p className="text-xs text-muted-foreground">{warning.suggestion}</p>
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Auto-Complete Suggestion */}
      {formType === 'daily-log' && (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-amber-600" />
              Smart Auto-Complete Available
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-amber-900 mb-4">
              Based on historical data and weather conditions, we can auto-fill fields for you.
            </p>
            <Button onClick={applyAutoCompletion} size="sm" variant="outline" className="w-full">
              Auto-Fill Form
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Batch Entry Option */}
      {formType === 'batch-entry' && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              Apply to All Ponds
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-green-900 mb-4">
              Use the same parameters for all your ponds today.
            </p>
            <Button onClick={applyBatchEntry} size="sm" variant="outline" className="w-full">
              Apply Same to All Ponds
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Field Help Tooltips */}
      <div className="text-xs text-muted-foreground p-3 rounded-lg bg-muted">
        <HelpCircle className="h-3 w-3 inline mr-1" />
        Focus on any field to see AI-powered guidance and suggestions
      </div>
    </div>
  );
}
