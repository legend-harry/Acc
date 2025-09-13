
"use client";

import type { ReactNode } from "react";
import { Header } from "@/components/layout/header";
import { UserProvider } from "@/context/user-context";
import { ProjectFilterProvider } from "@/context/project-filter-context";
import { useState, useEffect } from "react";
import { ProfileSelectorDialog } from "@/components/profile-selector-dialog";

export default function AppLayout({ children }: { children: ReactNode }) {
  const [showProfileDialog, setShowProfileDialog] = useState(false);

  useEffect(() => {
    // Check if a profile has been remembered
    const rememberedProfile = localStorage.getItem('rememberedProfile');
    const profileSelectedInSession = sessionStorage.getItem('profileSelected');

    if (!rememberedProfile && !profileSelectedInSession) {
      setShowProfileDialog(true);
    }
  }, []);

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
      </ProjectFilterProvider>
    </UserProvider>
  );
}
