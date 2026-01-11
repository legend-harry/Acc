
"use client";

import type { ReactNode } from "react";
import { Header } from "@/components/layout/header";
import { UserProvider } from "@/context/user-context";
import { ProjectFilterProvider } from "@/context/project-filter-context";
import { SubscriptionProvider } from "@/context/subscription-context";
import { CurrencyProvider } from "@/context/currency-context";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <UserProvider>
      <CurrencyProvider>
        <SubscriptionProvider>
          <ProjectFilterProvider>
            <div className="flex flex-col min-h-screen">
                <Header />
                <main className="flex-1 p-4 md:p-6 lg:p-8">
                    {children}
                </main>
            </div>
          </ProjectFilterProvider>
        </SubscriptionProvider>
      </CurrencyProvider>
    </UserProvider>
  );
}
