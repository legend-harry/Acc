"use client";

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useProjects, useTransactions, useBudgets, useEmployees, useAttendanceForDates } from '@/hooks/use-database';
import { usePonds, useDocuments, useImageAnalyses, useInventory } from '@/hooks/use-shrimp';
import { useUser } from '@/context/user-context';
import { createClient } from '@/lib/supabase/client';

export function DataCompletenessPanel({
  activePondId,
  showFinance = true,
  showShrimp = true,
  onNavigateToTab,
}: {
  activePondId?: string | null;
  showFinance?: boolean;
  showShrimp?: boolean;
  onNavigateToTab?: (tab: string) => void;
}) {
  const { selectedProfile } = useUser();
  const pathname = usePathname();
  const isOnShrimpPage = pathname === '/shrimp';
  const { projects, loading: projectsLoading } = useProjects();
  const { transactions, loading: transactionsLoading } = useTransactions();
  const { budgets, loading: budgetsLoading } = useBudgets();
  const { employees, loading: employeesLoading } = useEmployees();
  const { dailySummaries, loading: attendanceLoading } = useAttendanceForDates();
  const { ponds, loading: pondsLoading } = usePonds();
  const { items: inventory, loading: inventoryLoading } = useInventory();

  const pondId = activePondId ?? '';
  const { documents, loading: documentsLoading } = useDocuments(pondId);
  const { imageAnalyses: images, loading: imagesLoading } = useImageAnalyses(pondId);
  const [dailyLogCount, setDailyLogCount] = useState<number | null>(null);

  useEffect(() => {
    if (!selectedProfile || !pondId) {
      setDailyLogCount(null);
      return;
    }

    // const logsRef = ref(db, `shrimp/${selectedProfile}/daily-logs/${pondId}`);
    // const unsubscribe = onValue(logsRef, (snapshot) => {
    //   setDailyLogCount(Object.keys(data).length);
    // });
    setDailyLogCount(0); // TODO: implement Supabase logs count
  }, [selectedProfile, pondId]);

  const financeMissing = useMemo(() => {
    const missing: { key: string; label: string; action: string }[] = [];
    if (!projectsLoading && projects.length === 0) {
      missing.push({ key: 'projects', label: 'Projects', action: 'Create a project in Projects' });
    }
    if (!transactionsLoading && transactions.length === 0) {
      missing.push({ key: 'transactions', label: 'Transactions', action: 'Add transactions in Transactions' });
    }
    if (!budgetsLoading && budgets.length === 0) {
      missing.push({ key: 'budgets', label: 'Budgets', action: 'Set budgets in Budgets' });
    }
    if (!employeesLoading && employees.length === 0) {
      missing.push({ key: 'employees', label: 'Employees', action: 'Add employees in Employees' });
    }
    if (!attendanceLoading && Object.keys(dailySummaries).length === 0) {
      missing.push({ key: 'attendance', label: 'Attendance', action: 'Log attendance in Employees' });
    }
    return missing;
  }, [projectsLoading, projects, transactionsLoading, transactions, budgetsLoading, budgets, employeesLoading, employees, attendanceLoading, dailySummaries]);

  const shrimpMissing = useMemo(() => {
    const missing: { key: string; label: string; action: string }[] = [];
    if (!pondsLoading && ponds.length === 0) {
      missing.push({ key: 'ponds', label: 'Ponds', action: 'Add ponds in Shrimp' });
      return missing;
    }

    if (!activePondId) {
      missing.push({ key: 'pondSelect', label: 'Active pond selection', action: 'Select a pond in Shrimp' });
      return missing;
    }

    if (dailyLogCount === 0) {
      missing.push({ key: 'dailyLogs', label: 'Daily logs', action: 'Log daily operations in Operations' });
    }
    if (!documentsLoading && documents.length === 0) {
      missing.push({ key: 'documents', label: 'Reports/documents', action: 'Upload reports in Documents' });
    }
    if (!imagesLoading && images.length === 0) {
      missing.push({ key: 'images', label: 'Image analysis', action: 'Upload images in Documents' });
    }
    if (!inventoryLoading && inventory.length === 0) {
      missing.push({ key: 'inventory', label: 'Inventory records', action: 'Add inventory in Inventory' });
    }

    const activePond = ponds.find((pond) => pond.id === activePondId);
    if (activePond && !activePond.linkedProjectId) {
      missing.push({ key: 'linkedProject', label: 'Linked project', action: 'Link pond to a project' });
    }

    return missing;
  }, [pondsLoading, ponds, activePondId, dailyLogCount, documentsLoading, documents, imagesLoading, images, inventoryLoading, inventory]);

  const financeLoading = projectsLoading || transactionsLoading || budgetsLoading || employeesLoading || attendanceLoading;
  const shrimpLoading = pondsLoading || documentsLoading || imagesLoading || inventoryLoading || dailyLogCount === null;

  if (!showFinance && !showShrimp) return null;

  return (
    <Card className="border border-slate-200">
      <CardHeader>
        <CardTitle className="text-base">Data Completeness</CardTitle>
        <CardDescription>Identify missing data and where to add it.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!selectedProfile && (
          <Alert variant="destructive">
            <AlertDescription>No profile selected. Data completeness cannot be calculated.</AlertDescription>
          </Alert>
        )}

        {showFinance && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">Finance</p>
              <Badge variant="outline">{financeLoading ? 'Loading...' : `${financeMissing.length} missing`}</Badge>
            </div>
            {financeLoading ? (
              <p className="text-sm text-muted-foreground">Loading finance data...</p>
            ) : financeMissing.length === 0 ? (
              <p className="text-sm text-muted-foreground">All finance data present.</p>
            ) : (
              <div className="space-y-1 text-sm">
                {financeMissing.map((item) => (
                  <div key={item.key} className="flex items-center justify-between gap-2">
                    <span>{item.label}</span>
                    <span className="text-xs text-muted-foreground">{item.action}</span>
                  </div>
                ))}
                <div className="flex flex-wrap gap-2 pt-2">
                  <Button asChild size="sm" variant="outline">
                    <Link href="/transactions">Open Transactions</Link>
                  </Button>
                  <Button asChild size="sm" variant="outline">
                    <Link href="/reports">Open Reports</Link>
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {showShrimp && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">Shrimp Operations</p>
              <Badge variant="outline">{shrimpLoading ? 'Loading...' : `${shrimpMissing.length} missing`}</Badge>
            </div>
            {shrimpLoading ? (
              <p className="text-sm text-muted-foreground">Loading shrimp data...</p>
            ) : shrimpMissing.length === 0 ? (
              <p className="text-sm text-muted-foreground">All shrimp data present.</p>
            ) : (
              <div className="space-y-1 text-sm">
                {shrimpMissing.map((item) => (
                  <div key={item.key} className="flex items-center justify-between gap-2">
                    <span>{item.label}</span>
                    <span className="text-xs text-muted-foreground">{item.action}</span>
                  </div>
                ))}
                <div className="flex flex-wrap gap-2 pt-2">
                  {isOnShrimpPage ? (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onNavigateToTab?.('operations')}
                      >
                        Log Daily Operations
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onNavigateToTab?.('documents')}
                      >
                        Upload Documents
                      </Button>
                    </>
                  ) : (
                    <Button asChild size="sm" variant="outline">
                      <Link href="/shrimp">Open Shrimp Workspace</Link>
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}