
"use client";

import type { ReactNode } from "react";
import { Header } from "@/components/layout/header";
import { UserProvider } from "@/context/user-context";
import { ProjectFilterProvider } from "@/context/project-filter-context";
import { SubscriptionProvider } from "@/context/subscription-context";
import { useState, useEffect } from "react";
import { ProfileSelectorDialog } from "@/components/profile-selector-dialog";
import { UpgradeDialog } from "@/components/upgrade-dialog";
import { CurrencyProvider } from "@/context/currency-context";
import { useAttendance } from "@/hooks/use-attendance";
import { useToast } from "@/hooks/use-toast";


export default function AppLayout({ children }: { children: ReactNode }) {
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const { updateAttendance } = useAttendance(new Date());
  const { toast } = useToast();

  useEffect(() => {
    // Check if a profile has been remembered
    const rememberedProfile = localStorage.getItem('rememberedProfile');
    const profileSelectedInSession = sessionStorage.getItem('profileSelected');

    if (!rememberedProfile && !profileSelectedInSession) {
      setShowProfileDialog(true);
    }

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

  const handleProfileSelect = (remember: boolean) => {
    sessionStorage.setItem('profileSelected', 'true');
    setShowProfileDialog(false);
    if(remember) {
        const user = sessionStorage.getItem('userProfile'); // This will be set by the UserContext
        if(user) localStorage.setItem('rememberedProfile', user);
    }
  };


  return (
    <UserProvider>
      <SubscriptionProvider>
        <CurrencyProvider>
          <ProjectFilterProvider>
            <div className="flex flex-col min-h-screen">
                <Header />
                <main className="flex-1 p-4 md:p-6 lg:p-8">
                    {children}
                </main>
            </div>
            <ProfileSelectorDialog 
                isOpen={showProfileDialog} 
                onOpenChange={(isOpen) => {
                     if (!isOpen) {
                        // If the user closes the dialog without selecting,
                        // we still mark it as handled for the session.
                        handleProfileSelect(false);
                    } else {
                        setShowProfileDialog(true);
                    }
                }}
                onProfileSelect={handleProfileSelect}
            />
            <UpgradeDialog />
          </ProjectFilterProvider>
        </CurrencyProvider>
      </SubscriptionProvider>
    </UserProvider>
  );
}
