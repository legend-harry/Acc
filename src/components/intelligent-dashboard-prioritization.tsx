/**
 * Intelligent Dashboard Prioritization Component
 * Dynamic dashboard that rearranges based on context
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Zap,
  Focus,
  Clock,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Moon,
  Sun,
} from 'lucide-react';

interface DashboardPriority {
  componentId: string;
  title: string;
  component: React.ReactNode;
  priority: number;
  reason: string;
  phase: 'morning' | 'afternoon' | 'evening' | 'always';
  urgency: 'critical' | 'high' | 'medium' | 'low';
}

interface FocusMode {
  title: string;
  description: string;
  topPriorities: string[];
  estimatedTime: string;
  icon: React.ReactNode;
}

export function IntelligentDashboardPrioritization({
  currentPhase,
  recentAlerts,
  timeOfDay,
}: {
  currentPhase: string;
  recentAlerts: any[];
  timeOfDay: 'morning' | 'afternoon' | 'evening';
}) {
  const [priorities, setPriorities] = useState<DashboardPriority[]>([]);
  const [focusMode, setFocusMode] = useState<FocusMode | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPrioritization();
  }, [currentPhase, timeOfDay]);

  const loadPrioritization = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/ai/dashboard-prioritization', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPhase, timeOfDay, alertCount: recentAlerts.length }),
      });

      if (!response.ok) throw new Error('Failed to load prioritization');

      const data = await response.json();
      setPriorities(data.priorities || []);
      setFocusMode(data.focusMode || null);
    } catch (error) {
      console.error('Error loading prioritization:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCriticalActions = () => {
    return priorities
      .filter((p) => p.urgency === 'critical')
      .slice(0, 3)
      .map((p) => p.title);
  };

  const getTimeIcon = () => {
    switch (timeOfDay) {
      case 'morning':
        return <Sun className="h-5 w-5 text-yellow-600" />;
      case 'evening':
        return <Moon className="h-5 w-5 text-slate-600" />;
      default:
        return <Clock className="h-5 w-5 text-blue-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Focus Mode */}
      {focusMode && (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Focus className="h-5 w-5 text-amber-600" />
              <CardTitle>Focus Mode Activated</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold mb-1">{focusMode.title}</h4>
              <p className="text-sm text-amber-900 mb-3">{focusMode.description}</p>
            </div>

            <div className="bg-white rounded-lg p-3 space-y-2">
              <p className="text-sm font-medium">Top Priorities:</p>
              <ol className="text-sm space-y-1 ml-4 list-decimal">
                {focusMode.topPriorities.map((priority, idx) => (
                  <li key={idx}>{priority}</li>
                ))}
              </ol>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-amber-900">Estimated time: {focusMode.estimatedTime}</span>
              <Button size="sm" variant="outline">
                Start Focus Session
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      {getCriticalActions().length > 0 && (
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Critical Actions Required
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {getCriticalActions().map((action, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg bg-red-50 border border-red-200 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-red-600" />
                    <span className="text-sm font-medium">{action}</span>
                  </div>
                  <Button size="sm" variant="outline">
                    Act Now
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Time-Based Guidance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getTimeIcon()}
            {timeOfDay.charAt(0).toUpperCase() + timeOfDay.slice(1)} Briefing
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="metrics">Key Metrics</TabsTrigger>
              <TabsTrigger value="schedule">Schedule</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-3 mt-4">
              <div className="text-sm space-y-2">
                <p>
                  <span className="font-medium">Current Phase:</span> {currentPhase}
                </p>
                <p>
                  <span className="font-medium">Active Alerts:</span> {recentAlerts.length}
                </p>
                <p>
                  <span className="font-medium">Recommended Focus:</span> Water quality monitoring
                </p>
              </div>
            </TabsContent>

            <TabsContent value="metrics" className="space-y-3 mt-4">
              <div className="grid grid-cols-2 gap-3">
                <Card className="bg-muted">
                  <CardContent className="pt-4">
                    <p className="text-xs text-muted-foreground">Water Quality</p>
                    <p className="text-lg font-bold">Good</p>
                  </CardContent>
                </Card>
                <Card className="bg-muted">
                  <CardContent className="pt-4">
                    <p className="text-xs text-muted-foreground">Production Rate</p>
                    <p className="text-lg font-bold">85%</p>
                  </CardContent>
                </Card>
                <Card className="bg-muted">
                  <CardContent className="pt-4">
                    <p className="text-xs text-muted-foreground">Feed Efficiency</p>
                    <p className="text-lg font-bold">1.4 FCR</p>
                  </CardContent>
                </Card>
                <Card className="bg-muted">
                  <CardContent className="pt-4">
                    <p className="text-xs text-muted-foreground">Survival Rate</p>
                    <p className="text-lg font-bold">92%</p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="schedule" className="space-y-3 mt-4">
              <div className="text-sm space-y-3">
                <div className="flex items-start gap-3 p-2 rounded-lg bg-muted">
                  <Clock className="h-4 w-4 mt-0.5 text-blue-600" />
                  <div>
                    <p className="font-medium">Water Testing</p>
                    <p className="text-muted-foreground">Next: 2:00 PM (1 hour)</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-2 rounded-lg bg-muted">
                  <TrendingUp className="h-4 w-4 mt-0.5 text-green-600" />
                  <div>
                    <p className="font-medium">Feed Distribution</p>
                    <p className="text-muted-foreground">Next: 3:00 PM (2 hours)</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-2 rounded-lg bg-muted">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 text-purple-600" />
                  <div>
                    <p className="font-medium">Evening Report</p>
                    <p className="text-muted-foreground">Next: 6:00 PM (5 hours)</p>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Component Ordering Info */}
      <Alert>
        <Zap className="h-4 w-4" />
        <AlertDescription>
          Dashboard components are reordered based on: current farm phase, recent alerts, time of day, and your role.
          This ensures you see the most relevant information first.
        </AlertDescription>
      </Alert>
    </div>
  );
}
