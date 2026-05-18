// AI FACTORY — PWA notifications + worker health
import { factorySettings } from "./factory-settings";

export type NotifyEvent =
  | "mission_queued"
  | "mission_started"
  | "mission_done"
  | "mission_error"
  | "mission_needs_approval"
  | "worker_offline"
  | "worker_online";

const TITLES: Record<NotifyEvent, string> = {
  mission_queued: "Missão na fila",
  mission_started: "Missão iniciada",
  mission_done: "Missão concluída",
  mission_error: "Erro na missão",
  mission_needs_approval: "Aprovação necessária",
  worker_offline: "Worker offline",
  worker_online: "Worker online",
};

export function notificationsSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export function notificationPermission(): NotificationPermission {
  if (!notificationsSupported()) return "denied";
  return Notification.permission;
}

export async function ensureServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return null;
  try {
    const reg = await navigator.serviceWorker.register("/sw.js");
    return reg;
  } catch {
    return null;
  }
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!notificationsSupported()) return "denied";
  if (Notification.permission === "granted") {
    factorySettings.set({ notifications: true });
    await ensureServiceWorker();
    return "granted";
  }
  const result = await Notification.requestPermission();
  if (result === "granted") {
    factorySettings.set({ notifications: true });
    await ensureServiceWorker();
  }
  return result;
}

export async function notify(event: NotifyEvent, body?: string) {
  if (!notificationsSupported()) return;
  if (Notification.permission !== "granted") return;
  if (!factorySettings.get().notifications) return;
  const title = TITLES[event];
  try {
    const reg = await navigator.serviceWorker?.getRegistration();
    if (reg) {
      await reg.showNotification(title, {
        body: body ?? "",
        icon: "/ai-factory-icon.svg",
        badge: "/ai-factory-icon.svg",
        tag: event,
      });
    } else {
      new Notification(title, { body: body ?? "", icon: "/ai-factory-icon.svg" });
    }
  } catch {
    /* ignore */
  }
}

// -------- Worker health --------
export type WorkerStatus = "online" | "offline" | "unknown";

async function probe(path: string, signal: AbortSignal): Promise<boolean> {
  try {
    const base = factorySettings.workerBase();
    const res = await fetch(`${base}${path}`, { signal, mode: "cors" });
    if (!res.ok) return false;
    const ct = res.headers.get("content-type") || "";
    if (ct.includes("application/json")) {
      const j = await res.json().catch(() => null);
      if (j && typeof j === "object") {
        if ("ok" in j) return Boolean((j as any).ok);
        return true;
      }
    }
    return true;
  } catch {
    return false;
  }
}

export async function checkWorkerHealth(timeoutMs = 4000): Promise<WorkerStatus> {
  if (typeof window === "undefined") return "unknown";
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    for (const p of ["/status", "/health", "/saude"]) {
      const ok = await probe(p, ctrl.signal);
      if (ok) return "online";
    }
    return "offline";
  } finally {
    clearTimeout(t);
  }
}

let lastStatus: WorkerStatus = "unknown";
export function startWorkerMonitor(onChange?: (s: WorkerStatus) => void, intervalMs = 30_000) {
  if (typeof window === "undefined") return () => {};
  const tick = async () => {
    const s = await checkWorkerHealth();
    if (s !== lastStatus && s !== "unknown") {
      if (lastStatus === "online" && s === "offline") void notify("worker_offline");
      if (lastStatus === "offline" && s === "online") void notify("worker_online");
      lastStatus = s;
      onChange?.(s);
    } else if (lastStatus === "unknown" && s !== "unknown") {
      lastStatus = s;
      onChange?.(s);
    }
  };
  void tick();
  const id = setInterval(tick, intervalMs);
  return () => clearInterval(id);
}

export function getLastWorkerStatus(): WorkerStatus {
  return lastStatus;
}
