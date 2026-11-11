import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  THEME_STORAGE_KEY,
  applyResolvedTheme,
  isThemePreference,
  readThemePreference,
  resolveTheme,
  saveThemePreference,
  systemPrefersDark,
  type ResolvedTheme,
  type ThemePreference,
} from "@/lib/theme";

type Theme = ResolvedTheme;

interface ThemeContextType {
  /** The theme actually on screen. */
  theme: Theme;
  /** What the user picked in Settings (light, dark, or follow the phone). */
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
  toggleTheme?: () => void;
  switchable: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  switchable?: boolean;
}

export function ThemeProvider({
  children,
  defaultTheme = "light",
  switchable = true,
}: ThemeProviderProps) {
  const [preference, setPreferenceState] = useState<ThemePreference>(() =>
    switchable ? readThemePreference() : defaultTheme,
  );
  const [systemDark, setSystemDark] = useState(() => systemPrefersDark());
  const theme = resolveTheme(preference, systemDark);

  useEffect(() => {
    applyResolvedTheme(theme);
  }, [theme]);

  // Follow the phone/browser while "System" is selected.
  useEffect(() => {
    if (preference !== "system" || typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    const query = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => setSystemDark(systemPrefersDark());
    query.addEventListener?.("change", onChange);
    window.addEventListener("kharcha-app-resume", onChange);
    onChange();
    return () => {
      query.removeEventListener?.("change", onChange);
      window.removeEventListener("kharcha-app-resume", onChange);
    };
  }, [preference]);

  // Keep several open tabs in sync.
  useEffect(() => {
    if (!switchable || typeof window === "undefined") return;
    const onStorage = (event: StorageEvent) => {
      if (event.key === THEME_STORAGE_KEY && isThemePreference(event.newValue)) setPreferenceState(event.newValue);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [switchable]);

  const setPreference = useCallback((next: ThemePreference) => {
    if (!switchable) return;
    setPreferenceState(next);
    saveThemePreference(next);
  }, [switchable]);

  const value = useMemo<ThemeContextType>(() => ({
    theme,
    preference,
    setPreference,
    toggleTheme: switchable ? () => setPreference(theme === "dark" ? "light" : "dark") : undefined,
    switchable,
  }), [preference, setPreference, switchable, theme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}

/** Like useTheme, but safe outside the provider (returns undefined). */
export function useOptionalTheme() {
  return useContext(ThemeContext);
}
