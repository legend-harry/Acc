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
import { AIAnalyticsDashboard } from "@/components/shrimp/ai-analytics-dashboard";
import { usePonds, useAlerts } from '@/hooks/use-shrimp';
import { useUser } from '@/context/user-context';

export default function ShrimpFarmingPage() {
  const [showAddPond, setShowAddPond] = useState(false);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [activePond, setActivePond] = useState<string>('');
  const { selectedProfile } = useUser();

  const { ponds, loading: pondsLoading, deletePond } = usePonds();
  const { alerts, loading: alertsLoading } = useAlerts();

  // Set first pond as active if none selected
  useMemo(() => {
    if (!activePond && ponds.length > 0) {
      setActivePond(ponds[0].id);
    }
  }, [ponds, activePond]);

  // Get current phase from active pond
  const activePondData = ponds.find(p => p.id === activePond);
  const currentPhase = {
    name: activePondData?.currentPhase ? `${activePondData.currentPhase.charAt(0).toUpperCase() + activePondData.currentPhase.slice(1)} Cycle` : 'First Cycle Operation',
    day: activePondData?.cycleDay || 0,
    nextMilestone: activePondData?.currentStage === 'harvest' ? 'Harvest - Due Soon' : 'Harvest Planning - Due in 15 days',
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
    <div className="space-y-4 md:space-y-8 px-2 md:px-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl md:text-3xl font-bold break-words">🦐 Shrimp Farming Management</h1>
          <p className="text-muted-foreground mt-1 text-sm md:text-base break-words">Complete farm operations & project lifecycle tracking</p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <Button onClick={() => setShowImageUpload(true)} variant="outline" className="gap-1 md:gap-2 text-xs md:text-sm">
            <Image className="h-3 w-3 md:h-4 md:w-4" />
            <span className="hidden sm:inline">Analyze</span>
            <span className="sm:hidden">📸</span>
          </Button>
          <Button onClick={() => setShowAddPond(true)} className="gap-1 md:gap-2 bg-blue-600 hover:bg-blue-700 text-xs md:text-sm whitespace-nowrap">
            <Plus className="h-3 w-3 md:h-4 md:w-4" />
            Add Pond
          </Button>
        </div>
      </div>

      {/* Empty State */}
      {ponds.length === 0 && (
        <Card className="border-2 border-dashed border-blue-300 bg-gradient-to-br from-blue-50 to-cyan-50">
          <CardContent className="pt-8 pb-8 md:pt-16 md:pb-16 text-center px-4">
            <div className="space-y-4 md:space-y-6">
              <div className="text-5xl md:text-7xl animate-bounce">🦐</div>
              <div className="space-y-2">
                <h3 className="text-xl md:text-3xl font-bold text-gray-900 break-words">Welcome to Your Farm Management</h3>
                <p className="text-sm md:text-lg text-gray-600 break-words max-w-2xl mx-auto">Start by adding your first pond and let AI guide you through setup</p>
              </div>
              <div className="space-y-3 mt-4 md:mt-8">
                <Button onClick={() => setShowAddPond(true)} className="gap-2 px-6 py-4 md:px-8 md:py-6 text-base md:text-lg bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 md:h-5 md:w-5" />
                  Add New Farm
                </Button>
                <p className="text-xs md:text-sm text-gray-500 break-words max-w-md mx-auto px-4">
                  Our AI will help you assess your farm progress and prepare upcoming steps
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Critical Alerts */}
      {alerts.length > 0 && (
        <div className="grid gap-2">
          {alerts.slice(0, 3).map(alert => (
            <Card key={alert.id} className={alert.level === 'critical' ? 'border-red-500 bg-red-50' : alert.level === 'warning' ? 'border-orange-500 bg-orange-50' : 'border-blue-500 bg-blue-50'}>
              <CardContent className="pt-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <AlertTriangle className={`flex-shrink-0 ${alert.level === 'critical' ? 'h-5 w-5 text-red-600' : alert.level === 'warning' ? 'h-5 w-5 text-orange-600' : 'h-5 w-5 text-blue-600'}`} />
                <span className={`flex-1 text-sm md:text-base break-words ${alert.level === 'critical' ? 'text-red-900' : alert.level === 'warning' ? 'text-orange-900' : 'text-blue-900'}`}>{alert.message}</span>
                <Button size="sm" variant="outline" className="self-end sm:self-center flex-shrink-0">Review</Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Main Content - Only show if ponds exist */}
      {ponds.length > 0 && (
        <Tabs defaultValue="dashboard" className="space-y-4">
          <div className="overflow-x-auto -mx-2 px-2 md:mx-0 md:px-0">
            <TabsList className="inline-flex md:grid md:w-full md:grid-cols-7 min-w-max md:min-w-0">
              <TabsTrigger value="dashboard" className="text-xs md:text-sm">Dashboard</TabsTrigger>
              <TabsTrigger value="journey" className="text-xs md:text-sm">Journey</TabsTrigger>
              <TabsTrigger value="operations" className="text-xs md:text-sm">Operations</TabsTrigger>
              <TabsTrigger value="status" className="text-xs md:text-sm">Feed Chart</TabsTrigger>
              <TabsTrigger value="documents" className="text-xs md:text-sm">Documents</TabsTrigger>
              <TabsTrigger value="minerals" className="text-xs md:text-sm">Minerals</TabsTrigger>
              <TabsTrigger value="reports" className="text-xs md:text-sm">Reports</TabsTrigger>
            </TabsList>
          </div>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-4 animate-in fade-in duration-300">
            <ShrimpDashboard 
              ponds={ponds} 
              currentPhase={currentPhase}
              alerts={alerts}
              activePond={activePond}
              onPondSelect={setActivePond}
              onDeletePond={deletePond}
            />
          </TabsContent>

          {/* Journey Map Tab */}
          <TabsContent value="journey" className="space-y-4 animate-in fade-in duration-300">
            <ProjectJourneyMap 
              projectPhase={currentPhase.name}
              currentStage={ponds.find(p => p.id === activePond)?.currentStage || 'operation'}              pondName={ponds.find(p => p.id === activePond)?.name || ''}              cycleDay={ponds.find(p => p.id === activePond)?.cycleDay || 0}
              totalCycleDays={120}
            />
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
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <h3 className="font-semibold text-gray-900 break-words">{pond.name}</h3>
                            <p className="text-xs sm:text-sm text-gray-600 break-words">
                              {pond.currentStock.toLocaleString()} shrimp | {(pond.area * 2.471).toFixed(1)} acres | {pond.shrimpType} shrimp
                            </p>
                          </div>
                          <Badge variant={pond.status === 'active' ? 'default' : 'secondary'} className="capitalize self-start sm:self-center flex-shrink-0">
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

          {/* Feed Chart Tab (formerly Status) */}
          <TabsContent value="status" className="space-y-4 animate-in fade-in duration-300">
            {activePond && activePondData ? (
              <AIAnalyticsDashboard 
                pondId={activePond}
                pondName={activePondData.name}
                currentStock={activePondData.currentStock}
                pondArea={activePondData.area}
                farmingType={activePondData.farmingType}
                cycleDay={activePondData.cycleDay || 0}
              />
            ) : (
              <Card>
                <CardContent className="pt-6 text-center text-gray-600">
                  Please select a pond to view AI analytics
                </CardContent>
              </Card>
            )}
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
            {activePond && activePondData ? (
              <FinancialDashboard 
                pondId={activePond}
                linkedProjectId={activePondData.linkedProjectId}
              />
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
