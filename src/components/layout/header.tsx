"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  PlusCircle,
  LayoutDashboard,
  ArrowLeftRight,
  Target,
  PieChart,
  User,
  Users,
  Moon,
  Sun,
  Palette,
  Sparkles,
  Crown,
  Settings,
  FolderKanban,
  Bell,
  Archive,
  Fish,
  Menu,
  Search,
  ChevronDown,
  TrendingUp,
  Wallet,
  X,
} from "lucide-react";
import { AddExpenseDialog } from "@/components/add-expense-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import { useUser } from "@/context/user-context";
import { useSubscription } from "@/context/subscription-context";
import { InstallPwaButton } from "@/components/install-pwa-button";
import { useProjects } from "@/hooks/use-database";
import { useProjectFilter } from "@/context/project-filter-context";
import { NotificationBell } from "../notification-bell";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Overview" },
  { href: "/transactions", icon: ArrowLeftRight, label: "Cash Flow" },
  { href: "/planner", icon: Wallet, label: "Budgeting" },
  { href: "/employees", icon: Users, label: "Employees" },
  { href: "/reports", icon: PieChart, label: "Reports" },
  { href: "/shrimp", icon: Fish, label: "Aquaculture" },
];

const profiles = ["Ammu", "Vijay", "Divyesh", "Anvika", "Guest"];

function GlobalProjectSwitcher() {
  const { projects } = useProjects();
  const { selectedProjectId, setSelectedProjectId } = useProjectFilter();
  const [defaultProject, setDefaultProject] = useState("");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== "undefined") {
      const storedDefault = localStorage.getItem("defaultProjectId");
      if (storedDefault) {
        setDefaultProject(storedDefault);
      }
    }
  }, []);

  const activeProjects = projects.filter((project) => !project.archived);
  const archivedProjects = projects.filter((project) => project.archived);
  const selectedProject = projects.find((project) => project.id === selectedProjectId);

  if (!isMounted) {
    return (
      <Button variant="outline" size="icon" disabled>
        <FolderKanban className="h-[1.2rem] w-[1.2rem]" />
        <span className="sr-only">Switch Project</span>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <FolderKanban className="h-[1.2rem] w-[1.2rem]" />
          <span className="sr-only">Switch Project</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>
          {selectedProject ? `Project: ${selectedProject.name}` : "Select a Project"}
        </DropdownMenuLabel>
        <DropdownMenuRadioGroup value={selectedProjectId} onValueChange={setSelectedProjectId}>
          <DropdownMenuRadioItem value="all">
            <FolderKanban className="mr-2 h-4 w-4" />
            <span>All Projects</span>
          </DropdownMenuRadioItem>
          <DropdownMenuSeparator />
          {activeProjects.map((project) => (
            <DropdownMenuRadioItem key={project.id} value={project.id}>
              <FolderKanban className="mr-2 h-4 w-4" />
              <span>
                {project.name} {project.id === defaultProject && <span className="text-xs text-muted-foreground ml-2">(default)</span>}
              </span>
            </DropdownMenuRadioItem>
          ))}
          {archivedProjects.length > 0 && <DropdownMenuSeparator />}
          {archivedProjects.map((project) => (
            <DropdownMenuRadioItem key={project.id} value={project.id}>
              <Archive className="mr-2 h-4 w-4" />
              <span>{project.name}</span>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ProfileSwitcher() {
  const { user, setUser } = useUser();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold border-2 border-slate-200 dark:border-slate-700 shadow-sm hover:scale-105 transition-transform">
          {user?.charAt(0) || "U"}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Switch Profile</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={user} onValueChange={setUser}>
          {profiles.map((profile) => (
            <DropdownMenuRadioItem key={profile} value={profile}>
              <User className="mr-2 h-4 w-4" />
              <span>{profile}</span>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/profile">
            <Settings className="mr-2 h-4 w-4" />
            <span>Profile & Settings</span>
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ThemeSwitcher() {
  const [mode, setMode] = useState("light");
  const [theme, setTheme] = useState("default");
  const [isMounted, setIsMounted] = useState(false);
  const { isPremium, openUpgradeDialog } = useSubscription();

  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== "undefined") {
      const storedMode = localStorage.getItem("theme-mode") || "light";
      const storedTheme = localStorage.getItem("theme-base") || "default";
      setMode(storedMode);
      setTheme(storedTheme);
    }
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.classList.remove("light", "dark", "theme-special");
    document.documentElement.classList.add(mode);

    if (theme === "special" && isPremium) {
      document.documentElement.classList.add("theme-special");
    }

    if (typeof window !== "undefined") {
      localStorage.setItem("theme-mode", mode);
      localStorage.setItem("theme-base", theme);
    }
  }, [mode, theme, isPremium]);

  const toggleMode = () => setMode((previous) => (previous === "light" ? "dark" : "light"));

  const handleThemeChange = (selectedTheme: string) => {
    if (selectedTheme === "special" && !isPremium) {
      openUpgradeDialog("special-theme");
      return;
    }
    setTheme(selectedTheme);
  };

  if (!isMounted) {
    return (
      <button className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors" disabled>
        <Palette className="h-5 w-5" />
      </button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
          <Palette className="h-5 w-5" />
          <span className="sr-only">Toggle theme</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={toggleMode}>
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="ml-2">Toggle Dark Mode</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup value={theme} onValueChange={handleThemeChange}>
          <DropdownMenuRadioItem value="default">Default Theme</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="special" disabled={!isPremium}>
            <span className="flex items-center">
              {!isPremium && <Sparkles className="mr-2 h-4 w-4 text-yellow-400" />}
              Special Theme
            </span>
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function Header() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isPremium } = useSubscription();

  const currentPath = pathname ?? "";

  const handleLinkClick = () => setMobileMenuOpen(false);

  return (
    <>
      {/* Glass-panel top navigation */}
      <nav className="sticky top-0 z-30 h-16 lg:h-20 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl border-b border-slate-200/60 dark:border-slate-800/60 px-4 lg:px-8 flex items-center justify-between shadow-sm">
        {/* Left: Logo + Nav */}
        <div className="flex items-center gap-6 lg:gap-10">
          {/* Mobile menu toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden text-slate-600 dark:text-slate-400"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label="Toggle navigation"
            aria-expanded={mobileMenuOpen}
          >
            <Menu className="h-5 w-5" />
          </Button>

          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2.5 flex-shrink-0">
            <Image src="/Fintrack(logo).png" alt="ExpenseWise Logo" width={28} height={28} />
            <div>
              <h1 className="font-black text-lg text-slate-900 dark:text-slate-50 tracking-tight leading-none">ExpenseWise</h1>
              <p className="text-[9px] font-semibold text-slate-500 uppercase tracking-[0.15em] leading-none mt-0.5" style={{ fontFamily: "'Manrope', sans-serif" }}>
                Wealth Management
              </p>
            </div>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = currentPath.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center px-3 xl:px-4 py-2 rounded-lg transition-all duration-200 ${
                    isActive
                      ? "bg-slate-200/60 dark:bg-slate-800/60 text-slate-900 dark:text-slate-50"
                      : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                  aria-current={isActive ? "page" : undefined}
                >
                  <item.icon className="h-[1.15rem] w-[1.15rem] mr-2 flex-shrink-0" />
                  <span className="text-sm font-semibold whitespace-nowrap" style={{ fontFamily: "'Manrope', sans-serif" }}>
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Right: Search + Actions */}
        <div className="flex items-center gap-2 lg:gap-4">
          {/* Search */}
          <div className="hidden xl:block relative w-52">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search data..."
              className="w-full bg-slate-100 dark:bg-slate-900 border-none ring-1 ring-slate-200/50 dark:ring-slate-700/50 focus:ring-2 focus:ring-primary/30 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-700 dark:text-slate-300 placeholder:text-slate-400 transition-all outline-none"
            />
          </div>

          <NotificationBell />
          <ThemeSwitcher />
          <GlobalProjectSwitcher />

          {!isPremium && (
            <Button asChild size="sm" className="hidden xl:inline-flex bg-gradient-to-r from-yellow-400 to-orange-500 text-white shadow-lg shadow-orange-500/20">
              <Link href="/upgrade">
                <Crown className="mr-1.5 h-3.5 w-3.5" />
                Upgrade
              </Link>
            </Button>
          )}

          <AddExpenseDialog>
            <button className="hidden md:flex items-center bg-primary text-primary-foreground px-4 lg:px-5 py-2 lg:py-2.5 rounded-lg text-sm font-bold shadow-lg shadow-primary/10 active:scale-95 transition-all duration-200">
              <PlusCircle className="h-4 w-4 mr-2" />
              Add Transaction
            </button>
          </AddExpenseDialog>

          <ProfileSwitcher />
        </div>
      </nav>

      {/* Mobile menu drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-[50]">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
          <div className="relative w-72 h-full bg-white dark:bg-slate-950 shadow-2xl animate-slide-in">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Image src="/Fintrack(logo).png" alt="Logo" width={24} height={24} />
                <span className="font-bold text-slate-900 dark:text-slate-50">ExpenseWise</span>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <nav className="flex flex-col gap-1 p-3">
              {navItems.map((item) => {
                const isActive = currentPath.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={handleLinkClick}
                    className={`flex items-center px-4 py-3 rounded-lg text-sm font-semibold transition-all ${
                      isActive
                        ? "bg-slate-200/60 dark:bg-slate-800/60 text-slate-900 dark:text-slate-50"
                        : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    <item.icon className="h-5 w-5 mr-3" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            {!isPremium && (
              <div className="mx-3 mt-4">
                <Button asChild className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
                  <Link href="/upgrade" onClick={handleLinkClick}>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Upgrade to Premium
                  </Link>
                </Button>
              </div>
            )}
            <div className="mx-3 mt-4">
              <AddExpenseDialog>
                <Button className="w-full" onClick={handleLinkClick}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Transaction
                </Button>
              </AddExpenseDialog>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
