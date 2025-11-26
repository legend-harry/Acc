
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PlusCircle, LayoutDashboard, ArrowLeftRight, Target, PieChart, User, Users, Check, Moon, Sun, Palette, Sparkles, Crown, Settings, FolderKanban, Bell, Archive } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { AddExpenseDialog } from "@/components/add-expense-dialog";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuRadioGroup, DropdownMenuRadioItem } from "@/components/ui/dropdown-menu";
import { useUser } from "@/context/user-context";
import Image from "next/image";
import { useSubscription } from "@/context/subscription-context";
import { InstallPwaButton } from "@/components/install-pwa-button";
import { useProjects } from "@/hooks/use-database";
import { useProjectFilter } from "@/context/project-filter-context";
import { Project } from "@/types";
import { NotificationBell } from "../notification-bell";


const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/transactions", icon: ArrowLeftRight, label: "Transactions" },
  { href: "/planner", icon: Target, label: "Planner" },
  { href: "/employees", icon: Users, label: "Employees" },
  { href: "/reports", icon: PieChart, label: "Reports" },
];

const profiles = ["Ammu", "Vijay", "Divyesh", "Anvika", "Guest"];

function GlobalProjectSwitcher() {
    const { projects } = useProjects();
    const { selectedProjectId, setSelectedProjectId } = useProjectFilter();
    const [defaultProject, setDefaultProject] = useState<string>("");

    useEffect(() => {
        const storedDefault = localStorage.getItem("defaultProjectId");
        if (storedDefault) {
            setDefaultProject(storedDefault);
        }
    }, []);

    const activeProjects = projects.filter(p => !p.archived);
    const archivedProjects = projects.filter(p => p.archived);
    const selectedProject = projects.find(p => p.id === selectedProjectId);

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                    <FolderKanban className="h-[1.2rem] w-[1.2rem]" />
                    <span className="sr-only">Switch Project</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>{selectedProject ? `Project: ${selectedProject.name}` : "Select a Project"}</DropdownMenuLabel>
                <DropdownMenuRadioGroup value={selectedProjectId} onValueChange={setSelectedProjectId}>
                     <DropdownMenuRadioItem value="all">
                        <FolderKanban className="mr-2 h-4 w-4" />
                        <span>All Projects</span>
                    </DropdownMenuRadioItem>
                    <DropdownMenuSeparator />
                    {activeProjects.map((project: Project) => (
                        <DropdownMenuRadioItem key={project.id} value={project.id}>
                            <FolderKanban className="mr-2 h-4 w-4" />
                            <span>{project.name} {project.id === defaultProject && <span className="text-xs text-muted-foreground ml-2">(default)</span>}</span>
                        </DropdownMenuRadioItem>
                    ))}
                    {archivedProjects.length > 0 && <DropdownMenuSeparator />}
                    {archivedProjects.map((project: Project) => (
                         <DropdownMenuRadioItem key={project.id} value={project.id}>
                            <Archive className="mr-2 h-4 w-4" />
                            <span>{project.name}</span>
                        </DropdownMenuRadioItem>
                    ))}
                </DropdownMenuRadioGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    )
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
                    {profiles.map(profile => (
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
    )
}

function ThemeSwitcher() {
    const [mode, setMode] = useState('light');
    const [theme, setTheme] = useState('default');
    const { isPremium, openUpgradeDialog } = useSubscription();

    useEffect(() => {
        const storedMode = localStorage.getItem('theme-mode') || 'light';
        const storedTheme = localStorage.getItem('theme-base') || 'default';
        setMode(storedMode);
        setTheme(storedTheme);
    }, []);

    useEffect(() => {
        document.documentElement.classList.remove('light', 'dark', 'theme-special');
        
        document.documentElement.classList.add(mode);
        if (theme === 'special' && isPremium) {
            document.documentElement.classList.add('theme-special');
        }

        localStorage.setItem('theme-mode', mode);
        localStorage.setItem('theme-base', theme);
    }, [mode, theme, isPremium]);

    const toggleMode = () => setMode(mode === 'light' ? 'dark' : 'light');

    const handleThemeChange = (selectedTheme: string) => {
        if (selectedTheme === 'special' && !isPremium) {
            openUpgradeDialog('special-theme');
        } else {
            setTheme(selectedTheme);
        }
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
    )
}

export function Header() {
  const isMobile = useIsMobile();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isPremium } = useSubscription();

  const handleLinkClick = () => {
    setMobileMenuOpen(false);
  };

  const navLinks = (
    <>
      {navItems.map((item) => (
        <Button
          key={item.label}
          variant={pathname.startsWith(item.href) ? "secondary" : "ghost"}
          asChild
          className="flex items-center justify-start gap-2"
          onClick={handleLinkClick}
        >
          <Link href={item.href}>
            <item.icon className="h-4 w-4" />
            <span>{item.label}</span>
          </Link>
        </Button>
      ))}
    </>
  );

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between gap-4 border-b bg-background/80 px-4 backdrop-blur-sm md:px-6">
       <div className="flex items-center gap-4">
        {isMobile ? (
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                <Button variant="outline" size="icon">
                    <Menu />
                </Button>
                </SheetTrigger>
                <SheetContent side="left">
                    <SheetHeader>
                        <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                        <SheetDescription className="sr-only">Main navigation links for the application.</SheetDescription>
                    </SheetHeader>
                    <nav className="grid gap-2 text-lg font-medium mt-8">
                        <div className="flex items-center gap-2 font-bold mb-4 px-2.5">
                            <Image src="/Fintrack(logo).png" alt="ExpenseWise Logo" width={28} height={28} />
                            <h1 className="text-xl font-bold font-headline">ExpenseWise</h1>
                        </div>
                        {navLinks}
                    </nav>
                     {!isPremium && (
                        <div className="mt-auto p-4">
                           <Button asChild className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
                                <Link href="/upgrade">
                                    <Sparkles className="mr-2 h-4 w-4" />
                                    Upgrade to Premium
                                </Link>
                            </Button>
                        </div>
                    )}
                </SheetContent>
            </Sheet>
            ) : (
            <div className="flex items-center gap-2 font-bold">
                <Image src="/Fintrack(logo).png" alt="ExpenseWise Logo" width={28} height={28} />
                <h1 className="text-xl font-bold font-headline">ExpenseWise</h1>
            </div>
        )}
       </div>


      {!isMobile && (
        <nav className="hidden md:flex items-center gap-2 mx-auto">
          {navLinks}
        </nav>
      )}

      <div className="flex items-center gap-2">
        <NotificationBell />
        <InstallPwaButton />
        <ThemeSwitcher />
        <GlobalProjectSwitcher />
        <ProfileSwitcher />
        {!isPremium && !isMobile && (
            <Button asChild size="sm" className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
                <Link href="/upgrade">
                    <Crown className="mr-2 h-4 w-4" />
                    Upgrade
                </Link>
            </Button>
        )}
        <AddExpenseDialog>
            <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Transaction
            </Button>
        </AddExpenseDialog>
      </div>
    </header>
  );
}
