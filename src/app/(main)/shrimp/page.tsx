"use client";

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus, AlertTriangle, Zap, TrendingUp, FileText, BookOpen } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ShrimpDashboard } from "@/components/shrimp/shrimp-dashboard";
import { DailyLogForm } from "@/components/shrimp/daily-log-form";
import { FinancialDashboard } from "@/components/shrimp/financial-dashboard";
import { ProjectJourneyMap } from "@/components/shrimp/project-journey-map";
import { ReportGenerator } from "@/components/shrimp/report-generator";
import { KnowledgeBase } from "@/components/shrimp/knowledge-base";
import { AddPondDialog } from "@/components/shrimp/add-pond-dialog";

export default function ShrimpFarmingPage() {
  const [showAddPond, setShowAddPond] = useState(false);
  const [activePond, setActivePond] = useState<string>('pond-1');

  // Mock data - would come from Firebase in production
  const ponds = [
    { id: 'pond-1', name: 'Pond 1', area: 2, currentStock: 45000, status: 'active' },
    { id: 'pond-2', name: 'Pond 2', area: 2, currentStock: 42000, status: 'active' },
    { id: 'pond-3', name: 'Pond 3', area: 1.5, currentStock: 32000, status: 'preparing' },
  ];

  const alerts = [
    { id: 1, level: 'critical', message: 'Pond 1: DO below 4ppm', pond: 'pond-1' },
    { id: 2, level: 'warning', message: 'Feed inventory: 3 days remaining', pond: null },
  ];

  const currentPhase = {
    name: 'First Cycle Operation',
    day: 45,
    nextMilestone: 'Harvest Planning - Due in 15 days',
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Shrimp Farming Management</h1>
          <p className="text-muted-foreground mt-1">Complete farm operations & project lifecycle tracking</p>
        </div>
        <Button onClick={() => setShowAddPond(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Pond
        </Button>
      </div>

      {/* Critical Alerts */}
      {alerts.length > 0 && (
        <div className="grid gap-2">
          {alerts.map(alert => (
            <Card key={alert.id} className={alert.level === 'critical' ? 'border-red-500 bg-red-50' : 'border-orange-500 bg-orange-50'}>
              <CardContent className="pt-4 flex items-center gap-3">
                <AlertTriangle className={alert.level === 'critical' ? 'h-5 w-5 text-red-600' : 'h-5 w-5 text-orange-600'} />
                <span className={alert.level === 'critical' ? 'text-red-900' : 'text-orange-900'}>{alert.message}</span>
                <Button size="sm" variant="outline" className="ml-auto">Review</Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="dashboard" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="journey">Journey</TabsTrigger>
          <TabsTrigger value="operations">Operations</TabsTrigger>
          <TabsTrigger value="financial">Finance</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="knowledge">Knowledge</TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-4 animate-in fade-in duration-300">
          <ShrimpDashboard 
            ponds={ponds} 
            currentPhase={currentPhase}
            alerts={alerts}
          />
        </TabsContent>

        {/* Journey Map Tab */}
        <TabsContent value="journey" className="space-y-4 animate-in fade-in duration-300">
          <ProjectJourneyMap currentPhase={currentPhase} />
        </TabsContent>

        {/* Operations Tab */}
        <TabsContent value="operations" className="space-y-4 animate-in fade-in duration-300">
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold mb-4">Daily Operations</h2>
              <div className="grid gap-2 mb-6">
                {ponds.map(pond => (
                  <Card 
                    key={pond.id}
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => setActivePond(pond.id)}
                  >
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold">{pond.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {pond.currentStock.toLocaleString()} shrimp | {pond.area} ha
                          </p>
                        </div>
                        <Badge variant={pond.status === 'active' ? 'default' : 'secondary'}>
                          {pond.status}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {activePond && (
              <DailyLogForm 
                pondId={activePond}
                pondName={ponds.find(p => p.id === activePond)?.name || ''}
              />
            )}
          </div>
        </TabsContent>

        {/* Financial Tab */}
        <TabsContent value="financial" className="space-y-4 animate-in fade-in duration-300">
          <FinancialDashboard ponds={ponds} />
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-4 animate-in fade-in duration-300">
          <ReportGenerator ponds={ponds} />
        </TabsContent>

        {/* Knowledge Base Tab */}
        <TabsContent value="knowledge" className="space-y-4 animate-in fade-in duration-300">
          <KnowledgeBase />
        </TabsContent>
      </Tabs>

      <AddPondDialog open={showAddPond} onOpenChange={setShowAddPond} />
    </div>
  );
}
