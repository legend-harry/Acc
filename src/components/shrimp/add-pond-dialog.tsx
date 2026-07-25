"use client";

import { useState, useEffect, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, CheckCircle2, AlertCircle, Sparkles, ChevronDown, ChevronUp, Fish, Droplets, Ruler, Waves } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { usePonds } from '@/hooks/use-shrimp';
import { useProjects } from '@/hooks/use-database';
import { createClient } from '@/lib/supabase/client';
import { useClient } from '@/context/client-context';
import { useUser } from '@/context/user-context';

interface AddPondDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (pondId: string) => void;
}

// ── Size Presets ──────────────────────────────────────────────
const SIZE_PRESETS = [
  { id: 'small',  label: 'Small',  emoji: '🟢', dim: { l: 45,  w: 45  }, area: 0.2,  desc: '~0.2 ha (2,000 m²)',  seedHint: '20,000 – 30,000 PL' },
  { id: 'medium', label: 'Medium', emoji: '🔵', dim: { l: 70,  w: 70  }, area: 0.5,  desc: '~0.5 ha (5,000 m²)',  seedHint: '50,000 – 75,000 PL' },
  { id: 'large',  label: 'Large',  emoji: '🟣', dim: { l: 100, w: 100 }, area: 1.0,  desc: '~1.0 ha (10,000 m²)', seedHint: '100,000 – 150,000 PL' },
  { id: 'custom', label: 'Custom', emoji: '⚙️', dim: { l: 0,   w: 0   }, area: 0,    desc: 'Enter your own size',  seedHint: '' },
];

const SHRIMP_TYPES = [
  { id: 'white', label: 'White Leg (Vannamei)', survivalRate: 0.85 },
  { id: 'tiger', label: 'Tiger Shrimp', survivalRate: 0.80 },
  { id: 'giant', label: 'Giant Tiger', survivalRate: 0.75 },
];

const WATER_SOURCES = [
  { id: 'well', label: 'Well Water' },
  { id: 'pond', label: 'Brackish Pond' },
  { id: 'seawater', label: 'Seawater' },
  { id: 'canal', label: 'Canal/Estuary' },
];

const DEFAULT_DEPTH = 1.5;

export function AddPondDialog({ open, onOpenChange, onCreated }: AddPondDialogProps) {
  const { toast } = useToast();
  const { addPond } = usePonds();
  const { projects } = useProjects();
  const { clientId } = useClient();
  const { selectedProfile } = useUser();

  const [step, setStep] = useState(1); // 1: Core Info, 2: Review & Adjust
  const [isSaving, setIsSaving] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [isCreatingProject, setIsCreatingProject] = useState(false);

  // ── Step 1: Only 3 core inputs ──────────────────────────────
  const [pondName, setPondName] = useState('');
  const [sizePreset, setSizePreset] = useState('medium');
  const [customLength, setCustomLength] = useState('');
  const [customWidth, setCustomWidth] = useState('');
  const [seedAmount, setSeedAmount] = useState('');

  // ── Auto-filled values (editable in Step 2) ─────────────────
  const [depth, setDepth] = useState(DEFAULT_DEPTH);
  const [shrimpType, setShrimpType] = useState<'white' | 'tiger' | 'giant'>('white');
  const [waterSource, setWaterSource] = useState('well');
  const [linkedProjectId, setLinkedProjectId] = useState('auto');
  const [stockingDate, setStockingDate] = useState(new Date().toISOString().split('T')[0]);

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // ── Computed values ─────────────────────────────────────────
  const preset = SIZE_PRESETS.find(p => p.id === sizePreset) || SIZE_PRESETS[1];

  const dimensions = useMemo(() => {
    if (sizePreset === 'custom') {
      return { l: Number(customLength) || 0, w: Number(customWidth) || 0 };
    }
    return preset.dim;
  }, [sizePreset, customLength, customWidth, preset]);

  const areaHa = useMemo(() => (dimensions.l * dimensions.w) / 10000, [dimensions]);
  const areaM2 = useMemo(() => dimensions.l * dimensions.w, [dimensions]);
  const volume = useMemo(() => areaM2 * depth, [areaM2, depth]);

  const seedNum = Number(seedAmount) || 0;

  const densityPerM2 = useMemo(() => {
    if (areaM2 <= 0 || seedNum <= 0) return 0;
    return Math.round(seedNum / areaM2);
  }, [areaM2, seedNum]);

  const farmingType = useMemo<'extensive' | 'semi-intensive' | 'intensive'>(() => {
    if (densityPerM2 <= 20) return 'extensive';
    if (densityPerM2 <= 60) return 'semi-intensive';
    return 'intensive';
  }, [densityPerM2]);

  const shrimpConfig = SHRIMP_TYPES.find(s => s.id === shrimpType) || SHRIMP_TYPES[0];
  const expectedCount = useMemo(() => Math.round(seedNum * shrimpConfig.survivalRate), [seedNum, shrimpConfig]);

  // ── Auto-suggest seed amount when size changes ──────────────
  useEffect(() => {
    if (sizePreset !== 'custom' && !seedAmount) {
      // Default to intensive density (~100 PL/m²)
      const suggestedSeeds = Math.round(preset.area * 10000 * 100);
      setSeedAmount(String(suggestedSeeds));
    }
  }, [sizePreset]); // Only on preset change

  // ── Reset form when dialog opens ────────────────────────────
  useEffect(() => {
    if (open) {
      setStep(1);
      setPondName('');
      setSizePreset('medium');
      setCustomLength('');
      setCustomWidth('');
      setSeedAmount('');
      setDepth(DEFAULT_DEPTH);
      setShrimpType('white');
      setWaterSource('well');
      setLinkedProjectId('auto');
      setStockingDate(new Date().toISOString().split('T')[0]);
      setShowAdvanced(false);
      setValidationErrors({});
    }
  }, [open]);

  // ── Validation ──────────────────────────────────────────────
  const validateStep1 = () => {
    const errors: Record<string, string> = {};
    if (!pondName.trim()) errors.pondName = 'Give your pond a name';
    if (sizePreset === 'custom') {
      if (!customLength || Number(customLength) <= 0) errors.length = 'Enter length';
      if (!customWidth || Number(customWidth) <= 0) errors.width = 'Enter width';
    }
    if (!seedAmount || seedNum <= 0) errors.seedAmount = 'Enter seed count';
    if (!stockingDate) errors.stockingDate = 'Select a stocking date';
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ── Create project helper ───────────────────────────────────
  const createProjectWithName = async (name: string) => {
    const supabase = createClient();
    const { data, error } = await supabase.from('projects').insert({
      name,
      client_id: clientId,
      profile_id: selectedProfile
    }).select('id').single();
    if (error) throw error;
    return data?.id || '';
  };

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return;
    setIsCreatingProject(true);
    try {
      const newId = await createProjectWithName(newProjectName);
      toast({ title: "Project Created", description: `${newProjectName} created successfully` });
      setLinkedProjectId(newId);
      setNewProjectName('');
      setShowCreateProject(false);
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Failed to create project" });
    } finally {
      setIsCreatingProject(false);
    }
  };

  // ── Save pond ───────────────────────────────────────────────
  const handleAddPond = async () => {
    setIsSaving(true);
    try {
      // Auto-create project if set to 'auto'
      let projectId = linkedProjectId;
      if (projectId === 'auto' || projectId === 'none') {
        projectId = await createProjectWithName(pondName.trim() || 'New Pond Project');
      }

      const isoDate = new Date(stockingDate).toISOString();

      const newId = await addPond({
        name: pondName,
        area: areaHa,
        length: dimensions.l,
        width: dimensions.w,
        shrimptype: shrimpType,
        farmingtype: farmingType,
        targetDensity: densityPerM2,
        seedAmount: seedNum,
        expectedCount,
        waterSource,
        currentStock: seedNum,
        status: 'preparing',
        currentStage: 'planning',
        stockingdate: isoDate,
        cycleDay: 0,
        linkedprojectid: projectId || null,
      });

      if (newId && onCreated) onCreated(newId);

      toast({
        title: "🎉 Pond Created!",
        description: `${pondName} is ready — ${farmingType} farming, ${seedNum.toLocaleString()} PL stocked`,
      });

      onOpenChange(false);
      window.location.reload();
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Failed to create pond. Please try again." });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center">
                <Fish className="h-4 w-4 text-white" />
              </div>
              {step === 1 ? 'Add New Pond' : 'Review & Create'}
            </DialogTitle>
            <DialogDescription>
              {step === 1
                ? 'Just 3 things — we\'ll figure out the rest'
                : 'Everything looks good? Adjust anything you need, then create.'}
            </DialogDescription>
          </DialogHeader>

          {/* Step indicator */}
          <div className="flex gap-2 mb-2">
            {[1, 2].map(s => (
              <div key={s} className={`flex-1 h-1.5 rounded-full transition-all ${s <= step ? 'bg-blue-600' : 'bg-gray-200'}`} />
            ))}
          </div>

          {/* ═══ STEP 1: Three Core Inputs ═══ */}
          {step === 1 && (
            <div className="space-y-5">
              {/* 1. Pond Name */}
              <div className="space-y-1.5">
                <Label htmlFor="pond-name" className="text-sm font-semibold text-gray-800">
                  ① What do you call this pond?
                </Label>
                <Input
                  id="pond-name"
                  placeholder="e.g., Pond A1, Main Pond, East Side"
                  value={pondName}
                  onChange={(e) => { setPondName(e.target.value); setValidationErrors(v => ({ ...v, pondName: '' })); }}
                  className={`h-11 text-base ${validationErrors.pondName ? 'border-red-500' : ''}`}
                  autoFocus
                />
                {validationErrors.pondName && (
                  <p className="text-xs text-red-600 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{validationErrors.pondName}</p>
                )}
              </div>

              {/* 2. Pond Size */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-800">② How big is your pond?</Label>
                <div className="grid grid-cols-4 gap-2">
                  {SIZE_PRESETS.map(p => (
                    <button
                      key={p.id}
                      onClick={() => { setSizePreset(p.id); setSeedAmount(''); }}
                      className={`p-3 rounded-xl border-2 text-center transition-all ${
                        sizePreset === p.id
                          ? 'border-blue-500 bg-blue-50 shadow-sm'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <span className="text-xl">{p.emoji}</span>
                      <p className="font-semibold text-sm text-gray-900 mt-1">{p.label}</p>
                      {p.id !== 'custom' && (
                        <p className="text-[10px] text-gray-500 mt-0.5">{p.desc}</p>
                      )}
                    </button>
                  ))}
                </div>

                {/* Custom dimensions */}
                {sizePreset === 'custom' && (
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    <div className="space-y-1">
                      <Label className="text-xs text-gray-600">Length (m)</Label>
                      <Input
                        type="number" placeholder="e.g. 80"
                        value={customLength}
                        onChange={(e) => { setCustomLength(e.target.value); setValidationErrors(v => ({ ...v, length: '' })); }}
                        className={validationErrors.length ? 'border-red-500' : ''}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-gray-600">Width (m)</Label>
                      <Input
                        type="number" placeholder="e.g. 60"
                        value={customWidth}
                        onChange={(e) => { setCustomWidth(e.target.value); setValidationErrors(v => ({ ...v, width: '' })); }}
                        className={validationErrors.width ? 'border-red-500' : ''}
                      />
                    </div>
                  </div>
                )}

                {/* Computed area display */}
                {areaM2 > 0 && (
                  <div className="flex items-center gap-2 text-xs text-gray-600 bg-gray-50 rounded-lg px-3 py-2">
                    <Ruler className="h-3.5 w-3.5 text-blue-500" />
                    <span><strong>{dimensions.l}m × {dimensions.w}m</strong> = {areaM2.toLocaleString()} m² ({areaHa.toFixed(2)} ha)</span>
                  </div>
                )}
              </div>

              {/* 3. Seed Amount */}
              <div className="space-y-1.5">
                <Label htmlFor="seed-amount" className="text-sm font-semibold text-gray-800">
                  ③ How many seeds (PL) are you stocking?
                </Label>
                <Input
                  id="seed-amount"
                  type="number"
                  placeholder={preset.seedHint || 'e.g. 50000'}
                  value={seedAmount}
                  onChange={(e) => { setSeedAmount(e.target.value); setValidationErrors(v => ({ ...v, seedAmount: '' })); }}
                  className={`h-11 text-base ${validationErrors.seedAmount ? 'border-red-500' : ''}`}
                />
                {validationErrors.seedAmount && (
                  <p className="text-xs text-red-600 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{validationErrors.seedAmount}</p>
                )}

                {/* Auto-detected farming type */}
                {seedNum > 0 && areaM2 > 0 && (
                  <div className={`rounded-lg px-3 py-2 text-xs font-medium flex items-center gap-2 ${
                    farmingType === 'extensive' ? 'bg-green-50 text-green-800' :
                    farmingType === 'semi-intensive' ? 'bg-blue-50 text-blue-800' :
                    'bg-orange-50 text-orange-800'
                  }`}>
                    <Sparkles className="h-3.5 w-3.5" />
                    Auto-detected: <strong className="capitalize">{farmingType}</strong> farming ({densityPerM2} PL/m²)
                    {' • '} Expected harvest: {expectedCount.toLocaleString()} shrimp
                  </div>
                )}
              </div>

              {/* 4. Stocking Date */}
              <div className="space-y-1.5">
                <Label htmlFor="stocking-date" className="text-sm font-semibold text-gray-800">
                  ④ When was (or will be) this pond stocked?
                </Label>
                <Input
                  id="stocking-date"
                  type="date"
                  value={stockingDate}
                  onChange={(e) => { setStockingDate(e.target.value); setValidationErrors(v => ({ ...v, stockingDate: '' })); }}
                  className={`h-11 text-base ${validationErrors.stockingDate ? 'border-red-500' : ''}`}
                />
                {validationErrors.stockingDate && (
                  <p className="text-xs text-red-600 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{validationErrors.stockingDate}</p>
                )}
                <p className="text-xs text-gray-500">Selecting a past date will automatically calculate your current cycle day.</p>
              </div>
            </div>
          )}

          {/* ═══ STEP 2: Review & Adjust ═══ */}
          {step === 2 && (
            <div className="space-y-4">
              {/* Summary Card */}
              <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-cyan-50">
                <CardContent className="pt-5 pb-5">
                  <div className="flex items-center gap-3 mb-4">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    <h3 className="font-bold text-lg text-gray-900">{pondName}</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="bg-white/80 rounded-lg p-2.5 border border-emerald-100">
                      <p className="text-[10px] text-gray-500 uppercase font-medium">Dimensions</p>
                      <p className="font-bold text-gray-900">{dimensions.l}m × {dimensions.w}m × {depth}m</p>
                      <p className="text-xs text-gray-500">{areaHa.toFixed(2)} ha • {volume.toFixed(0)} m³</p>
                    </div>
                    <div className="bg-white/80 rounded-lg p-2.5 border border-emerald-100">
                      <p className="text-[10px] text-gray-500 uppercase font-medium">Stocking</p>
                      <p className="font-bold text-gray-900">{seedNum.toLocaleString()} PL</p>
                      <p className="text-xs text-gray-500">{densityPerM2} PL/m² • {shrimpConfig.label.split('(')[0].trim()}</p>
                    </div>
                    <div className="bg-white/80 rounded-lg p-2.5 border border-emerald-100">
                      <p className="text-[10px] text-gray-500 uppercase font-medium">Farming Type</p>
                      <p className="font-bold text-gray-900 capitalize">{farmingType}</p>
                      <p className="text-xs text-gray-500">Survival: {Math.round(shrimpConfig.survivalRate * 100)}%</p>
                    </div>
                    <div className="bg-white/80 rounded-lg p-2.5 border border-emerald-100">
                      <p className="text-[10px] text-gray-500 uppercase font-medium">Expected Harvest</p>
                      <p className="font-bold text-gray-900">{expectedCount.toLocaleString()}</p>
                      <p className="text-xs text-gray-500">Water: {WATER_SOURCES.find(w => w.id === waterSource)?.label}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Project Link Info */}
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 text-sm">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-indigo-600" />
                  <span className="text-indigo-800">
                    {linkedProjectId === 'auto'
                      ? `A project "${pondName}" will be auto-created for expense tracking`
                      : `Linked to: ${projects.find(p => p.id === linkedProjectId)?.name || 'Unknown project'}`}
                  </span>
                </div>
              </div>

              {/* ── Advanced Settings (collapsed) ── */}
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="w-full flex items-center justify-between px-4 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all"
              >
                <span>⚙️ Advanced Settings</span>
                {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>

              {showAdvanced && (
                <div className="space-y-4 animate-in slide-in-from-top-2 duration-200">
                  {/* Depth */}
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-600">Pond Depth (m)</Label>
                    <Input
                      type="number" step="0.1" value={depth}
                      onChange={(e) => setDepth(Number(e.target.value) || DEFAULT_DEPTH)}
                    />
                  </div>

                  {/* Shrimp Type */}
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-600">Shrimp Species</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {SHRIMP_TYPES.map(t => (
                        <button
                          key={t.id}
                          onClick={() => setShrimpType(t.id as any)}
                          className={`p-2 rounded-lg border-2 text-center text-xs transition-all ${
                            shrimpType === t.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <p className="font-semibold text-gray-900">{t.label.split('(')[0].trim()}</p>
                          <p className="text-gray-500">{Math.round(t.survivalRate * 100)}% survival</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Water Source */}
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-600">Water Source</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {WATER_SOURCES.map(src => (
                        <button
                          key={src.id}
                          onClick={() => setWaterSource(src.id)}
                          className={`p-2 rounded-lg border-2 text-center text-sm transition-all ${
                            waterSource === src.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <p className="font-semibold text-gray-900">{src.label}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Project Linking */}
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-600">Link to Financial Project</Label>
                    <Select
                      value={linkedProjectId}
                      onValueChange={(value) => {
                        if (value === '__create_new__') {
                          setShowCreateProject(true);
                        } else {
                          setLinkedProjectId(value);
                        }
                      }}
                    >
                      <SelectTrigger className="bg-white border-indigo-200">
                        <SelectValue placeholder="Select a project" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="auto">🤖 Auto-create project with pond name</SelectItem>
                        <SelectItem value="none">No project (standalone pond)</SelectItem>
                        <SelectItem value="__create_new__" className="text-indigo-600 font-semibold">
                          ➕ Create a custom project...
                        </SelectItem>
                        {projects.filter(p => !p.archived).map(project => (
                          <SelectItem key={project.id} value={project.id}>
                            {project.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Navigation ── */}
          <div className="flex gap-2 pt-3 border-t">
            {step > 1 && (
              <Button variant="outline" onClick={() => setStep(1)} disabled={isSaving}>
                Back
              </Button>
            )}
            <div className="flex-1" />
            {step === 1 ? (
              <Button
                onClick={() => { if (validateStep1()) setStep(2); }}
                className="gap-2 bg-blue-600 hover:bg-blue-700"
              >
                Review
                <CheckCircle2 className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={handleAddPond}
                disabled={isSaving}
                className="gap-2 bg-emerald-600 hover:bg-emerald-700 min-w-[140px]"
              >
                {isSaving ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</>
                ) : (
                  <><Plus className="h-4 w-4" /> Create Pond</>
                )}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Create New Project Dialog */}
      <Dialog open={showCreateProject} onOpenChange={setShowCreateProject}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
            <DialogDescription>
              Create a project to track pond expenses and analyze ROI
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="project-name">Project Name</Label>
              <Input
                id="project-name"
                placeholder="e.g., Shrimp Farm Expansion 2026"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleCreateProject(); }}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => { setShowCreateProject(false); setNewProjectName(''); }} disabled={isCreatingProject}>
                Cancel
              </Button>
              <Button onClick={handleCreateProject} disabled={isCreatingProject} className="gap-2">
                {isCreatingProject ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</>
                ) : (
                  <><Plus className="w-4 h-4" /> Create Project</>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
