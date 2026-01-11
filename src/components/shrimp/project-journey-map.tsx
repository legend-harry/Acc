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

export function ProjectJourneyMap({ projectPhase = 'operation' }: { projectPhase?: string }) {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [expandedPhase, setExpandedPhase] = useState<string | null>('operation');

  const phases: Phase[] = [
    {
      id: 'planning',
      name: 'Planning & Design',
      status: 'completed',
      progress: 100,
      description: 'Project planning, site selection, and system design',
      checklist: [
        { item: 'Site assessment and soil testing', completed: true },
        { item: 'Stocking density calculation', completed: true },
        { item: 'Budget preparation', completed: true },
        { item: 'Pond layout design', completed: true },
      ],
      resources: [
        { name: 'Site Selection Guide', url: '#' },
        { name: 'Design Specifications', url: '#' },
      ],
      duration: '2-4 weeks',
    },
    {
      id: 'setup',
      name: 'Setup & Preparation',
      status: 'completed',
      progress: 100,
      description: 'Pond construction, water system setup, and equipment installation',
      checklist: [
        { item: 'Pond excavation and leveling', completed: true },
        { item: 'Aeration system installation', completed: true },
        { item: 'Water supply and draining setup', completed: true },
        { item: 'Equipment calibration and testing', completed: true },
      ],
      resources: [
        { name: 'Equipment Manual', url: '#' },
        { name: 'Installation Checklist', url: '#' },
      ],
      duration: '3-6 weeks',
    },
    {
      id: 'stocking',
      name: 'Stocking & Acclimation',
      status: 'completed',
      progress: 100,
      description: 'Water preparation, seed acclimation, and initial stocking',
      checklist: [
        { item: 'Water treatment and conditioning', completed: true },
        { item: 'PL quality assessment', completed: true },
        { item: 'Acclimation process', completed: true },
        { item: 'Post-stocking monitoring', completed: true },
      ],
      resources: [
        { name: 'Acclimation Protocol', url: '#' },
        { name: 'Water Quality Standards', url: '#' },
      ],
      duration: '1 week',
    },
    {
      id: 'operation',
      name: 'Operation & Maintenance',
      status: 'current',
      progress: 45,
      description: 'Daily monitoring, feeding, maintenance, and problem management',
      checklist: [
        { item: 'Daily water quality testing', completed: true },
        { item: 'Feeding schedule optimization', completed: true },
        { item: 'Health monitoring and observation', completed: false },
        { item: 'Disease prevention protocol', completed: false },
        { item: 'Equipment maintenance', completed: false },
      ],
      resources: [
        { name: 'Daily Operations Manual', url: '#' },
        { name: 'Disease Identification Guide', url: '#' },
        { name: 'Emergency Response Plan', url: '#' },
      ],
      duration: '12 weeks',
    },
    {
      id: 'harvest',
      name: 'Harvest & Processing',
      status: 'upcoming',
      progress: 0,
      description: 'Harvesting, grading, processing, and quality control',
      checklist: [
        { item: 'Harvest planning and scheduling', completed: false },
        { item: 'Partial harvest practice', completed: false },
        { item: 'Size grading setup', completed: false },
        { item: 'Quality assurance testing', completed: false },
      ],
      resources: [
        { name: 'Harvest Guidelines', url: '#' },
        { name: 'Quality Standards', url: '#' },
      ],
      duration: '2-3 days',
    },
    {
      id: 'analysis',
      name: 'Analysis & Planning',
      status: 'upcoming',
      progress: 0,
      description: 'Post-cycle analysis, reporting, and next cycle planning',
      checklist: [
        { item: 'Production data analysis', completed: false },
        { item: 'Financial reconciliation', completed: false },
        { item: 'Performance review', completed: false },
        { item: 'Next cycle improvement plan', completed: false },
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
      {/* Journey Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Project Journey Timeline</CardTitle>
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
            Current Phase: Operation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">
            You're in the Operation & Maintenance phase (Day 45 of 120). Focus on maintaining optimal water quality and feeding efficiency.
          </p>
          <Badge className="bg-blue-600">Phase 4 of 6</Badge>
        </CardContent>
      </Card>
    </div>
  );
}
