"use client";

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sparkles, Clock, CheckCircle2, AlertTriangle, Lightbulb,
  Activity, Scale, Droplets, Utensils, Zap, Calendar, Fish, RefreshCw, Settings, Moon
} from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

interface ProjectJourneyMapProps {
  projectPhase: string;
  currentStage: string;
  pondName: string;
  cycleDay: number;
  totalCycleDays: number;
  projectId?: string | null;
  projectName?: string | null;
  farmingType?: string;
  shrimpType?: string;
  currentStock?: number;
  recentLogs?: any[];
  pondId: string;
}

interface DailyScheduleItem {
  time: string;
  task: string;
  type: string;
}

interface AiBriefing {
  statusSummary: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  expectedDeltas: string;
  dailySchedule: DailyScheduleItem[];
  recommendations: string[];
}

const PHASES = [
  { id: 'planning',     label: 'Planning',     emoji: '📋', days: 7 },
  { id: 'preparation',  label: 'Preparation',  emoji: '🔧', days: 14 },
  { id: 'stocking',     label: 'Stocking',     emoji: '🐟', days: 3 },
  { id: 'operation',    label: 'Grow-out',     emoji: '📈', days: 90 },
  { id: 'harvest',      label: 'Harvest',      emoji: '⚖️', days: 6 },
];

export function ProjectJourneyMap({
  projectPhase,
  currentStage,
  pondName,
  cycleDay,
  totalCycleDays,
  projectId,
  projectName,
  farmingType,
  shrimpType,
  currentStock,
  recentLogs,
  pondId,
}: ProjectJourneyMapProps) {
  const [briefing, setBriefing] = useState<AiBriefing | null>(null);
  const [loading, setLoading] = useState(true);
  const [completedTasks, setCompletedTasks] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  const getMoonPhase = () => {
    // Simple approximation based on known new moon (e.g. Jan 11, 2024)
    const knownNewMoon = new Date('2024-01-11T00:00:00Z').getTime();
    const now = Date.now();
    const cycle = 29.53058867 * 24 * 60 * 60 * 1000;
    const phase = ((now - knownNewMoon) % cycle) / cycle;
    if (phase < 0.03 || phase > 0.97) return { icon: '🌑', label: 'New Moon (High Moulting Risk)' };
    if (phase < 0.22) return { icon: '🌒', label: 'Waxing Crescent' };
    if (phase < 0.28) return { icon: '🌓', label: 'First Quarter' };
    if (phase < 0.47) return { icon: '🌔', label: 'Waxing Gibbous' };
    if (phase < 0.53) return { icon: '🌕', label: 'Full Moon (High Moulting Risk)' };
    if (phase < 0.72) return { icon: '🌖', label: 'Waning Gibbous' };
    if (phase < 0.78) return { icon: '🌗', label: 'Last Quarter' };
    return { icon: '🌘', label: 'Waning Crescent' };
  };
  const moonPhase = useMemo(getMoonPhase, []);

  const activePhaseIndex = useMemo(() => {
    const idx = PHASES.findIndex(p => p.id === currentStage);
    return idx >= 0 ? idx : 0;
  }, [currentStage]);

  const overallProgress = Math.min(100, Math.round((cycleDay / totalCycleDays) * 100));

  const fetchBriefing = async (forceRefresh = false) => {
    if (!pondId) return;
    
    const cacheKey = `ai_brief_${pondId}`;
    if (!forceRefresh) {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        try {
          const parsedCache = JSON.parse(cached);
          // Check if cache is older than 3 days (3 * 24 * 60 * 60 * 1000 ms)
          const isExpired = Date.now() - parsedCache.timestamp > 259200000;
          if (!isExpired) {
            setBriefing(parsedCache.data);
            setLoading(false);
            return;
          }
        } catch (e) {
          console.error("Cache parsing error", e);
        }
      }
    }

    setLoading(true);
    try {
      const res = await fetch('/api/ai/analyze-farm-progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pondName,
          currentStage,
          cycleDay,
          totalCycleDays,
          farmingType,
          shrimpType,
          currentStock,
          recentLogs
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setBriefing(data);
        localStorage.setItem(cacheKey, JSON.stringify({
          timestamp: Date.now(),
          data: data
        }));
      } else {
        throw new Error('Failed to fetch AI briefing');
      }
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "AI Assistant Offline",
        description: "Could not generate today's briefing. Please check your connection."
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch briefing on mount or when pondId changes
  useEffect(() => {
    setBriefing(null); // Clear old briefing immediately on pond switch
    if (pondId && pondName) {
      fetchBriefing();
      // Load completed tasks for today
      const today = new Date().toISOString().split('T')[0];
      const savedTasks = localStorage.getItem(`tasks_${pondId}_${today}`);
      if (savedTasks) {
        try { setCompletedTasks(JSON.parse(savedTasks)); } catch(e){}
      } else {
        setCompletedTasks({});
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pondId]);

  const toggleTask = (taskIndex: number) => {
    setCompletedTasks(prev => {
      const today = new Date().toISOString().split('T')[0];
      const updated = { ...prev, [taskIndex]: !prev[taskIndex] };
      localStorage.setItem(`tasks_${pondId}_${today}`, JSON.stringify(updated));
      return updated;
    });
  };

  const getTaskIcon = (type: string) => {
    switch (type) {
      case 'feed': return <Utensils className="h-4 w-4 text-orange-500" />;
      case 'test': return <Droplets className="h-4 w-4 text-blue-500" />;
      case 'observe': return <Activity className="h-4 w-4 text-emerald-500" />;
      case 'maintenance': return <Settings className="h-4 w-4 text-gray-500" />;
      default: return <CheckCircle2 className="h-4 w-4 text-gray-500" />;
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-emerald-700 bg-emerald-50 border-emerald-200';
      case 'medium': return 'text-amber-700 bg-amber-50 border-amber-200';
      case 'high': return 'text-orange-700 bg-orange-50 border-orange-200';
      case 'critical': return 'text-red-700 bg-red-50 border-red-200';
      default: return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="space-y-4">
      {/* ── Top Level Context ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-gray-900">{pondName} Daily Assistant</h2>
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              <Sparkles className="h-3 w-3 mr-1" /> AI Powered
            </Badge>
            <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-300 ml-2" title={moonPhase.label}>
              <span className="mr-1">{moonPhase.icon}</span> {moonPhase.label}
            </Badge>
          </div>
          <p className="text-sm text-gray-500 flex items-center gap-2 mt-1">
            <Calendar className="h-3.5 w-3.5" /> Day {cycleDay} of {totalCycleDays} ({PHASES[activePhaseIndex]?.label} Phase)
            {projectName && <span className="font-medium text-indigo-600 truncate max-w-[150px]">📁 {projectName}</span>}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => fetchBriefing(true)} disabled={loading} className="gap-2 shrink-0">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh Insights
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* ── Left Column: Briefing & Schedule ── */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="border-indigo-100 overflow-hidden shadow-sm">
            <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-4 border-b border-indigo-100 flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                <Lightbulb className="h-5 w-5 text-indigo-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-indigo-900">Today&apos;s Briefing</h3>
                {loading ? (
                  <div className="space-y-2 mt-2">
                    <Skeleton className="h-4 w-full bg-indigo-100/50" />
                    <Skeleton className="h-4 w-5/6 bg-indigo-100/50" />
                  </div>
                ) : briefing ? (
                  <p className="text-sm text-indigo-800/80 mt-1 leading-relaxed">
                    {briefing.statusSummary}
                  </p>
                ) : (
                  <p className="text-sm text-indigo-500 mt-1">No briefing available.</p>
                )}
              </div>
            </div>
            <CardContent className="p-0">
              <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-100">
                {/* Schedule */}
                <div className="p-4 bg-white space-y-4">
                  <h4 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                    <Clock className="h-4 w-4 text-indigo-500" />
                    Dynamic Schedule (Interactive)
                  </h4>
                  
                  {loading ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="flex gap-3">
                          <Skeleton className="w-16 h-8 rounded" />
                          <Skeleton className="flex-1 h-8 rounded" />
                        </div>
                      ))}
                    </div>
                  ) : briefing?.dailySchedule?.length ? (
                    <div className="space-y-3">
                      {briefing.dailySchedule.map((item, index) => {
                        const isDone = completedTasks[index];
                        return (
                          <div 
                            key={index} 
                            className={`flex items-start gap-3 p-3 rounded-xl border transition-colors cursor-pointer select-none
                              ${isDone ? 'bg-gray-50 border-gray-200 opacity-60' : 'bg-white border-gray-100 hover:border-indigo-200 hover:bg-indigo-50/50'}`}
                            onClick={() => toggleTask(index)}
                          >
                            <div className="w-16 shrink-0">
                              <Badge variant="outline" className={`font-mono ${isDone ? 'text-gray-400 border-gray-200' : 'bg-indigo-50 text-indigo-700 border-indigo-100'}`}>
                                {item.time}
                              </Badge>
                            </div>
                            <div className="flex-1">
                              <p className={`text-sm font-medium ${isDone ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                                {item.task}
                              </p>
                              <div className="flex items-center gap-1.5 mt-1">
                                {getTaskIcon(item.type)}
                                <span className="text-xs text-gray-500 capitalize">{item.type}</span>
                              </div>
                            </div>
                            <div className="shrink-0 pt-1">
                              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors
                                ${isDone ? 'border-emerald-500 bg-emerald-500' : 'border-gray-300'}`}>
                                {isDone && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No schedule generated.</p>
                  )}
                </div>

                {/* Recommendations */}
                <div className="p-4 bg-gray-50/50">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Zap className="h-3.5 w-3.5" /> AI Recommendations
                  </h4>
                  {loading ? (
                    <div className="space-y-3">
                      {[1, 2].map(i => <Skeleton key={i} className="h-12 w-full" />)}
                    </div>
                  ) : briefing?.recommendations ? (
                    <ul className="space-y-2.5">
                      {briefing.recommendations.map((rec, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 flex-shrink-0" />
                          <span className="leading-snug">{rec}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-500">No recommendations available.</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Right Column: Context & Timeline ── */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Current Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Risk Level */}
              <div>
                <p className="text-xs text-gray-500 mb-1">AI Risk Assessment</p>
                {loading ? <Skeleton className="h-8 w-24" /> : (
                  <Badge variant="outline" className={`capitalize px-3 py-1 ${getRiskColor(briefing?.riskLevel || 'low')}`}>
                    <AlertTriangle className="h-3.5 w-3.5 mr-1.5" />
                    {briefing?.riskLevel || 'Unknown'} Risk
                  </Badge>
                )}
              </div>

              {/* Expected Deltas */}
              <div>
                <p className="text-xs text-gray-500 mb-1">Expected Parameters Today</p>
                {loading ? <Skeleton className="h-12 w-full" /> : (
                  <p className="text-sm text-gray-700 bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                    {briefing?.expectedDeltas || 'No parameter expectations available.'}
                  </p>
                )}
              </div>

              {/* Progress Timeline */}
              <div className="pt-2 border-t border-gray-100">
                <div className="flex justify-between items-center mb-1">
                  <p className="text-xs font-semibold text-gray-700">Cycle Progress</p>
                  <p className="text-xs text-gray-500">{overallProgress}%</p>
                </div>
                <Progress value={overallProgress} className="h-2 mb-3" />
                
                <div className="flex gap-1">
                  {PHASES.map((phase, idx) => (
                    <div 
                      key={phase.id} 
                      title={phase.label}
                      className={`h-1.5 flex-1 rounded-full ${
                        idx < activePhaseIndex ? 'bg-emerald-400' :
                        idx === activePhaseIndex ? 'bg-blue-500' : 'bg-gray-200'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
