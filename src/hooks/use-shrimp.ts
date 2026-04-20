'use client';
import { useClient } from '@/context/client-context';

import { useState, useEffect } from 'react';
import { differenceInDays } from 'date-fns';
import { db, getDbForClient } from '@/lib/firebase';
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
  stockingDate?: string;  // ISO date — when shrimp were seeded; used to compute cycleDay dynamically
  currentPhase?: string;
  currentStage?: 'planning' | 'preparation' | 'stocking' | 'operation' | 'harvest';
  cycleDay?: number;
  linkedProjectId?: string | null;
  // Metrics are calculated from daily logs - may not exist for new ponds
  metrics?: {
    fcr: number;
    survivalRate: number;
    avgWeight: number;
    feeding?: number;
  };
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

export interface Document {
  id: string;
  pondId: string;
  name: string;
  type: 'soil-testing' | 'water-testing' | 'feed-analysis' | 'health-report' | 'shrimp-health-image' | 'pond-condition' | 'equipment-photo' | 'unknown';
  uploadDate: string;
  confidence: number;
  fileSize: string;
  aiAnalysis?: string;
  isImage?: boolean;
  minerals?: Record<string, number>;
  previewData?: string;
  url?: string;
}

export interface ImageAnalysis {
  id: string;
  pondId: string;
  name: string;
  uploadDate: string;
  uploadDay: number;
  phase: string;
  type: 'shrimp-health-image' | 'pond-condition' | 'equipment-photo';
  aiAnalysis: string;
  confidence: number;
  fileSize: string;
  previewData?: string;
  url?: string;
}

export function usePonds() {
    const { clientId } = useClient();
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

    const pondsRef = ref(getDbForClient(clientId), `clients/${clientId}/shrimp/${selectedProfile}/ponds`);
    console.log('usePonds: Setting up listener at', `shrimp/${selectedProfile}/ponds`);
    
    const unsubscribe = onValue(pondsRef, (snapshot) => {
      const data = snapshot.val();
      console.log('usePonds: Firebase snapshot received, data =', data);
      if (data) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const pondsArray = Object.entries(data).map(([id, pond]: [string, any]) => {
          // Compute cycleDay dynamically so it increments with each passing day
          const refDate = pond.stockingDate || pond.createdAt;
          const dynamicCycleDay = refDate
            ? Math.max(0, differenceInDays(today, new Date(refDate)))
            : (pond.cycleDay || 0);
          return {
            id,
            ...pond,
            // Sanitize numeric fields — Firebase may return them as undefined or string
            currentStock: Number(pond.currentStock) || 0,
            seedAmount:   Number(pond.seedAmount)   || 0,
            expectedCount: Number(pond.expectedCount) || 0,
            area:         Number(pond.area)         || 0,
            length:       Number(pond.length)       || 0,
            width:        Number(pond.width)        || 0,
            depth:        Number(pond.depth)        || 0,
            targetDensity: Number(pond.targetDensity) || 0,
            cycleDay: dynamicCycleDay,
          };
        });
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

    const pondsRef = ref(getDbForClient(clientId), `clients/${clientId}/shrimp/${selectedProfile}/ponds`);
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

    const pondRef = ref(getDbForClient(clientId), `clients/${clientId}/shrimp/${selectedProfile}/ponds/${pondId}`);
    await update(pondRef, updates);
  };

  const deletePond = async (pondId: string) => {
    if (!selectedProfile) return;

    const pondRef = ref(getDbForClient(clientId), `clients/${clientId}/shrimp/${selectedProfile}/ponds/${pondId}`);
    await remove(pondRef);
  };

  return { ponds, loading, addPond, updatePond, deletePond };
}

export function useAlerts() {
    const { clientId } = useClient();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const { selectedProfile } = useUser();

  useEffect(() => {
    if (!selectedProfile) {
      setAlerts([]);
      setLoading(false);
      return;
    }

    const alertsRef = ref(getDbForClient(clientId), `clients/${clientId}/shrimp/${selectedProfile}/alerts`);
    
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

    const alertsRef = ref(getDbForClient(clientId), `clients/${clientId}/shrimp/${selectedProfile}/alerts`);
    const newAlertRef = push(alertsRef);
    
    await set(newAlertRef, {
      ...alertData,
      createdAt: new Date().toISOString(),
    });

    return newAlertRef.key;
  };

  const deleteAlert = async (alertId: string) => {
    if (!selectedProfile) return;

    const alertRef = ref(getDbForClient(clientId), `clients/${clientId}/shrimp/${selectedProfile}/alerts/${alertId}`);
    await remove(alertRef);
  };

  return { alerts, loading, addAlert, deleteAlert };
}

export function useInventory() {
    const { clientId } = useClient();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { selectedProfile } = useUser();

  useEffect(() => {
    if (!selectedProfile) {
      setItems([]);
      setLoading(false);
      return;
    }

    const invRef = ref(getDbForClient(clientId), `clients/${clientId}/shrimp/${selectedProfile}/inventory`);
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
    const invRef = ref(getDbForClient(clientId), `clients/${clientId}/shrimp/${selectedProfile}/inventory`);
    const newRef = push(invRef);
    await set(newRef, { ...item, updatedAt: new Date().toISOString() });
    return newRef.key;
  };

  const updateItem = async (id: string, updates: Partial<InventoryItem>) => {
    if (!selectedProfile) return;
    const itemRef = ref(getDbForClient(clientId), `clients/${clientId}/shrimp/${selectedProfile}/inventory/${id}`);
    await update(itemRef, { ...updates, updatedAt: new Date().toISOString() });
  };

  const deleteItem = async (id: string) => {
    if (!selectedProfile) return;
    const itemRef = ref(getDbForClient(clientId), `clients/${clientId}/shrimp/${selectedProfile}/inventory/${id}`);
    await remove(itemRef);
  };

  return { items, loading, addItem, updateItem, deleteItem };
}

export function useDocuments(pondId: string) {
    const { clientId } = useClient();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const { selectedProfile } = useUser();

  useEffect(() => {
    if (!selectedProfile || !pondId) {
      setDocuments([]);
      setLoading(false);
      return;
    }

    const docsRef = ref(getDbForClient(clientId), `clients/${clientId}/shrimp/${selectedProfile}/documents/${pondId}`);
    const unsubscribe = onValue(docsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.entries(data).map(([id, doc]: [string, any]) => ({ id, ...doc }));
        list.sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime());
        setDocuments(list);
      } else {
        setDocuments([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [selectedProfile, pondId]);

  const addDocument = async (doc: Omit<Document, 'id'>) => {
    if (!selectedProfile || !pondId) return;
    const docsRef = ref(getDbForClient(clientId), `clients/${clientId}/shrimp/${selectedProfile}/documents/${pondId}`);
    const newRef = push(docsRef);
    await set(newRef, doc);
    return newRef.key;
  };

  const deleteDocument = async (id: string) => {
    if (!selectedProfile || !pondId) return;
    const docRef = ref(getDbForClient(clientId), `clients/${clientId}/shrimp/${selectedProfile}/documents/${pondId}/${id}`);
    await remove(docRef);
  };

  return { documents, loading, addDocument, deleteDocument };
}

export function useImageAnalysis(pondId: string) {
    const { clientId } = useClient();
  const [images, setImages] = useState<ImageAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const { selectedProfile } = useUser();

  useEffect(() => {
    if (!selectedProfile || !pondId) {
      setImages([]);
      setLoading(false);
      return;
    }

    const imagesRef = ref(getDbForClient(clientId), `clients/${clientId}/shrimp/${selectedProfile}/images/${pondId}`);
    const unsubscribe = onValue(imagesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.entries(data).map(([id, img]: [string, any]) => ({ id, ...img }));
        list.sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime());
        setImages(list);
      } else {
        setImages([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [selectedProfile, pondId]);

  const addImage = async (img: Omit<ImageAnalysis, 'id'>) => {
    if (!selectedProfile || !pondId) return;
    const imagesRef = ref(getDbForClient(clientId), `clients/${clientId}/shrimp/${selectedProfile}/images/${pondId}`);
    const newRef = push(imagesRef);
    await set(newRef, img);
    return newRef.key;
  };

  const deleteImage = async (id: string) => {
    if (!selectedProfile || !pondId) return;
    const imgRef = ref(getDbForClient(clientId), `clients/${clientId}/shrimp/${selectedProfile}/images/${pondId}/${id}`);
    await remove(imgRef);
  };

  return { images, loading, addImage, deleteImage };
}
