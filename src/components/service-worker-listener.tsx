"use client";

import { useEffect, ReactNode } from "react";
import { useAttendance } from "@/hooks/use-attendance";
import { useToast } from "@/hooks/use-toast";

export function ServiceWorkerListener({ children }: { children: ReactNode }) {
  const { updateAttendance } = useAttendance(new Date());
  const { toast } = useToast();

  useEffect(() => {
    // Listen for messages from the service worker
    const handleServiceWorkerMessage = async (event: MessageEvent) => {
      if (event.data && event.data.type === 'MARK_ATTENDANCE') {
        const { employeeId, date } = event.data.payload;
        try {
          // The useAttendance hook needs to be at this level to be used here.
          // We are using a new Date() so it's for today.
          await updateAttendance(employeeId, { status: 'full-day' });
          toast({
            title: "Attendance Marked",
            description: "Successfully marked as present from the notification.",
          });
        } catch (error) {
          toast({
            title: "Failed to Mark Attendance",
            description: "There was an error while updating attendance.",
            variant: "destructive",
          });
          console.error('Failed to mark attendance from SW message:', error);
        }
      }
    };
    navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);

    return () => {
      navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage);
    };

  }, [updateAttendance, toast]);

  return <>{children}</>;
}
