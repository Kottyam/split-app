// App colour theme (light / dark / follow the phone). The same rules run in a tiny inline script
// in client/index.html before the first paint, so a saved dark theme never flashes white.
export type ThemePreference = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'kharcha-theme';
export const THEME_PREFERENCES: readonly ThemePreference[] = ['light', 'dark', 'system'];
const LIGHT_THEME_COLOR = '#ffffff';
const DARK_THEME_COLOR = '#0f1419';

type AppearanceBridge = {
  isSystemDarkMode?: () => boolean;
  setDarkMode?: (dark: boolean) => void;
};

function getAppearanceBridge(): AppearanceBridge | null {
  if (typeof window === 'undefined') return null;
  const bridge = (window as Window & { KharchaAppearance?: AppearanceBridge }).KharchaAppearance;
  return bridge && typeof bridge === 'object' ? bridge : null;
}

export function isThemePreference(value: unknown): value is ThemePreference {
  return value === 'light' || value === 'dark' || value === 'system';
}

export function readThemePreference(): ThemePreference {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return isThemePreference(stored) ? stored : 'light';
  } catch {
    return 'light';
  }
}

export function saveThemePreference(preference: ThemePreference): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, preference);
  } catch {
    // Storage can be unavailable in private modes; the theme still applies for this session.
  }
}

/** Is the phone / browser in dark mode? The Android app answers through its native bridge. */
export function systemPrefersDark(): boolean {
  const bridge = getAppearanceBridge();
  if (bridge && typeof bridge.isSystemDarkMode === 'function') {
    try {
      return bridge.isSystemDarkMode() === true;
    } catch {
      // fall through to the media query
    }
  }
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function resolveTheme(preference: ThemePreference, systemDark: boolean = systemPrefersDark()): ResolvedTheme {
  if (preference === 'system') return systemDark ? 'dark' : 'light';
  return preference;
}

/** Apply the resolved theme to <html>, the browser chrome colour, and the Android system bars. */
export function applyResolvedTheme(theme: ResolvedTheme): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.classList.toggle('dark', theme === 'dark');
  root.style.colorScheme = theme;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', theme === 'dark' ? DARK_THEME_COLOR : LIGHT_THEME_COLOR);
  const bridge = getAppearanceBridge();
  if (bridge && typeof bridge.setDarkMode === 'function') {
    try {
      bridge.setDarkMode(theme === 'dark');
    } catch {
      // Older APKs without the appearance bridge keep their light system bars.
    }
  }
}
