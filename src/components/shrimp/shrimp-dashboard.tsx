"use client";

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  TrendingUp, AlertTriangle, Trash2, ChevronRight, AlertCircle, Edit2,
  Fish, Droplets, Target, Calendar, Timer, Activity, ArrowUpRight,
  ArrowDownRight, Waves, Shell
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { EditPondDialog } from './edit-pond-dialog';

// Growth stage mapping
function getGrowthStage(cycleDay: number): { stage: string; icon: 'microscope' | 'fish' | 'shell' | 'target'; color: string } {
  if (cycleDay <= 20) return { stage: 'Post-Larvae', icon: 'microscope', color: 'text-violet-600' };
  if (cycleDay <= 45) return { stage: 'Juvenile', icon: 'fish', color: 'text-cyan-600' };
  if (cycleDay <= 80) return { stage: 'Sub-Adult', icon: 'shell', color: 'text-emerald-600' };
  return { stage: 'Adult', icon: 'target', color: 'text-amber-600' };
}

const GROWTH_ICONS: Record<string, typeof Fish> = {
  microscope: Activity,
  fish: Fish,
  shell: Shell,
  target: Target,
};

// Status config
const STATUS_CONFIG: Record<string, { bg: string; border: string; dot: string; text: string }> = {
  active: { bg: 'bg-emerald-50', border: 'border-emerald-300', dot: 'bg-emerald-500', text: 'text-emerald-700' },
  preparing: { bg: 'bg-amber-50', border: 'border-amber-300', dot: 'bg-amber-500', text: 'text-amber-700' },
  harvesting: { bg: 'bg-blue-50', border: 'border-blue-300', dot: 'bg-blue-500', text: 'text-blue-700' },
  resting: { bg: 'bg-gray-50', border: 'border-gray-300', dot: 'bg-gray-400', text: 'text-gray-600' },
};

export function ShrimpDashboard({ ponds, currentPhase, alerts, onPondSelect, onDeletePond, activePond }: any) {
  const [deleteConfirming, setDeleteConfirming] = useState<string | null>(null);
  const [selectedPond, setSelectedPond] = useState<string | null>(activePond || null);
  const [editingPond, setEditingPond] = useState<any>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const { toast } = useToast();

  // Get selected pond data for analytics
  const activePondData = selectedPond ? ponds.find((p: any) => p.id === selectedPond) : null;

  // Calculate estimated survival count
  const estimatedCount = useMemo(() => {
    if (!activePondData) return null;
    const cycleDay = activePondData.cycleDay || 0;
    const initialStock = activePondData.currentStock || 0;
    const survivalRate = activePondData.metrics?.survivalRate || 85;
    const dailySurvival = Math.pow(survivalRate / 100, 1 / 120);
    return Math.round(initialStock * Math.pow(dailySurvival, cycleDay));
  }, [activePondData]);

  // Days remaining estimate
  const daysRemaining = useMemo(() => {
    if (!activePondData) return null;
    const totalDays = 120;
    const currentDay = activePondData.cycleDay || 0;
    return Math.max(0, totalDays - currentDay);
  }, [activePondData]);

  // Growth stage
  const growthStage = useMemo(() => {
    return getGrowthStage(activePondData?.cycleDay || 0);
  }, [activePondData]);

  const handleDeleteClick = (pondId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    if (deleteConfirming === pondId) {
      onDeletePond(pondId);
      setDeleteConfirming(null);
      toast({
        title: "Pond Deleted",
        description: "The pond has been removed successfully",
      });
    } else {
      setDeleteConfirming(pondId);
      setTimeout(() => {
        setDeleteConfirming(null);
      }, 3000);
    }
  };

  const handleEditClick = (pond: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingPond(pond);
    setEditDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* === Cycle Phase Hero Banner === */}
      <div className="rounded-2xl overflow-hidden relative aqua-gradient-bg">
        <div className="p-5 md:p-6 relative z-10">
          <div className="flex flex-col md:flex-row md:items-stretch justify-between gap-4">

            {/* Left — phase info + progress */}
            <div className="flex-1 space-y-3 min-w-0">
              <div className="flex items-center gap-2">
                <Waves className="h-5 w-5 text-cyan-600 animate-wave flex-shrink-0" />
                <h2 className="text-lg md:text-xl font-bold text-gray-900 truncate">{currentPhase.name}</h2>
              </div>

              {/* Progress bar */}
              <div className="w-full">
                <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
                  <span className="flex items-center gap-1 font-medium">
                    <Calendar className="h-3 w-3" />
                    Day {currentPhase.day} of 120
                  </span>
                  <span className="font-bold text-gray-700">{Math.round((currentPhase.day / 120) * 100)}% complete</span>
                </div>
                <div className="h-3 rounded-full bg-white/50 overflow-hidden shadow-inner">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-emerald-400 to-amber-400 transition-all duration-1000 ease-out relative"
                    style={{ width: `${Math.min(100, (currentPhase.day / 120) * 100)}%` }}
                  >
                    <div className="absolute inset-0 bg-white/20 rounded-full animate-pulse" />
                  </div>
                </div>
              </div>

              {/* Next milestone badge */}
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="border-cyan-300 text-cyan-700 bg-white/70 backdrop-blur-sm text-xs font-medium px-3 py-1">
                  <Calendar className="h-3 w-3 mr-1" /> {currentPhase.nextMilestone}
                </Badge>
                {growthStage && (
                  <Badge variant="outline" className={`border-current bg-white/70 backdrop-blur-sm text-xs font-medium px-3 py-1 ${growthStage.color}`}>
                    {(() => { const Icon = GROWTH_ICONS[growthStage.icon]; return <Icon className="h-3 w-3 mr-1" />; })()}
                    {growthStage.stage} Phase
                  </Badge>
                )}
              </div>
            </div>

            {/* Right — countdown + metrics */}
            <div className="flex gap-3 flex-shrink-0">
              {/* Harvest countdown */}
              {daysRemaining !== null && daysRemaining > 0 && (
                <div className="glass-card rounded-xl px-5 py-3 text-center animate-scale-in flex flex-col items-center justify-center min-w-[90px]">
                  <Timer className="h-4 w-4 text-cyan-600 mb-1" />
                  <p className="text-3xl font-bold text-gray-900 leading-none">{daysRemaining}</p>
                  <p className="text-[11px] text-gray-500 font-medium mt-1">days left</p>
                </div>
              )}
              {daysRemaining === 0 && (
                <div className="glass-card rounded-xl px-5 py-3 text-center animate-scale-in flex flex-col items-center justify-center min-w-[90px]">
                  <Target className="h-5 w-5 text-emerald-600 mb-1" />
                  <p className="text-sm font-bold text-emerald-700 leading-tight">Harvest</p>
                  <p className="text-[11px] text-gray-500 font-medium">Ready!</p>
                </div>
              )}
              {/* Stock pill */}
              {activePondData && (
                <div className="glass-card rounded-xl px-5 py-3 text-center animate-scale-in flex flex-col items-center justify-center min-w-[90px]">
                  <Fish className="h-4 w-4 text-cyan-600 mb-1" />
                  <p className="text-xl font-bold text-gray-900 leading-none">
                    {((estimatedCount || activePondData?.currentStock || 0) / 1000).toFixed(0)}K
                  </p>
                  <p className="text-[11px] text-gray-500 font-medium mt-1">est. alive</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>


      {/* === Pond-Specific KPI Grid === */}
      {activePondData ? (
        <div className="grid gap-3 md:gap-4 grid-cols-2 lg:grid-cols-4">
          {/* Current Stock / Estimated Count */}
          <Card className="kpi-card hover-lift border-cyan-200 bg-gradient-to-br from-cyan-50 to-sky-50 animate-fade-up" style={{ animationDelay: '0ms' }}>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between mb-2">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-400 to-sky-500 flex items-center justify-center shadow-sm">
                  <Fish className="h-4 w-4 text-white" />
                </div>
                {estimatedCount && estimatedCount < activePondData.currentStock && (
                  <div className="flex items-center gap-0.5 text-xs text-orange-600">
                    <ArrowDownRight className="h-3 w-3" />
                    <span>{Math.round(((activePondData.currentStock - estimatedCount) / activePondData.currentStock) * 100)}%</span>
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500 font-medium">Estimated Count</p>
              <p className="text-xl md:text-2xl font-bold text-gray-900 animate-counter-up">
                {(estimatedCount || activePondData.currentStock || 0).toLocaleString()}
              </p>
              <p className="text-xs text-cyan-600 mt-0.5">
                Seeded: {(activePondData.currentStock || 0).toLocaleString()}
              </p>
            </CardContent>
          </Card>

          {/* Target Density */}
          <Card className="kpi-card hover-lift border-emerald-200 bg-gradient-to-br from-emerald-50 to-green-50 animate-fade-up" style={{ animationDelay: '75ms' }}>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between mb-2">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center shadow-sm">
                  <Target className="h-4 w-4 text-white" />
                </div>
              </div>
              <p className="text-xs text-gray-500 font-medium">Target Density</p>
              <p className="text-xl md:text-2xl font-bold text-gray-900 animate-counter-up">{activePondData.targetDensity || 0}</p>
              <p className="text-xs text-emerald-600 mt-0.5">PL/m² — {activePondData.farmingType || 'N/A'}</p>
            </CardContent>
          </Card>

          {/* Pond Area */}
          <Card className="kpi-card hover-lift border-purple-200 bg-gradient-to-br from-purple-50 to-violet-50 animate-fade-up" style={{ animationDelay: '150ms' }}>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between mb-2">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-400 to-violet-500 flex items-center justify-center shadow-sm">
                  <Droplets className="h-4 w-4 text-white" />
                </div>
              </div>
              <p className="text-xs text-gray-500 font-medium">Pond Area</p>
              <p className="text-xl md:text-2xl font-bold text-gray-900 animate-counter-up">{(activePondData.area || 0).toFixed(2)} ha</p>
              <p className="text-xs text-purple-600 mt-0.5">{((activePondData.area || 0) * 10000).toFixed(0)} m²</p>
            </CardContent>
          </Card>

          {/* Growth Stage */}
          <Card className="kpi-card hover-lift border-amber-200 bg-gradient-to-br from-amber-50 to-yellow-50 animate-fade-up" style={{ animationDelay: '225ms' }}>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between mb-2">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center shadow-sm">
                  <Activity className="h-4 w-4 text-white" />
                </div>
              </div>
              <p className="text-xs text-gray-500 font-medium">Growth Stage</p>
              <p className={`text-xl md:text-2xl font-bold capitalize animate-counter-up ${growthStage.color}`}>
                {(() => { const Icon = GROWTH_ICONS[growthStage.icon]; return <Icon className="h-5 w-5 inline mr-1" />; })()}
                {growthStage.stage}
              </p>
              <p className="text-xs text-amber-600 mt-0.5">Day {activePondData.cycleDay || 0}/{120}</p>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="grid gap-3 md:gap-4 grid-cols-2 lg:grid-cols-4">
          {['Current Stock', 'Target Density', 'Pond Area', 'Growth Stage'].map((label, i) => (
            <Card key={label} className="border-gray-200 opacity-60 animate-fade-up" style={{ animationDelay: `${i * 50}ms` }}>
              <CardContent className="pt-4 pb-4">
                <p className="text-xs text-gray-400 font-medium">{label}</p>
                <p className="text-xl font-bold text-gray-300 mt-2">--</p>
                <p className="text-xs text-gray-400 mt-1">Select a pond</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* === Farm Overview — Pond Cards === */}
      <Card className="border-slate-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shell className="h-5 w-5 text-cyan-500" />
                All Ponds Overview
              </CardTitle>
              <CardDescription className="mt-1">Click a pond to view its analytics. Total: {ponds.length} pond{ponds.length !== 1 ? 's' : ''}</CardDescription>
            </div>
            <Badge className="bg-cyan-100 text-cyan-800 font-semibold">
              {ponds.filter((p: any) => p.status === 'active').length} active
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {ponds.map((pond: any, index: number) => {
            const statusCfg = STATUS_CONFIG[pond.status] || STATUS_CONFIG.active;
            const pondGrowthStage = getGrowthStage(pond.cycleDay || 0);
            const cycleProgress = Math.min(100, ((pond.cycleDay || 0) / 120) * 100);
            const isSelected = selectedPond === pond.id;

            return (
              <div
                key={pond.id}
                onClick={() => {
                  setSelectedPond(pond.id);
                  onPondSelect?.(pond.id);
                }}
                className={`rounded-xl p-4 cursor-pointer transition-all duration-300 hover-lift animate-fade-up ${isSelected
                  ? 'bg-gradient-to-r from-cyan-50 to-sky-50 border-2 border-cyan-300 shadow-md ring-1 ring-cyan-100'
                  : 'bg-white border border-gray-200 hover:border-cyan-200 hover:bg-cyan-50/30'
                  }`}
                style={{ animationDelay: `${index * 60}ms` }}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900 truncate">{pond.name}</h3>
                      <ChevronRight className={`h-4 w-4 text-gray-400 transition-transform ${isSelected ? 'rotate-90 text-cyan-500' : ''}`} />
                    </div>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span className="text-xs text-gray-600">{pond.area} ha</span>
                      <span className="text-gray-300">•</span>
                      <span className="text-xs text-gray-600">{(pond.currentStock || 0).toLocaleString()} seeded</span>
                      <span className="text-gray-300">•</span>
                      <span className={`text-xs font-medium ${pondGrowthStage.color}`}>
                        {(() => { const Icon = GROWTH_ICONS[pondGrowthStage.icon]; return <Icon className="h-3 w-3 inline mr-0.5" />; })()}
                        {pondGrowthStage.stage}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 ml-2">
                    <Badge variant="outline" className={`${statusCfg.text} ${statusCfg.bg} border-current capitalize text-xs`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot} mr-1.5 inline-block`} />
                      {pond.status}
                    </Badge>
                    <Button onClick={(e) => handleEditClick(pond, e)} variant="ghost" size="sm" className="h-7 w-7 p-0 hover:bg-cyan-100">
                      <Edit2 className="h-3.5 w-3.5 text-gray-400" />
                    </Button>
                    <Button
                      onClick={(e) => handleDeleteClick(pond.id, e)}
                      variant={deleteConfirming === pond.id ? 'destructive' : 'ghost'}
                      size="sm"
                      className="h-7 w-7 p-0"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                {deleteConfirming === pond.id && (
                  <div className="mb-3 p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2 animate-scale-in">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    <span>Tap delete again to confirm (3s timeout)</span>
                  </div>
                )}

                {/* Mini Progress + Metrics */}
                <div className="space-y-2">
                  {/* Cycle progress bar */}
                  <div>
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>Cycle Day {pond.cycleDay || 0}</span>
                      <span>{Math.round(cycleProgress)}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400 transition-all duration-700"
                        style={{ width: `${cycleProgress}%` }}
                      />
                    </div>
                  </div>

                  {/* Quick stats grid */}
                  <div className="grid grid-cols-3 gap-3 text-xs">
                    <div className="rounded-lg bg-gray-50 p-2">
                      <span className="text-gray-400 block">Species</span>
                      <p className="font-semibold capitalize text-gray-800">{pond.shrimpType}</p>
                    </div>
                    <div className="rounded-lg bg-gray-50 p-2">
                      <span className="text-gray-400 block">Farming</span>
                      <p className="font-semibold capitalize text-gray-800">{pond.farmingType}</p>
                    </div>
                    <div className="rounded-lg bg-gray-50 p-2">
                      <span className="text-gray-400 block">Remaining</span>
                      <p className="font-semibold text-gray-800">{Math.max(0, 120 - (pond.cycleDay || 0))}d</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Edit Pond Dialog */}
      <EditPondDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        pond={editingPond}
        onSaved={() => {
          setEditingPond(null);
        }}
      />
    </div>
  );
}
