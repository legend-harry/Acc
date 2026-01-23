"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { TrendingUp, AlertTriangle, Trash2, ChevronRight, AlertCircle, Edit2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { EditPondDialog } from './edit-pond-dialog';

export function ShrimpDashboard({ ponds, currentPhase, alerts, onPondSelect, onDeletePond, activePond }: any) {
  const [deleteConfirming, setDeleteConfirming] = useState<string | null>(null);
  const [selectedPond, setSelectedPond] = useState<string | null>(activePond || null);
  const [editingPond, setEditingPond] = useState<any>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const { toast } = useToast();
  
  // Get selected pond data for analytics
  const activePondData = selectedPond ? ponds.find((p: any) => p.id === selectedPond) : null;
  const handleDeleteClick = (pondId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (deleteConfirming === pondId) {
      // Confirm delete
      onDeletePond(pondId);
      setDeleteConfirming(null);
      toast({
        title: "Pond Deleted",
        description: "The pond has been removed successfully",
      });
    } else {
      // Start confirmation timer
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
      {/* Phase Info */}
      <Card className="bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-gray-900">{currentPhase.name}</h2>
            <div className="flex items-center gap-4 text-sm">
              <span className="text-gray-700 font-medium">Day {currentPhase.day} of cycle</span>
              <Badge variant="outline" className="border-blue-300 text-blue-700">📅 {currentPhase.nextMilestone}</Badge>
            </div>
            <Progress value={(currentPhase.day / 120) * 100} className="mt-4" />
          </div>
        </CardContent>
      </Card>

      {/* Pond-Specific Metrics Grid */}
      {activePondData ? (
        <div className="grid gap-3 md:gap-4 grid-cols-2 md:grid-cols-2">
          <Card className="animate-in fade-in slide-in-from-bottom-2 duration-300 border-blue-200 bg-blue-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs md:text-sm font-medium text-blue-700">📊 Current Stock</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl md:text-2xl font-bold text-gray-900">{(activePondData.currentStock || 0).toLocaleString()}</div>
              <p className="text-xs text-gray-600 mt-1">{activePondData.name}</p>
            </CardContent>
          </Card>

          <Card className="animate-in fade-in slide-in-from-bottom-2 duration-300 border-green-200 bg-green-50" style={{ animationDelay: '50ms' }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs md:text-sm font-medium text-green-700">🎯 Target Density</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl md:text-2xl font-bold text-gray-900">{activePondData.targetDensity || 0}</div>
              <p className="text-xs text-gray-600 mt-1">PL/m² - {activePondData.farmingType || 'N/A'}</p>
            </CardContent>
          </Card>

          <Card className="animate-in fade-in slide-in-from-bottom-2 duration-300 border-purple-200 bg-purple-50" style={{ animationDelay: '100ms' }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs md:text-sm font-medium text-purple-700">📏 Pond Area</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl md:text-2xl font-bold text-gray-900">{(activePondData.area || 0).toFixed(2)} ha</div>
              <p className="text-xs text-gray-600 mt-1">{((activePondData.area || 0) * 10000).toFixed(0)} m²</p>
            </CardContent>
          </Card>

          <Card className="animate-in fade-in slide-in-from-bottom-2 duration-300 border-orange-200 bg-orange-50" style={{ animationDelay: '150ms' }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs md:text-sm font-medium text-orange-700">🦐 Species Type</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl md:text-2xl font-bold text-gray-900 capitalize">{activePondData.shrimpType || 'N/A'}</div>
              <p className="text-xs text-gray-600 mt-1">Cycle {activePondData.cycleDay || 0}/{activePondData.totalCycleDays || 120} days</p>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="grid gap-3 md:gap-4 grid-cols-2 md:grid-cols-2">
          <Card className="animate-in fade-in slide-in-from-bottom-2 duration-300 border-gray-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs md:text-sm font-medium text-gray-600">📊 Current Stock</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl md:text-2xl font-bold text-gray-400">--</div>
              <p className="text-xs text-gray-600 mt-1">Select a pond</p>
            </CardContent>
          </Card>

          <Card className="animate-in fade-in slide-in-from-bottom-2 duration-300 border-gray-200" style={{ animationDelay: '50ms' }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs md:text-sm font-medium text-gray-600">🎯 Target Density</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl md:text-2xl font-bold text-gray-400">--</div>
              <p className="text-xs text-gray-600 mt-1">Select a pond</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Pond Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle>📍 All Ponds Overview</CardTitle>
          <p className="text-sm text-gray-600 mt-2">Click a pond to view its specific analytics above</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {ponds.map((pond: any) => (
            <div
              key={pond.id}
              onClick={() => {
                setSelectedPond(pond.id);
                onPondSelect?.(pond.id);
              }}
              className={`p-4 border rounded-lg cursor-pointer transition-all ${
                selectedPond === pond.id
                  ? 'bg-blue-50 border-blue-300 shadow-md'
                  : 'hover:bg-muted/50 hover:border-blue-200'
              }`}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900">{pond.name}</h3>
                    <ChevronRight className="h-4 w-4 text-gray-500" />
                  </div>
                  <p className="text-sm text-gray-700">{pond.area} ha | {pond.currentStock.toLocaleString()} shrimp</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={pond.status === 'active' ? 'default' : 'secondary'}>
                    {pond.status}
                  </Badge>
                  <Button
                    onClick={(e) => handleEditClick(pond, e)}
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 hover:bg-blue-100"
                    title="Edit pond"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    onClick={(e) => handleDeleteClick(pond.id, e)}
                    variant={deleteConfirming === pond.id ? 'destructive' : 'ghost'}
                    size="sm"
                    className="h-8 w-8 p-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {deleteConfirming === pond.id && (
                <div className="mb-3 p-2 sm:p-3 bg-red-50 border border-red-200 rounded text-xs sm:text-sm text-red-700 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>Tap delete again to confirm (3s timeout)</span>
                </div>
              )}

              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-600 text-xs">Type</span>
                  <p className="font-semibold capitalize text-gray-900">{pond.shrimpType}</p>
                </div>
                <div>
                  <span className="text-gray-600 text-xs">Farming</span>
                  <p className="font-semibold capitalize text-gray-900">{pond.farmingType}</p>
                </div>
                <div>
                  <span className="text-gray-600 text-xs">Cycle Day</span>
                  <p className="font-semibold text-gray-900">{pond.cycleDay || 0}</p>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Edit Pond Dialog */}
      <EditPondDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        pond={editingPond}
        onSaved={() => {
          setEditingPond(null);
          // Refresh data will happen automatically via Firebase listener
        }}
      />
    </div>
  );
}
