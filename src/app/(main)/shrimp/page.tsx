"use client";

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus, AlertTriangle, Zap, TrendingUp, FileText, BookOpen, Image } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ShrimpDashboard } from "@/components/shrimp/shrimp-dashboard";
import { DailyLogForm } from "@/components/shrimp/daily-log-form";
import { FinancialDashboard } from "@/components/shrimp/financial-dashboard";
import { ProjectJourneyMap } from "@/components/shrimp/project-journey-map";
import { ReportGenerator } from "@/components/shrimp/report-generator";
import { KnowledgeBase } from "@/components/shrimp/knowledge-base";
import { AddPondDialog } from "@/components/shrimp/add-pond-dialog";
import { ShrimpChatBot } from "@/components/shrimp/shrimp-chatbot";
import { ImageUploadDialog } from "@/components/shrimp/image-upload-dialog";
import { FarmStatusForm } from "@/components/shrimp/farm-status-form";
import { DocumentUploadComponent } from "@/components/shrimp/document-upload";
import { HistoricalMineralGraphs } from "@/components/shrimp/historical-minerals";
import { InventoryManager } from "@/components/shrimp/inventory-manager";
import { usePonds, useAlerts } from '@/hooks/use-shrimp';
import { useUser } from '@/context/user-context';

export default function ShrimpFarmingPage() {
  const [showAddPond, setShowAddPond] = useState(false);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [activePond, setActivePond] = useState<string>('');
  const { selectedProfile } = useUser();

  const { ponds, loading: pondsLoading } = usePonds();
  const { alerts, loading: alertsLoading } = useAlerts();

  // Set first pond as active if none selected
  useMemo(() => {
    if (!activePond && ponds.length > 0) {
      setActivePond(ponds[0].id);
    }
  }, [ponds, activePond]);

  const currentPhase = {
    name: 'First Cycle Operation',
    day: ponds.find(p => p.id === activePond)?.cycleDay || 0,
    nextMilestone: 'Harvest Planning - Due in 15 days',
  };

  if (pondsLoading || alertsLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600">Loading farm data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">🦐 Shrimp Farming Management</h1>
          <p className="text-muted-foreground mt-1">Complete farm operations & project lifecycle tracking</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowImageUpload(true)} variant="outline" className="gap-2">
            <Image className="h-4 w-4" />
            Analyze Image
          </Button>
          <Button onClick={() => setShowAddPond(true)} className="gap-2 bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4" />
            Add Pond
          </Button>
        </div>
      </div>

      {/* Empty State */}
      {ponds.length === 0 && (
        <Card className="border-2 border-dashed border-gray-300">
          <CardContent className="pt-12 pb-12 text-center">
            <div className="space-y-4">
              <div className="text-6xl">🦐</div>
              <h3 className="text-xl font-semibold text-gray-900">No Ponds Created Yet</h3>
              <p className="text-gray-600">Get started by creating your first shrimp farming pond</p>
              <Button onClick={() => setShowAddPond(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Create First Pond
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Critical Alerts */}
      {alerts.length > 0 && (
        <div className="grid gap-2">
          {alerts.slice(0, 3).map(alert => (
            <Card key={alert.id} className={alert.level === 'critical' ? 'border-red-500 bg-red-50' : alert.level === 'warning' ? 'border-orange-500 bg-orange-50' : 'border-blue-500 bg-blue-50'}>
              <CardContent className="pt-4 flex items-center gap-3">
                <AlertTriangle className={alert.level === 'critical' ? 'h-5 w-5 text-red-600' : alert.level === 'warning' ? 'h-5 w-5 text-orange-600' : 'h-5 w-5 text-blue-600'} />
                <span className={alert.level === 'critical' ? 'text-red-900' : alert.level === 'warning' ? 'text-orange-900' : 'text-blue-900'}>{alert.message}</span>
                <Button size="sm" variant="outline" className="ml-auto">Review</Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Main Content - Only show if ponds exist */}
      {ponds.length > 0 && (
        <Tabs defaultValue="dashboard" className="space-y-4">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="journey">Journey</TabsTrigger>
            <TabsTrigger value="operations">Operations</TabsTrigger>
            <TabsTrigger value="status">Status</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="minerals">Minerals</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
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
                      className={`cursor-pointer transition-all ${
                        activePond === pond.id 
                          ? 'border-2 border-blue-600 bg-blue-50' 
                          : 'hover:bg-muted/50 border-gray-200'
                      }`}
                      onClick={() => setActivePond(pond.id)}
                    >
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold text-gray-900">{pond.name}</h3>

                        <InventoryManager />
                            <p className="text-sm text-gray-600">
                              {pond.currentStock.toLocaleString()} shrimp | {pond.area.toFixed(1)} ha | {pond.shrimpType} shrimp
                            </p>
                          </div>
                          <Badge variant={pond.status === 'active' ? 'default' : 'secondary'} className="capitalize">
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

          {/* Farm Status Tab */}
          <TabsContent value="status" className="space-y-4 animate-in fade-in duration-300">
            {activePond ? (
              <FarmStatusForm 
                pondId={activePond}
                pondName={ponds.find(p => p.id === activePond)?.name || ''}
              />
            return (
              <div className="space-y-8">
                <CardContent className="pt-6 text-center text-gray-600">
                  Please select a pond to view status
                </CardContent>
              </Card>
            )}
                    <p className="text-xs text-gray-500 mt-1">Profile: {selectedProfile} · Ponds: {ponds.length}</p>
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents" className="space-y-4 animate-in fade-in duration-300">
            {activePond ? (
              <DocumentUploadComponent 
                pondId={activePond}
                pondName={ponds.find(p => p.id === activePond)?.name || ''}
              />
            ) : (
              <Card>
                <CardContent className="pt-6 text-center text-gray-600">
                  Please select a pond to manage documents
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Minerals Tab */}
          <TabsContent value="minerals" className="space-y-4 animate-in fade-in duration-300">
            {activePond ? (
              <HistoricalMineralGraphs 
                pondId={activePond}
                pondName={ponds.find(p => p.id === activePond)?.name || ''}
              />
            ) : (
              <Card>
                <CardContent className="pt-6 text-center text-gray-600">
                  Please select a pond to view mineral data
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Financial/Reports Tab */}
          <TabsContent value="reports" className="space-y-4 animate-in fade-in duration-300">
            {activePond ? (
              <FinancialDashboard pondId={activePond} />
            ) : (
              <Card>
                <CardContent className="pt-6 text-center text-gray-600">
                  Please select a pond to view financials
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      )}

      <AddPondDialog 
        open={showAddPond} 
        onOpenChange={setShowAddPond}
        onCreated={(id) => {
          if (id) setActivePond(id);
        }}
      />
      <ImageUploadDialog open={showImageUpload} onOpenChange={setShowImageUpload} />
      
      {/* Floating Chatbot */}
      <ShrimpChatBot />
    </div>
  );
}
