"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { TrendingUp, AlertTriangle, Trash2, ChevronRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function ShrimpDashboard({ ponds, currentPhase, alerts, onPondSelect, onDeletePond }: any) {
  const [deleteConfirming, setDeleteConfirming] = useState<string | null>(null);
  const [selectedPond, setSelectedPond] = useState<string | null>(null);
  const { toast } = useToast();
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

  return (
    <div className="space-y-6">
      {/* Phase Info */}
      <Card className="bg-gradient-to-r from-blue-50 to-cyan-50">
        <CardContent className="pt-6">
          <div className="space-y-2">
            <h2 className="text-lg font-semibold">{currentPhase.name}</h2>
            <div className="flex items-center gap-4 text-sm">
              <span className="text-muted-foreground">Day {currentPhase.day} of cycle</span>
              <Badge variant="outline">📅 {currentPhase.nextMilestone}</Badge>
            </div>
            <Progress value={(currentPhase.day / 120) * 100} className="mt-4" />
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics Grid */}
      <div className="grid gap-3 md:gap-4 grid-cols-2 md:grid-cols-2">
        <Card className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">Total Ponds</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold">{ponds.length}</div>
            <p className="text-xs text-muted-foreground mt-1">{ponds.filter((p: any) => p.status === 'active').length} active</p>
          </CardContent>
        </Card>

        <Card className="animate-in fade-in slide-in-from-bottom-2 duration-300" style={{ animationDelay: '50ms' }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">Total Stock</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold">{ponds.reduce((sum: number, p: any) => sum + (p.currentStock || 0), 0).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">across all ponds</p>
          </CardContent>
        </Card>
      </div>

      {/* Pond Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Pond Status Overview</CardTitle>
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
                    <h3 className="font-semibold">{pond.name}</h3>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">{pond.area} ha | {pond.currentStock.toLocaleString()} shrimp</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={pond.status === 'active' ? 'default' : 'secondary'}>
                    {pond.status}
                  </Badge>
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
                  <span className="text-muted-foreground">Type</span>
                  <p className="font-semibold capitalize">{pond.shrimpType}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Farming</span>
                  <p className="font-semibold capitalize">{pond.farmingType}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Cycle Day</span>
                  <p className="font-semibold">{pond.cycleDay || 0}</p>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
