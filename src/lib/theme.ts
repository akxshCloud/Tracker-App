import { create } from "zustand";
import { getSetting, setSetting } from "@/features/debt/db";

type ThemeMode = "system" | "light" | "dark";

interface ThemeStore {
  mode: ThemeMode;
  resolved: "light" | "dark"; // the actual applied theme
  initialize: () => Promise<void>;
  setMode: (mode: ThemeMode) => Promise<void>;
  cycleMode: () => Promise<void>;
}

function getSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function resolveTheme(mode: ThemeMode): "light" | "dark" {
  if (mode === "system") return getSystemTheme();
  return mode;
}

function applyTheme(resolved: "light" | "dark") {
  const html = document.documentElement;
  html.setAttribute("data-theme", resolved);
  // Also toggle the class for Tailwind dark variant
  if (resolved === "dark") {
    html.classList.add("dark");
  } else {
    html.classList.remove("dark");
  }
}

export const useThemeStore = create<ThemeStore>((set, get) => ({
  mode: "system",
  resolved: "dark",

  initialize: async () => {
    let mode: ThemeMode = "system";
    try {
      const saved = await getSetting("theme");
      if (saved === "light" || saved === "dark" || saved === "system") {
        mode = saved;
      }
    } catch {
      // DB not ready yet, default to system
    }

    const resolved = resolveTheme(mode);
    applyTheme(resolved);
    set({ mode, resolved });

    // Watch for system theme changes
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    mq.addEventListener("change", () => {
      const { mode } = get();
      if (mode === "system") {
        const resolved = resolveTheme("system");
        applyTheme(resolved);
        set({ resolved });
      }
    });
  },

  setMode: async (mode) => {
    const resolved = resolveTheme(mode);
    applyTheme(resolved);
    set({ mode, resolved });
    try {
      await setSetting("theme", mode);
    } catch {
      // Settings table might not exist yet
    }
  },

  cycleMode: async () => {
    const { mode, setMode } = get();
    const next: ThemeMode = mode === "system" ? "light" : mode === "light" ? "dark" : "system";
    await setMode(next);
  },
}));
