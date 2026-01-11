"use client";

import { useState } from 'react';
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus } from 'lucide-react';
import { useFarmingStats, usePondActivities, usePonds } from "@/hooks/use-farming";
import { InventoryList } from "@/components/inventory-list";
import { AddInventoryDialog } from "@/components/add-inventory-dialog";
import { Skeleton } from "@/components/ui/skeleton";

export default function FarmingPage() {
  const [showAddInventory, setShowAddInventory] = useState(false);
  const { stats, loading: statsLoading } = useFarmingStats();
  const { ponds, loading: pondsLoading } = usePonds();
  const { activities, loading: activitiesLoading } = usePondActivities();

  const StatCard = ({ title, value, description }: { title: string; value: string | number; description?: string }) => (
    <Card className="animate-in fade-in slide-in-from-bottom-2 duration-300">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
      </CardContent>
    </Card>
  );

  const SkeletonStat = () => (
    <Card>
      <CardHeader className="pb-2">
        <Skeleton className="h-4 w-24" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-16 mb-1" />
        <Skeleton className="h-3 w-32" />
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-8">
      <PageHeader title="Farming Management" description="Track ponds, inventory, and activities" />

      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statsLoading ? (
          <>
            <SkeletonStat />
            <SkeletonStat />
            <SkeletonStat />
            <SkeletonStat />
          </>
        ) : (
          <>
            <StatCard
              title="Total Ponds"
              value={stats?.totalPonds || 0}
              description="Across all cycles"
            />
            <StatCard
              title="Active Ponds"
              value={stats?.activePonds || 0}
              description="Currently in production"
            />
            <StatCard
              title="Total Stock Value"
              value={`₹${(stats?.totalStockValue || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
              description="Inventory value"
            />
            <StatCard
              title="Survival Rate"
              value={`${(stats?.averageSurvivalRate || 0).toFixed(1)}%`}
              description="Average across ponds"
            />
          </>
        )}
      </div>

      <Tabs defaultValue="inventory" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="activities">Activities</TabsTrigger>
          <TabsTrigger value="ponds">Ponds</TabsTrigger>
        </TabsList>

        {/* Inventory Tab */}
        <TabsContent value="inventory" className="space-y-4 animate-in fade-in duration-300">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold">Feed & Supplies Inventory</h2>
              <p className="text-sm text-muted-foreground">Track feed, minerals, chemicals, and equipment</p>
            </div>
            <Button
              onClick={() => setShowAddInventory(true)}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Item
            </Button>
          </div>
          <InventoryList />
          <AddInventoryDialog open={showAddInventory} onOpenChange={setShowAddInventory} />
        </TabsContent>

        {/* Activities Tab */}
        <TabsContent value="activities" className="space-y-4 animate-in fade-in duration-300">
          <div>
            <h2 className="text-xl font-semibold">Recent Activities</h2>
            <p className="text-sm text-muted-foreground">Track feeding, cleaning, health checks, and more</p>
          </div>

          {activitiesLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="pt-6">
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : activities.length > 0 ? (
            <div className="space-y-3">
              {activities.map((activity, index) => (
                <Card
                  key={activity.id}
                  className="animate-in fade-in slide-in-from-left-1"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold capitalize">{activity.type}</h3>
                          <span className="text-xs bg-muted px-2 py-1 rounded">
                            {activity.pondId ? `Pond ${activity.pondId.slice(0, 8)}` : 'General'}
                          </span>
                        </div>
                        {activity.description && (
                          <p className="text-sm text-muted-foreground mb-2">{activity.description}</p>
                        )}
                        {activity.quantity && (
                          <p className="text-sm text-muted-foreground">
                            Quantity: {activity.quantity} {activity.unit}
                          </p>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground text-right">
                        {new Date(activity.timestamp).toLocaleDateString()} at{' '}
                        {new Date(activity.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="animate-in fade-in duration-300">
              <CardContent className="pt-8">
                <div className="text-center text-muted-foreground">
                  <p>No activities recorded yet. Start tracking your farm operations!</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Ponds Tab */}
        <TabsContent value="ponds" className="space-y-4 animate-in fade-in duration-300">
          <div>
            <h2 className="text-xl font-semibold">Ponds</h2>
            <p className="text-sm text-muted-foreground">Monitor water quality and stock status</p>
          </div>

          {pondsLoading ? (
            <div className="grid gap-4 md:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-5 w-24 mb-2" />
                    <Skeleton className="h-4 w-32" />
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {Array.from({ length: 3 }).map((_, j) => (
                      <Skeleton key={j} className="h-4 w-full" />
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : ponds.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {ponds.map((pond, index) => (
                <Card
                  key={pond.id}
                  className="animate-in fade-in slide-in-from-bottom-2 duration-300"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle>{pond.name}</CardTitle>
                        <CardDescription>Area: {pond.area} sq.m</CardDescription>
                      </div>
                      <span
                        className={`text-xs px-2 py-1 rounded font-semibold ${
                          pond.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : pond.status === 'preparing'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {pond.status}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Current Stock</p>
                        <p className="text-lg font-semibold">{pond.currentStock}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Capacity</p>
                        <p className="text-lg font-semibold">{pond.capacity}</p>
                      </div>
                    </div>

                    {pond.waterQuality && (
                      <div className="pt-4 border-t space-y-2">
                        <p className="text-xs font-semibold text-muted-foreground">Water Quality</p>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          {pond.waterQuality.pH && (
                            <div>
                              <span className="text-muted-foreground">pH:</span> {pond.waterQuality.pH}
                            </div>
                          )}
                          {pond.waterQuality.temperature && (
                            <div>
                              <span className="text-muted-foreground">Temp:</span> {pond.waterQuality.temperature}°C
                            </div>
                          )}
                          {pond.waterQuality.dissolvedOxygen && (
                            <div>
                              <span className="text-muted-foreground">DO:</span> {pond.waterQuality.dissolvedOxygen} ppm
                            </div>
                          )}
                          {pond.waterQuality.ammonia && (
                            <div>
                              <span className="text-muted-foreground">NH₃:</span> {pond.waterQuality.ammonia} ppm
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="animate-in fade-in duration-300">
              <CardContent className="pt-8">
                <div className="text-center text-muted-foreground">
                  <p>No ponds registered yet. Add your first pond to get started!</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
