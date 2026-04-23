"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark" | "system";

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: "light" | "dark";
  setTheme: (theme: Theme) => void;
  specialThemeEnabled: boolean;
  setSpecialThemeEnabled: (enabled: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({
  children,
  defaultTheme = "light",
  storageKey = "theme-mode",
  specialStorageKey = "special-theme-enabled",
}: {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
  specialStorageKey?: string;
}) {
  const [theme, setThemeState] = useState<Theme>(defaultTheme);
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");
  const [specialThemeEnabled, setSpecialThemeEnabledState] = useState(false);

  useEffect(() => {
    const storedTheme = localStorage.getItem(storageKey) as Theme | null;
    if (storedTheme) {
      setThemeState(storedTheme);
    }

    const storedSpecialTheme = localStorage.getItem(specialStorageKey);
    setSpecialThemeEnabledState(storedSpecialTheme === "true");
  }, [storageKey]);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");

    let currentTheme = theme;
    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
      currentTheme = systemTheme;
    }

    root.classList.add(currentTheme as string);
    setResolvedTheme(currentTheme as "light" | "dark");

    if (specialThemeEnabled) {
      root.classList.add("theme-special");
    } else {
      root.classList.remove("theme-special");
    }

    // Add listener for system theme changes if in system mode
    if (theme === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handleChange = () => {
        const newSystemTheme = mediaQuery.matches ? "dark" : "light";
        root.classList.remove("light", "dark");
        root.classList.add(newSystemTheme);
        setResolvedTheme(newSystemTheme);
      };

      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }
  }, [theme, specialThemeEnabled]);

  const setTheme = (newTheme: Theme) => {
    localStorage.setItem(storageKey, newTheme);
    setThemeState(newTheme);
  };

  const setSpecialThemeEnabled = (enabled: boolean) => {
    localStorage.setItem(specialStorageKey, String(enabled));
    setSpecialThemeEnabledState(enabled);
  };

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, specialThemeEnabled, setSpecialThemeEnabled }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
