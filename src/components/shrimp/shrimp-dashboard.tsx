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
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Feed Conversion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1.4</div>
            <p className="text-xs text-muted-foreground mt-1">↓ Better than target</p>
          </CardContent>
        </Card>

        <Card className="animate-in fade-in slide-in-from-bottom-2 duration-300" style={{ animationDelay: '50ms' }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Survival Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">85%</div>
            <p className="text-xs text-muted-foreground mt-1">✓ On track</p>
          </CardContent>
        </Card>

        <Card className="animate-in fade-in slide-in-from-bottom-2 duration-300" style={{ animationDelay: '100ms' }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Weight</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12g</div>
            <p className="text-xs text-muted-foreground mt-1">↑ Growing well</p>
          </CardContent>
        </Card>

        <Card className="animate-in fade-in slide-in-from-bottom-2 duration-300" style={{ animationDelay: '150ms' }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Ponds</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ponds.length}</div>
            <p className="text-xs text-muted-foreground mt-1">{ponds.filter((p: any) => p.status === 'active').length} active</p>
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
              <div className="grid grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">pH</span>
                  <p className="font-semibold">7.8</p>
                </div>
                <div>
                  <span className="text-muted-foreground">DO</span>
                  <p className="font-semibold text-orange-600">4.2</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Temp</span>
                  <p className="font-semibold">28°C</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Ammonia</span>
                  <p className="font-semibold">0.1</p>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
