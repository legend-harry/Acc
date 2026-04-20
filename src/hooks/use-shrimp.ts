"use client";

import { useState, useEffect } from 'react';
import { differenceInDays } from 'date-fns';
import { useClient } from '@/context/client-context';
import { useUser } from '@/context/user-context';
import { createClient } from '@/lib/supabase/client';

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
  stockingDate?: string;
  currentPhase?: string;
  currentStage?: 'planning' | 'preparation' | 'stocking' | 'operation' | 'harvest';
  cycleDay?: number;
  linkedProjectId?: string | null;
  metrics?: { fcr: number; survivalRate: number; avgWeight: number; feeding?: number; };
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
    category: 'feed' | 'equipment' | 'medication' | 'consumable' | 'other';
    name: string;
    quantity: number;
    unit: string;
    location?: string;
    updatedAt: string;
}

export interface Document {
    id: string;
    type: string;
    name: string;
    pondId: string;
    uploadDate: string;
    confidence: number;
    fileSize: string;
}

export interface ImageAnalysis {
    id: string;
    type: string;
    name: string;
    pondId: string;
    uploadDate: string;
    uploadDay: number;
    phase: string;
    aiAnalysis: string;
    confidence: number;
    fileSize: string;
}

export function usePonds() {
  const { clientId } = useClient();
  const { selectedProfile } = useUser();
  const [ponds, setPonds] = useState<Pond[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    if (!clientId || !selectedProfile) {
      setPonds([]);
      setLoading(false);
      return;
    }

    const fetchPonds = async () => {
      const { data } = await supabase
        .from('ponds')
        .select('*')
        .eq('client_id', clientId)
        .eq('profile_id', selectedProfile);
        
      if (data) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const pondsArray = data.map(pond => {
          const refDate = pond.stockingDate || pond.created_at;
          const dynamicCycleDay = refDate ? Math.max(0, differenceInDays(today, new Date(refDate))) : (pond.cycleDay || 0);
          return {
            ...pond,
            createdAt: pond.created_at,
            cycleDay: dynamicCycleDay
          } as unknown as Pond;
        });
        setPonds(pondsArray);
      }
      setLoading(false);
    };

    fetchPonds();
    const ch = supabase.channel(`_${Math.random()}`).on('postgres_changes', { event: '*', schema: 'public', table: 'ponds', filter: `client_id=eq.${clientId}` }, fetchPonds).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [clientId, selectedProfile]);

  const addPond = async (pondData: Omit<Pond, 'id' | 'createdAt'>) => {
    if (!clientId || !selectedProfile) return;
    const { data } = await supabase.from('ponds').insert([{ ...pondData, client_id: clientId, profile_id: selectedProfile }]).select('id').single();
    return data?.id;
  };

  const updatePond = async (pondId: string, updates: Partial<Pond>) => {
    await supabase.from('ponds').update(updates).eq('id', pondId).eq('client_id', clientId);
  };

  const deletePond = async (pondId: string) => {
    await supabase.from('ponds').delete().eq('id', pondId).eq('client_id', clientId);
  };

  return { ponds, loading, addPond, updatePond, deletePond };
}

export function useAlerts() {
  const { clientId } = useClient();
  const { selectedProfile } = useUser();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    if (!clientId || !selectedProfile) {
      setAlerts([]);
      setLoading(false);
      return;
    }

    const fetchAlerts = async () => {
      const { data } = await supabase.from('alerts').select('*').eq('client_id', clientId).eq('profile_id', selectedProfile).order('created_at', { ascending: false });
      if (data) {
          setAlerts(data.map(d => ({ ...d, createdAt: d.created_at })) as unknown as Alert[]);
      }
      setLoading(false);
    };

    fetchAlerts();
    const ch = supabase.channel(`_${Math.random()}`).on('postgres_changes', { event: '*', schema: 'public', table: 'alerts', filter: `client_id=eq.${clientId}` }, fetchAlerts).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [clientId, selectedProfile]);

  const addAlert = async (alertData: Omit<Alert, 'id' | 'createdAt'>) => {
      if (!clientId || !selectedProfile) return;
      const { data } = await supabase.from('alerts').insert([{ ...alertData, client_id: clientId, profile_id: selectedProfile }]).select('id').single();
      return data?.id;
  };

  const deleteAlert = async (alertId: string) => {
      await supabase.from('alerts').delete().eq('id', alertId).eq('client_id', clientId);
  };

  return { alerts, loading, addAlert, deleteAlert };
}

// Stubs for remaining hooks heavily simplified to array returns
export function useInventory() {
    const [inventory, setInventory] = useState<InventoryItem[]>([]);
    return { inventory, loading: false, addInventoryItem: async() => {}, updateInventoryItem: async() => {}, deleteInventoryItem: async() => {} };
}
export function useTransactionsForPond() { return { transactions: [], loading: false, addTransaction: async() => {}, updateTransaction: async() => {}, deleteTransaction: async() => {} }; }
export function useDailyLogs() { return { dailyLogs: [], loading: false, addDailyLog: async() => {}, updateDailyLog: async() => {}, deleteDailyLog: async() => {} }; }
export function useDocuments() { return { documents: [], loading: false, addDocument: async() => {}, deleteDocument: async() => {} }; }
export function useImageAnalyses() { return { imageAnalyses: [], loading: false, addImageAnalysis: async() => {}, deleteImageAnalysis: async() => {} }; }
