import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { registerPWA, activateWaitingWorker } from "@/lib/pwa-register";

export function PwaUpdatePrompt() {
  const [updateReady, setUpdateReady] = useState(false);

  useEffect(() => {
    registerPWA(() => setUpdateReady(true));
  }, []);

  if (!updateReady) return null;

  return (
    <div
      role="status"
      className="fixed left-1/2 top-4 z-[70] flex -translate-x-1/2 items-center gap-3 rounded-full border px-4 py-2 shadow-xl backdrop-blur-xl"
      style={{
        background: "rgba(12,10,8,0.9)",
        borderColor: "rgba(249,115,22,0.3)",
      }}
    >
      <span className="flex items-center gap-2 text-xs font-medium text-white">
        <span className="size-2 animate-pulse rounded-full" style={{ background: "#F97316" }} />
        Nova versão disponível
      </span>
      <button
        onClick={activateWaitingWorker}
        className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold text-[#0C0A08] transition hover:brightness-110"
        style={{ background: "#F97316" }}
      >
        <RefreshCw className="size-3" /> Atualizar agora
      </button>
    </div>
  );
}
