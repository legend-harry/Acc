"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { PlusCircle, Wallet } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

export function Header() {
  const isMobile = useIsMobile();
  return (
    <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm md:px-6">
      <SidebarTrigger className="flex md:hidden" />
       {isMobile && (
        <div className="flex items-center gap-2 font-bold">
            <Wallet className="h-6 w-6 text-primary" />
            <span className="font-headline text-lg">ExpenseWise</span>
        </div>
      )}
      <div className="flex-1" />
      <Button>
        <PlusCircle className="mr-2 h-4 w-4" />
        Add Expense
      </Button>
    </header>
  );
}
