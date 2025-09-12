
"use client";

import { useState, useEffect } from 'react';
import { ref, onValue, off } from 'firebase/database';
import { db } from '@/lib/firebase';
import type { Transaction, BudgetSummary, Project } from '@/types';

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

