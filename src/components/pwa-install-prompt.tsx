import { useEffect, useState } from "react";
import { X, Download, Share } from "lucide-react";

const DISMISS_KEY = "pwa-install-dismissed-until";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    // @ts-expect-error iOS Safari
    window.navigator.standalone === true
  );
}

function isIOS() {
  if (typeof navigator === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !("MSStream" in window);
}

function isDismissed() {
  if (typeof localStorage === "undefined") return false;
  const until = Number(localStorage.getItem(DISMISS_KEY) || 0);
  return until > Date.now();
}

function dismissFor7Days() {
  const seven = 7 * 24 * 60 * 60 * 1000;
  localStorage.setItem(DISMISS_KEY, String(Date.now() + seven));
}

export function PwaInstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [iosMode, setIosMode] = useState(false);

  useEffect(() => {
    if (isStandalone() || isDismissed()) return;

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);

    const onInstalled = () => {
      setVisible(false);
      setDeferred(null);
    };
    window.addEventListener("appinstalled", onInstalled);

    // iOS Safari has no beforeinstallprompt — show manual instructions after a delay.
    if (isIOS()) {
      const t = setTimeout(() => {
        if (!isStandalone() && !isDismissed()) {
          setIosMode(true);
          setVisible(true);
        }
      }, 4000);
      return () => {
        clearTimeout(t);
        window.removeEventListener("beforeinstallprompt", onBeforeInstall);
        window.removeEventListener("appinstalled", onInstalled);
      };
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (!visible) return null;

  const handleInstall = async () => {
    if (!deferred) return;
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    if (outcome === "accepted" || outcome === "dismissed") {
      setVisible(false);
      setDeferred(null);
      if (outcome === "dismissed") dismissFor7Days();
    }
  };

  const handleDismiss = () => {
    dismissFor7Days();
    setVisible(false);
  };

  return (
    <div
      role="dialog"
      aria-label="Instalar HOF Analytics"
      className="fixed inset-x-3 bottom-3 z-[60] mx-auto max-w-md rounded-2xl border p-4 shadow-2xl backdrop-blur-xl sm:inset-x-auto sm:right-4 sm:bottom-4"
      style={{
        background: "rgba(12,10,8,0.85)",
        borderColor: "rgba(249,115,22,0.25)",
        boxShadow: "0 25px 60px -20px rgba(249,115,22,0.35)",
      }}
    >
      <button
        onClick={handleDismiss}
        aria-label="Fechar"
        className="absolute right-2 top-2 rounded-md p-1 text-white/50 transition hover:bg-white/5 hover:text-white/80"
      >
        <X className="size-4" />
      </button>
      <div className="flex items-start gap-3 pr-6">
        <div
          className="grid size-10 shrink-0 place-items-center rounded-xl text-base font-bold"
          style={{ background: "linear-gradient(135deg,#F97316,#EA580C)", color: "#0C0A08" }}
        >
          H
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-white">
            Instale o Analytics no seu {iosMode ? "iPhone" : "dispositivo"}
          </div>
          {iosMode ? (
            <p className="mt-1 text-xs leading-relaxed text-white/70">
              No Safari, toque em{" "}
              <span className="inline-flex items-center gap-1 rounded-md bg-white/10 px-1.5 py-0.5 font-medium text-white">
                <Share className="size-3" /> Compartilhar
              </span>{" "}
              e depois em <span className="font-medium text-white">Adicionar à Tela de Início</span>.
            </p>
          ) : (
            <p className="mt-1 text-xs leading-relaxed text-white/70">
              Acesso rápido, sem abrir o navegador. Instale como app no seu celular ou desktop.
            </p>
          )}

          {!iosMode && (
            <div className="mt-3 flex items-center gap-2">
              <button
                onClick={handleInstall}
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-[#0C0A08] transition hover:brightness-110"
                style={{ background: "#F97316" }}
              >
                <Download className="size-3.5" /> Instalar
              </button>
              <button
                onClick={handleDismiss}
                className="rounded-lg px-3 py-1.5 text-xs font-medium text-white/70 transition hover:bg-white/5 hover:text-white"
              >
                Agora não
              </button>
            </div>
          )}
          {iosMode && (
            <div className="mt-3">
              <button
                onClick={handleDismiss}
                className="rounded-lg px-3 py-1.5 text-xs font-medium text-white/70 transition hover:bg-white/5 hover:text-white"
              >
                Entendi
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
