import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { THEME_STORAGE_KEY, applyResolvedTheme, readThemePreference, resolveTheme, saveThemePreference } from './theme';

class MemoryStorage {
  private values = new Map<string, string>();
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, String(value)); }
  removeItem(key: string) { this.values.delete(key); }
}

describe('theme preference', () => {
  beforeEach(() => {
    Object.assign(globalThis, { localStorage: new MemoryStorage() });
  });

  it('defaults to light and ignores unknown stored values', () => {
    expect(readThemePreference()).toBe('light');
    localStorage.setItem(THEME_STORAGE_KEY, 'purple');
    expect(readThemePreference()).toBe('light');
  });

  it('persists light, dark, and system', () => {
    for (const preference of ['dark', 'system', 'light'] as const) {
      saveThemePreference(preference);
      expect(readThemePreference()).toBe(preference);
    }
  });

  it('resolves system from the phone setting', () => {
    expect(resolveTheme('system', true)).toBe('dark');
    expect(resolveTheme('system', false)).toBe('light');
    expect(resolveTheme('dark', false)).toBe('dark');
    expect(resolveTheme('light', true)).toBe('light');
  });

  it('applies the dark class, color-scheme, and native system bars', () => {
    const classes = new Set<string>();
    const calls: boolean[] = [];
    const meta = { content: '', setAttribute(_: string, value: string) { this.content = value; } };
    Object.assign(globalThis, {
      document: {
        documentElement: { classList: { toggle: (name: string, on: boolean) => (on ? classes.add(name) : classes.delete(name)) }, style: {} as Record<string, string> },
        querySelector: () => meta,
      },
      window: { KharchaAppearance: { setDarkMode: (dark: boolean) => calls.push(dark) } },
    });
    applyResolvedTheme('dark');
    expect(classes.has('dark')).toBe(true);
    expect((document.documentElement.style as any).colorScheme).toBe('dark');
    expect(meta.content).toBe('#0f1419');
    applyResolvedTheme('light');
    expect(classes.has('dark')).toBe(false);
    expect(calls).toEqual([true, false]);
    delete (globalThis as any).document;
    delete (globalThis as any).window;
  });
});

describe('dark theme wiring', () => {
  const root = resolve(import.meta.dirname, '../../..');
  const read = (path: string) => readFileSync(resolve(root, path), 'utf8');

  it('applies the saved theme in index.html before the app bundle loads', () => {
    const html = read('client/index.html');
    const themeScript = html.indexOf(`localStorage.getItem('${THEME_STORAGE_KEY}')`);
    expect(themeScript).toBeGreaterThan(-1);
    expect(themeScript).toBeLessThan(html.indexOf('/src/main.tsx'));
    expect(html).toContain("classList.add('dark')");
    // The <base> script must stay first in <head>.
    expect(html.indexOf('document.write')).toBeLessThan(themeScript);
  });

  it('keeps dark colours screen-only so print and PDF stay light', () => {
    const css = read('client/src/darkTheme.css');
    expect(read('client/src/index.css')).toContain('@import "./darkTheme.css";');
    const firstDarkRule = css.indexOf('html.dark {');
    expect(css.lastIndexOf('@media screen', firstDarkRule)).toBeGreaterThan(-1);
    expect(css).not.toMatch(/@media print/);
  });

  it('remaps the most common hard-coded light surfaces and dark text', () => {
    const css = read('client/src/darkTheme.css');
    for (const selector of ['.bg-white', '.text-kharcha-navy', '.text-gray-600', '.border-black', '.bg-kharcha-cream', '.bg-\\[\\#fff3e3\\]']) {
      expect(css, selector).toContain(`html.dark ${selector} `);
    }
  });

  it('exposes the Android appearance bridge for system bars and phone dark mode', () => {
    const main = read('android-app/app/src/main/java/app/kharcha/splitter/MainActivity.java');
    expect(main).toContain('"KharchaAppearance"');
    expect(main).toContain('isSystemDarkMode');
    expect(main).toContain('setDarkMode');
  });
});
