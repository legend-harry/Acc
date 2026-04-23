"use client";

import { useState, useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/header";
import { EnterpriseSidebar } from "@/components/layout/enterprise-sidebar";
import { EnterpriseTopbar } from "@/components/layout/enterprise-topbar";
import { ClientProvider } from "@/context/client-context";
import { UserProvider, useUser } from "@/context/user-context";
import { ProjectFilterProvider } from "@/context/project-filter-context";
import { SubscriptionProvider } from "@/context/subscription-context";
import { CurrencyProvider } from "@/context/currency-context";
import { LayoutProvider, useLayout } from "@/context/layout-context";
import { UpgradeDialog } from "@/components/upgrade-dialog";
import { AIOnboardingFlow } from "@/components/ai-onboarding-flow";
import { LanguageProvider } from "@/context/language-context";

function LayoutShell({ children }: { children: ReactNode }) {
  const { layout } = useLayout();
  const [mobileOpen, setMobileOpen] = useState(false);
  const router = useRouter();
  const { user, userData, isLoading } = useUser();

  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    } else if (user) {
      const onboardingKey = `onboardingComplete:${user}`;
      const promptKey = `projectSetupPromptShown:${user}`;
      const onboardingComplete = localStorage.getItem(onboardingKey) === 'true' || localStorage.getItem('onboardingComplete') === 'true';
      const promptShown = localStorage.getItem(promptKey) === 'true';
      const accountCreatedAt = userData?.created_at ? new Date(userData.created_at).getTime() : Number.NaN;
      const isFreshAccount = localStorage.getItem('newAccountJustCreated') === 'true' || (Number.isFinite(accountCreatedAt) && Date.now() - accountCreatedAt < 24 * 60 * 60 * 1000);

      if (!onboardingComplete && isFreshAccount && !promptShown) {
          setShowOnboarding(true);
          localStorage.setItem(promptKey, 'true');
          localStorage.removeItem('newAccountJustCreated');
      }
    }
  }, [user, isLoading, router, userData]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary/20 border-t-primary"></div>
      </div>
    );
  }

  // Prevent flash of content before redirect executes
  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary/20 border-t-primary"></div>
      </div>
    );
  }

  if (layout === "enterprise") {
    return (
      <div className="min-h-screen bg-background">
        <EnterpriseSidebar
          mobileOpen={mobileOpen}
          onMobileClose={() => setMobileOpen(false)}
        />
        <EnterpriseTopbar onMobileMenuToggle={() => setMobileOpen((p) => !p)} />
        <div className="enterprise-content-area">
          <main className="pt-20 lg:pt-24 p-4 md:p-6 lg:p-8 min-h-screen">
            <div className="animate-fade-up">
              {children}
            </div>
            {showOnboarding && <AIOnboardingFlow open={showOnboarding} onOpenChange={setShowOnboarding} />}
          </main>
        </div>
      </div>
    );
  }

  // Default layout
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1 p-4 md:p-6 lg:p-8">
        {children}
        {showOnboarding && <AIOnboardingFlow open={showOnboarding} onOpenChange={setShowOnboarding} />}
      </main>
    </div>
  );
}

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <ClientProvider>
      <LanguageProvider>
        <UserProvider>
          <SubscriptionProvider>
            <CurrencyProvider>
              <ProjectFilterProvider>
                <LayoutProvider>
                  <LayoutShell>{children}</LayoutShell>
                </LayoutProvider>
              </ProjectFilterProvider>
            </CurrencyProvider>
          </SubscriptionProvider>
        </UserProvider>
      </LanguageProvider>
    </ClientProvider>
  );
}
