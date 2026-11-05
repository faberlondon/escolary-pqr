import { cn } from "@/lib/utils";
import { deadlineLabel, deadlineState, type DeadlineState } from "@/lib/ventanilla/rules";
import type { Radicado, RadicadoStatus } from "@/lib/ventanilla/types";

type Tone = "primary" | "success" | "warning" | "danger" | "muted";

/** Mismos tonos semánticos que `KpiCard` de eScolary. */
const TONES: Record<Tone, string> = {
  primary: "bg-primary/10 text-primary",
  success: "bg-emerald-100/60 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  warning: "bg-amber-100/60 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  danger: "bg-destructive/10 text-destructive dark:text-red-400",
  muted: "bg-muted text-muted-foreground",
};

const STATUS: Record<RadicadoStatus, { label: string; tone: Tone }> = {
  radicado: { label: "Radicado", tone: "primary" },
  en_tramite: { label: "En trámite", tone: "primary" },
  prorrogado: { label: "Prorrogado", tone: "warning" },
  respondido: { label: "Respondido", tone: "success" },
  cerrado: { label: "Cerrado", tone: "muted" },
  recibido_conforme: { label: "Recibido conforme", tone: "success" },
  devuelto: { label: "Devuelto", tone: "danger" },
  anulado: { label: "Anulado", tone: "muted" },
};

export const statusLabel = (s: RadicadoStatus): string => STATUS[s].label;

export function Pill({ tone, children, className }: { tone: Tone; children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-bold",
        TONES[tone],
        className
      )}
    >
      <span aria-hidden className="size-1.5 rounded-full bg-current" />
      {children}
    </span>
  );
}

export function StatusBadge({ radicado, now }: { radicado: Radicado; now: Date }) {
  const overdue = deadlineState(radicado, now).state === "overdue";
  if (overdue) return <Pill tone="danger">Vencido</Pill>;
  const s = STATUS[radicado.status];
  return <Pill tone={s.tone}>{s.label}</Pill>;
}

const DEADLINE_TEXT: Record<DeadlineState, string> = {
  none: "text-muted-foreground",
  ok: "text-muted-foreground",
  soon: "text-amber-700 dark:text-amber-400",
  today: "text-destructive dark:text-red-400",
  overdue: "text-destructive dark:text-red-400",
};

export function DeadlineText({ radicado, now }: { radicado: Radicado; now: Date }) {
  const { state } = deadlineState(radicado, now);
  return (
    <span className={cn("whitespace-nowrap text-xs font-semibold tabular-nums", DEADLINE_TEXT[state])}>
      {deadlineLabel(radicado, now)}
    </span>
  );
}
