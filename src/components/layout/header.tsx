
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PlusCircle, Wallet, LayoutDashboard, ArrowLeftRight, Target, PieChart } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { AddExpenseDialog } from "@/components/add-expense-dialog";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/transactions", icon: ArrowLeftRight, label: "Transactions" },
  { href: "/budgets", icon: Target, label: "Budgets" },
  { href: "/reports", icon: PieChart, label: "Reports" },
];

export function Header() {
  const isMobile = useIsMobile();
  const pathname = usePathname();

  const navLinks = (
    <>
      {navItems.map((item) => (
        <Button
          key={item.label}
          variant={pathname.startsWith(item.href) ? "secondary" : "ghost"}
          asChild
        >
          <Link href={item.href} className="flex items-center gap-2">
            <item.icon className="h-4 w-4" />
            {!isMobile && <span>{item.label}</span>}
          </Link>
        </Button>
      ))}
    </>
  );

  return (
    <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm md:px-6">
      <div className="flex items-center gap-2 font-bold">
        <Wallet className="h-7 w-7 text-primary" />
        <h1 className="text-xl font-bold font-headline">MedidiWallet</h1>
      </div>

      <div className="flex-1 flex justify-center">
        {isMobile ? (
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon">
                <Menu />
              </Button>
            </SheetTrigger>
            <SheetContent side="left">
              <nav className="grid gap-2 text-lg font-medium mt-8">
                {navItems.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={`flex items-center gap-4 px-2.5 py-2 rounded-lg ${
                      pathname.startsWith(item.href)
                        ? "text-primary bg-muted"
                        : "text-muted-foreground hover:text-primary"
                    }`}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        ) : (
          <nav className="hidden md:flex items-center gap-2">
            {navLinks}
          </nav>
        )}
      </div>

      <AddExpenseDialog>
        <PlusCircle className="mr-2 h-4 w-4" />
        Add Expense
      </AddExpenseDialog>
    </header>
  );
}
