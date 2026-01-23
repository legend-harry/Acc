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
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/transactions", icon: ArrowLeftRight, label: "Transactions" },
  { href: "/planner", icon: Target, label: "Planner" },
  { href: "/employees", icon: Users, label: "Employees" },
  { href: "/reports", icon: PieChart, label: "Reports" },
  { href: "/shrimp", icon: Fish, label: "Fish Farm" },
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
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <User className="h-4 w-4" />
          <span className="hidden md:inline">{user}</span>
        </Button>
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
      <Button variant="outline" size="icon" disabled>
        <Palette className="h-[1.2rem] w-[1.2rem]" />
        <span className="sr-only">Toggle theme</span>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <Palette className="h-[1.2rem] w-[1.2rem]" />
          <span className="sr-only">Toggle theme</span>
        </Button>
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

  const renderNavLinks = (variant: "desktop" | "mobile" = "desktop") =>
    navItems.map((item) => {
      const isActive = currentPath.startsWith(item.href);
      const variantClasses =
        variant === "mobile"
          ? "w-full justify-start rounded-lg px-4 py-3 text-base font-semibold"
          : "rounded-md px-3 py-1 text-sm";
      const activeClasses = isActive ? "bg-blue-600 text-white shadow" : "text-muted-foreground hover:bg-muted hover:text-foreground";

      return (
        <Link
          key={item.label}
          href={item.href}
          onClick={handleLinkClick}
          className={`flex items-center gap-2 transition ${variantClasses} ${activeClasses}`}
          aria-current={isActive ? "page" : undefined}
        >
          <item.icon className="h-4 w-4" />
          <span>{item.label}</span>
        </Link>
      );
    });

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between gap-4 border-b border-muted/30 bg-background/90 px-4 backdrop-blur-md backdrop-saturate-[1.2] shadow-sm md:px-6">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="text-foreground md:hidden"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label="Toggle navigation"
            aria-expanded={mobileMenuOpen}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Image src="/Fintrack(logo).png" alt="ExpenseWise Logo" width={28} height={28} />
            <span className="text-base font-semibold tracking-wide md:text-lg">ExpenseWise</span>
          </div>
        </div>

        <nav className="hidden flex-1 items-center justify-center gap-2 md:flex">
          {renderNavLinks()}
        </nav>

        <div className="flex flex-1 flex-wrap items-center justify-end gap-2">
          <NotificationBell />
          <InstallPwaButton />
          <ThemeSwitcher />
          <GlobalProjectSwitcher />
          <ProfileSwitcher />
          {!isPremium && (
            <Button asChild size="sm" className="hidden md:inline-flex bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
              <Link href="/upgrade">
                <Crown className="mr-2 h-4 w-4" />
                Upgrade
              </Link>
            </Button>
          )}
          <AddExpenseDialog>
            <Button className="min-w-[150px] whitespace-nowrap md:min-w-0" size="sm">
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Transaction
            </Button>
          </AddExpenseDialog>
        </div>
      </header>

      {mobileMenuOpen && (
        <div className="md:hidden border-b border-muted/20 bg-background/95 px-4 py-3 shadow-sm">
          <nav className="flex flex-col gap-2">{renderNavLinks("mobile")}</nav>
          {!isPremium && (
            <div className="mt-3">
              <Button asChild className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
                <Link href="/upgrade">
                  <Sparkles className="mr-2 h-4 w-4" />
                  Upgrade to Premium
                </Link>
              </Button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
