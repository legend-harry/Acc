/**
 * Project Linked Ponds Component
 * Shows ponds linked to a specific project with images, stages, and key metrics
 */

'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Fish,
  MapPin,
  TrendingUp,
  Image as ImageIcon,
  ChevronRight,
  AlertTriangle,
  Droplets,
  BarChart3,
  Link as LinkIcon,
  Unlink,
  Plus,
} from 'lucide-react';

interface LinkedPond {
  id: string;
  name: string;
  area: number;
  species: 'vannamei' | 'tiger' | 'monodon';
  status: 'active' | 'preparing' | 'harvesting' | 'resting';
  currentPhase: 'setup' | 'stocking' | 'operation' | 'harvest' | 'analysis';
  cycleDay: number;
  currentStock: number;
  seedAmount: number;
  waterQuality: 'excellent' | 'good' | 'fair' | 'poor';
  temperature: number;
  humidity: number;
  metrics: {
    fcr: number;
    survivalRate: number;
    avgWeight: number;
  };
  images?: string[];
  linkedProjectId?: string;
}

interface ProjectLinkedPondsProps {
  projectId: string;
  linkedPonds: LinkedPond[];
  onPondSelect: (pondId: string) => void;
  onLinkPond?: () => void;
  onUnlinkPond?: (pondId: string) => void;
}

export function ProjectLinkedPonds({
  projectId,
  linkedPonds,
  onPondSelect,
  onLinkPond,
  onUnlinkPond,
}: ProjectLinkedPondsProps) {
  const totalStock = linkedPonds.reduce((sum, pond) => sum + pond.currentStock, 0);
  const activePonds = linkedPonds.filter((pond) => pond.status === 'active').length;
  const avgSurvivalRate = linkedPonds.length > 0
    ? Math.round(linkedPonds.reduce((sum, pond) => sum + pond.metrics.survivalRate, 0) / linkedPonds.length)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header with Summary */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <LinkIcon className="h-6 w-6" />
            Project Ponds
          </h2>
          <p className="text-muted-foreground mt-1">
            {linkedPonds.length} pond{linkedPonds.length !== 1 ? 's' : ''} linked to this project
          </p>
        </div>
        {onLinkPond && (
          <Button onClick={onLinkPond}>
            <Plus className="h-4 w-4 mr-2" />
            Link Pond
          </Button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-gradient-to-br from-blue-50 to-cyan-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Stock</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{(totalStock / 1000).toFixed(1)}K</p>
            <p className="text-xs text-muted-foreground mt-1">Across all ponds</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-emerald-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Ponds</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{activePonds}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {activePonds} / {linkedPonds.length} in operation
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-pink-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Survival</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{avgSurvivalRate}%</p>
            <Progress value={avgSurvivalRate} className="mt-2 h-1" />
          </CardContent>
        </Card>
      </div>

      {/* No Ponds Message */}
      {linkedPonds.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="pt-6 text-center">
            <Fish className="h-8 w-8 mx-auto mb-2 opacity-50 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">No ponds linked to this project yet</p>
            {onLinkPond && (
              <Button onClick={onLinkPond}>
                <Plus className="h-4 w-4 mr-2" />
                Link Your First Pond
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Linked Ponds Grid */}
      {linkedPonds.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {linkedPonds.map((pond) => (
            <LinkedPondCard
              key={pond.id}
              pond={pond}
              onSelect={() => onPondSelect(pond.id)}
              onUnlink={onUnlinkPond ? () => onUnlinkPond(pond.id) : undefined}
            />
          ))}
        </div>
      )}

      {/* Linked Ponds List View (for projects with many ponds) */}
      {linkedPonds.length > 6 && (
        <Card>
          <CardHeader>
            <CardTitle>All Linked Ponds</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {linkedPonds.map((pond) => (
                <div
                  key={pond.id}
                  className="flex items-center justify-between p-3 border rounded hover:bg-muted transition-colors cursor-pointer"
                  onClick={() => onPondSelect(pond.id)}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="h-8 w-8 rounded bg-muted flex items-center justify-center text-xs font-semibold">
                      {pond.name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{pond.name}</p>
                      <p className="text-xs text-muted-foreground">{pond.currentPhase} • Day {pond.cycleDay}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right text-xs">
                      <p className="font-semibold">{(pond.currentStock / 1000).toFixed(1)}K</p>
                      <p className="text-muted-foreground">{pond.metrics.survivalRate}% survival</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/**
 * Individual Linked Pond Card Component
 */
function LinkedPondCard({
  pond,
  onSelect,
  onUnlink,
}: {
  pond: LinkedPond;
  onSelect: () => void;
  onUnlink?: () => void;
}) {
  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case 'operation':
        return 'bg-green-100 text-green-800';
      case 'setup':
      case 'stocking':
        return 'bg-blue-100 text-blue-800';
      case 'harvest':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return '🟢 Active';
      case 'preparing':
        return '🟡 Preparing';
      case 'harvesting':
        return '🟠 Harvesting';
      case 'resting':
        return '⚫ Resting';
      default:
        return '⚪ Unknown';
    }
  };

  return (
    <Card
      className="overflow-hidden cursor-pointer hover:shadow-lg transition-all"
      onClick={onSelect}
    >
      {/* Pond Image */}
      {pond.images && pond.images.length > 0 ? (
        <div className="relative h-32 bg-muted overflow-hidden">
          <img
            src={pond.images[0]}
            alt={pond.name}
            className="w-full h-full object-cover"
          />
          {onUnlink && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onUnlink();
              }}
              className="absolute top-2 right-2 p-1 rounded bg-red-500 text-white hover:bg-red-600 transition-colors"
              title="Unlink pond"
            >
              <Unlink className="h-4 w-4" />
            </button>
          )}
        </div>
      ) : (
        <div className="h-32 bg-gradient-to-br from-blue-100 to-cyan-100 flex items-center justify-center relative">
          <ImageIcon className="h-8 w-8 text-muted-foreground opacity-50" />
          {onUnlink && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onUnlink();
              }}
              className="absolute top-2 right-2 p-1 rounded bg-red-500 text-white hover:bg-red-600 transition-colors"
              title="Unlink pond"
            >
              <Unlink className="h-4 w-4" />
            </button>
          )}
        </div>
      )}

      <CardHeader className="pb-2">
        <div className="flex items-start justify-between mb-2">
          <CardTitle className="text-lg">{pond.name}</CardTitle>
          <Badge variant="outline" className="text-xs">
            {getStatusBadge(pond.status)}
          </Badge>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge className={getPhaseColor(pond.currentPhase)} variant="outline">
            {pond.currentPhase === 'operation' ? `Day ${pond.cycleDay}` : pond.currentPhase}
          </Badge>
          <Badge variant="secondary">{pond.area} ha</Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Stock Info */}
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="p-2 rounded bg-muted">
            <p className="text-muted-foreground text-xs">Current Stock</p>
            <p className="font-semibold">{(pond.currentStock / 1000).toFixed(1)}K</p>
          </div>
          <div className="p-2 rounded bg-muted">
            <p className="text-muted-foreground text-xs">Survival Rate</p>
            <p className="font-semibold">{pond.metrics.survivalRate}%</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div>
          <div className="flex justify-between items-center mb-1 text-xs">
            <span className="text-muted-foreground">Phase Progress</span>
            <span className="font-semibold">
              {pond.currentPhase === 'operation' ? `Day ${pond.cycleDay}` : 'Starting'}
            </span>
          </div>
          <Progress value={Math.min((pond.cycleDay / 90) * 100, 100)} className="h-2" />
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-3 gap-1 text-center text-xs">
          <div className="p-1.5 rounded bg-muted">
            <p className="text-muted-foreground">FCR</p>
            <p className="font-semibold">{pond.metrics.fcr}</p>
          </div>
          <div className="p-1.5 rounded bg-muted">
            <p className="text-muted-foreground">Temp</p>
            <p className="font-semibold">{pond.temperature}°C</p>
          </div>
          <div className="p-1.5 rounded bg-muted">
            <p className="text-muted-foreground">Quality</p>
            <p className="font-semibold capitalize text-xs">{pond.waterQuality[0]}</p>
          </div>
        </div>

        {/* Water Quality Alert */}
        {pond.waterQuality === 'poor' && (
          <Alert variant="destructive" className="py-2">
            <AlertTriangle className="h-3 w-3" />
            <AlertDescription className="text-xs">Water quality critical</AlertDescription>
          </Alert>
        )}

        {pond.waterQuality === 'fair' && (
          <Alert className="bg-yellow-50 border-yellow-200 py-2">
            <AlertTriangle className="h-3 w-3 text-yellow-600" />
            <AlertDescription className="text-xs text-yellow-800">Water quality needs attention</AlertDescription>
          </Alert>
        )}

        {/* View Details Button */}
        <Button
          className="w-full"
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onSelect();
          }}
        >
          View Details <ChevronRight className="h-3 w-3 ml-2" />
        </Button>
      </CardContent>
    </Card>
  );
}
