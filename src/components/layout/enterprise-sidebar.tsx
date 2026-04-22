"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ArrowLeftRight,
  Target,
  PieChart,
  Users,
  Fish,
  Crown,
  HelpCircle,
  LogOut,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSubscription } from "@/context/subscription-context";
import { useUser } from "@/context/user-context";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Home" },
  { href: "/transactions", icon: ArrowLeftRight, label: "Cash Flow" },
  { href: "/planner", icon: Target, label: "Budget" },
  { href: "/employees", icon: Users, label: "Manage" },
  { href: "/reports", icon: PieChart, label: "Reports" },
  { href: "/shrimp", icon: Fish, label: "Aqua" },
];

interface EnterpriseSidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function EnterpriseSidebar({ mobileOpen, onMobileClose }: EnterpriseSidebarProps) {
  const pathname = usePathname();
  const { isPremium } = useSubscription();
  const { user } = useUser();
  const currentPath = pathname ?? "";

  const sidebar = (
    <aside className="enterprise-sidebar h-screen w-72 glass-nav flex flex-col py-8 border-r border-border/20 z-[60] shadow-ambient">
      {/* Logo */}
      <div className="px-8 mb-10">
        <div className="flex items-center gap-2">
          <Image src="/Fintrack(logo).png" alt="Logo" width={28} height={28} />
          <h1 className="font-black text-xl text-slate-900 dark:text-slate-50 tracking-tight">ExpenseWise</h1>
        </div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mt-1" style={{ fontFamily: "'Manrope', sans-serif" }}>
          Wealth Management
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const isActive = currentPath.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onMobileClose}
              className={`flex items-center mx-4 py-3 px-4 transition-all duration-200 ease-precision rounded-xl ${
                isActive
                  ? "bg-primary/8 dark:bg-primary/15 text-foreground scale-[1.01] font-bold shadow-ambient-sm border-l-2 border-primary"
                  : "text-muted-foreground hover:bg-muted/60 dark:hover:bg-muted/40 hover:text-foreground"
              }`}
            >
              <item.icon className="h-5 w-5 mr-3 flex-shrink-0" />
              <span className="text-sm font-semibold" style={{ fontFamily: "'Manrope', sans-serif" }}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Section */}
      <div className="px-8 mt-auto space-y-6">


        {/* Profile & Settings Links */}
        <div className="space-y-1">
          <Link
            href="/profile"
            onClick={onMobileClose}
            className="flex items-center text-slate-500 dark:text-slate-400 py-2 px-4 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-md transition-all text-xs font-semibold"
          >
            <HelpCircle className="h-4 w-4 mr-3" />
            Settings
          </Link>
          <div className="flex items-center text-slate-500 dark:text-slate-400 py-2 px-4 text-xs font-semibold">
            <LogOut className="h-4 w-4 mr-3" />
            <span>{user}</span>
          </div>
        </div>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:block fixed left-0 top-0 h-screen z-[60]">
        {sidebar}
      </div>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-[70]">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onMobileClose} />
          <div className="relative h-full w-72 animate-slide-in">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 z-10 text-slate-500"
              onClick={onMobileClose}
            >
              <X className="h-5 w-5" />
            </Button>
            {sidebar}
          </div>
        </div>
      )}
    </>
  );
}
