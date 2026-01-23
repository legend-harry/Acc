"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { FileDown, Wand2, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/context/user-context';

type ReportType = 'daily' | 'weekly' | 'cycle-end' | 'custom';

export function ReportGenerator({ pondId }: { pondId: string }) {
  const { toast } = useToast();
  const { selectedProfile } = useUser();
  const [reportType, setReportType] = useState<ReportType>('daily');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedReport, setGeneratedReport] = useState<{
    title: string;
    narrative: string;
    metrics: Record<string, string | number>;
    recommendations: string[];
  } | null>(null);

  const [selectedMetrics, setSelectedMetrics] = useState({
    waterQuality: true,
    feeding: true,
    mortality: true,
    growth: true,
    expenses: true,
    revenue: true,
  });

  const reportTemplates = {
    daily: {
      title: 'Daily Operations Report',
      metrics: ['Water Quality Summary', 'Feeding Record', 'Observations', 'Actions Taken'],
    },
    weekly: {
      title: 'Weekly Performance Report',
      metrics: ['Average Water Parameters', 'Weekly Growth Data', 'Feeding Efficiency', 'Costs This Week', 'Alerts/Issues'],
    },
    'cycle-end': {
      title: 'Cycle-End Summary Report',
      metrics: ['Production Summary', 'Financial Analysis', 'Key Metrics (FCR, Survival)', 'Lessons Learned', 'Recommendations'],
    },
    custom: {
      title: 'Custom Report',
      metrics: ['Select metrics below'],
    },
  };

  const handleGenerateReport = async () => {
    if (!selectedProfile) {
      setError('No profile selected');
      return;
    }

    setIsGenerating(true);
    setError(null);
    try {
      const response = await fetch('/api/ai/generate-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pondId,
          profile: selectedProfile,
          reportType,
          selectedMetrics,
          includeAIAnalysis: true,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        setError(data.error || 'Failed to generate report');
        toast({
          variant: "destructive",
          title: "Report Generation Failed",
          description: data.error || 'Could not generate the report.',
        });
        return;
      }
      
      if (data.narrative) {
        setGeneratedReport({
          title: reportTemplates[reportType].title,
          narrative: data.narrative,
          metrics: data.metrics || {},
          recommendations: data.recommendations || [],
        });

        toast({
          title: "Report Generated",
          description: "Analysis from database completed",
        });
      }
    } catch (error) {
      console.error('Report generation error:', error);
      setError('Unable to generate report');
      toast({
        variant: "destructive",
        title: "Report Generation Failed",
        description: "Could not generate the report. Please try again.",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Report Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Configure Your Report</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Report Type Selection */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Report Type</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {(['daily', 'weekly', 'cycle-end', 'custom'] as ReportType[]).map(type => (
                <button
                  key={type}
                  onClick={() => setReportType(type)}
                  className={`p-3 rounded-lg border-2 transition-all text-left ${
                    reportType === type
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <p className="font-semibold capitalize">{type.replace('-', ' ')}</p>
                  <p className="text-xs text-muted-foreground">
                    {type === 'daily' && 'Yesterday\'s operations'}
                    {type === 'weekly' && 'Last 7 days summary'}
                    {type === 'cycle-end' && 'Complete cycle analysis'}
                    {type === 'custom' && 'Select your metrics'}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Metric Selection (Custom) */}
          {reportType === 'custom' && (
            <div className="space-y-3 pt-4 border-t">
              <Label className="text-base font-semibold">Select Metrics</Label>
              <div className="space-y-2">
                {Object.entries(selectedMetrics).map(([key, checked]) => (
                  <label key={key} className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(value) =>
                        setSelectedMetrics({ ...selectedMetrics, [key]: value })
                      }
                    />
                    <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Date Range (for Weekly) */}
          {reportType === 'weekly' && (
            <div className="pt-4 border-t space-y-3">
              <Label className="text-base font-semibold">Select Week</Label>
              <div className="flex gap-2">
                <Input type="date" defaultValue="2024-01-08" className="flex-1" />
                <Input type="date" defaultValue="2024-01-14" className="flex-1" />
              </div>
            </div>
          )}

          {/* Template Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
            <h4 className="font-semibold text-sm">Included in {reportTemplates[reportType].title}</h4>
            <ul className="text-sm space-y-1">
              {reportTemplates[reportType].metrics.map((metric, i) => (
                <li key={i} className="flex items-center gap-2">
                  <span className="text-blue-600">•</span> {metric}
                </li>
              ))}
            </ul>
          </div>

          {/* Generate Button */}
          <Button
            onClick={handleGenerateReport}
            disabled={isGenerating}
            className="w-full gap-2 bg-blue-600 hover:bg-blue-700 h-12"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating Report...
              </>
            ) : (
              <>
                <Wand2 className="h-4 w-4" />
                Generate with AI Analysis
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Generated Report */}
      {generatedReport && (
        <Card className="border-2 border-green-200 bg-green-50">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                {generatedReport.title}
              </CardTitle>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline">
                <FileDown className="h-4 w-4 mr-1" />
                PDF
              </Button>
              <Button size="sm" variant="outline">
                <FileDown className="h-4 w-4 mr-1" />
                Excel
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-6 bg-white rounded-lg p-4">
            {/* Metrics Summary */}
            {Object.keys(generatedReport.metrics).length > 0 && (
              <div>
                <h3 className="font-semibold text-lg mb-3">Key Metrics</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {Object.entries(generatedReport.metrics).map(([key, value]) => (
                    <div key={key} className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-sm text-muted-foreground capitalize">{key}</p>
                      <p className="text-lg font-semibold text-blue-600">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* AI Narrative */}
            <div>
              <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <Wand2 className="h-5 w-5 text-purple-600" />
                AI Analysis & Narrative
              </h3>
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-sm leading-relaxed space-y-3">
                {generatedReport.narrative.split('\n').map((paragraph, i) => (
                  paragraph.trim() && <p key={i}>{paragraph.trim()}</p>
                ))}
              </div>
            </div>

            {/* Recommendations */}
            {generatedReport.recommendations.length > 0 && (
              <div>
                <h3 className="font-semibold text-lg mb-3">AI Recommendations</h3>
                <div className="space-y-2">
                  {generatedReport.recommendations.map((rec, i) => (
                    <div key={i} className="flex gap-3 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <span className="text-yellow-600 font-semibold flex-shrink-0">→</span>
                      <p className="text-sm">{rec}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Export Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
              <p className="font-semibold mb-1">Ready to Export</p>
              <p className="text-muted-foreground">
                This report can be exported as PDF or Excel for sharing with team members, managers, or auditors.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Message */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6 flex gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-900">Unable to Generate Report</p>
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Explanation */}
      {!generatedReport && !error && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <p className="text-sm text-blue-900">
              📊 Reports are generated from your recorded daily logs. The more logs you record, the more comprehensive and accurate the reports will be.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
