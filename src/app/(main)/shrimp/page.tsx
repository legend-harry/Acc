"use client";

import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import {
  Plus, AlertTriangle, TrendingUp, FileText, BookOpen, Image,
  LayoutDashboard, Route, ClipboardList, Utensils, FolderOpen,
  Beaker, PieChart, Calculator, Fish, Waves, Activity, Shell,
  Sparkles, ArrowRight, Zap, BarChart3
} from 'lucide-react';
import { QuickSeedDialog } from "@/components/shrimp/quick-seed-dialog";
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
import { FeedingSchedulePlanner } from "@/components/shrimp/feeding-schedule-planner";
import { HarvestEstimator } from "@/components/shrimp/harvest-estimator";
import { FCREngine } from "@/components/shrimp/fcr-engine";
import { GrowthBiomassTracker } from "@/components/shrimp/growth-biomass-tracker";
import { FinancialSummaryCards } from "@/components/dashboard/financial-summary-cards";
import { usePonds, useAlerts } from '@/hooks/use-shrimp';
import { useTransactions } from '@/hooks/use-database';
import { useUser } from '@/context/user-context';

const TAB_CONFIG = [
  { value: 'dashboard', icon: LayoutDashboard, label: 'Dashboard', shortLabel: 'Dash' },
  { value: 'harvest', icon: Calculator, label: 'Harvest', shortLabel: 'Harv' },
  { value: 'fcr', icon: Zap, label: 'FCR Engine', shortLabel: 'FCR' },
  { value: 'growth', icon: BarChart3, label: 'Growth', shortLabel: 'Grow' },
  { value: 'journey', icon: Route, label: 'Journey', shortLabel: 'Map' },
  { value: 'operations', icon: ClipboardList, label: 'Operations', shortLabel: 'Ops' },
  { value: 'status', icon: Utensils, label: 'Feed Chart', shortLabel: 'Feed' },
  { value: 'documents', icon: FolderOpen, label: 'Documents', shortLabel: 'Docs' },
  { value: 'minerals', icon: Beaker, label: 'Minerals', shortLabel: 'Min' },
  { value: 'reports', icon: PieChart, label: 'Reports', shortLabel: 'Fin' },
];

export default function ShrimpFarmingPage() {
  const [showAddPond, setShowAddPond] = useState(false);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [showQuickSeed, setShowQuickSeed] = useState(false);
  const [activePond, setActivePond] = useState<string>('');
  const [activeTab, setActiveTab] = useState('dashboard');
  const { selectedProfile } = useUser();

  const { ponds, loading: pondsLoading, deletePond } = usePonds();
  const { alerts, loading: alertsLoading } = useAlerts();
  const { transactions, loading: transactionsLoading } = useTransactions();
  const safePonds = Array.isArray(ponds) ? ponds : [];
  const safeAlerts = Array.isArray(alerts) ? alerts : [];
  const safeTransactions = Array.isArray(transactions) ? transactions : [];

  // Set first pond as active if none selected
  useEffect(() => {
    if (!activePond && safePonds.length > 0) {
      setActivePond(safePonds[0].id);
    }
  }, [safePonds, activePond]);

  // Get current phase from active pond
  const activePondData = safePonds.find(p => p.id === activePond);
  const currentPhase = useMemo(() => {
    const day = activePondData?.cycleDay || 0;
    const totalDays = 120;
    const daysLeft = Math.max(0, totalDays - day);
    const nextMilestone = activePondData?.currentStage === 'harvest'
      ? 'Harvest - Due Soon'
      : daysLeft <= 30
      ? `Harvest Planning - Due in ${daysLeft} days`
      : `Day ${day} of ${totalDays}`;
    return {
      name: activePondData?.currentPhase
        ? `${activePondData.currentPhase.charAt(0).toUpperCase() + activePondData.currentPhase.slice(1)} Cycle`
        : 'First Cycle Operation',
      day,
      nextMilestone,
    };
  }, [activePondData]);

  // Farm-wide stats
  const farmStats = useMemo(() => {
    return {
      totalPonds: safePonds.length,
      activePonds: safePonds.filter(p => p.status === 'active').length,
      totalStock: safePonds.reduce((sum, p) => sum + (p.currentStock || 0), 0),
      criticalAlerts: safeAlerts.filter((a: any) => a.level === 'critical').length,
    };
  }, [safePonds, safeAlerts]);

  const shrimpDashboardTransactions = useMemo(() => {
    if (!activePondData) return safeTransactions;
    const linkedProjectId = activePondData.linkedprojectid;
    if (!linkedProjectId) return safeTransactions;
    return safeTransactions.filter((t) => t.projectid === linkedProjectId);
  }, [safeTransactions, activePondData]);

  if (pondsLoading || alertsLoading || transactionsLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-4">
          <div className="relative mx-auto w-16 h-16">
            <div className="absolute inset-0 rounded-full border-4 border-cyan-100"></div>
            <div className="absolute inset-0 rounded-full border-4 border-t-cyan-500 animate-spin"></div>
            <Fish className="absolute inset-0 m-auto h-6 w-6 text-cyan-500 animate-float" />
          </div>
          <p className="text-gray-600 font-medium">Loading farm data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6 px-2 md:px-0">
      <PageHeader 
        title="Shrimp Farm Manager" 
        description="Complete aquaculture operations & lifecycle tracking"
      >
        <div className="flex gap-2 flex-shrink-0 flex-wrap">
          <Button
            onClick={() => setShowImageUpload(true)}
            variant="outline"
            className="gap-1.5 text-sm"
          >
            <Image className="h-4 w-4" />
            <span className="hidden sm:inline">Analyze Image</span>
          </Button>
          <Button
            onClick={() => setShowQuickSeed(true)}
            variant="outline"
            className="gap-1.5 bg-amber-50 hover:bg-amber-100 border-amber-300 text-amber-800 text-sm"
          >
            <Zap className="h-4 w-4" />
            <span className="hidden sm:inline">Quick Seed</span>
          </Button>
          <Button
            onClick={() => setShowAddPond(true)}
            className="gap-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="h-4 w-4" />
            Add Pond
          </Button>
        </div>
      </PageHeader>
      
      {/* Farm-wide stats pills */}
      {safePonds.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          <Badge variant="outline" className="text-gray-600">
            <Fish className="h-3 w-3 mr-1" /> {farmStats.activePonds}/{farmStats.totalPonds} ponds active
          </Badge>
          <Badge variant="outline" className="text-gray-600">
            <Activity className="h-3 w-3 mr-1" /> {(farmStats.totalStock || 0).toLocaleString()} total stock
          </Badge>
          {farmStats.criticalAlerts > 0 && (
            <Badge variant="destructive" className="animate-pulse">
              <AlertTriangle className="h-3 w-3 mr-1" /> {farmStats.criticalAlerts} alert{farmStats.criticalAlerts > 1 ? 's' : ''}
            </Badge>
          )}
        </div>
      )}

      {/* === Active Pond Context Bar === */}
      {activePondData && (
        <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white/60 border border-cyan-200/50 backdrop-blur-sm">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className={`w-2 h-2 rounded-full ${activePondData.status === 'active' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            <span className="text-sm font-semibold text-gray-800 truncate">{activePondData.name}</span>
            <span className="text-xs text-gray-500">•</span>
            <span className="text-xs text-gray-500 capitalize">{activePondData.shrimptype}</span>
            <span className="text-xs text-gray-500">•</span>
            <span className="text-xs text-gray-500">Day {activePondData.cycleDay || 0}</span>
          </div>
          {safePonds.length > 1 && (
            <select
              className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white text-gray-600"
              value={activePond}
              onChange={(e) => setActivePond(e.target.value)}
            >
              {safePonds.map((p: any) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          )}
        </div>
      )}

      {/* === Empty State === */}
      {safePonds.length === 0 && (
        <Card className="overflow-hidden relative">
          <CardContent className="pt-10 pb-12 text-center px-6">
            <div className="space-y-6">
              <div className="relative inline-block">
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-blue-100 flex items-center justify-center animate-float shadow-sm mx-auto">
                  <Fish className="h-8 w-8 md:h-10 md:w-10 text-blue-600" />
                </div>
              </div>
              <div className="space-y-2 max-w-lg mx-auto">
                <h3 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Welcome to Your Farm</h3>
                <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">
                  Start by adding your first pond. Our system will help you track feed, growth, expenses, and find the optimal harvest window.
                </p>
              </div>

              {/* Onboarding steps */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 text-sm text-gray-600 dark:text-gray-300 max-w-xl mx-auto">
                <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg px-3 py-2 border border-gray-200 dark:border-gray-700">
                  <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 flex items-center justify-center text-xs font-bold">1</span>
                  <span>Add Pond</span>
                </div>
                <ArrowRight className="h-4 w-4 text-gray-400 dark:text-gray-500 hidden sm:block" />
                <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg px-3 py-2 border border-gray-200 dark:border-gray-700">
                  <span className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 flex items-center justify-center text-xs font-bold">2</span>
                  <span>Log Daily Data</span>
                </div>
                <ArrowRight className="h-4 w-4 text-gray-400 dark:text-gray-500 hidden sm:block" />
                <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg px-3 py-2 border border-gray-200 dark:border-gray-700">
                  <span className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 flex items-center justify-center text-xs font-bold">3</span>
                  <span>Track & Harvest</span>
                </div>
              </div>

              <Button
                onClick={() => setShowAddPond(true)}
                className="gap-2 px-8 py-5 text-base bg-blue-600 hover:bg-blue-700 mt-4"
              >
                <Plus className="h-5 w-5" />
                Add Your First Pond
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* === Critical Alerts === */}
      {safeAlerts.length > 0 && (
        <div className="space-y-2">
          {safeAlerts.slice(0, 3).map((alert: any) => (
            <div
              key={alert.id}
              className={`flex flex-col sm:flex-row items-start sm:items-center gap-3 rounded-xl px-4 py-3 border animate-fade-up ${
                alert.level === 'critical'
                  ? 'border-red-300 bg-red-50/80'
                  : alert.level === 'warning'
                  ? 'border-amber-300 bg-amber-50/80'
                  : 'border-blue-300 bg-blue-50/80'
              }`}
            >
              <AlertTriangle className={`flex-shrink-0 h-4 w-4 ${
                alert.level === 'critical' ? 'text-red-500' : alert.level === 'warning' ? 'text-amber-500' : 'text-blue-500'
              }`} />
              <span className={`flex-1 text-sm ${
                alert.level === 'critical' ? 'text-red-800' : alert.level === 'warning' ? 'text-amber-800' : 'text-blue-800'
              }`}>{alert.message}</span>
              <Button size="sm" variant="outline" className="self-end sm:self-center text-xs">Review</Button>
            </div>
          ))}
        </div>
      )}

      {/* === Main Content Tabs === */}
      {safePonds.length > 0 && (
        <div className="space-y-4">
          <FinancialSummaryCards transactions={shrimpDashboardTransactions} />

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <div className="overflow-x-auto -mx-2 px-2 md:mx-0 md:px-0 pb-1">
              <TabsList className="inline-flex md:grid md:w-full md:grid-cols-10 min-w-max md:min-w-0 bg-white/50 backdrop-blur-sm border border-gray-200/80 rounded-xl p-1 gap-0.5">
                {TAB_CONFIG.map((tab) => (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className="rounded-lg text-xs md:text-sm gap-1.5 data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-blue-500 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200"
                  >
                    <tab.icon className="h-3.5 w-3.5 hidden sm:block" />
                    <span className="sm:hidden">{tab.shortLabel}</span>
                    <span className="hidden sm:inline">{tab.label}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            {/* Dashboard Tab */}
            <TabsContent value="dashboard" className="space-y-4 animate-in fade-in duration-300">
              <ShrimpDashboard
                ponds={safePonds}
                currentPhase={currentPhase}
                alerts={safeAlerts}
                activePond={activePond}
                onPondSelect={setActivePond}
                onDeletePond={deletePond}
              />
            </TabsContent>

            {/* Harvest Estimator Tab (NEW!) */}
            <TabsContent value="harvest" className="space-y-4 animate-in fade-in duration-300">
              {activePond && activePondData ? (
                <HarvestEstimator
                  pondName={activePondData.name}
                  shrimpType={activePondData.shrimptype || 'white'}
                  initialStock={activePondData.currentStock || 0}
                  pondArea={activePondData.area || 0}
                  cycleDay={activePondData.cycleDay || 0}
                  seedDate={activePondData.createdAt}
                />
              ) : (
                <Card>
                  <CardContent className="pt-6 text-center text-gray-600">
                    Select a pond to view harvest projections
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* FCR Engine Tab */}
            <TabsContent value="fcr" className="space-y-4 animate-in fade-in duration-300">
              {activePond && activePondData ? (
                <FCREngine
                  pondName={activePondData.name}
                  shrimpType={activePondData.shrimptype || 'white'}
                  initialStock={activePondData.currentStock || 0}
                  pondArea={activePondData.area || 0}
                  cycleDay={activePondData.cycleDay || 0}
                  pondId={activePond}
                />
              ) : (
                <Card>
                  <CardContent className="pt-6 text-center text-gray-600">
                    Select a pond to use the FCR Engine
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Growth Curve Tab */}
            <TabsContent value="growth" className="space-y-4 animate-in fade-in duration-300">
              {activePond && activePondData ? (
                <GrowthBiomassTracker
                  pondName={activePondData.name}
                  shrimpType={activePondData.shrimptype || 'white'}
                  initialStock={activePondData.currentStock || 0}
                  cycleDay={activePondData.cycleDay || 0}
                  pondId={activePond}
                  farmingType={activePondData.farmingtype}
                />
              ) : (
                <Card>
                  <CardContent className="pt-6 text-center text-gray-600">
                    Select a pond to track growth curves
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Journey Map Tab */}
            <TabsContent value="journey" className="space-y-4 animate-in fade-in duration-300">
              <ProjectJourneyMap
                projectPhase={currentPhase.name}
                currentStage={safePonds.find(p => p.id === activePond)?.currentStage || 'operation'}
                pondName={safePonds.find(p => p.id === activePond)?.name || ''}
                cycleDay={safePonds.find(p => p.id === activePond)?.cycleDay || 0}
                totalCycleDays={120}
              />
            </TabsContent>

            {/* Operations Tab */}
            <TabsContent value="operations" className="space-y-4 animate-in fade-in duration-300">
              <div className="space-y-4">
                <div>
                  <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <ClipboardList className="h-5 w-5 text-cyan-500" />
                    Daily Operations
                  </h2>
                  <div className="grid gap-2 mb-6">
                    {safePonds.map((pond: any) => (
                      <div
                        key={pond.id}
                        className={`rounded-xl p-3 cursor-pointer transition-all duration-200 ${
                          activePond === pond.id
                            ? 'border-2 border-cyan-400 bg-cyan-50/80 shadow-sm'
                            : 'border border-gray-200 hover:bg-gray-50 hover:border-cyan-200'
                        }`}
                        onClick={() => setActivePond(pond.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="min-w-0 flex-1">
                            <h3 className="font-semibold text-gray-900">{pond.name}</h3>
                            <p className="text-xs text-gray-600">
                              {(pond.currentStock || 0).toLocaleString()} shrimp | {pond.shrimpType} | Day {pond.cycleDay || 0}
                            </p>
                          </div>
                          <Badge variant={pond.status === 'active' ? 'default' : 'secondary'} className="capitalize text-xs">
                            {pond.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                {activePond && (
                  <DailyLogForm
                    pondId={activePond}
                    pondName={safePonds.find(p => p.id === activePond)?.name || ''}
                  />
                )}
              </div>
            </TabsContent>

            {/* Feed Chart Tab */}
            <TabsContent value="status" className="space-y-4 animate-in fade-in duration-300">
              {activePond && activePondData ? (
                <FeedingSchedulePlanner
                  pondName={activePondData.name}
                  initialStock={activePondData.currentStock}
                />
              ) : (
                <Card>
                  <CardContent className="pt-6 text-center text-gray-600">
                    Please select a pond to view feed projections
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Documents Tab */}
            <TabsContent value="documents" className="space-y-4 animate-in fade-in duration-300">
              {activePond ? (
                <DocumentUploadComponent
                  pondId={activePond}
                    pondName={safePonds.find(p => p.id === activePond)?.name || ''}
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

            {/* Reports Tab */}
            <TabsContent value="reports" className="space-y-4 animate-in fade-in duration-300">
              {activePond && activePondData ? (
                <FinancialDashboard
                  pondId={activePond}
                  linkedProjectId={activePondData.linkedprojectid ?? null}
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
        </div>
      )}

      <AddPondDialog
        open={showAddPond}
        onOpenChange={setShowAddPond}
        onCreated={(id: string) => {
          if (id) setActivePond(id);
        }}
      />
      <QuickSeedDialog
        open={showQuickSeed}
        onOpenChange={setShowQuickSeed}
        onSeeded={(id: string) => {
          if (id) setActivePond(id);
        }}
      />
      <ImageUploadDialog open={showImageUpload} onOpenChange={setShowImageUpload} />

      {/* Floating Chatbot */}
      <ShrimpChatBot pondId={activePond} />
    </div>
  );
}
