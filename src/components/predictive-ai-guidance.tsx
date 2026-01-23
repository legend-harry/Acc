/**
 * Predictive AI Guidance System
 * Provides proactive alerts and recommendations
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  AlertTriangle,
  Lightbulb,
  TrendingDown,
  TrendingUp,
  Clock,
  CheckCircle2,
  Zap,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PredictiveAlert {
  id: string;
  type: 'critical' | 'warning' | 'info' | 'success';
  title: string;
  description: string;
  daysUntilIssue: number;
  recommendedAction: string;
  priority: 'high' | 'medium' | 'low';
  affectedPonds: string[];
  metric: string;
  currentValue: number;
  predictedValue: number;
  trend: 'rising' | 'falling' | 'stable';
}

interface DailyChecklist {
  id: string;
  task: string;
  priority: 'high' | 'medium' | 'low';
  timeWindow: string;
  reason: string;
  completed: boolean;
}

interface SmartReminder {
  id: string;
  type: 'weather' | 'temperature' | 'schedule' | 'maintenance';
  title: string;
  message: string;
  suggestedAction: string;
  dueTime: string;
}

export function PredictiveAIGuidance({ pondId }: { pondId?: string }) {
  const { toast } = useToast();
  const [alerts, setAlerts] = useState<PredictiveAlert[]>([]);
  const [checklist, setChecklist] = useState<DailyChecklist[]>([]);
  const [reminders, setReminders] = useState<SmartReminder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPredictiveGuidance();
  }, [pondId]);

  const loadPredictiveGuidance = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/ai/predictive-guidance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pondId }),
      });

      if (!response.ok) throw new Error('Failed to load guidance');

      const data = await response.json();
      setAlerts(data.alerts || []);
      setChecklist(data.checklist || []);
      setReminders(data.reminders || []);
    } catch (error) {
      console.error('Error loading predictive guidance:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load AI guidance',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChecklistToggle = async (taskId: string) => {
    const updated = checklist.map((task) =>
      task.id === taskId ? { ...task, completed: !task.completed } : task
    );
    setChecklist(updated);

    // Track completion
    await fetch('/api/ai/checklist-completed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ taskId, completed: updated.find((t) => t.id === taskId)?.completed }),
    }).catch(console.error);
  };

  const handleDismissAlert = async (alertId: string) => {
    setAlerts(alerts.filter((a) => a.id !== alertId));

    await fetch('/api/ai/dismiss-alert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ alertId }),
    }).catch(console.error);
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'critical':
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-orange-600" />;
      case 'success':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      default:
        return <Lightbulb className="h-5 w-5 text-blue-600" />;
    }
  };

  const getAlertColor = (type: string): 'default' | 'destructive' | 'secondary' => {
    switch (type) {
      case 'critical':
        return 'destructive';
      case 'warning':
        return 'secondary';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6 text-center text-muted-foreground">
          Loading AI guidance...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Anticipatory Alerts */}
      {alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-600" />
              Predictive Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {alerts.map((alert) => (
              <Alert key={alert.id} variant={getAlertColor(alert.type)}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    {getAlertIcon(alert.type)}
                    <div className="flex-1">
                      <AlertTitle className="mb-1">{alert.title}</AlertTitle>
                      <AlertDescription className="text-sm mb-2">
                        {alert.description}
                      </AlertDescription>
                      <div className="flex flex-wrap gap-2 mb-2">
                        <Badge variant="outline" className="text-xs">
                          <Clock className="h-3 w-3 mr-1" />
                          {alert.daysUntilIssue} days
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {alert.metric}: {alert.currentValue} → {alert.predictedValue}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {alert.trend === 'rising' ? (
                            <TrendingUp className="h-3 w-3 mr-1" />
                          ) : (
                            <TrendingDown className="h-3 w-3 mr-1" />
                          )}
                          {alert.trend}
                        </Badge>
                      </div>
                      <p className="text-sm font-medium text-foreground">
                        Recommended: {alert.recommendedAction}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDismissAlert(alert.id)}
                  >
                    Dismiss
                  </Button>
                </div>
              </Alert>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Daily Checklist */}
      {checklist.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              Today's Smart Checklist
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {checklist.map((task) => (
                <div
                  key={task.id}
                  className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => handleChecklistToggle(task.id)}
                    className="mt-1 cursor-pointer"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className={`font-medium ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                        {task.task}
                      </p>
                      <Badge variant="outline" className="text-xs">
                        {task.timeWindow}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{task.reason}</p>
                  </div>
                </div>
              ))}
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  Completed: {checklist.filter((t) => t.completed).length}/{checklist.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Smart Reminders */}
      {reminders.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Smart Reminders
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {reminders.map((reminder) => (
              <div key={reminder.id} className="p-3 border rounded-lg space-y-2">
                <div className="flex items-start justify-between">
                  <h4 className="font-medium">{reminder.title}</h4>
                  <Badge variant="outline" className="text-xs">
                    {reminder.dueTime}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{reminder.message}</p>
                <p className="text-sm font-medium text-blue-600">
                  💡 {reminder.suggestedAction}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {alerts.length === 0 && checklist.length === 0 && reminders.length === 0 && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6 text-center">
            <CheckCircle2 className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <p className="font-medium text-green-900">All Systems Optimal</p>
            <p className="text-sm text-green-700">No predictive alerts at this time</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
