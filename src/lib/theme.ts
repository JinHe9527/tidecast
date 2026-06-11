import { create } from "zustand";

export type Theme = "dark" | "light";

const STORAGE_KEY = "tidecast-theme";

function getInitialTheme(): Theme {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved === "dark" || saved === "light") return saved;
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

/** Flip the `light`/`dark` class + data-theme on <html>; tokens re-resolve via CSS vars. */
function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.toggle("light", theme === "light");
  root.classList.toggle("dark", theme === "dark");
  root.setAttribute("data-theme", theme); // HeroUI v3 keys off data-theme
  localStorage.setItem(STORAGE_KEY, theme);
}

interface ThemeStore {
  theme: Theme;
  set: (theme: Theme) => void;
  toggle: () => void;
}

/**
 * Shared theme store so the title-bar toggle and the settings panel stay in
 * sync. Applied to <html> at import (before first paint) and on every change.
 */
export const useTheme = create<ThemeStore>((set, get) => {
  const initial = getInitialTheme();
  applyTheme(initial);
  return {
    theme: initial,
    set: (theme) => {
      applyTheme(theme);
      set({ theme });
    },
    toggle: () => {
      const next: Theme = get().theme === "dark" ? "light" : "dark";
      applyTheme(next);
      set({ theme: next });
    },
  };
});
