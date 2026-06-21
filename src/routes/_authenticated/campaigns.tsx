import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { CampaignsTable } from "@/components/campaigns-table";
import type { Period } from "@/lib/mock-data";

export const Route = createFileRoute("/_authenticated/campaigns")({
  component: CampaignsPage,
});

function CampaignsPage() {
  const [period, setPeriod] = useState<Period>("30d");
  return (
    <AppShell
      title="Campanhas"
      subtitle="Performance detalhada das frentes de mídia"
      period={period}
      onPeriodChange={setPeriod}
    >
      <CampaignsTable />
    </AppShell>
  );
}
