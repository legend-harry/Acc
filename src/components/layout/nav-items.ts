import type { LucideIcon } from "lucide-react";
import {
  ArrowLeftRight,
  Fish,
  LayoutDashboard,
  PieChart,
  Target,
  Users,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  color: string;
};

export const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, color: "text-sky-600" },
  { href: "/transactions", label: "Transactions", icon: ArrowLeftRight, color: "text-teal-600" },
  { href: "/planner", label: "Planner", icon: Target, color: "text-amber-500" },
  { href: "/employees", label: "Employees", icon: Users, color: "text-emerald-500" },
  { href: "/reports", label: "Reports", icon: PieChart, color: "text-violet-600" },
  { href: "/shrimp", label: "Fish Farm", icon: Fish, color: "text-rose-500" },
];
