"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, Settings, PlusCircle, Menu, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AddExpenseDialog } from "@/components/add-expense-dialog";
import { useUser } from "@/context/user-context";
import { useLanguage } from "@/context/language-context";

interface EnterpriseTopbarProps {
  onMobileMenuToggle?: () => void;
}

export function EnterpriseTopbar({ onMobileMenuToggle }: EnterpriseTopbarProps) {
  const { user } = useUser();
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <header className="enterprise-topbar fixed top-0 right-0 left-0 z-40 px-4 lg:px-8 h-16 lg:h-20 flex items-center justify-between glass-nav border-b border-border/20 shadow-ambient-sm">
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
            placeholder={t("Search transactions...")}
            className="w-full bg-muted/50 dark:bg-muted/30 border-none ring-1 ring-border/30 focus:ring-2 focus:ring-primary/30 rounded-xl pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 transition-all duration-200 ease-precision outline-none"
          />
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2 sm:gap-4 ml-4">
        <Link href="/profile">
          <Button variant="ghost" size="icon" className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
            <Settings className="h-[1.15rem] w-[1.15rem]" />
          </Button>
        </Link>


        <AddExpenseDialog>
          <Button className="bg-gradient-to-br from-primary to-primary-container text-white hover:opacity-90 px-4 sm:px-6 py-2.5 rounded-xl text-sm font-bold shadow-ambient active:scale-[0.97] transition-all duration-200 ease-precision">
            <PlusCircle className="h-4 w-4 mr-0 sm:mr-2" />
            <span className="hidden sm:inline">{t("Add Transaction")}</span>
          </Button>
        </AddExpenseDialog>

        {/* Profile Avatar */}
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-primary-container flex items-center justify-center text-white text-sm font-bold border-2 border-background shadow-ambient-sm transition-transform duration-200 hover:scale-105">
          {user?.charAt(0) || "U"}
        </div>
      </div>
    </header>
  );
}
