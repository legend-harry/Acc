
"use client";

import { useState, useEffect } from 'react';
import { ref, onValue, off, query, orderByChild, equalTo } from 'firebase/database';
import { db } from '@/lib/firebase';
import type { Transaction, BudgetSummary, Employee, Project, AttendanceRecord, DailySummary, MonthlyAttendanceSummary } from '@/types';

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
        }));
        setTransactions(transactionsList);
      } else {
        setTransactions([]);
      }
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
                setBudgets(budgetList);
            } else {
                setBudgets([]);
            }
            setLoading(false);
        });

        return () => {
            off(budgetsRef, 'value', listener);
        };
    }, []);

    return { budgets, loading };
}

export function useCategories() {
    const { budgets, loading } = useBudgets();
    const [categories, setCategories] = useState<string[]>([]);

    useEffect(() => {
        if (!loading) {
            const uniqueCategories = [...new Set(budgets.map(b => b.category))];
            setCategories(uniqueCategories);
        }
    }, [budgets, loading]);

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
                    id: key
                }));
                setEmployees(employeeList);
            } else {
                setEmployees([]);
            }
            setLoading(false);
        });

        return () => {
            off(employeesRef, 'value', listener);
        };
    }, []);

    return { employees, loading };
}

export function useProjects() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const projectsRef = ref(db, 'projects');

        const listener = onValue(projectsRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const projectList: Project[] = Object.keys(data).map(key => ({
                    ...data[key],
                    id: key
                }));
                setProjects(projectList);
            } else {
                setProjects([]);
            }
            setLoading(false);
        });

        return () => {
            off(projectsRef, 'value', listener);
        };
    }, []);

    return { projects, loading };
}

export function useAttendanceForDates() {
    const [dailySummaries, setDailySummaries] = useState<Record<string, DailySummary>>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const attendanceRef = ref(db, 'attendance');

        const listener = onValue(attendanceRef, (snapshot) => {
            const data = snapshot.val();
            const summaries: Record<string, DailySummary> = {};

            if (data) {
                // Group by date
                Object.keys(data).forEach(key => {
                    const record: AttendanceRecord = data[key];
                    const dateKey = record.date;

                    if (!summaries[dateKey]) {
                        summaries[dateKey] = {
                            date: dateKey,
                            status: 'mixed',
                            totalPresent: 0,
                            totalAbsent: 0,
                            totalHalfDay: 0
                        };
                    }

                    if (record.status === 'full-day') {
                        summaries[dateKey].totalPresent++;
                    } else if (record.status === 'half-day') {
                        summaries[dateKey].totalHalfDay++;
                    } else if (record.status === 'absent') {
                        summaries[dateKey].totalAbsent++;
                    }
                });

                // Determine overall status
                Object.keys(summaries).forEach(dateKey => {
                    const summary = summaries[dateKey];
                    if (summary.totalAbsent === 0 && summary.totalHalfDay === 0) {
                        summary.status = 'present';
                    } else if (summary.totalPresent === 0 && summary.totalHalfDay === 0) {
                        summary.status = 'absent';
                    } else if (summary.totalPresent === 0 && summary.totalAbsent === 0) {
                        summary.status = 'half-day';
                    } else {
                        summary.status = 'mixed';
                    }
                });
            }

            setDailySummaries(summaries);
            setLoading(false);
        });

        return () => {
            off(attendanceRef, 'value', listener);
        };
    }, []);

    return { dailySummaries, loading };
}

export function useEmployeeMonthlyAttendance(employeeId: string, date: Date) {
    const [attendanceForMonth, setAttendanceForMonth] = useState<Record<string, AttendanceRecord>>({});
    const [summary, setSummary] = useState<MonthlyAttendanceSummary>({
        totalDays: 0,
        fullDays: 0,
        halfDays: 0,
        absent: 0,
        totalWages: 0,
        overtimeHours: 0,
        overtimeWages: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const startDate = new Date(year, month, 1).toISOString().split('T')[0];
        const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0];

        const attendanceRef = ref(db, 'attendance');

        const listener = onValue(attendanceRef, (snapshot) => {
            const data = snapshot.val();
            const monthRecords: Record<string, AttendanceRecord> = {};
            let fullDays = 0;
            let halfDays = 0;
            let absent = 0;
            let overtimeHours = 0;
            let overtimeWages = 0;

            if (data) {
                Object.keys(data).forEach(key => {
                    const record: AttendanceRecord = data[key];
                    if (record.employeeId === employeeId && 
                        record.date >= startDate && 
                        record.date <= endDate) {
                        monthRecords[record.date] = record;

                        if (record.status === 'full-day') fullDays++;
                        else if (record.status === 'half-day') halfDays++;
                        else if (record.status === 'absent') absent++;

                        if (record.overtimeHours) {
                            overtimeHours += record.overtimeHours;
                            overtimeWages += record.overtimeHours * (record.overtimeRate || 0);
                        }
                    }
                });
            }

            setAttendanceForMonth(monthRecords);
            setSummary({
                totalDays: fullDays + halfDays + absent,
                fullDays,
                halfDays,
                absent,
                totalWages: 0, // Calculate based on employee wage
                overtimeHours,
                overtimeWages
            });
            setLoading(false);
        });

        return () => {
            off(attendanceRef, 'value', listener);
        };
    }, [employeeId, date]);

    return { attendanceForMonth, summary, loading };
}
