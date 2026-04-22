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
  shrimptype: 'white' | 'tiger' | 'giant';
  farmingtype: 'extensive' | 'semi-intensive' | 'intensive';
  targetDensity: number;
  seedAmount: number;
  expectedCount: number;
  waterSource: string;
  currentStock: number;
  status: 'active' | 'preparing' | 'harvesting' | 'resting';
  createdAt: string;
  stockingdate?: string;
  currentPhase?: string;
  currentStage?: 'planning' | 'preparation' | 'stocking' | 'operation' | 'harvest';
  cycleDay?: number;
  linkedprojectid?: string | null;
  metrics?: { fcr: number; survivalRate: number; avgWeight: number; feeding?: number; };
}

export interface Alert {
  id: string;
  level: 'critical' | 'warning' | 'info';
  message: string;
  pondid: string | null;
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
      // Build query — only apply profile_id filter if selectedProfile is set,
      // so ponds that were created without a profile_id still appear.
      let query = supabase
        .from('ponds')
        .select('*')
        .eq('client_id', clientId);

      if (selectedProfile) {
        query = query.eq('profile_id', selectedProfile);
      }

      const { data } = await query;
        
      if (data) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const pondsArray = data.map(pond => {
          const refDate = pond.stockingdate || pond.stocking_date || pond.created_at;
          const dynamicCycleDay = refDate ? Math.max(0, differenceInDays(today, new Date(refDate))) : (pond.cycleDay || 0);
          return {
            ...pond,
            createdAt: pond.created_at,
            cycleDay: dynamicCycleDay,
            // Normalise all possible snake_case / combined column names → camelCase
            shrimpType: pond.shrimp_type     ?? pond.shrimptype     ?? '',
            farmingType: pond.farming_type    ?? pond.farmingtype    ?? '',
            targetDensity: pond.target_density  ?? pond.targetDensity  ?? 0,
            seedAmount: pond.seed_amount     ?? pond.seedAmount     ?? 0,
            expectedCount: pond.expected_count  ?? pond.expectedCount  ?? 0,
            currentStock: pond.current_stock   ?? pond.currentStock   ?? 0,
            stockingdate: pond.stockingdate    ?? pond.stocking_date  ?? null,
            linkedprojectid: pond.linkedprojectid ?? pond.linked_project_id ?? null,
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
    if (!clientId) return;
    // Explicitly map to lowercase DB column names (PostgreSQL folds unquoted identifiers)
    const dbRecord = {
      client_id: clientId,
      profile_id: selectedProfile || '',
      name: pondData.name,
      area: pondData.area ?? 0,
      length: pondData.length ?? 0,
      width: pondData.width ?? 0,
      shrimptype: pondData.shrimptype ?? pondData.shrimpType ?? '',
      farmingtype: pondData.farmingtype ?? pondData.farmingType ?? '',
      targetdensity: pondData.targetDensity ?? 0,
      seedamount: pondData.seedAmount ?? 0,
      expectedcount: pondData.expectedCount ?? 0,
      watersource: pondData.waterSource ?? '',
      currentstock: pondData.currentStock ?? 0,
      status: pondData.status ?? 'active',
      stockingdate: pondData.stockingdate ?? null,
      currentphase: (pondData as any).currentPhase ?? '',
      currentstage: (pondData as any).currentStage ?? 'planning',
      cycleday: pondData.cycleDay ?? 0,
      linkedprojectid: pondData.linkedprojectid ?? null,
    };
    // Core-only record (base schema without migration)
    const coreRecord = {
      client_id: clientId,
      profile_id: selectedProfile || '',
      name: pondData.name,
      area: pondData.area ?? 0,
      shrimptype: pondData.shrimptype ?? pondData.shrimpType ?? '',
      farmingtype: pondData.farmingtype ?? pondData.farmingType ?? '',
      targetdensity: pondData.targetDensity ?? 0,
      seedamount: pondData.seedAmount ?? 0,
      expectedcount: pondData.expectedCount ?? 0,
      watersource: pondData.waterSource ?? '',
      currentstock: pondData.currentStock ?? 0,
      status: pondData.status ?? 'active',
      stockingdate: pondData.stockingdate ?? null,
    };

    // Try full insert first, fall back to core
    const { data, error } = await supabase.from('ponds').insert([dbRecord]).select('id').single();
    if (error) {
      console.warn("Full pond insert failed, trying core-only:", error.message);
      const { data: coreData, error: coreError } = await supabase.from('ponds').insert([coreRecord]).select('id').single();
      if (coreError) { console.error("Core pond insert also failed:", coreError); return; }
      return coreData?.id;
    }
    return data?.id;
  };

  const updatePond = async (pondId: string, updates: Partial<Pond>) => {
    // Remap camelCase keys to lowercase DB column names
    const dbUpdates: Record<string, any> = {};
    const keyMap: Record<string, string> = {
      shrimpType: 'shrimptype', shrimptype: 'shrimptype',
      farmingType: 'farmingtype', farmingtype: 'farmingtype',
      targetDensity: 'targetdensity',
      seedAmount: 'seedamount',
      expectedCount: 'expectedcount',
      waterSource: 'watersource',
      currentStock: 'currentstock',
      stockingDate: 'stockingdate', stockingdate: 'stockingdate',
      currentPhase: 'currentphase',
      currentStage: 'currentstage',
      cycleDay: 'cycleday',
      linkedprojectid: 'linkedprojectid',
    };
    for (const [key, value] of Object.entries(updates)) {
      dbUpdates[keyMap[key] || key] = value;
    }
    await supabase.from('ponds').update(dbUpdates).eq('id', pondId).eq('client_id', clientId);
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
    if (!clientId) {
      setAlerts([]);
      setLoading(false);
      return;
    }

    const fetchAlerts = async () => {
      let query = supabase
        .from('alerts')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      if (selectedProfile) {
        query = query.eq('profile_id', selectedProfile);
      }

      const { data } = await query;
      if (data) {
        setAlerts(data.map(d => ({ ...d, createdAt: d.created_at, pondid: d.pondid })) as unknown as Alert[]);
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
