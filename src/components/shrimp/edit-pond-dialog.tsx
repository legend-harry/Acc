"use client";

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { ref, update } from 'firebase/database';
import { useUser } from '@/context/user-context';

interface Pond {
  id: string;
  name: string;
  area: number;
  currentStock: number;
  targetDensity: number;
  species: string;
  shrimpType: 'white' | 'tiger' | 'giant';
  farmingType: 'extensive' | 'semi-intensive' | 'intensive';
  status: 'active' | 'preparing' | 'harvesting' | 'resting';
  cycleDay: number;
  totalCycleDays: number;
  waterSource: string;
  linkedProjectId?: string | null;
  currentPhase?: string;
}

interface EditPondDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pond: Pond | null;
  onSaved?: () => void;
}

export function EditPondDialog({ open, onOpenChange, pond, onSaved }: EditPondDialogProps) {
  const { toast } = useToast();
  const { selectedProfile } = useUser();
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [formData, setFormData] = useState({
    name: '',
    area: '',
    currentStock: '',
    targetDensity: '',
    shrimpType: 'white' as 'white' | 'tiger' | 'giant',
    farmingType: 'intensive' as 'extensive' | 'semi-intensive' | 'intensive',
    status: 'active' as 'active' | 'preparing' | 'harvesting' | 'resting',
    cycleDay: '',
    totalCycleDays: '',
    waterSource: 'well',
  });

  useEffect(() => {
    if (pond && open) {
      setFormData({
        name: pond.name || '',
        area: pond.area?.toString() || '',
        currentStock: pond.currentStock?.toString() || '',
        targetDensity: pond.targetDensity?.toString() || '',
        shrimpType: pond.shrimpType || 'white',
        farmingType: pond.farmingType || 'intensive',
        status: pond.status || 'active',
        cycleDay: pond.cycleDay?.toString() || '0',
        totalCycleDays: pond.totalCycleDays?.toString() || '120',
        waterSource: pond.waterSource || 'well',
      });
      setErrors({});
    }
  }, [pond, open]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = 'Pond name is required';
    if (!formData.area || parseFloat(formData.area) <= 0) newErrors.area = 'Pond area must be greater than 0';
    if (!formData.currentStock || parseInt(formData.currentStock) < 0) newErrors.currentStock = 'Stock count cannot be negative';
    if (!formData.targetDensity || parseInt(formData.targetDensity) <= 0) newErrors.targetDensity = 'Target density must be greater than 0';
    if (!formData.cycleDay || parseInt(formData.cycleDay) < 0) newErrors.cycleDay = 'Cycle day cannot be negative';
    if (!formData.totalCycleDays || parseInt(formData.totalCycleDays) <= 0) newErrors.totalCycleDays = 'Total cycle days must be greater than 0';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm() || !pond || !selectedProfile) return;

    setIsSaving(true);
    try {
      const pondRef = ref(db, `shrimp/${selectedProfile}/ponds/${pond.id}`);
      
      await update(pondRef, {
        name: formData.name,
        area: parseFloat(formData.area),
        currentStock: parseInt(formData.currentStock),
        targetDensity: parseInt(formData.targetDensity),
        shrimpType: formData.shrimpType,
        farmingType: formData.farmingType,
        status: formData.status,
        cycleDay: parseInt(formData.cycleDay),
        totalCycleDays: parseInt(formData.totalCycleDays),
        waterSource: formData.waterSource,
        lastUpdated: new Date().toISOString(),
      });

      toast({
        title: "Pond Updated",
        description: `${formData.name} has been updated successfully`,
      });

      onOpenChange(false);
      onSaved?.();
    } catch (error) {
      console.error('Error updating pond:', error);
      toast({
        title: "Error",
        description: "Failed to update pond. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!pond) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Pond: {pond.name}</DialogTitle>
          <DialogDescription>
            Update pond details and specifications
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-gray-900">Basic Information</h3>
            
            <div>
              <Label htmlFor="name">Pond Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="area">Pond Area (hectares)</Label>
                <Input
                  id="area"
                  type="number"
                  step="0.1"
                  value={formData.area}
                  onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                  className={errors.area ? 'border-red-500' : ''}
                />
                {errors.area && <p className="text-xs text-red-600 mt-1">{errors.area}</p>}
              </div>

              <div>
                <Label htmlFor="waterSource">Water Source</Label>
                <Select value={formData.waterSource} onValueChange={(val) => setFormData({ ...formData, waterSource: val })}>
                  <SelectTrigger id="waterSource">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="well">Well Water</SelectItem>
                    <SelectItem value="pond">Brackish Pond</SelectItem>
                    <SelectItem value="seawater">Seawater</SelectItem>
                    <SelectItem value="canal">Canal/Estuary</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Stock Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-gray-900">Stock Information</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="currentStock">Current Stock Count</Label>
                <Input
                  id="currentStock"
                  type="number"
                  value={formData.currentStock}
                  onChange={(e) => setFormData({ ...formData, currentStock: e.target.value })}
                  className={errors.currentStock ? 'border-red-500' : ''}
                />
                {errors.currentStock && <p className="text-xs text-red-600 mt-1">{errors.currentStock}</p>}
              </div>

              <div>
                <Label htmlFor="targetDensity">Target Density (PL/m²)</Label>
                <Input
                  id="targetDensity"
                  type="number"
                  value={formData.targetDensity}
                  onChange={(e) => setFormData({ ...formData, targetDensity: e.target.value })}
                  className={errors.targetDensity ? 'border-red-500' : ''}
                />
                {errors.targetDensity && <p className="text-xs text-red-600 mt-1">{errors.targetDensity}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="shrimpType">Shrimp Type</Label>
                <Select value={formData.shrimpType} onValueChange={(val: any) => setFormData({ ...formData, shrimpType: val })}>
                  <SelectTrigger id="shrimpType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="white">White Leg (Vannamei)</SelectItem>
                    <SelectItem value="tiger">Tiger Shrimp</SelectItem>
                    <SelectItem value="giant">Giant Tiger</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="farmingType">Farming Type</Label>
                <Select value={formData.farmingType} onValueChange={(val: any) => setFormData({ ...formData, farmingType: val })}>
                  <SelectTrigger id="farmingType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="extensive">Extensive</SelectItem>
                    <SelectItem value="semi-intensive">Semi-Intensive</SelectItem>
                    <SelectItem value="intensive">Intensive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Cycle Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-gray-900">Cycle Information</h3>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="cycleDay">Current Cycle Day</Label>
                <Input
                  id="cycleDay"
                  type="number"
                  value={formData.cycleDay}
                  onChange={(e) => setFormData({ ...formData, cycleDay: e.target.value })}
                  className={errors.cycleDay ? 'border-red-500' : ''}
                />
                {errors.cycleDay && <p className="text-xs text-red-600 mt-1">{errors.cycleDay}</p>}
              </div>

              <div>
                <Label htmlFor="totalCycleDays">Total Cycle Days</Label>
                <Input
                  id="totalCycleDays"
                  type="number"
                  value={formData.totalCycleDays}
                  onChange={(e) => setFormData({ ...formData, totalCycleDays: e.target.value })}
                  className={errors.totalCycleDays ? 'border-red-500' : ''}
                />
                {errors.totalCycleDays && <p className="text-xs text-red-600 mt-1">{errors.totalCycleDays}</p>}
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(val: any) => setFormData({ ...formData, status: val })}>
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="preparing">Preparing</SelectItem>
                    <SelectItem value="harvesting">Harvesting</SelectItem>
                    <SelectItem value="resting">Resting</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 p-3 rounded text-sm text-blue-700">
              <p>Progress: <strong>{Math.round((parseInt(formData.cycleDay) / parseInt(formData.totalCycleDays)) * 100)}%</strong> ({formData.cycleDay} of {formData.totalCycleDays} days)</p>
            </div>
          </div>

          {/* Summary */}
          <div className="space-y-2">
            <h3 className="font-semibold text-sm text-gray-900">Summary</h3>
            <Card className="bg-gradient-to-br from-blue-50 to-cyan-50">
              <CardContent className="pt-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Stocking Density</span>
                    <p className="font-bold text-gray-900">
                      {formData.area && formData.currentStock 
                        ? (parseInt(formData.currentStock) / (parseFloat(formData.area) * 10000)).toFixed(2) 
                        : '--'} PL/m²
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600">Total Area (m²)</span>
                    <p className="font-bold text-gray-900">
                      {formData.area ? (parseFloat(formData.area) * 10000).toFixed(0) : '--'} m²
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600">Farming Type</span>
                    <p className="font-bold capitalize text-gray-900">{formData.farmingType}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Shrimp Type</span>
                    <p className="font-bold capitalize text-gray-900">{formData.shrimpType}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={isSaving}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
