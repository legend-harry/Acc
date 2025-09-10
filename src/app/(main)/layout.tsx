
"use client";

import type { ReactNode } from "react";
import { Header } from "@/components/layout/header";
import { UserProvider } from "@/context/user-context";
import { useState, useEffect } from "react";
import { ProfileSelectorDialog } from "@/components/profile-selector-dialog";

export default function AppLayout({ children }: { children: ReactNode }) {
  const [showProfileDialog, setShowProfileDialog] = useState(false);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // This logic could be expanded to check for time elapsed
        // but for now, we'll show it on every visibility change
        // if the user was previously hidden.
        setShowProfileDialog(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Initial check in case the app loads into a visible state
    // from a background tab.
    if (document.visibilityState === 'visible') {
        setShowProfileDialog(true);
    }


    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return (
    <UserProvider>
        <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-1 p-4 md:p-6 lg:p-8">
                {children}
            </main>
        </div>
        <ProfileSelectorDialog isOpen={showProfileDialog} onOpenChange={setShowProfileDialog} />
    </UserProvider>
  );
}
