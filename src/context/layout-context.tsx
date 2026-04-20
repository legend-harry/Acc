"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

type LayoutMode = "default" | "enterprise";

interface LayoutContextType {
  layout: LayoutMode;
  setLayout: (layout: LayoutMode) => void;
}

const LayoutContext = createContext<LayoutContextType>({
  layout: "default",
  setLayout: () => {},
});

export function LayoutProvider({ children }: { children: ReactNode }) {
  const [layout, setLayoutState] = useState<LayoutMode>("default");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem("app-layout") as LayoutMode | null;
    if (stored === "enterprise" || stored === "default") {
      setLayoutState(stored);
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const html = document.documentElement;

    if (layout === "enterprise") {
      html.classList.add("theme-enterprise");
    } else {
      html.classList.remove("theme-enterprise");
    }

    localStorage.setItem("app-layout", layout);
  }, [layout, mounted]);

  const setLayout = (newLayout: LayoutMode) => {
    setLayoutState(newLayout);
  };

  return (
    <LayoutContext.Provider value={{ layout, setLayout }}>
      {children}
    </LayoutContext.Provider>
  );
}

export function useLayout() {
  return useContext(LayoutContext);
}
