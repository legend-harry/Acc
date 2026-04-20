"use client";

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Wand2, Loader2, Plus, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import { Progress } from "@/components/ui/progress";
import { useToast } from '@/hooks/use-toast';
import { usePonds } from '@/hooks/use-shrimp';
import { useProjects } from '@/hooks/use-database';
import { ref, push } from 'firebase/database';
import { db } from '@/lib/firebase';

interface AddPondDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (pondId: string) => void;
}

export function AddPondDialog({ open, onOpenChange, onCreated }: AddPondDialogProps) {
  const { toast } = useToast();
  const { addPond } = usePonds();
  const { projects } = useProjects();
  const [step, setStep] = useState(1); // 1: Basic Info, 2: Progress Assessment, 3: Design, 4: Review
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [recommendations, setRecommendations] = useState<any>(null);
  const [progressAnalysis, setProgressAnalysis] = useState<any>(null);
  const [upcomingSteps, setUpcomingSteps] = useState<any[]>([]);
  const [showMetrics, setShowMetrics] = useState(true);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [isCreatingProject, setIsCreatingProject] = useState(false);

  const [formData, setFormData] = useState({
    pondName: '',
    area: '' as any,
    length: '' as any,
    width: '' as any,
    depth: '' as any,
    species: 'vannamei',
    shrimpType: 'white' as 'white' | 'tiger' | 'giant',
    farmingType: 'intensive' as 'extensive' | 'semi-intensive' | 'intensive',
    targetDensity: '' as any,
    seedAmount: '' as any,
    expectedCount: '' as any,
    waterSource: 'well',
    linkedProjectId: 'none',
    // Progress Assessment fields
    currentStage: 'planning' as 'planning' | 'preparation' | 'stocking' | 'operation' | 'harvest',
    daysInCycle: '' as any,
    currentStockHealth: null as 'excellent' | 'good' | 'fair' | 'poor' | null,
    waterQuality: null as 'excellent' | 'good' | 'fair' | 'poor' | null,
    feedingStatus: 'optimal' as 'optimal' | 'normal' | 'reduced' | 'ceased',
    observations: '',
  });
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const productionModels = [
    { id: 'extensive', label: 'Extensive', density: '10-15/m²', description: 'Low input, natural systems' },
    { id: 'semi-intensive', label: 'Semi-Intensive', density: '30-50/m²', description: 'Moderate input and density' },
    { id: 'intensive', label: 'Intensive', density: '80-150/m²', description: 'High input, high output' },
  ];

  const shrimpTypes = [
    { id: 'white', label: 'White Leg (Vannamei)', yield: 'High', market: 'Global' },
    { id: 'tiger', label: 'Tiger Shrimp', yield: 'Medium', market: 'Premium' },
    { id: 'giant', label: 'Giant Tiger', yield: 'Low', market: 'Premium' },
  ];

  const waterSources = [
    { id: 'well', label: 'Well Water', quality: 'Good' },
    { id: 'pond', label: 'Brackish Pond', quality: 'Variable' },
    { id: 'seawater', label: 'Seawater', quality: 'Excellent' },
    { id: 'canal', label: 'Canal/Estuary', quality: 'Mixed' },
  ];

  const handleOptimizeDesign = async () => {
    setIsOptimizing(true);
    try {
      const response = await fetch('/api/ai/optimize-pond-design', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pondName: formData.pondName,
          area: formData.area,
          productionModel: formData.farmingType,
          species: formData.species,
          waterSource: formData.waterSource,
        }),
      });

      const data = await response.json();

      if (data.recommendations) {
        setRecommendations(data.recommendations);
        toast({
          title: "Design Optimized",
          description: "AI recommendations generated based on your parameters",
        });
      }
    } catch (error) {
      console.error('Design optimization error:', error);
      toast({
        variant: "destructive",
        title: "Optimization Failed",
        description: "Could not generate recommendations",
      });
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleAnalyzeProgress = async () => {
    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/ai/analyze-farm-progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pondName: formData.pondName,
          currentStage: formData.currentStage,
          daysInCycle: formData.daysInCycle,
          stockHealth: formData.currentStockHealth,
          waterQuality: formData.waterQuality,
          feedingStatus: formData.feedingStatus,
          farmingType: formData.farmingType,
          observations: formData.observations,
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();

      if (data.analysis) {
        setProgressAnalysis(data.analysis);
        setUpcomingSteps(data.upcomingSteps || []);
        toast({
          title: "Progress Analyzed",
          description: "AI has prepared recommended steps for your farm",
        });
      } else if (data.status === 'mock' || data.mockData) {
        // Handle mock response during development
        setProgressAnalysis(data.analysis || { status: 'Continuing with current operations' });
        setUpcomingSteps(data.upcomingSteps || ['Monitor daily', 'Check water quality', 'Continue feeding schedule']);
        toast({
          title: "Progress Analyzed (Demo Mode)",
          description: "Using sample recommendations",
        });
      }
    } catch (error) {
      console.error('Progress analysis error:', error);
      // Provide a workaround with mock data
      const mockAnalysis = {
        status: `Currently in ${formData.currentStage} phase - ${formData.daysInCycle} days elapsed`,
      };
      const mockSteps = [
        `Continue monitoring ${formData.currentStage} phase progress`,
        `Maintain ${formData.waterQuality} water quality`,
        `Keep feeding schedule at ${formData.feedingStatus} level`,
      ];
      setProgressAnalysis(mockAnalysis);
      setUpcomingSteps(mockSteps);
      toast({
        title: "Using Demo Analysis",
        description: "AI service unavailable - showing template recommendations",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Auto-detect farming type based on density calculation
  useEffect(() => {
    const area = calculateArea();
    const seedAmount = Number(formData.seedAmount) || 0;
    if (area > 0 && seedAmount > 0) {
      const densityPerM2 = seedAmount / (area * 10000);
      
      let detectedType: 'extensive' | 'semi-intensive' | 'intensive';
      if (densityPerM2 <= 20) {
        detectedType = 'extensive';
      } else if (densityPerM2 <= 60) {
        detectedType = 'semi-intensive';
      } else {
        detectedType = 'intensive';
      }
      
      if (detectedType !== formData.farmingType) {
        setFormData(prev => ({ ...prev, farmingType: detectedType, targetDensity: Math.round(densityPerM2) }));
      }
    }
  }, [formData.length, formData.width, formData.seedAmount, formData.farmingType]);

  const calculateExpectedCount = () => {
    // Expected harvest will be calculated from actual survival data during the cycle
    // Don't assume survival rates upfront
    return 0;
  };

  const calculateArea = () => {
    // Calculate area from dimensions (length × width in meters → hectares)
    const length = Number(formData.length) || 0;
    const width = Number(formData.width) || 0;
    return (length * width) / 10000;
  };

  const createProjectWithName = async (name: string) => {
    const projectsRef = ref(db, 'projects');
    const newProjectRef = await push(projectsRef, {
      name,
      archived: false,
    });
    return newProjectRef.key || '';
  };

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please enter a project name",
      });
      return;
    }

    setIsCreatingProject(true);
    try {
      const newId = await createProjectWithName(newProjectName);
      
      toast({
        title: "Project Created",
        description: `${newProjectName} has been created successfully`,
      });

      setFormData({ ...formData, linkedProjectId: newId });
      setNewProjectName('');
      setShowCreateProject(false);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create project. Please try again.",
      });
    } finally {
      setIsCreatingProject(false);
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!formData.pondName.trim()) {
      errors.pondName = "Pond name is required";
    }
    if (!formData.length || Number(formData.length) <= 0) {
      errors.length = "Length is required and must be greater than 0";
    }
    if (!formData.width || Number(formData.width) <= 0) {
      errors.width = "Width is required and must be greater than 0";
    }
    if (!formData.depth || Number(formData.depth) <= 0) {
      errors.depth = "Depth is required and must be greater than 0";
    }
    if (!formData.seedAmount || Number(formData.seedAmount) <= 0) {
      errors.seedAmount = "Seed amount is required and must be greater than 0";
    }
    
    return errors;
  };

  const handleAddPond = async () => {
    const errors = validateForm();
    
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      const errorMessages = Object.values(errors).join(', ');
      toast({
        variant: "destructive",
        title: "Missing Required Information",
        description: errorMessages,
      });
      return;
    }

    setValidationErrors({});
    setIsSaving(true);
    try {
      // Ensure a project is linked: if user left as standalone, auto-create a project with pond name
      let projectId = formData.linkedProjectId;
      if (projectId === 'none') {
        projectId = await createProjectWithName(formData.pondName.trim() || 'New Pond Project');
      }

      const area = calculateArea();
      const expected = calculateExpectedCount();

      // Compute stockingDate by back-calculating from daysInCycle so cycleDay stays current
      const stockingDate = new Date();
      stockingDate.setDate(stockingDate.getDate() - (Number(formData.daysInCycle) || 0));

      const newId = await addPond({
        name: formData.pondName,
        area,
        length: Number(formData.length) || 0,
        width: Number(formData.width) || 0,
        depth: Number(formData.depth) || 0,
        shrimpType: formData.shrimpType,
        farmingType: formData.farmingType,
        targetDensity: Number(formData.targetDensity) || 0,
        seedAmount: Number(formData.seedAmount) || 0,
        expectedCount: expected,
        waterSource: formData.waterSource,
        currentStock: Number(formData.seedAmount) || 0,
        status: 'preparing',
        currentStage: formData.currentStage,
        stockingDate: stockingDate.toISOString(),
        cycleDay: Number(formData.daysInCycle) || 0,
        linkedProjectId: projectId || null,
      });

      // Notify parent so it can select the new pond immediately
      if (newId && onCreated) {
        onCreated(newId);
      }

      toast({
        title: "Pond Created",
        description: `${formData.pondName} has been added to your farm`,
      });

      // Reset form
      setStep(1);
      setFormData({
        pondName: '',
        area: 1,
        length: 50,
        width: 40,
        depth: 1.5,
        species: 'vannamei',
        shrimpType: 'white',
        farmingType: 'intensive',
        targetDensity: 80,
        seedAmount: 50000,
        expectedCount: 42500,
        waterSource: 'well',
        linkedProjectId: 'none',
        currentStage: 'planning',
        daysInCycle: 0,
        currentStockHealth: 'good',
        waterQuality: 'good',
        feedingStatus: 'optimal',
        observations: '',
      });
      setRecommendations(null);
      setProgressAnalysis(null);
      setUpcomingSteps([]);
      onOpenChange(false);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create pond. Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Pond</DialogTitle>
          <DialogDescription>
            Step {step} of 4 - 
            {step === 1 && ' Enter pond details'}
            {step === 2 && ' Assess farm progress'}
            {step === 3 && ' Configure design'}
            {step === 4 && ' Review and create'}
          </DialogDescription>
        </DialogHeader>

        {/* Step Indicator */}
        <div className="flex gap-2 mb-6">
          {[1, 2, 3, 4].map(s => (
            <div
              key={s}
              className={`flex-1 h-2 rounded-full ${
                s <= step ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            />
          ))}
        </div>

        {/* Step 1: Basic Information */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pond-name" className="text-gray-900 font-medium">Pond Name</Label>
              <Input
                id="pond-name"
                placeholder="e.g., Pond A1, Main Pond"
                value={formData.pondName}
                onChange={(e) => {
                  setFormData({ ...formData, pondName: e.target.value });
                  setValidationErrors({ ...validationErrors, pondName: '' });
                }}
                className={`text-gray-900 ${validationErrors.pondName ? 'border-red-500' : ''}`}
              />
              {validationErrors.pondName && (
                <p className="text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {validationErrors.pondName}
                </p>
              )}
            </div>

            {/* Pond Dimensions */}
            <Card className="border-purple-200 bg-purple-50">
              <CardHeader>
                <CardTitle className="text-base text-gray-900">Pond Dimensions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="length" className="text-gray-900 font-medium">Length (m)</Label>
                    <Input
                      id="length"
                      type="number"
                      placeholder="50"
                      value={formData.length}
                      onChange={(e) => {
                        setFormData({ ...formData, length: e.target.value });
                        setValidationErrors({ ...validationErrors, length: '' });
                      }}
                      className={`text-gray-900 ${validationErrors.length ? 'border-red-500' : ''}`}
                    />
                    {validationErrors.length && (
                      <p className="text-xs text-red-600 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {validationErrors.length}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="width" className="text-gray-900 font-medium">Width (m)</Label>
                    <Input
                      id="width"
                      type="number"
                      placeholder="40"
                      value={formData.width}
                      onChange={(e) => {
                        setFormData({ ...formData, width: e.target.value });
                        setValidationErrors({ ...validationErrors, width: '' });
                      }}
                      className={`text-gray-900 ${validationErrors.width ? 'border-red-500' : ''}`}
                    />
                    {validationErrors.width && (
                      <p className="text-xs text-red-600 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {validationErrors.width}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="depth" className="text-gray-900 font-medium">Depth (m)</Label>
                    <Input
                      id="depth"
                      type="number"
                      step="0.1"
                      placeholder="1.5"
                      value={formData.depth}
                      onChange={(e) => {
                        setFormData({ ...formData, depth: e.target.value });
                        setValidationErrors({ ...validationErrors, depth: '' });
                      }}
                      className={`text-gray-900 ${validationErrors.depth ? 'border-red-500' : ''}`}
                    />
                    {validationErrors.depth && (
                      <p className="text-xs text-red-600 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {validationErrors.depth}
                      </p>
                    )}
                  </div>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded p-3">
                  <p className="text-sm font-semibold text-gray-900">
                    Calculated Area: {(calculateArea() * 2.471).toFixed(2)} acres ({(calculateArea() * 10000).toFixed(0)} m²)
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    Volume: {((Number(formData.length) || 0) * (Number(formData.width) || 0) * (Number(formData.depth) || 0)).toFixed(0)} m³
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Seed Amount and Expected Count */}
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="text-base text-gray-900">Stocking Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="seed-amount" className="text-gray-900 font-medium">Seed Amount (PL)</Label>
                    <Input
                      id="seed-amount"
                      type="number"
                      placeholder="50000"
                      value={formData.seedAmount}
                      onChange={(e) => {
                        const seedAmount = e.target.value;
                        // Don't pre-calculate expectedCount - it will be based on actual survival data
                        setFormData({ 
                          ...formData, 
                          seedAmount,
                          expectedCount: 0
                        });
                        setValidationErrors({ ...validationErrors, seedAmount: '' });
                      }}
                      className={`text-gray-900 ${validationErrors.seedAmount ? 'border-red-500' : ''}`}
                    />
                    {validationErrors.seedAmount && (
                      <p className="text-xs text-red-600 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {validationErrors.seedAmount}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="expected-count" className="text-gray-900 font-medium">Expected Harvest</Label>
                    <Input
                      id="expected-count"
                      type="number"
                      value={formData.expectedCount}
                      onChange={(e) => setFormData({ ...formData, expectedCount: e.target.value })}
                      className="text-gray-900 bg-gray-50"
                      readOnly
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="bg-yellow-50 border border-yellow-200 rounded p-2">
                    <p className="text-xs text-gray-700">
                      💡 Based on {formData.farmingType} farming, expected survival rate: {
                        formData.farmingType === 'extensive' ? '70%' :
                        formData.farmingType === 'semi-intensive' ? '80%' : '85%'
                      }
                    </p>
                  </div>
                  {calculateArea() > 0 && Number(formData.seedAmount) > 0 && formData.targetDensity && (
                    <div className={`rounded p-2 text-xs font-medium ${
                      formData.farmingType === 'extensive' ? 'bg-green-100 text-green-900' :
                      formData.farmingType === 'semi-intensive' ? 'bg-blue-100 text-blue-900' :
                      'bg-orange-100 text-orange-900'
                    }`}>
                      🤖 Auto-detected: <span className="font-bold capitalize">{formData.farmingType}</span> farming
                      ({formData.targetDensity} PL/m²)
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Shrimp Type Selection */}
            <div className="space-y-2">
              <Label className="text-gray-900 font-medium">Shrimp Type</Label>
              <div className="grid gap-2">
                {shrimpTypes.map(type => (
                  <button
                    key={type.id}
                    onClick={() => setFormData({ ...formData, shrimpType: type.id as 'white' | 'tiger' | 'giant' })}
                    className={`p-3 rounded border-2 text-left transition-all ${
                      formData.shrimpType === type.id
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-300 bg-white hover:border-gray-400'
                    }`}
                  >
                    <p className="font-semibold text-gray-900">{type.label}</p>
                    <div className="flex justify-between text-xs text-gray-600 mt-1">
                      <span>Yield: {type.yield}</span>
                      <span>{type.market} Market</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Farming Type Selection */}
            <div className="space-y-2">
              <Label className="text-gray-900 font-medium">Farming Type</Label>
              <div className="grid grid-cols-3 gap-2">
                {productionModels.map(model => (
                  <button
                    key={model.id}
                    onClick={() => setFormData({ ...formData, farmingType: model.id as 'extensive' | 'semi-intensive' | 'intensive' })}
                    className={`p-3 rounded border-2 text-center transition-all text-sm ${
                      formData.farmingType === model.id
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-300 bg-white'
                    }`}
                  >
                    <p className="font-semibold text-gray-900">{model.label}</p>
                    <p className="text-xs text-gray-600">{model.density}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Progress Assessment */}
        {step === 2 && (
          <div className="space-y-4">
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="text-base text-gray-900 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-blue-600" />
                  AI Farm Progress Assessment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label className="text-gray-900 font-medium">Current Project Phase</Label>
                    <Select value={formData.currentStage} onValueChange={(value) => setFormData({ ...formData, currentStage: value as any })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="planning">Phase 1: Planning & Design - Site assessment, budget prep, pond design</SelectItem>
                        <SelectItem value="preparation">Phase 2: Pond Preparation - Excavation, water system, equipment setup</SelectItem>
                        <SelectItem value="stocking">Phase 3: Stocking & Acclimation - Water prep, PL acclimation, seed release</SelectItem>
                        <SelectItem value="operation">Phase 4: Operation & Maintenance - Daily farming, monitoring, feeding (10-16 weeks)</SelectItem>
                        <SelectItem value="harvest">Phase 5: Harvest & Processing - Harvest, grading, quality checks</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-600 mt-1">
                      {formData.currentStage === 'planning' && '💡 Planning Phase: Assess site, calculate costs, design pond layout'}
                      {formData.currentStage === 'preparation' && '💡 Preparation Phase: Building infrastructure and installing equipment'}
                      {formData.currentStage === 'stocking' && '💡 Stocking Phase: Acclimating PL and releasing into pond'}
                      {formData.currentStage === 'operation' && '💡 Operation Phase: Active farming with daily monitoring and feeding'}
                      {formData.currentStage === 'harvest' && '💡 Harvest Phase: Preparing for harvest and post-cycle analysis'}
                    </p>
                  </div>

                  {formData.currentStage !== 'planning' && (
                    <>
                      <div className="space-y-2">
                        <Label className="text-gray-900 font-medium">Days in Current Cycle</Label>
                        <Input
                          type="number"
                          min="0"
                          max="150"
                          value={formData.daysInCycle || ''}
                          onChange={(e) => {
                            const val = e.target.value === '' ? 0 : parseInt(e.target.value, 10);
                            setFormData({ ...formData, daysInCycle: isNaN(val) ? 0 : val });
                          }}
                          onBlur={(e) => {
                            const val = e.target.value === '' ? 0 : parseInt(e.target.value, 10);
                            if (isNaN(val) || val < 0) setFormData({ ...formData, daysInCycle: 0 });
                            if (val > 150) setFormData({ ...formData, daysInCycle: 150 });
                          }}
                          className="text-gray-900"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-gray-900 font-medium">Stock Health Status</Label>
                        <Select value={formData.currentStockHealth || undefined} onValueChange={(value) => setFormData({ ...formData, currentStockHealth: value as any })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select health status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="excellent">Excellent</SelectItem>
                            <SelectItem value="good">Good</SelectItem>
                            <SelectItem value="fair">Fair</SelectItem>
                            <SelectItem value="poor">Poor</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-gray-900 font-medium">Water Quality</Label>
                        <Select value={formData.waterQuality || undefined} onValueChange={(value) => setFormData({ ...formData, waterQuality: value as any })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select water quality" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="excellent">Excellent</SelectItem>
                            <SelectItem value="good">Good</SelectItem>
                            <SelectItem value="fair">Fair</SelectItem>
                            <SelectItem value="poor">Poor</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-gray-900 font-medium">Feeding Status</Label>
                        <Select value={formData.feedingStatus} onValueChange={(value) => setFormData({ ...formData, feedingStatus: value as any })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="optimal">Optimal</SelectItem>
                            <SelectItem value="normal">Normal</SelectItem>
                            <SelectItem value="reduced">Reduced</SelectItem>
                            <SelectItem value="ceased">Ceased</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-gray-900 font-medium">Additional Observations (Optional)</Label>
                        <Textarea
                          placeholder="E.g., unusual behavior, disease signs, environmental changes..."
                          value={formData.observations}
                          onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
                          className="min-h-20 text-gray-900"
                        />
                      </div>
                    </>
                  )}
                </div>

                <Button
                  onClick={handleAnalyzeProgress}
                  disabled={isAnalyzing}
                  className="w-full gap-2 bg-blue-600 hover:bg-blue-700"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Generate Progress Analysis & Next Steps
                    </>
                  )}
                </Button>

                {progressAnalysis && (
                  <Card className="border-green-200 bg-green-50 mt-4">
                    <CardHeader>
                      <CardTitle className="text-sm text-green-900 flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        Progress Analysis & Next Steps
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                      <div className="bg-white rounded p-3 border border-green-200">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="text-xs text-gray-600 uppercase">Current Phase</p>
                            <p className="font-bold text-gray-900">
                              {formData.currentStage === 'planning' && 'Phase 1: Planning & Design'}
                              {formData.currentStage === 'preparation' && 'Phase 2: Pond Preparation'}
                              {formData.currentStage === 'stocking' && 'Phase 3: Stocking & Acclimation'}
                              {formData.currentStage === 'operation' && 'Phase 4: Operation & Maintenance'}
                              {formData.currentStage === 'harvest' && 'Phase 5: Harvest & Processing'}
                            </p>
                          </div>
                          {formData.daysInCycle > 0 && (
                            <div className="text-right">
                              <p className="text-xs text-gray-600 uppercase">Progress</p>
                              <p className="font-bold text-blue-600">{formData.daysInCycle} days</p>
                            </div>
                          )}
                        </div>
                        <Progress value={(formData.daysInCycle / 150) * 100} className="h-2" />
                      </div>

                      <div>
                        <p className="font-semibold text-gray-900 mb-1">Current Status:</p>
                        <p className="text-gray-700 bg-white p-2 rounded">{progressAnalysis.status}</p>
                      </div>

                      <div>
                        <p className="font-semibold text-gray-900 mb-2">📍 Upcoming Steps:</p>
                        <ul className="space-y-2">
                          {upcomingSteps.map((step: any, idx: number) => (
                            <li key={idx} className="flex gap-2 text-gray-700 bg-white p-2 rounded">
                              <span className="font-bold text-green-600 min-w-6">{idx + 1}.</span>
                              <span>{step}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <p className="font-semibold text-gray-900 mb-1">💡 Recommendation:</p>
                        <p className="text-gray-700 bg-white p-2 rounded italic">{progressAnalysis.recommendation}</p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 3: Design & Resources */}
        {step === 3 && (
          <div className="space-y-4">
            {/* Stocking Density with Recommended Bar */}
            <Card className="border-purple-200 bg-purple-50">
              <CardHeader>
                <CardTitle className="text-base text-gray-900">Stocking Density</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label className="text-gray-900 font-medium">Target Density (PL/m²)</Label>
                    <Badge variant="outline" className="text-lg">{formData.targetDensity}</Badge>
                  </div>
                  <Slider
                    value={[formData.targetDensity]}
                    onValueChange={(v) => setFormData({ ...formData, targetDensity: v[0] })}
                    min={10}
                    max={150}
                    step={5}
                    className="py-2"
                  />
                </div>

                {/* Recommended Bars by Farming Type */}
                <div className="space-y-3 pt-2">
                  <p className="text-xs font-semibold text-gray-600 uppercase">Recommended Range by Type:</p>
                  
                  {/* Extensive */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-medium text-gray-700">Extensive</span>
                      <span className="text-xs text-gray-600">10-15/m²</span>
                    </div>
                    <div className="h-6 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 opacity-40"
                        style={{ width: `${(13 / 150) * 100}%` }}
                      />
                      {formData.targetDensity >= 10 && formData.targetDensity <= 15 && (
                        <div
                          className="h-full bg-green-600 w-1 rounded-full"
                          style={{ marginLeft: `${(formData.targetDensity / 150) * 100}%` }}
                        />
                      )}
                    </div>
                  </div>

                  {/* Semi-Intensive */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-medium text-gray-700">Semi-Intensive</span>
                      <span className="text-xs text-gray-600">30-50/m²</span>
                    </div>
                    <div className="h-6 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 opacity-40"
                        style={{ width: `${(40 / 150) * 100}%`, marginLeft: `${(30 / 150) * 100}%` }}
                      />
                      {formData.targetDensity >= 30 && formData.targetDensity <= 50 && (
                        <div
                          className="h-full bg-blue-600 w-1"
                          style={{ marginLeft: `${(formData.targetDensity / 150) * 100}%` }}
                        />
                      )}
                    </div>
                  </div>

                  {/* Intensive */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-medium text-gray-700">Intensive</span>
                      <span className="text-xs text-gray-600">80-150/m²</span>
                    </div>
                    <div className="h-6 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-orange-500 opacity-40"
                        style={{ width: `${(70 / 150) * 100}%`, marginLeft: `${(80 / 150) * 100}%` }}
                      />
                      {formData.targetDensity >= 80 && formData.targetDensity <= 150 && (
                        <div
                          className="h-full bg-orange-600 w-1"
                          style={{ marginLeft: `${(formData.targetDensity / 150) * 100}%` }}
                        />
                      )}
                    </div>
                  </div>
                </div>

                {/* Density Status */}
                <div className={`p-3 rounded text-sm font-medium ${
                  formData.targetDensity <= 15 ? 'bg-green-100 text-green-900' :
                  formData.targetDensity <= 50 ? 'bg-blue-100 text-blue-900' :
                  'bg-orange-100 text-orange-900'
                }`}>
                  {formData.targetDensity <= 15 ? '✓ Extensive farming - Low input, natural' :
                   formData.targetDensity <= 50 ? '⚡ Semi-intensive - Balanced approach' :
                   '🚀 Intensive farming - High output, needs management'}
                </div>
              </CardContent>
            </Card>

            <div className="space-y-2">
              <Label className="text-gray-900 font-medium">Production Model</Label>
              <div className="grid gap-2">
                {productionModels.map(model => (
                  <button
                    key={model.id}
                    onClick={() => setFormData({ ...formData, farmingType: model.id as 'extensive' | 'semi-intensive' | 'intensive' })}
                    className={`p-3 rounded border-2 text-left transition-all ${
                      formData.farmingType === model.id
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-300 hover:border-gray-400 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-gray-900">{model.label}</p>
                        <p className="text-xs text-gray-600">{model.description}</p>
                        <p className="text-xs text-blue-600 font-semibold mt-1">{model.density}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-900 font-medium">Water Source</Label>
              <div className="grid grid-cols-2 gap-2">
                {waterSources.map(source => (
                  <button
                    key={source.id}
                    onClick={() => setFormData({ ...formData, waterSource: source.id })}
                    className={`p-3 rounded border-2 text-center transition-all ${
                      formData.waterSource === source.id
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-300 bg-white'
                    }`}
                  >
                    <p className="font-semibold text-gray-900 text-sm">{source.label}</p>
                    <p className="text-xs text-gray-600">{source.quality}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Project Linking */}
            <Card className="border-indigo-200 bg-indigo-50">
              <CardHeader>
                <CardTitle className="text-base text-gray-900">Link to Project (Optional)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2">
                  <Select
                    value={formData.linkedProjectId}
                    onValueChange={(value) => {
                      if (value === '__create_new__') {
                        setShowCreateProject(true);
                      } else {
                        setFormData({ ...formData, linkedProjectId: value });
                      }
                    }}
                  >
                    <SelectTrigger className="bg-white flex-1">
                      <SelectValue placeholder="Select a project to link transactions" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Project (Standalone)</SelectItem>
                      <SelectItem value="__create_new__" className="text-blue-600 font-semibold">
                        ➕ Create New Project
                      </SelectItem>
                      {projects.filter(p => !p.archived).map(project => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <p className="text-xs text-gray-600">
                  💡 Link this pond to a project to track all expenses and analyze ROI
                </p>
              </CardContent>
            </Card>

            <div className="space-y-2">
              <Label className="text-gray-900 font-medium">Target Stocking Density</Label>
              <div className="flex gap-2 items-center">
                <Slider
                  value={[formData.targetDensity]}
                  onValueChange={(v) => setFormData({ ...formData, targetDensity: v[0] })}
                  min={10}
                  max={200}
                  step={10}
                  className="flex-1"
                />
                <span className="font-semibold text-gray-900 min-w-16">{formData.targetDensity} PL/m²</span>
              </div>
            </div>

            {/* AI Design Optimization */}
            <Button
              onClick={handleOptimizeDesign}
              disabled={isOptimizing}
              className="w-full gap-2 bg-purple-600 hover:bg-purple-700"
            >
              {isOptimizing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating Recommendations...
                </>
              ) : (
                <>
                  <Wand2 className="h-4 w-4" />
                  Get AI Design Recommendations
                </>
              )}
            </Button>

            {/* AI Recommendations */}
            {recommendations && (
              <Card className="border-purple-200 bg-purple-50">
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Wand2 className="h-4 w-4 text-purple-600" />
                    AI Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {recommendations.equipment && (
                    <div>
                      <p className="font-semibold">Recommended Equipment:</p>
                      <ul className="list-disc list-inside text-muted-foreground">
                        {recommendations.equipment.map((item: string, i: number) => (
                          <li key={i}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {recommendations.considerations && (
                    <div>
                      <p className="font-semibold">Important Considerations:</p>
                      <ul className="list-disc list-inside text-muted-foreground">
                        {recommendations.considerations.map((item: string, i: number) => (
                          <li key={i}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Step 4: Review & Confirm */}
        {step === 4 && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base text-gray-900">Pond Configuration Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Pond Name</p>
                    <p className="font-semibold text-lg text-gray-900">{formData.pondName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Dimensions</p>
                    <p className="font-semibold text-lg text-gray-900">
                      {formData.length}m × {formData.width}m × {formData.depth}m
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Area</p>
                    <p className="font-semibold text-lg text-gray-900">{calculateArea().toFixed(2)} ha</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Volume</p>
                    <p className="font-semibold text-lg text-gray-900">
                      {(formData.length * formData.width * formData.depth).toFixed(0)} m³
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Shrimp Type</p>
                    <p className="font-semibold text-lg text-gray-900 capitalize">{formData.shrimpType}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Farming Type</p>
                    <p className="font-semibold text-lg text-gray-900 capitalize">{formData.farmingType}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Seed Amount</p>
                    <p className="font-semibold text-lg text-gray-900">{(Number(formData.seedAmount) || 0).toLocaleString()} PL</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Expected Harvest</p>
                    <p className="font-semibold text-lg text-gray-900">{(Number(formData.expectedCount) || 0).toLocaleString()} shrimp</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Stocking Density</p>
                    <p className="font-semibold text-lg text-gray-900">{formData.targetDensity} PL/m²</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Water Source</p>
                    <p className="font-semibold text-lg text-gray-900 capitalize">{formData.waterSource.replace('-', ' ')}</p>
                  </div>
                  {formData.linkedProjectId && (
                    <div className="col-span-2">
                      <p className="text-sm text-gray-600">Linked Project</p>
                      <p className="font-semibold text-lg text-gray-900">
                        {projects.find(p => p.id === formData.linkedProjectId)?.name || 'Unknown'}
                      </p>
                    </div>
                  )}
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-sm font-semibold text-gray-900 mb-2">✓ Ready to Create</p>
                  <p className="text-xs text-gray-700">All information validated. Your pond will be created in "Preparing" status.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex gap-2 pt-4 border-t">
          {step > 1 && (
            <Button variant="outline" onClick={() => setStep(step - 1)} disabled={isSaving}>
              Back
            </Button>
          )}
          <div className="flex-1" />
          {step < 4 ? (
            <Button
              onClick={() => setStep(step + 1)}
              className="gap-2"
              disabled={step === 2 && !progressAnalysis}
            >
              Continue
            </Button>
          ) : (
            <Button
              onClick={handleAddPond}
              disabled={isSaving}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating Pond...
                </>
              ) : (
                'Create Pond'
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
              Create a new project to track pond expenses and analyze ROI
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
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleCreateProject();
                  }
                }}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateProject(false);
                  setNewProjectName('');
                }}
                disabled={isCreatingProject}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateProject}
                disabled={isCreatingProject}
                className="gap-2"
              >
                {isCreatingProject ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Create Project
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
