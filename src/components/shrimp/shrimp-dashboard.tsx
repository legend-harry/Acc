"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, AlertTriangle } from 'lucide-react';

export function ShrimpDashboard({ ponds, currentPhase, alerts }: any) {
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
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Ponds</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ponds.length}</div>
            <p className="text-xs text-muted-foreground mt-1">{ponds.filter((p: any) => p.status === 'active').length} active</p>
          </CardContent>
        </Card>

        <Card className="animate-in fade-in slide-in-from-bottom-2 duration-300" style={{ animationDelay: '50ms' }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Stock</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ponds.reduce((sum: number, p: any) => sum + (p.currentStock || 0), 0).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">shrimp across all ponds</p>
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
            <div key={pond.id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold">{pond.name}</h3>
                  <p className="text-sm text-muted-foreground">{pond.area} ha | {pond.currentStock.toLocaleString()} shrimp</p>
                </div>
                <Badge variant={pond.status === 'active' ? 'default' : 'secondary'}>
                  {pond.status}
                </Badge>
              </div>
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
