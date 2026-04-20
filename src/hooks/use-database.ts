"use client";

import { useState, useEffect, useMemo } from 'react';
import type { Transaction, BudgetSummary, Project, Employee, AttendanceRecord, AttendanceStatus } from '@/types';
import { useClient } from '@/context/client-context';
import { useUser } from '@/context/user-context';
import { startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { createClient } from '@/lib/supabase/client';

export function useProjects() {
    const { clientId } = useClient();
    const { selectedProfile } = useUser();
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        if (!clientId || !selectedProfile) {
            setProjects([]);
            setLoading(false);
            return;
        }

        const fetchProjects = async () => {
            const { data } = await supabase
                .from('projects')
                .select('*')
                .eq('client_id', clientId)
                .eq('profile_id', selectedProfile);
            if (data) setProjects(data as Project[]);
            setLoading(false);
        };

        fetchProjects();

        const channel = supabase.channel(`_${Math.random()}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'projects', filter: `client_id=eq.${clientId}` }, fetchProjects)
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [clientId, selectedProfile]);

    return { projects, loading };
}

export function useTransactions() {
    const { clientId } = useClient();
    const { selectedProfile } = useUser();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        if (!clientId || !selectedProfile) {
            setTransactions([]);
            setLoading(false);
            return;
        }

        const fetchTx = async () => {
            const { data } = await supabase
                .from('transactions')
                .select('*')
                .eq('client_id', clientId)
                .eq('profile_id', selectedProfile)
                .order('date', { ascending: false });
                
            if (data) {
                 setTransactions(data.map(d => ({
                     ...d,
                     date: new Date(d.date),
                     createdAt: new Date(d.created_at)
                 })) as unknown as Transaction[]);
            }
            setLoading(false);
        };

        fetchTx();

        const channel = supabase.channel(`_${Math.random()}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions', filter: `client_id=eq.${clientId}` }, fetchTx)
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [clientId, selectedProfile]);

    return { transactions, loading };
}

export function useBudgets() {
    const { clientId } = useClient();
    const { selectedProfile } = useUser();
    const [budgets, setBudgets] = useState<BudgetSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        if (!clientId || !selectedProfile) {
            setBudgets([]);
            setLoading(false);
            return;
        }

        const fetchBudgets = async () => {
            const { data } = await supabase
                .from('budgets')
                .select('*')
                .eq('client_id', clientId)
                .eq('profile_id', selectedProfile);
            
            if (data) {
                const sorted = data.sort((a, b) => a.category.localeCompare(b.category));
                setBudgets(sorted as BudgetSummary[]);
            }
            setLoading(false);
        };

        fetchBudgets();

        const channel = supabase.channel(`_${Math.random()}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'budgets', filter: `client_id=eq.${clientId}` }, fetchBudgets)
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [clientId, selectedProfile]);

    return { budgets, loading };
}

export function useCategories(projectId?: string) {
    const { budgets, loading } = useBudgets();
    
    const categories = loading 
        ? [] 
        : [...new Set(budgets.filter(b => !projectId || b.projectId === projectId).map(b => b.category))].sort();

    return { categories, loading };
}

export function useEmployees() {
    const { clientId } = useClient();
    const { selectedProfile } = useUser();
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        if (!clientId || !selectedProfile) {
            setEmployees([]);
            setLoading(false);
            return;
        }

        const fetchEmployees = async () => {
            const { data } = await supabase
                .from('employees')
                .select('*')
                .eq('client_id', clientId)
                .eq('profile_id', selectedProfile);
            
            if (data) setEmployees(data as Employee[]);
            setLoading(false);
        };

        fetchEmployees();

        const channel = supabase.channel(`_${Math.random()}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'employees', filter: `client_id=eq.${clientId}` }, fetchEmployees)
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [clientId, selectedProfile]);

    return { employees, loading };
}

export function useAttendanceForDates() {
    const { clientId } = useClient();
    const { selectedProfile } = useUser();
    const [dailySummaries, setDailySummaries] = useState<Record<string, { status: 'present' | 'absent' | 'half-day' }>>({});
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        if (!clientId || !selectedProfile) {
            setDailySummaries({});
            setLoading(false);
            return;
        }

        const fetchAttendance = async () => {
            const { data } = await supabase
                .from('attendance')
                .select('*')
                .eq('client_id', clientId)
                .eq('profile_id', selectedProfile);
            
            if (data) {
                // Group by date
                const grouped: Record<string, Record<string, any>> = {};
                data.forEach(r => {
                     if (!grouped[r.date]) grouped[r.date] = {};
                     grouped[r.date][r.employee_id] = r;
                });
                
                const summaries: Record<string, any> = {};
                Object.keys(grouped).forEach(dateString => {
                    const dailyRecords = grouped[dateString];
                    const statuses = Object.values(dailyRecords).map(rec => rec.status);
                    if (statuses.includes('absent')) summaries[dateString] = { status: 'absent' };
                    else if (statuses.includes('half-day')) summaries[dateString] = { status: 'half-day' };
                    else if (statuses.every(s => s === 'full-day')) summaries[dateString] = { status: 'present' };
                });
                setDailySummaries(summaries);
            }
            setLoading(false);
        };

        fetchAttendance();

        const channel = supabase.channel(`_${Math.random()}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'attendance', filter: `client_id=eq.${clientId}` }, fetchAttendance)
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [clientId, selectedProfile]);

    return { dailySummaries, loading };
}

export function useEmployeeAttendance(employeeId: string) {
    const { clientId } = useClient();
    const { selectedProfile } = useUser();
    const [attendanceRecords, setAttendanceRecords] = useState<Record<string, AttendanceRecord>>({});
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        if (!clientId || !selectedProfile || !employeeId) {
            setLoading(false);
            return;
        }

        const fetchAtt = async () => {
            const { data } = await supabase
                .from('attendance')
                .select('*')
                .eq('client_id', clientId)
                .eq('profile_id', selectedProfile)
                .eq('employee_id', employeeId);
            
            if (data) {
                const mapped: Record<string, AttendanceRecord> = {};
                data.forEach(r => mapped[r.date] = r as AttendanceRecord);
                setAttendanceRecords(mapped);
            }
            setLoading(false);
        };

        fetchAtt();

        const channel = supabase.channel(`att_emp_${employeeId}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'attendance', filter: `client_id=eq.${clientId}` }, fetchAtt)
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [clientId, selectedProfile, employeeId]);

    return { attendanceRecords, loading };
}

export function useEmployeeMonthlyAttendance(employeeId: string, monthDate: Date) {
    const { attendanceRecords, loading } = useEmployeeAttendance(employeeId);

    const { attendanceForMonth, summary } = useMemo(() => {
        const start = startOfMonth(monthDate);
        const end = endOfMonth(monthDate);
        
        const recordsInMonth = Object.values(attendanceRecords).filter(record => {
            const recordDate = new Date(record.date);
            const recordUTC = new Date(Date.UTC(recordDate.getFullYear(), recordDate.getMonth(), recordDate.getDate()));
            return isWithinInterval(recordUTC, { start, end });
        });

        const monthSummary = {
            present: recordsInMonth.filter(r => r.status === 'full-day').length,
            absent: recordsInMonth.filter(r => r.status === 'absent').length,
            halfDay: recordsInMonth.filter(r => r.status === 'half-day').length,
        };

        return { attendanceForMonth: recordsInMonth, summary: monthSummary };
    }, [attendanceRecords, monthDate]);
    
    return { attendanceForMonth, summary, loading };
}