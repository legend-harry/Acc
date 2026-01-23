/**
 * Redesigned Multi-Pond Dashboard
 * Shows overview of all ponds with aggregated metrics and insights
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Grid,
  List,
  Search,
  Plus,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Droplets,
  Fish,
  Thermometer,
  Wind,
  MapPin,
  Image as ImageIcon,
  ChevronRight,
} from 'lucide-react';
import { Input } from '@/components/ui/input';

interface Pond {
  id: string;
  name: string;
  area: number; // hectares
  seedAmount: number;
  currentStock: number;
  species: 'vannamei' | 'tiger' | 'monodon';
  farmingType: 'extensive' | 'semi-intensive' | 'intensive';
  status: 'active' | 'preparing' | 'harvesting' | 'resting';
  stage: 'planning' | 'setup' | 'stocking' | 'operation' | 'harvest' | 'analysis';
  cycleDay: number;
  waterQuality: 'excellent' | 'good' | 'fair' | 'poor';
  temperature: number;
  humidity: number;
  location: {
    latitude: number;
    longitude: number;
    area: string;
  };
  images?: string[];
  metrics: {
    fcr: number;
    survivalRate: number;
    avgWeight: number;
    feeding: number;
  };
}

interface AggregatedMetrics {
  totalPonds: number;
  activePonds: number;
  totalSeed: number;
  totalCurrent: number;
  avgFCR: number;
  avgSurvivalRate: number;
  criticalAlerts: number;
  warnings: number;
}

export function MultiPondDashboard({
  ponds,
  onPondSelect,
  onAddPond,
}: {
  ponds: Pond[];
  onPondSelect: (pondId: string) => void;
  onAddPond: () => void;
}) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'preparing' | 'resting'>('all');
  const [metrics, setMetrics] = useState<AggregatedMetrics | null>(null);

  // Calculate aggregated metrics
  useEffect(() => {
    const activePonds = ponds.filter((p) => p.status === 'active');
    const totalSeed = ponds.reduce((sum, p) => sum + p.seedAmount, 0);
    const totalCurrent = ponds.reduce((sum, p) => sum + p.currentStock, 0);
    const avgFCR = ponds.length > 0 ? (ponds.reduce((sum, p) => sum + p.metrics.fcr, 0) / ponds.length).toFixed(2) : 0;
    const avgSurvivalRate = ponds.length > 0 ? Math.round((ponds.reduce((sum, p) => sum + p.metrics.survivalRate, 0) / ponds.length)) : 0;

    setMetrics({
      totalPonds: ponds.length,
      activePonds: activePonds.length,
      totalSeed,
      totalCurrent,
      avgFCR: parseFloat(avgFCR as string),
      avgSurvivalRate,
      criticalAlerts: ponds.filter((p) => p.waterQuality === 'poor').length,
      warnings: ponds.filter((p) => p.waterQuality === 'fair').length,
    });
  }, [ponds]);

  const filteredPonds = ponds.filter((pond) => {
    const matchesSearch = pond.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || pond.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStageColor = (stage: string) => {
    switch (stage) {
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return '🟢';
      case 'preparing':
        return '🟡';
      case 'harvesting':
        return '🟠';
      case 'resting':
        return '⚫';
      default:
        return '⚪';
    }
  };

  if (!metrics) {
    return <div className="text-center py-8">Loading metrics...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-blue-50 to-cyan-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Fish className="h-4 w-4" />
              Total Ponds
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{metrics.totalPonds}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.activePonds} active • {metrics.totalPonds - metrics.activePonds} inactive
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-emerald-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Total Stock
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{(metrics.totalCurrent / 1000).toFixed(1)}K</div>
            <p className="text-xs text-muted-foreground mt-1">
              Seeded: {(metrics.totalSeed / 1000).toFixed(1)}K
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-orange-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              Feed Conversion Ratio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{metrics.avgFCR}</div>
            <p className="text-xs text-muted-foreground mt-1">Average across all ponds</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-pink-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Survival Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{metrics.avgSurvivalRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">Farm average</p>
          </CardContent>
        </Card>
      </div>

      {/* Critical Alerts Section */}
      {metrics.criticalAlerts > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <span className="font-semibold">{metrics.criticalAlerts} pond(s) with critical water quality issues</span>
            <p className="text-sm mt-1">Review immediately and take corrective action</p>
          </AlertDescription>
        </Alert>
      )}

      {/* Search and Filter Bar */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search ponds by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex gap-2">
          {['all', 'active', 'preparing', 'resting'].map((status) => (
            <Badge
              key={status}
              variant={filterStatus === status ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setFilterStatus(status as any)}
            >
              {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
            </Badge>
          ))}
        </div>

        <div className="flex gap-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button onClick={onAddPond} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Pond
          </Button>
        </div>
      </div>

      {/* Ponds Grid/List View */}
      {viewMode === 'grid' ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredPonds.map((pond) => (
            <PondCard
              key={pond.id}
              pond={pond}
              onSelect={() => onPondSelect(pond.id)}
              getStageColor={getStageColor}
              getStatusIcon={getStatusIcon}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredPonds.map((pond) => (
            <PondListItem
              key={pond.id}
              pond={pond}
              onSelect={() => onPondSelect(pond.id)}
              getStageColor={getStageColor}
              getStatusIcon={getStatusIcon}
            />
          ))}
        </div>
      )}

      {filteredPonds.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="pt-6 text-center text-muted-foreground">
            <Fish className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No ponds found matching your criteria</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/**
 * Individual Pond Card Component
 */
function PondCard({
  pond,
  onSelect,
  getStageColor,
  getStatusIcon,
}: {
  pond: Pond;
  onSelect: () => void;
  getStageColor: (stage: string) => string;
  getStatusIcon: (status: string) => string;
}) {
  return (
    <Card
      className="cursor-pointer hover:shadow-lg transition-all overflow-hidden"
      onClick={onSelect}
    >
      {/* Pond Image */}
      {pond.images && pond.images.length > 0 ? (
        <div className="relative h-40 bg-muted overflow-hidden">
          <img
            src={pond.images[0]}
            alt={pond.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute top-2 right-2 flex gap-1">
            <Badge variant="secondary" className="bg-black/50 text-white border-0">
              {pond.images.length} photo{pond.images.length !== 1 ? 's' : ''}
            </Badge>
          </div>
        </div>
      ) : (
        <div className="h-40 bg-gradient-to-br from-blue-100 to-cyan-100 flex items-center justify-center">
          <ImageIcon className="h-8 w-8 text-muted-foreground opacity-50" />
        </div>
      )}

      <CardHeader className="pb-3">
        <div className="flex items-start justify-between mb-2">
          <CardTitle className="text-lg">{pond.name}</CardTitle>
          <Badge variant="outline">{getStatusIcon(pond.status)} {pond.status}</Badge>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge className={getStageColor(pond.stage)} variant="outline">
            {pond.stage === 'operation' ? `Day ${pond.cycleDay}` : pond.stage}
          </Badge>
          <Badge variant="secondary">{pond.area} ha</Badge>
          <Badge variant="secondary">{pond.farmingType}</Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Stock Info */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="p-2 rounded bg-muted">
            <p className="text-muted-foreground text-xs">Seeded</p>
            <p className="font-semibold">{(pond.seedAmount / 1000).toFixed(1)}K</p>
          </div>
          <div className="p-2 rounded bg-muted">
            <p className="text-muted-foreground text-xs">Current</p>
            <p className="font-semibold">{(pond.currentStock / 1000).toFixed(1)}K</p>
          </div>
        </div>

        {/* Survival Rate */}
        <div>
          <div className="flex justify-between items-center mb-1 text-xs">
            <span className="text-muted-foreground">Survival Rate</span>
            <span className="font-semibold">{pond.metrics.survivalRate}%</span>
          </div>
          <Progress value={pond.metrics.survivalRate} className="h-2" />
        </div>

        {/* Environmental Data */}
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="p-2 rounded bg-muted text-center">
            <Thermometer className="h-3 w-3 mx-auto mb-1" />
            <p className="text-muted-foreground">Temp</p>
            <p className="font-semibold">{pond.temperature}°C</p>
          </div>
          <div className="p-2 rounded bg-muted text-center">
            <Droplets className="h-3 w-3 mx-auto mb-1" />
            <p className="text-muted-foreground">Humidity</p>
            <p className="font-semibold">{pond.humidity}%</p>
          </div>
          <div className="p-2 rounded bg-muted text-center">
            <AlertTriangle className="h-3 w-3 mx-auto mb-1" />
            <p className="text-muted-foreground">Quality</p>
            <p className="font-semibold capitalize text-xs">{pond.waterQuality}</p>
          </div>
        </div>

        {/* Water Quality Indicator */}
        <div className={`p-2 rounded text-center text-sm font-medium ${
          pond.waterQuality === 'excellent' ? 'bg-green-100 text-green-800' :
          pond.waterQuality === 'good' ? 'bg-blue-100 text-blue-800' :
          pond.waterQuality === 'fair' ? 'bg-yellow-100 text-yellow-800' :
          'bg-red-100 text-red-800'
        }`}>
          Water Quality: {pond.waterQuality.toUpperCase()}
        </div>

        {/* View Details Button */}
        <Button className="w-full" variant="outline">
          View Details <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      </CardContent>
    </Card>
  );
}

/**
 * Pond List Item Component
 */
function PondListItem({
  pond,
  onSelect,
  getStageColor,
  getStatusIcon,
}: {
  pond: Pond;
  onSelect: () => void;
  getStageColor: (stage: string) => string;
  getStatusIcon: (status: string) => string;
}) {
  return (
    <Card className="cursor-pointer hover:shadow-md transition-all" onClick={onSelect}>
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          {/* Thumbnail */}
          {pond.images && pond.images.length > 0 ? (
            <img
              src={pond.images[0]}
              alt={pond.name}
              className="h-16 w-16 rounded object-cover flex-shrink-0"
            />
          ) : (
            <div className="h-16 w-16 rounded bg-muted flex items-center justify-center flex-shrink-0">
              <ImageIcon className="h-6 w-6 text-muted-foreground opacity-50" />
            </div>
          )}

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold truncate">{pond.name}</h3>
              <Badge variant="outline">{getStatusIcon(pond.status)}</Badge>
              <Badge className={getStageColor(pond.stage)} variant="outline">
                {pond.stage === 'operation' ? `Day ${pond.cycleDay}` : pond.stage}
              </Badge>
            </div>
            <div className="grid grid-cols-4 gap-4 text-xs text-muted-foreground">
              <div>
                <p className="text-muted-foreground">Area</p>
                <p className="font-semibold text-foreground">{pond.area} ha</p>
              </div>
              <div>
                <p className="text-muted-foreground">Stock</p>
                <p className="font-semibold text-foreground">{(pond.currentStock / 1000).toFixed(1)}K</p>
              </div>
              <div>
                <p className="text-muted-foreground">FCR</p>
                <p className="font-semibold text-foreground">{pond.metrics.fcr}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Survival</p>
                <p className="font-semibold text-foreground">{pond.metrics.survivalRate}%</p>
              </div>
            </div>
          </div>

          {/* Quality Badge */}
          <div className={`px-3 py-2 rounded text-sm font-semibold flex-shrink-0 ${
            pond.waterQuality === 'excellent' ? 'bg-green-100 text-green-800' :
            pond.waterQuality === 'good' ? 'bg-blue-100 text-blue-800' :
            pond.waterQuality === 'fair' ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
          }`}>
            {pond.waterQuality}
          </div>

          <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
        </div>
      </CardContent>
    </Card>
  );
}
