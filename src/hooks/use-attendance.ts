
"use client";

import { useState, useEffect, useCallback } from 'react';
import { ref, onValue, off, set, get } from 'firebase/database';
import { db } from '@/lib/firebase';
import type { AttendanceRecord } from '@/types';
import { format } from 'date-fns';

type AttendanceData = Record<string, AttendanceRecord>; // Key is employeeId

export function useAttendance(date: Date) {
  const [attendance, setAttendance] = useState<AttendanceData>({});
  const [loading, setLoading] = useState(true);
  const dateString = format(date, 'yyyy-MM-dd');

  useEffect(() => {
    setLoading(true);
    const attendanceRef = ref(db, `attendance/${dateString}`);
    
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
    const attendanceRef = ref(db, `attendance/${dateString}/${employeeId}`);
    try {
        const snapshot = await get(attendanceRef);
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

  return { attendance, loading, updateAttendance };
}

    