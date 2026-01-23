/**
 * Pond Detail View - Shows all pond-exclusive features
 * Includes journey map, daily logs, alerts, reports, knowledge base
 */

'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import {
  ChevronLeft,
  Calendar,
  AlertTriangle,
  BarChart3,
  BookOpen,
  Edit2,
  Share2,
  Download,
  Image as ImageIcon,
  MapPin,
  Thermometer,
  Droplets,
  Wind,
  TrendingUp,
  TrendingDown,
  Activity,
} from 'lucide-react';

interface PondDetailViewProps {
  pond: any;
  onBack: () => void;
  onEdit?: () => void;
}

const PHASES = [
  { id: 'setup', name: 'Setup', description: 'Pond preparation and conditioning', days: 14 },
  { id: 'stocking', name: 'Stocking', description: 'Seed introduction and acclimation', days: 3 },
  { id: 'operation', name: 'Operation', description: 'Active farming and management', days: 90 },
  { id: 'harvest', name: 'Harvest', description: 'Harvesting and collection', days: 3 },
  { id: 'analysis', name: 'Analysis', description: 'Data review and planning', days: 7 },
];

export function PondDetailView({ pond, onBack, onEdit }: PondDetailViewProps) {
  const [activeTab, setActiveTab] = useState('overview');

  const currentPhaseIndex = PHASES.findIndex((p) => p.id === pond.currentPhase);
  const totalCycleDays = PHASES.reduce((sum, p) => sum + p.days, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{pond.name}</h1>
            <div className="flex gap-2 mt-2">
              <Badge variant="outline">{pond.status}</Badge>
              <Badge className="bg-blue-100 text-blue-800">{pond.farmingType}</Badge>
              <Badge className="bg-green-100 text-green-800">{pond.species}</Badge>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {onEdit && <Button variant="outline" onClick={onEdit}><Edit2 className="h-4 w-4 mr-2" />Edit</Button>}
          <Button variant="outline"><Share2 className="h-4 w-4 mr-2" />Share</Button>
          <Button variant="outline"><Download className="h-4 w-4 mr-2" />Export</Button>
        </div>
      </div>

      {/* Pond Image Gallery */}
      {pond.images && pond.images.length > 0 && (
        <div className="grid grid-cols-4 gap-2">
          {pond.images.slice(0, 4).map((image: string, idx: number) => (
            <div key={idx} className="aspect-square rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity">
              <img src={image} alt={`Pond ${idx + 1}`} className="w-full h-full object-cover" />
            </div>
          ))}
          {pond.images.length > 4 && (
            <div className="aspect-square rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
              <span className="text-sm font-semibold">+{pond.images.length - 4} more</span>
            </div>
          )}
        </div>
      )}

      {!pond.images || pond.images.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="pt-6 text-center text-muted-foreground">
            <ImageIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No images uploaded yet</p>
            <Button variant="outline" size="sm" className="mt-2">Upload Images</Button>
          </CardContent>
        </Card>
      )}

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Current Stock</p>
            <p className="text-2xl font-bold">{(pond.currentStock / 1000).toFixed(1)}K</p>
            <p className="text-xs text-muted-foreground mt-1">Day {pond.cycleDay}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">FCR</p>
            <p className="text-2xl font-bold">{pond.metrics.fcr}</p>
            <Badge variant="outline" className="mt-1 text-xs">Feed Conversion</Badge>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Survival Rate</p>
            <p className="text-2xl font-bold">{pond.metrics.survivalRate}%</p>
            <Progress value={pond.metrics.survivalRate} className="mt-2 h-1" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Avg Weight</p>
            <p className="text-2xl font-bold">{pond.metrics.avgWeight}g</p>
            <p className="text-xs text-muted-foreground mt-1">Est. per shrimp</p>
          </CardContent>
        </Card>
      </div>

      {/* Environmental Conditions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Environmental Conditions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="p-3 rounded-lg bg-orange-50 border border-orange-200">
              <div className="flex items-center gap-2 mb-2">
                <Thermometer className="h-4 w-4 text-orange-600" />
                <span className="text-sm font-semibold text-orange-900">Temperature</span>
              </div>
              <p className="text-2xl font-bold text-orange-900">{pond.temperature}°C</p>
              <p className="text-xs text-orange-800 mt-1">Optimal: 25-32°C</p>
            </div>
            <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <Droplets className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-semibold text-blue-900">Humidity</span>
              </div>
              <p className="text-2xl font-bold text-blue-900">{pond.humidity}%</p>
              <p className="text-xs text-blue-800 mt-1">Optimal: 70-90%</p>
            </div>
            <div className="p-3 rounded-lg bg-cyan-50 border border-cyan-200">
              <div className="flex items-center gap-2 mb-2">
                <Wind className="h-4 w-4 text-cyan-600" />
                <span className="text-sm font-semibold text-cyan-900">Wind Speed</span>
              </div>
              <p className="text-2xl font-bold text-cyan-900">5 m/s</p>
              <p className="text-xs text-cyan-800 mt-1">Light breeze</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Journey Map */}
      <Card>
        <CardHeader>
          <CardTitle>Farming Cycle Progress</CardTitle>
          <CardDescription>Current phase: {pond.currentPhase}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {PHASES.map((phase, idx) => {
              const isCompleted = idx < currentPhaseIndex;
              const isCurrent = phase.id === pond.currentPhase;
              const phaseProgress = isCurrent ? pond.cycleDay : (isCompleted ? phase.days : 0);

              return (
                <div key={phase.id}>
                  <div className="flex items-start gap-4">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 font-semibold ${
                      isCurrent ? 'bg-primary text-primary-foreground' :
                      isCompleted ? 'bg-green-100 text-green-800' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {idx + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <div>
                          <p className="font-semibold">{phase.name}</p>
                          <p className="text-sm text-muted-foreground">{phase.description}</p>
                        </div>
                        <span className="text-sm font-semibold">
                          {phaseProgress} / {phase.days} days
                        </span>
                      </div>
                      <Progress value={(phaseProgress / phase.days) * 100} className="h-2" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Tabs for Details */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="logs">Daily Logs</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="knowledge">Knowledge</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pond Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded bg-muted">
                  <p className="text-sm text-muted-foreground">Location</p>
                  <p className="font-semibold flex items-center gap-2 mt-1">
                    <MapPin className="h-4 w-4" />
                    {pond.location?.area || 'Not specified'}
                  </p>
                </div>
                <div className="p-3 rounded bg-muted">
                  <p className="text-sm text-muted-foreground">Pond Area</p>
                  <p className="font-semibold">{pond.area} hectares</p>
                </div>
                <div className="p-3 rounded bg-muted">
                  <p className="text-sm text-muted-foreground">Water Source</p>
                  <p className="font-semibold capitalize">{pond.waterSource}</p>
                </div>
                <div className="p-3 rounded bg-muted">
                  <p className="text-sm text-muted-foreground">Farming Type</p>
                  <p className="font-semibold capitalize">{pond.farmingType}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Feed Conversion Ratio</span>
                  <span className="font-semibold">{pond.metrics.fcr}</span>
                </div>
                <Progress value={80} className="h-2" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Survival Rate</span>
                  <span className="font-semibold">{pond.metrics.survivalRate}%</span>
                </div>
                <Progress value={pond.metrics.survivalRate} className="h-2" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Daily Logs Tab */}
        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Daily Logs
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center text-muted-foreground py-6">
              <p>No logs recorded yet</p>
              <Button variant="outline" size="sm" className="mt-2">Add Log</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Alerts & Notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {pond.waterQuality === 'poor' && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <p className="font-semibold">Critical: Water Quality Poor</p>
                    <p className="text-sm mt-1">
                      Immediate action required. Check dissolved oxygen levels and perform water exchange.
                    </p>
                  </AlertDescription>
                </Alert>
              )}
              {pond.waterQuality === 'fair' && (
                <Alert className="bg-yellow-50 border-yellow-200">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <AlertDescription className="text-yellow-900">
                    <p className="font-semibold">Warning: Water Quality Fair</p>
                    <p className="text-sm mt-1">Monitor closely. Consider increasing aeration.</p>
                  </AlertDescription>
                </Alert>
              )}
              {pond.waterQuality === 'good' || pond.waterQuality === 'excellent' && (
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircleIcon className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-900">
                    All systems normal. Water quality is good.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Knowledge Tab */}
        <TabsContent value="knowledge" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Knowledge Base
              </CardTitle>
              <CardDescription>Recommended articles for your current phase</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { title: 'Best Practices for Setup Phase', category: 'Setup', views: 234 },
                { title: 'Feeding Schedule Guide', category: 'Operation', views: 456 },
                { title: 'Water Quality Management', category: 'Maintenance', views: 789 },
              ].map((article, idx) => (
                <div key={idx} className="p-3 border rounded hover:bg-muted cursor-pointer transition-colors">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-sm">{article.title}</p>
                      <Badge variant="outline" className="mt-1 text-xs">{article.category}</Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">{article.views} views</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Fallback icon
function CheckCircleIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}
