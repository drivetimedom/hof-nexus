import { cn } from "@/lib/utils";

function Bar({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-[calc(var(--r)/2)]",
        className,
      )}
      style={{ background: "var(--glass-strong)" }}
    />
  );
}

export function KpiSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="surface-panel relative overflow-hidden p-5 transition-ea"
          style={{ background: "var(--glass)", borderColor: "var(--glass-border)" }}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1 space-y-3">
              <Bar className="h-3 w-20" />
              <Bar className="h-6 w-28" />
            </div>
            <Bar className="h-5 w-12 shrink-0 rounded-full" />
          </div>
          <Bar className="mt-5 h-10 w-full" />
          <Bar className="mt-3 h-2.5 w-3/4" />
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2 p-5 sm:p-7">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 rounded-[var(--r)] border p-4 transition-ea"
          style={{ background: "var(--glass)", borderColor: "var(--glass-border)" }}
        >
          <div className="flex-1 space-y-2">
            <Bar className="h-3.5 w-1/3" />
            <Bar className="h-2.5 w-1/5" />
          </div>
          <Bar className="hidden h-3 w-16 sm:block" />
          <Bar className="hidden h-3 w-16 md:block" />
          <Bar className="hidden h-3 w-16 md:block" />
          <Bar className="h-6 w-16 rounded-full" />
        </div>
      ))}
    </div>
  );
}

export function InsightsSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="surface-panel relative overflow-hidden p-5 transition-ea"
          style={{ background: "var(--glass)", borderColor: "var(--glass-border)" }}
        >
          <div className="flex items-center justify-between">
            <Bar className="h-5 w-24 rounded-full" />
            <Bar className="h-3 w-14" />
          </div>
          <Bar className="mt-5 h-4 w-3/4" />
          <div className="mt-3 space-y-2">
            <Bar className="h-3 w-full" />
            <Bar className="h-3 w-5/6" />
            <Bar className="h-3 w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
}
