
"use client";

import { useState, useEffect, useMemo } from 'react';
import { ref, onValue, off, get, query, orderByChild, equalTo } from 'firebase/database';
import { db } from '@/lib/firebase';
import type { Transaction, BudgetSummary, Project, Employee, AttendanceRecord, AttendanceStatus } from '@/types';
import { startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';

export function useProjects() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const projectsRef = ref(db, 'projects');
        const listener = onValue(projectsRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const projectList: Project[] = Object.keys(data).map(key => ({
                    id: key,
                    name: data[key].name
                }));
                setProjects(projectList);
            } else {
                setProjects([]);
            }
            setLoading(false);
        }, (error) => {
            console.error("Firebase read failed: " + error.name);
            setLoading(false);
        });

        return () => {
            off(projectsRef, 'value', listener);
        };
    }, []);

    return { projects, loading };
}


export function useTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const transactionsRef = ref(db, 'transactions');
    
    const listener = onValue(transactionsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const transactionsList: Transaction[] = Object.keys(data).map(key => ({
          ...data[key],
          id: key,
          date: new Date(data[key].date), // Ensure date is a Date object
          createdAt: new Date(data[key].createdAt), // Ensure createdAt is a Date object
        }));
        setTransactions(transactionsList);
      } else {
        setTransactions([]);
      }
      setLoading(false);
    }, (error) => {
        console.error("Firebase read failed: " + error.name);
        setLoading(false);
    });

    return () => {
      off(transactionsRef, 'value', listener);
    };
  }, []);

  return { transactions, loading };
}


export function useBudgets() {
    const [budgets, setBudgets] = useState<BudgetSummary[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const budgetsRef = ref(db, 'budgets');

        const listener = onValue(budgetsRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const budgetList: BudgetSummary[] = Object.keys(data).map(key => ({
                    ...data[key],
                    id: key
                }));
                setBudgets(budgetList.sort((a, b) => a.category.localeCompare(b.category)));
            } else {
                setBudgets([]);
            }
            setLoading(false);
        }, (error) => {
            console.error("Firebase read failed: " + error.name);
            setLoading(false);
        });

        return () => {
            off(budgetsRef, 'value', listener);
        };
    }, []);

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
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const employeesRef = ref(db, 'employees');
        const listener = onValue(employeesRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const employeeList: Employee[] = Object.keys(data).map(key => ({
                    ...data[key],
                    id: key,
                }));
                setEmployees(employeeList);
            } else {
                setEmployees([]);
            }
            setLoading(false);
        }, (error) => {
            console.error("Firebase read failed for employees: " + error.message);
            setLoading(false);
        });

        return () => {
            off(employeesRef, 'value', listener);
        };
    }, []);

    return { employees, loading };
}

type DailySummary = {
  status: 'present' | 'absent' | 'half-day';
};

export function useAttendanceForDates() {
    const [dailySummaries, setDailySummaries] = useState<Record<string, DailySummary>>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const attendanceRef = ref(db, `attendance`);
        const listener = onValue(attendanceRef, (snapshot) => {
            const data = snapshot.val();
            const summaries: Record<string, DailySummary> = {};

            if (data) {
                Object.keys(data).forEach(dateString => {
                    const dailyRecords: Record<string, AttendanceRecord> = data[dateString];
                    const statuses = Object.values(dailyRecords).map(rec => rec.status);
                    
                    if (statuses.includes('absent')) {
                        summaries[dateString] = { status: 'absent' };
                    } else if (statuses.includes('half-day')) {
                        summaries[dateString] = { status: 'half-day' };
                    } else if (statuses.every(s => s === 'full-day')) {
                        summaries[dateString] = { status: 'present' };
                    }
                });
            }
            
            setDailySummaries(summaries);
            setLoading(false);
        }, (error) => {
            console.error("Firebase read failed for attendance dates: " + error.message);
            setDailySummaries({});
            setLoading(false);
        });

        return () => {
            off(attendanceRef, 'value', listener);
        };
    }, []);

    return { dailySummaries, loading };
}

export function useEmployeeAttendance(employeeId: string) {
    const [attendanceRecords, setAttendanceRecords] = useState<Record<string, AttendanceRecord>>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!employeeId) {
            setLoading(false);
            return;
        }

        const attendanceRef = ref(db, 'attendance');
        const listener = onValue(attendanceRef, (snapshot) => {
            const allAttendance = snapshot.val();
            const employeeAttendance: Record<string, AttendanceRecord> = {};
            if (allAttendance) {
                Object.keys(allAttendance).forEach(dateString => {
                    if (allAttendance[dateString][employeeId]) {
                        employeeAttendance[dateString] = allAttendance[dateString][employeeId];
                    }
                });
            }
            setAttendanceRecords(employeeAttendance);
            setLoading(false);
        }, (error) => {
            console.error("Firebase read failed for employee attendance: " + error.message);
            setLoading(false);
        });

        return () => off(attendanceRef, 'value', listener);
    }, [employeeId]);

    return { attendanceRecords, loading };
}

export function useEmployeeMonthlyAttendance(employeeId: string, monthDate: Date) {
    const { attendanceRecords, loading } = useEmployeeAttendance(employeeId);

    const { attendanceForMonth, summary } = useMemo(() => {
        const start = startOfMonth(monthDate);
        const end = endOfMonth(monthDate);
        
        const recordsInMonth = Object.values(attendanceRecords).filter(record => {
            const recordDate = new Date(record.date);
            // Adjust for timezone offset by comparing year, month, and day
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

    