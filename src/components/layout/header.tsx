
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PlusCircle, LayoutDashboard, ArrowLeftRight, Target, PieChart, User, Check, Moon, Sun, Palette } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { AddExpenseDialog } from "@/components/add-expense-dialog";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuRadioGroup, DropdownMenuRadioItem } from "@/components/ui/dropdown-menu";
import { useUser } from "@/context/user-context";
import Image from "next/image";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/transactions", icon: ArrowLeftRight, label: "Transactions" },
  { href: "/planner", icon: Target, label: "Planner" },
  { href: "/reports", icon: PieChart, label: "Reports" },
];

const profiles = ["Ammu", "Vijay", "Divyesh", "Anvika", "Guest"];

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
                <DropdownMenuSeparator />
                {profiles.map(profile => (
                    <DropdownMenuItem key={profile} onSelect={() => setUser(profile)}>
                        <User className="mr-2 h-4 w-4" />
                        <span>{profile}</span>
                        {user === profile && <Check className="ml-auto h-4 w-4" />}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

function ThemeSwitcher() {
    const [mode, setMode] = useState('light');
    const [theme, setTheme] = useState('default');

    useEffect(() => {
        const storedMode = localStorage.getItem('theme-mode') || 'light';
        const storedTheme = localStorage.getItem('theme-base') || 'default';
        setMode(storedMode);
        setTheme(storedTheme);
    }, []);

    useEffect(() => {
        document.documentElement.classList.remove('light', 'dark', 'theme-special');
        
        document.documentElement.classList.add(mode);
        if (theme === 'special') {
            document.documentElement.classList.add('theme-special');
        }

        localStorage.setItem('theme-mode', mode);
        localStorage.setItem('theme-base', theme);
    }, [mode, theme]);

    const toggleMode = () => setMode(mode === 'light' ? 'dark' : 'light');

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
                <DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>
                    <DropdownMenuRadioItem value="default">Default Theme</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="special">Special Theme</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

export function Header() {
  const isMobile = useIsMobile();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
    <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between gap-4 border-b bg-background/80 px-4 backdrop-blur-sm md:px-6">
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
        <ThemeSwitcher />
        <ProfileSwitcher />
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
