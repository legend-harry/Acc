
"use client";

import type { ReactNode } from "react";
import { Header } from "@/components/layout/header";
import { UserProvider } from "@/context/user-context";
import { useState, useEffect } from "react";
import { ProfileSelectorDialog } from "@/components/profile-selector-dialog";

export default function AppLayout({ children }: { children: ReactNode }) {
  const [showProfileDialog, setShowProfileDialog] = useState(false);

  useEffect(() => {
    // Check if a profile has already been selected in this session
    const profileSelected = sessionStorage.getItem('profileSelected');
    if (!profileSelected) {
      setShowProfileDialog(true);
    }
  }, []);

  const handleProfileSelect = () => {
    sessionStorage.setItem('profileSelected', 'true');
    setShowProfileDialog(false);
  };

  return (
    <UserProvider>
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
                    handleProfileSelect();
                } else {
                    setShowProfileDialog(true);
                }
            }}
            onProfileSelect={handleProfileSelect}
        />
    </UserProvider>
  );
}
