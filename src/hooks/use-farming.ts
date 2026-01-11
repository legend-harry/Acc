"use client";

import { useState, useEffect } from 'react';
import { ref, onValue, off } from 'firebase/database';
import { db } from '@/lib/firebase';
import type { InventoryItem, Pond, PondActivity, FarmingStats } from '@/types';

export function useInventory() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const inventoryRef = ref(db, 'farming/inventory');

    const listener = onValue(inventoryRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const items: InventoryItem[] = Object.keys(data).map(key => ({
          ...data[key],
          id: key
        }));
        setInventory(items);
      } else {
        setInventory([]);
      }
      setLoading(false);
    });

    return () => {
      off(inventoryRef, 'value', listener);
    };
  }, []);

  return { inventory, loading };
}

export function usePonds() {
  const [ponds, setPonds] = useState<Pond[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const pondsRef = ref(db, 'farming/ponds');

    const listener = onValue(pondsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const pondList: Pond[] = Object.keys(data).map(key => ({
          ...data[key],
          id: key
        }));
        setPonds(pondList);
      } else {
        setPonds([]);
      }
      setLoading(false);
    });

    return () => {
      off(pondsRef, 'value', listener);
    };
  }, []);

  return { ponds, loading };
}

export function usePondActivities(pondId?: string) {
  const [activities, setActivities] = useState<PondActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const activitiesRef = ref(db, 'farming/activities');

    const listener = onValue(activitiesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        let activityList: PondActivity[] = Object.keys(data).map(key => ({
          ...data[key],
          id: key
        }));

        // Filter by pondId if provided
        if (pondId) {
          activityList = activityList.filter(a => a.pondId === pondId);
        }

        // Sort by date descending
        activityList.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        setActivities(activityList);
      } else {
        setActivities([]);
      }
      setLoading(false);
    });

    return () => {
      off(activitiesRef, 'value', listener);
    };
  }, [pondId]);

  return { activities, loading };
}

export function useFarmingStats() {
  const { ponds } = usePonds();
  const { inventory } = useInventory();
  const { activities } = usePondActivities();
  const [stats, setStats] = useState<FarmingStats>({
    totalPonds: 0,
    activePonds: 0,
    totalStockValue: 0,
    feedUsageThisMonth: 0,
    averageSurvivalRate: 0
  });

  useEffect(() => {
    const activePonds = ponds.filter(p => p.status === 'active');
    const totalStockValue = inventory.reduce((sum, item) => sum + (item.quantity * item.unitCost), 0);

    // Calculate feed usage this month
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const feedUsage = activities
      .filter(a => a.type === 'feeding' && a.date >= monthStart)
      .reduce((sum, a) => sum + (a.quantity || 0), 0);

    setStats({
      totalPonds: ponds.length,
      activePonds: activePonds.length,
      totalStockValue,
      feedUsageThisMonth: feedUsage,
      averageSurvivalRate: 85 // This would be calculated from harvest data
    });
  }, [ponds, inventory, activities]);

  return stats;
}

export function useLowStockItems() {
  const { inventory } = useInventory();
  const [lowStockItems, setLowStockItems] = useState<InventoryItem[]>([]);

  useEffect(() => {
    const low = inventory.filter(item => item.quantity <= item.minimumThreshold);
    setLowStockItems(low);
  }, [inventory]);

  return { lowStockItems };
}
