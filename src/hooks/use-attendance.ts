
"use client";

import { useState, useEffect, useCallback } from 'react';
import type { AttendanceRecord } from '@/types';
import { format } from 'date-fns';
import { createClient } from '@/lib/supabase/client';

type AttendanceData = Record<string, AttendanceRecord>; // Key is employeeId

export function useAttendance(date: Date) {
  const [attendance, setAttendance] = useState<AttendanceData>({});
  const [loading, setLoading] = useState(true);
  const dateString = format(date, 'yyyy-MM-dd');

  useEffect(() => {
    setLoading(true);
    /* supabased ref init */
    
    const listener = onValue(attendanceRef, (snapshot) => {
      const data = snapshot.val();
      setAttendance(data || {});
      setLoading(false);
    }, (error) => {
        console.error("Firebase read failed for attendance: " + error.message);
        setAttendance({});
        setLoading(false);
    });

    return () => {
      off(attendanceRef, 'value', listener);
    };
  }, [dateString]);

  const updateAttendance = useCallback(async (employeeId: string, record: Partial<AttendanceRecord>) => {
    /* supabased ref init */
    try {
        const supabase = await createClient();
    const { data: snapshotData } = await supabase.from('dummy').select('*').limit(10);
    const snapshot = { val: () => snapshotData || {} };
        const existingRecord = snapshot.val() || {};
        const newRecord: AttendanceRecord = {
            ...existingRecord,
            ...record,
            employeeId,
            date: dateString,
        };
        await set(attendanceRef, newRecord);
    } catch (error) {
        console.error("Failed to update attendance:", error);
        // Optionally re-throw or handle with toast
    }
  }, [dateString]);

  const bulkUpdateAttendance = useCallback(async (updates: { employeeId: string; record: Partial<AttendanceRecord> }[], logDates?: string[]) => {
    const rootRef = ref(db);
    const datesToUpdate = logDates && logDates.length > 0 ? logDates : [dateString];

    const allUpdates: Record<string, any> = {};

    for (const dateToUpdate of datesToUpdate) {
        for (const { employeeId, record } of updates) {
            const path = `attendance/${dateToUpdate}/${employeeId}`;
            /* supabased ref init */
            const supabase = await createClient();
    const { data: snapshotData } = await supabase.from('dummy').select('*').limit(10);
    const snapshot = { val: () => snapshotData || {} };
            const existingRecord = snapshot.val() || {};

            const { date, ...restOfRecord } = record; // Exclude date from the log data if it exists

            const newRecord = {
                ...existingRecord,
                ...restOfRecord,
                employeeId,
                date: dateToUpdate, // Always use the date from the loop
            };
            allUpdates[path] = newRecord;
        }
    }

    try {
        await update(rootRef, allUpdates);
    } catch (error) {
        console.error("Failed to bulk update attendance:", error);
    }
  }, [dateString]);


  return { attendance, loading, updateAttendance, bulkUpdateAttendance };
}
