"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, Bell, Settings, PlusCircle, Menu, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AddExpenseDialog } from "@/components/add-expense-dialog";
import { NotificationBell } from "@/components/notification-bell";
import { useUser } from "@/context/user-context";
import { createClient } from '@/lib/supabase/client';

interface EnterpriseTopbarProps {
  onMobileMenuToggle?: () => void;
}

export function EnterpriseTopbar({ onMobileMenuToggle }: EnterpriseTopbarProps) {
  const { user } = useUser();
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <header className="enterprise-topbar fixed top-0 right-0 left-0 z-40 px-4 lg:px-8 h-16 lg:h-20 flex items-center justify-between bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl border-b border-slate-200/60 dark:border-slate-800/60 shadow-sm">
      {/* Left: Mobile menu + Search */}
      <div className="flex items-center flex-1 gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden text-slate-600"
          onClick={onMobileMenuToggle}
        >
          <Menu className="h-5 w-5" />
        </Button>

        <div className="relative w-full max-w-md hidden sm:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search transactions..."
            className="w-full bg-slate-100 dark:bg-slate-900 border-none ring-1 ring-slate-200/50 dark:ring-slate-700/50 focus:ring-2 focus:ring-blue-500/30 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 placeholder:text-slate-400 transition-all outline-none"
          />
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2 sm:gap-4 ml-4">
        <NotificationBell />

        <Link href="/profile">
          <Button variant="ghost" size="icon" className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
            <Settings className="h-[1.15rem] w-[1.15rem]" />
          </Button>
        </Link>

        <AddExpenseDialog>
          <Button className="bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 hover:bg-slate-700 dark:hover:bg-slate-300 px-4 sm:px-6 py-2.5 rounded-lg text-sm font-bold shadow-lg shadow-slate-900/10 active:scale-95 transition-all duration-200">
            <PlusCircle className="h-4 w-4 mr-0 sm:mr-2" />
            <span className="hidden sm:inline">Add Transaction</span>
          </Button>
        </AddExpenseDialog>

        {/* Profile Avatar */}
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold border-2 border-slate-200 dark:border-slate-700 shadow-sm">
          {user?.charAt(0) || "U"}
        </div>
      </div>
    </header>
  );
}
