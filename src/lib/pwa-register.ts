// Guarded PWA registration wrapper. Only registers in production, outside
// Lovable preview / iframe / dev, and honors ?sw=off kill switch.

const SW_URL = "/sw.js";

type UpdateHandler = () => void;

function shouldSkipRegistration(): boolean {
  if (typeof window === "undefined") return true;
  if (!("serviceWorker" in navigator)) return true;
  if (!import.meta.env.PROD) return true;
  try {
    if (window.self !== window.top) return true;
  } catch {
    return true;
  }
  const host = window.location.hostname;
  if (
    host.startsWith("id-preview--") ||
    host.startsWith("preview--") ||
    host === "lovableproject.com" ||
    host.endsWith(".lovableproject.com") ||
    host === "lovableproject-dev.com" ||
    host.endsWith(".lovableproject-dev.com") ||
    host === "beta.lovable.dev" ||
    host.endsWith(".beta.lovable.dev")
  ) {
    return true;
  }
  const params = new URLSearchParams(window.location.search);
  if (params.get("sw") === "off") return true;
  return false;
}

async function unregisterExisting() {
  try {
    const regs = await navigator.serviceWorker.getRegistrations();
    for (const reg of regs) {
      const url = reg.active?.scriptURL || reg.installing?.scriptURL || reg.waiting?.scriptURL || "";
      if (url.endsWith(SW_URL)) {
        await reg.unregister();
      }
    }
  } catch {
    /* ignore */
  }
}

export async function registerPWA(onUpdateAvailable?: UpdateHandler) {
  if (shouldSkipRegistration()) {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      await unregisterExisting();
    }
    return;
  }

  try {
    const { Workbox } = await import("workbox-window");
    const wb = new Workbox(SW_URL);

    wb.addEventListener("waiting", () => {
      onUpdateAvailable?.();
    });

    wb.addEventListener("controlling", () => {
      window.location.reload();
    });

    (window as unknown as { __wb?: unknown }).__wb = wb;
    await wb.register();
  } catch (err) {
    console.warn("[pwa] registration failed", err);
  }
}

export function activateWaitingWorker() {
  const wb = (window as unknown as { __wb?: { messageSkipWaiting: () => void } }).__wb;
  if (wb && typeof wb.messageSkipWaiting === "function") {
    wb.messageSkipWaiting();
  } else {
    window.location.reload();
  }
}
