"use client";

import { useState, type ReactNode } from "react";
import { Header } from "@/components/layout/header";
import { EnterpriseSidebar } from "@/components/layout/enterprise-sidebar";
import { EnterpriseTopbar } from "@/components/layout/enterprise-topbar";
import { ClientProvider } from "@/context/client-context";
import { UserProvider } from "@/context/user-context";
import { ProjectFilterProvider } from "@/context/project-filter-context";
import { SubscriptionProvider } from "@/context/subscription-context";
import { CurrencyProvider } from "@/context/currency-context";
import { LayoutProvider, useLayout } from "@/context/layout-context";
import { UpgradeDialog } from "@/components/upgrade-dialog";

function LayoutShell({ children }: { children: ReactNode }) {
  const { layout } = useLayout();
  const [mobileOpen, setMobileOpen] = useState(false);

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
            {children}
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
      </main>
    </div>
  );
}

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <ClientProvider>
      <UserProvider>
        <SubscriptionProvider>
          <CurrencyProvider>
            <ProjectFilterProvider>
              <LayoutProvider>
                <LayoutShell>{children}</LayoutShell>
                <UpgradeDialog />
              </LayoutProvider>
            </ProjectFilterProvider>
          </CurrencyProvider>
        </SubscriptionProvider>
      </UserProvider>
    </ClientProvider>
  );
}
