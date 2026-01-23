"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle, AlertCircle, Wand2, ChevronRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Phase {
  id: string;
  name: string;
  status: 'completed' | 'current' | 'upcoming';
  progress: number;
  description: string;
  checklist: { item: string; completed: boolean }[];
  resources: { name: string; url: string }[];
  duration: string;
}

export function ProjectJourneyMap({ 
  projectPhase = 'operation',
  currentStage = 'operation',
  pondName = '',
  cycleDay = 0,
  totalCycleDays = 120
}: { 
  projectPhase?: string;
  currentStage?: 'planning' | 'preparation' | 'stocking' | 'operation' | 'harvest';
  pondName?: string;
  cycleDay?: number;
  totalCycleDays?: number;
}) {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [expandedPhase, setExpandedPhase] = useState<string | null>(currentStage || 'operation');

  // Map currentStage to phase IDs
  const stageToPhaseMap: Record<string, string> = {
    planning: 'planning',
    preparation: 'setup',
    stocking: 'stocking',
    operation: 'operation',
    harvest: 'harvest',
  };

  const activePhaseId = stageToPhaseMap[currentStage] || 'operation';
  
  // Calculate progress based on cycle day for operation phase
  const getPhaseProgress = (phaseId: string) => {
    if (phaseId === 'operation' && activePhaseId === 'operation') {
      return Math.min(100, Math.round((cycleDay / totalCycleDays) * 100));
    }
    return phaseId === activePhaseId ? 50 : (activePhaseId === 'harvest' || activePhaseId === 'operation' ? 100 : 0);
  };

  const phases: Phase[] = [
    {
      id: 'planning',
      name: '📋 Phase 1: Planning & Design',
      status: activePhaseId === 'planning' ? 'current' : (['setup', 'stocking', 'operation', 'harvest'].includes(activePhaseId) ? 'completed' : 'upcoming'),
      progress: activePhaseId === 'planning' ? 50 : (['setup', 'stocking', 'operation', 'harvest'].includes(activePhaseId) ? 100 : 0),
      description: 'Assess location, calculate requirements, design pond layout and budget',
      checklist: [
        { item: 'Site assessment and soil testing', completed: true },
        { item: 'Stocking density calculation (target: 80-120/m²)', completed: true },
        { item: 'Budget preparation and cost estimation', completed: true },
        { item: 'Pond layout design and dimension planning', completed: true },
      ],
      resources: [
        { name: 'Site Selection Guide', url: '#' },
        { name: 'Design Specifications', url: '#' },
      ],
      duration: '2-4 weeks',
    },
    {
      id: 'setup',
      name: '🔨 Phase 2: Pond Preparation',
      status: activePhaseId === 'setup' ? 'current' : (['stocking', 'operation', 'harvest'].includes(activePhaseId) ? 'completed' : 'upcoming'),
      progress: activePhaseId === 'setup' ? 50 : (['stocking', 'operation', 'harvest'].includes(activePhaseId) ? 100 : 0),
      description: 'Construct pond, install aeration & water systems, test equipment',
      checklist: [
        { item: 'Pond excavation and leveling', completed: true },
        { item: 'Aeration system installation and testing', completed: true },
        { item: 'Water supply and draining infrastructure setup', completed: true },
        { item: 'Equipment calibration and functionality testing', completed: true },
      ],
      resources: [
        { name: 'Equipment Manual', url: '#' },
        { name: 'Installation Checklist', url: '#' },
      ],
      duration: '3-6 weeks',
    },
    {
      id: 'stocking',
      name: '🦐 Phase 3: Stocking & Acclimation',
      status: activePhaseId === 'stocking' ? 'current' : (['operation', 'harvest'].includes(activePhaseId) ? 'completed' : 'upcoming'),
      progress: activePhaseId === 'stocking' ? 50 : (['operation', 'harvest'].includes(activePhaseId) ? 100 : 0),
      description: 'Prepare water, acclimate post-larvae (PL), release into pond',
      checklist: [
        { item: 'Water treatment and conditioning (salinity, temperature)', completed: true },
        { item: 'PL quality assessment and health check', completed: true },
        { item: 'Gradual acclimation process (2-4 hours)', completed: true },
        { item: 'Post-stocking monitoring and observation', completed: true },
      ],
      resources: [
        { name: 'Acclimation Protocol', url: '#' },
        { name: 'Water Quality Standards', url: '#' },
      ],
      duration: '1 day',
    },
    {
      id: 'operation',
      name: '📊 Phase 4: Operation & Maintenance',
      status: activePhaseId === 'operation' ? 'current' : (activePhaseId === 'harvest' ? 'completed' : 'upcoming'),
      progress: getPhaseProgress('operation'),
      description: `Daily farming operations: monitoring, feeding, maintenance (Day ${cycleDay}/${totalCycleDays})`,
      checklist: [
        { item: 'Daily water quality testing (pH, DO, ammonia, temp)', completed: true },
        { item: 'Feeding schedule optimization based on growth', completed: true },
        { item: 'Health monitoring and disease observation', completed: false },
        { item: 'Disease prevention protocol enforcement', completed: false },
        { item: 'Equipment maintenance and system checks', completed: false },
      ],
      resources: [
        { name: 'Daily Operations Manual', url: '#' },
        { name: 'Disease Identification Guide', url: '#' },
        { name: 'Emergency Response Plan', url: '#' },
      ],
      duration: '10-16 weeks',
    },
    {
      id: 'harvest',
      name: '🎯 Phase 5: Harvest & Processing',
      status: activePhaseId === 'harvest' ? 'current' : 'upcoming',
      progress: activePhaseId === 'harvest' ? 50 : 0,
      description: 'Harvest shrimp, grade by size, process, and perform quality control',
      checklist: [
        { item: 'Harvest planning and optimal timing determination', completed: false },
        { item: 'Partial harvest practice (if applicable)', completed: false },
        { item: 'Size grading setup and calibration', completed: false },
        { item: 'Quality assurance and freshness testing', completed: false },
      ],
      resources: [
        { name: 'Harvest Guidelines', url: '#' },
        { name: 'Quality Standards', url: '#' },
      ],
      duration: '2-3 days',
    },
    {
      id: 'analysis',
      name: '📈 Phase 6: Analysis & Planning',
      status: 'upcoming',
      progress: 0,
      description: 'Analyze production, calculate ROI, plan improvements for next cycle',
      checklist: [
        { item: 'Production data collection and analysis (FCR, survival rate, yield)', completed: false },
        { item: 'Financial reconciliation and ROI calculation', completed: false },
        { item: 'Performance review against targets', completed: false },
        { item: 'Next cycle improvement plan and optimization', completed: false },
      ],
      resources: [
        { name: 'Analysis Template', url: '#' },
        { name: 'Benchmarking Guide', url: '#' },
      ],
      duration: '1 week',
    },
  ];

  const handleGenerateNextTasks = async (phaseId: string) => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/ai/generate-phase-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phaseId,
          currentPhase: projectPhase,
          dayInPhase: 45,
        }),
      });

      const data = await response.json();
      toast({
        title: "Tasks Generated",
        description: "AI has created recommended tasks for this phase",
      });
    } catch (error) {
      console.error('Task generation error:', error);
      toast({
        variant: "destructive",
        title: "Generation Failed",
        description: "Could not generate phase tasks",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Pond Identifier */}
      {pondName && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-600">📍 Project Timeline for:</span>
              <Badge className="bg-blue-600">{pondName}</Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Journey Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>🗓️ Project Journey Timeline {pondName && `- ${pondName}`}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {phases.map((phase, idx) => (
              <div key={phase.id} className="relative">
                {/* Timeline connector */}
                {idx < phases.length - 1 && (
                  <div
                    className={`absolute left-6 top-16 bottom-0 w-0.5 ${
                      phase.status === 'completed' ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                  />
                )}

                {/* Phase card */}
                <div
                  onClick={() => setExpandedPhase(expandedPhase === phase.id ? null : phase.id)}
                  className={`relative cursor-pointer p-4 rounded-lg border-2 transition-all ${
                    phase.status === 'current'
                      ? 'border-blue-500 bg-blue-50'
                      : phase.status === 'completed'
                      ? 'border-green-300 bg-green-50'
                      : 'border-gray-300 bg-gray-50'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className="relative z-10 mt-1">
                      {phase.status === 'completed' && (
                        <CheckCircle2 className="h-8 w-8 text-green-600" />
                      )}
                      {phase.status === 'current' && (
                        <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
                          <Circle className="h-4 w-4 text-white fill-white" />
                        </div>
                      )}
                      {phase.status === 'upcoming' && (
                        <Circle className="h-8 w-8 text-gray-400" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-lg">{phase.name}</h3>
                          <p className="text-sm text-muted-foreground">{phase.description}</p>
                          <p className="text-xs text-muted-foreground mt-1">Duration: {phase.duration}</p>
                        </div>
                        <ChevronRight
                          className={`h-5 w-5 text-muted-foreground transition-transform ${
                            expandedPhase === phase.id ? 'rotate-90' : ''
                          }`}
                        />
                      </div>

                      {/* Progress bar */}
                      <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-full rounded-full transition-all ${
                            phase.status === 'completed'
                              ? 'bg-green-600'
                              : phase.status === 'current'
                              ? 'bg-blue-600'
                              : 'bg-gray-400'
                          }`}
                          style={{ width: `${phase.progress}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{phase.progress}% Complete</p>

                      {/* Expanded content */}
                      {expandedPhase === phase.id && (
                        <div className="mt-4 pt-4 border-t space-y-4">
                          {/* Checklist */}
                          <div>
                            <h4 className="font-semibold text-sm mb-2">Phase Checklist</h4>
                            <div className="space-y-2">
                              {phase.checklist.map((item, i) => (
                                <label key={i} className="flex items-center gap-2 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={item.completed}
                                    readOnly
                                    className="rounded"
                                  />
                                  <span className={item.completed ? 'line-through text-muted-foreground' : ''}>
                                    {item.item}
                                  </span>
                                </label>
                              ))}
                            </div>
                          </div>

                          {/* Resources */}
                          {phase.resources.length > 0 && (
                            <div>
                              <h4 className="font-semibold text-sm mb-2">Resources</h4>
                              <div className="flex flex-wrap gap-2">
                                {phase.resources.map((resource, i) => (
                                  <Button
                                    key={i}
                                    variant="outline"
                                    size="sm"
                                    onClick={() => window.open(resource.url)}
                                  >
                                    {resource.name}
                                  </Button>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* AI Task Generation */}
                          {phase.status === 'current' && (
                            <Button
                              onClick={() => handleGenerateNextTasks(phase.id)}
                              disabled={isGenerating}
                              className="w-full gap-2 bg-purple-600 hover:bg-purple-700"
                            >
                              <Wand2 className="h-4 w-4" />
                              Generate Phase Tasks
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Current Phase Alert */}
      <Card className="border-2 border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-blue-600" />
            Current Phase {pondName && `- ${pondName}`}: Operation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">
            {pondName} is in the Operation & Maintenance phase (Day {cycleDay} of {totalCycleDays}). Focus on maintaining optimal water quality and feeding efficiency for this pond.
          </p>
          <Badge className="bg-blue-600">Phase 4 of 6 - Pond Specific</Badge>
        </CardContent>
      </Card>
    </div>
  );
}
