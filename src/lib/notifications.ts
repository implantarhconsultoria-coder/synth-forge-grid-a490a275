// AI Factory — notifications dispatcher honoring user settings
import { getSettings, type NotificationKind } from "./factory-settings";

export interface NotifyOptions {
  kind: NotificationKind;
  title: string;
  body?: string;
  force?: boolean; // ignore type toggle (still respects master switch)
}

export async function ensureNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === "undefined" || !("Notification" in window)) return "denied";
  if (Notification.permission === "default") {
    try {
      return await Notification.requestPermission();
    } catch {
      return "denied";
    }
  }
  return Notification.permission;
}

function playBeep() {
  try {
    const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = 880;
    gain.gain.value = 0.08;
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.15);
    setTimeout(() => ctx.close().catch(() => {}), 300);
  } catch {}
}

export async function notify({ kind, title, body, force }: NotifyOptions): Promise<boolean> {
  if (typeof window === "undefined") return false;
  const s = getSettings();

  if (!s.notificationsEnabled) return false;
  if (!force && !s.notificationTypes[kind]) return false;

  if (s.soundEnabled) playBeep();
  if (s.vibrationEnabled && "vibrate" in navigator) {
    try { navigator.vibrate?.([80, 40, 80]); } catch {}
  }

  if ("Notification" in window) {
    const perm = Notification.permission === "granted"
      ? "granted"
      : await ensureNotificationPermission();
    if (perm === "granted") {
      // Prefer SW notifications — they work when tab is in background / screen locked
      try {
        const reg = await navigator.serviceWorker?.getRegistration();
        if (reg) {
          await reg.showNotification(title, {
            body,
            icon: "/icon-192.png",
            badge: "/icon-192.png",
            tag: kind,
            renotify: true,
          } as NotificationOptions);
          return true;
        }
      } catch {}
      try {
        new Notification(title, { body, icon: "/icon-192.png" });
        return true;
      } catch {}
    }
  }
  return false;
}

export async function testNotification() {
  await ensureNotificationPermission();
  return notify({
    kind: "mission_created",
    title: "AI Factory",
    body: "Notificação de teste — som, vibração e alerta funcionando.",
    force: true,
  });
}
