'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { ref, onValue, push, set, remove, update } from 'firebase/database';
import { useUser } from '@/context/user-context';

export interface Pond {
  id: string;
  name: string;
  area: number;
  length: number;
  width: number;
  depth: number;
  shrimpType: 'white' | 'tiger' | 'giant';
  farmingType: 'extensive' | 'semi-intensive' | 'intensive';
  targetDensity: number;
  seedAmount: number;
  expectedCount: number;
  waterSource: string;
  currentStock: number;
  status: 'active' | 'preparing' | 'harvesting' | 'resting';
  createdAt: string;
  currentPhase?: string;
  cycleDay?: number;
  linkedProjectId?: string | null;
}

export interface Alert {
  id: string;
  level: 'critical' | 'warning' | 'info';
  message: string;
  pondId: string | null;
  createdAt: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: 'feed' | 'equipment' | 'medication' | 'consumable' | 'other';
  quantity: number;
  unit: string;
  location?: string;
  reorderPoint?: number;
  notes?: string;
  updatedAt: string;
}

export function usePonds() {
  const [ponds, setPonds] = useState<Pond[]>([]);
  const [loading, setLoading] = useState(true);
  const { selectedProfile } = useUser();

  useEffect(() => {
    // Debug log
    console.log('usePonds: selectedProfile =', selectedProfile);
    
    if (!selectedProfile) {
      console.log('usePonds: No selectedProfile, clearing ponds');
      setPonds([]);
      setLoading(false);
      return;
    }

    const pondsRef = ref(db, `shrimp/${selectedProfile}/ponds`);
    console.log('usePonds: Setting up listener at', `shrimp/${selectedProfile}/ponds`);
    
    const unsubscribe = onValue(pondsRef, (snapshot) => {
      const data = snapshot.val();
      console.log('usePonds: Firebase snapshot received, data =', data);
      if (data) {
        const pondsArray = Object.entries(data).map(([id, pond]: [string, any]) => ({
          id,
          ...pond,
        }));
        console.log('usePonds: Setting ponds array:', pondsArray);
        setPonds(pondsArray);
      } else {
        console.log('usePonds: No data from Firebase');
        setPonds([]);
      }
      setLoading(false);
    }, (error) => {
      console.error('usePonds: Firebase read error:', error);
      setLoading(false);
    });

    return () => {
      console.log('usePonds: Cleanup listener');
      unsubscribe();
    };
  }, [selectedProfile]);

  const addPond = async (pondData: Omit<Pond, 'id' | 'createdAt'>) => {
    if (!selectedProfile) {
      console.error('addPond: No selectedProfile set');
      return;
    }

    console.log('addPond: Creating pond with profile:', selectedProfile);
    console.log('addPond: Pond data:', pondData);

    const pondsRef = ref(db, `shrimp/${selectedProfile}/ponds`);
    const newPondRef = push(pondsRef);
    
    try {
      await set(newPondRef, {
        ...pondData,
        createdAt: new Date().toISOString(),
      });
      console.log('addPond: Successfully saved pond with ID:', newPondRef.key);
    } catch (error) {
      console.error('addPond: Firebase write error:', error);
      throw error;
    }

    return newPondRef.key;
  };

  const updatePond = async (pondId: string, updates: Partial<Pond>) => {
    if (!selectedProfile) return;

    const pondRef = ref(db, `shrimp/${selectedProfile}/ponds/${pondId}`);
    await update(pondRef, updates);
  };

  const deletePond = async (pondId: string) => {
    if (!selectedProfile) return;

    const pondRef = ref(db, `shrimp/${selectedProfile}/ponds/${pondId}`);
    await remove(pondRef);
  };

  return { ponds, loading, addPond, updatePond, deletePond };
}

export function useAlerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const { selectedProfile } = useUser();

  useEffect(() => {
    if (!selectedProfile) {
      setAlerts([]);
      setLoading(false);
      return;
    }

    const alertsRef = ref(db, `shrimp/${selectedProfile}/alerts`);
    
    const unsubscribe = onValue(alertsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const alertsArray = Object.entries(data).map(([id, alert]: [string, any]) => ({
          id,
          ...alert,
        }));
        // Sort by createdAt descending
        alertsArray.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setAlerts(alertsArray);
      } else {
        setAlerts([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [selectedProfile]);

  const addAlert = async (alertData: Omit<Alert, 'id' | 'createdAt'>) => {
    if (!selectedProfile) return;

    const alertsRef = ref(db, `shrimp/${selectedProfile}/alerts`);
    const newAlertRef = push(alertsRef);
    
    await set(newAlertRef, {
      ...alertData,
      createdAt: new Date().toISOString(),
    });

    return newAlertRef.key;
  };

  const deleteAlert = async (alertId: string) => {
    if (!selectedProfile) return;

    const alertRef = ref(db, `shrimp/${selectedProfile}/alerts/${alertId}`);
    await remove(alertRef);
  };

  return { alerts, loading, addAlert, deleteAlert };
}

export function useInventory() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { selectedProfile } = useUser();

  useEffect(() => {
    if (!selectedProfile) {
      setItems([]);
      setLoading(false);
      return;
    }

    const invRef = ref(db, `shrimp/${selectedProfile}/inventory`);
    const unsubscribe = onValue(invRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.entries(data).map(([id, item]: [string, any]) => ({ id, ...item }));
        // sort by updatedAt desc
        list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        setItems(list);
      } else {
        setItems([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [selectedProfile]);

  const addItem = async (item: Omit<InventoryItem, 'id' | 'updatedAt'>) => {
    if (!selectedProfile) return;
    const invRef = ref(db, `shrimp/${selectedProfile}/inventory`);
    const newRef = push(invRef);
    await set(newRef, { ...item, updatedAt: new Date().toISOString() });
    return newRef.key;
  };

  const updateItem = async (id: string, updates: Partial<InventoryItem>) => {
    if (!selectedProfile) return;
    const itemRef = ref(db, `shrimp/${selectedProfile}/inventory/${id}`);
    await update(itemRef, { ...updates, updatedAt: new Date().toISOString() });
  };

  const deleteItem = async (id: string) => {
    if (!selectedProfile) return;
    const itemRef = ref(db, `shrimp/${selectedProfile}/inventory/${id}`);
    await remove(itemRef);
  };

  return { items, loading, addItem, updateItem, deleteItem };
}
