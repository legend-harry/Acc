"use client";

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from 'lucide-react';
import { useInventory, useLowStockItems } from "@/hooks/use-farming";
import { Skeleton } from "@/components/ui/skeleton";
import type { InventoryItem, InventoryItemType } from "@/types";

export function InventoryList() {
  const { inventory, loading } = useInventory();
  const { lowStockItems } = useLowStockItems();

  const groupedByType = useMemo(() => {
    const grouped: Record<InventoryItemType, InventoryItem[]> = {
      feed: [],
      minerals: [],
      chemicals: [],
      medicine: [],
      equipment: [],
      other: []
    };

    inventory.forEach(item => {
      grouped[item.type].push(item);
    });

    return grouped;
  }, [inventory]);

  if (loading && inventory.length === 0) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Array.from({ length: 2 }).map((_, j) => (
                  <Skeleton key={j} className="h-20 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {lowStockItems.length > 0 && (
        <Alert className="border-orange-200 bg-orange-50 animate-in fade-in slide-in-from-top-2 duration-300">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            {lowStockItems.length} item(s) below minimum threshold. Reorder soon!
          </AlertDescription>
        </Alert>
      )}

      {Object.entries(groupedByType).map(([type, items]) => (
        items.length > 0 && (
          <Card key={type} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <CardHeader>
              <CardTitle className="text-lg capitalize">{type}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {items.map((item, index) => {
                  const stockPercentage = (item.quantity / item.reorderQuantity) * 100;
                  const isLow = item.quantity <= item.minimumThreshold;
                  const isExpiringSoon = item.expiryDate && new Date(item.expiryDate) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

                  return (
                    <div
                      key={item.id}
                      className="p-4 border rounded-lg hover:bg-muted/50 transition-colors duration-200 animate-in fade-in slide-in-from-left-1"
                      style={{
                        animationDelay: `${index * 50}ms`
                      }}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold">{item.name}</h3>
                            {isLow && (
                              <Badge variant="destructive" className="animate-pulse">Low Stock</Badge>
                            )}
                            {isExpiringSoon && (
                              <Badge variant="outline" className="border-orange-500 text-orange-700">Expiring Soon</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {item.supplier && `Supplier: ${item.supplier}`}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold">
                            {item.quantity}
                            <span className="text-sm text-muted-foreground ml-1">{item.unit}</span>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            ₹{(item.quantity * item.unitCost).toFixed(2)}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Stock Level</span>
                          <span>{Math.min(100, Math.round(stockPercentage))}%</span>
                        </div>
                        <Progress
                          value={Math.min(100, stockPercentage)}
                          className="h-2"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground pt-1">
                          <span>Min: {item.minimumThreshold}{item.unit}</span>
                          <span>Reorder: {item.reorderQuantity}{item.unit}</span>
                        </div>
                      </div>

                      {item.expiryDate && (
                        <div className="text-xs text-muted-foreground mt-2 pt-2 border-t">
                          Expires: {new Date(item.expiryDate).toLocaleDateString()}
                        </div>
                      )}

                      {item.notes && (
                        <div className="text-xs text-muted-foreground mt-2 pt-2 border-t italic">
                          {item.notes}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )
      ))}

      {inventory.length === 0 && !loading && (
        <Card className="animate-in fade-in duration-300">
          <CardContent className="pt-8">
            <div className="text-center text-muted-foreground">
              <p>No inventory items yet. Add your first item to get started!</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
