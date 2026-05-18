// AI Factory — settings store (localStorage), reactive via useSyncExternalStore
import { useSyncExternalStore } from "react";

export type Theme = "dark" | "light" | "system";
export type AccentColor = "blue" | "purple" | "green" | "neon";
export type Density = "compact" | "normal" | "large";

export type NotificationKind =
  | "mission_created"
  | "mission_started"
  | "mission_completed"
  | "critical_error"
  | "approval_needed"
  | "worker_status";

export interface FactorySettings {
  // Appearance
  theme: Theme;
  accent: AccentColor;
  density: Density;
  // Notifications
  notificationsEnabled: boolean;
  notificationTypes: Record<NotificationKind, boolean>;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  // Factory
  autopilot: boolean;
  safeMode: boolean;
  workerUrl: string;
  workerPort: number;
  // Projects
  defaultProject: string;
  defaultRepo: string;
  whatsappAlert: string;
}

const STORAGE_KEY = "factory.settings.v1";

const DEFAULTS: FactorySettings = {
  theme: "dark",
  accent: "blue",
  density: "normal",
  notificationsEnabled: true,
  notificationTypes: {
    mission_created: true,
    mission_started: true,
    mission_completed: true,
    critical_error: true,
    approval_needed: true,
    worker_status: true,
  },
  soundEnabled: true,
  vibrationEnabled: true,
  autopilot: false,
  safeMode: true,
  workerUrl: "",
  workerPort: 8787,
  defaultProject: "",
  defaultRepo: "",
  whatsappAlert: "11991860102",
};

function read(): FactorySettings {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULTS,
      ...parsed,
      notificationTypes: { ...DEFAULTS.notificationTypes, ...(parsed?.notificationTypes ?? {}) },
    };
  } catch {
    return DEFAULTS;
  }
}

let current: FactorySettings = read();
const listeners = new Set<() => void>();
let version = 0;

function emit() {
  version++;
  listeners.forEach((l) => l());
}

export const ACCENT_PRESETS: Record<AccentColor, { primary: string; ring: string; accent: string; label: string; swatch: string }> = {
  blue:   { primary: "#38bdf8", ring: "#38bdf8", accent: "#8b5cf6", label: "Azul",  swatch: "#38bdf8" },
  purple: { primary: "#a855f7", ring: "#a855f7", accent: "#38bdf8", label: "Roxo",  swatch: "#a855f7" },
  green:  { primary: "#22c55e", ring: "#22c55e", accent: "#14b8a6", label: "Verde", swatch: "#22c55e" },
  neon:   { primary: "#39ff14", ring: "#39ff14", accent: "#ff00d4", label: "Neon",  swatch: "#39ff14" },
};

export const DENSITY_SCALE: Record<Density, string> = {
  compact: "0.875",
  normal: "1",
  large: "1.125",
};

export function applySettings(s: FactorySettings) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;

  // Theme
  const wantDark =
    s.theme === "dark" ||
    (s.theme === "system" && window.matchMedia?.("(prefers-color-scheme: dark)").matches);
  root.classList.toggle("dark", wantDark);
  root.classList.toggle("light", !wantDark);
  root.dataset.theme = s.theme;

  // Accent color
  const acc = ACCENT_PRESETS[s.accent];
  root.style.setProperty("--primary", acc.primary);
  root.style.setProperty("--ring", acc.ring);
  root.style.setProperty("--accent", acc.accent);

  // Density
  root.dataset.density = s.density;
  root.style.fontSize = `${parseFloat(DENSITY_SCALE[s.density]) * 16}px`;
}

export function getSettings(): FactorySettings {
  return current;
}

export function updateSettings(patch: Partial<FactorySettings>) {
  current = { ...current, ...patch };
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
    } catch {}
  }
  applySettings(current);
  emit();
}

export function updateNotificationType(kind: NotificationKind, enabled: boolean) {
  updateSettings({
    notificationTypes: { ...current.notificationTypes, [kind]: enabled },
  });
}

export function useFactorySettings(): FactorySettings {
  useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => version,
    () => version,
  );
  return current;
}

// Apply immediately on load
if (typeof window !== "undefined") {
  applySettings(current);
  // React to system theme changes when in "system" mode
  try {
    window.matchMedia?.("(prefers-color-scheme: dark)").addEventListener("change", () => {
      if (current.theme === "system") applySettings(current);
    });
  } catch {}
}
