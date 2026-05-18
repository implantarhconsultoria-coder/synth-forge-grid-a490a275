// AI FACTORY — User-configurable settings
// Persisted to localStorage and shared across the app.

import { useSyncExternalStore } from "react";

export interface FactorySettings {
  workerUrl: string;
  workerPort: number;
  autopilot: boolean;
  safeMode: boolean;
  githubConnected: boolean;
  supabaseConnected: boolean;
  notifications: boolean;
  defaultProject: string;
  defaultRepo: string;
  whatsappAlert: string;
}

const KEY = "factory.settings.v1";

export const DEFAULT_SETTINGS: FactorySettings = {
  workerUrl: "http://localhost",
  workerPort: 8787,
  autopilot: true,
  safeMode: true,
  githubConnected: true,
  supabaseConnected: true,
  notifications: false,
  defaultProject: "AI FACTORY",
  defaultRepo: "implantarh/ai-factory",
  whatsappAlert: "11991860102",
};

function read(): FactorySettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

let current: FactorySettings = read();
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

export const factorySettings = {
  get(): FactorySettings {
    return current;
  },
  set(patch: Partial<FactorySettings>) {
    current = { ...current, ...patch };
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(KEY, JSON.stringify(current));
      } catch {
        /* ignore */
      }
    }
    emit();
  },
  reset() {
    current = { ...DEFAULT_SETTINGS };
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(KEY);
    }
    emit();
  },
  workerBase(): string {
    const url = current.workerUrl?.trim() || "http://localhost";
    const hasPort = /:\d+(?:\/|$)/.test(url);
    if (hasPort) return url.replace(/\/$/, "");
    return `${url.replace(/\/$/, "")}:${current.workerPort}`;
  },
  subscribe(l: () => void) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
};

export function useFactorySettings(): FactorySettings {
  return useSyncExternalStore(
    factorySettings.subscribe,
    factorySettings.get,
    () => DEFAULT_SETTINGS,
  );
}
