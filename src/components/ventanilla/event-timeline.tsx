import { AlertTriangle, CalendarClock, CheckCircle2, Inbox, Lock, MailCheck, PenLine, Reply, Undo2, UserCheck } from "lucide-react";

import { cn } from "@/lib/utils";
import { formatDateTime } from "@/lib/ventanilla/rules";
import type { EventType, RadicadoEvent } from "@/lib/ventanilla/types";

const META: Record<EventType, { label: string; icon: typeof Inbox; tone: string }> = {
  radicated: { label: "Radicado", icon: Inbox, tone: "bg-primary/10 text-primary" },
  ack_sent: { label: "Acuse de recibo", icon: MailCheck, tone: "bg-primary/10 text-primary" },
  assigned: { label: "Asignado", icon: UserCheck, tone: "bg-primary/10 text-primary" },
  note: { label: "Nota interna", icon: PenLine, tone: "bg-muted text-muted-foreground" },
  extended: { label: "Prórroga", icon: CalendarClock, tone: "bg-amber-100/60 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
  answered: { label: "Respondido", icon: Reply, tone: "bg-emerald-100/60 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
  closed: { label: "Cerrado", icon: Lock, tone: "bg-muted text-muted-foreground" },
  accepted: { label: "Recibido conforme", icon: CheckCircle2, tone: "bg-emerald-100/60 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
  returned: { label: "Devuelto con observaciones", icon: Undo2, tone: "bg-destructive/10 text-destructive" },
  due_alert: { label: "Alerta de vencimiento", icon: AlertTriangle, tone: "bg-amber-100/60 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
};

export function EventTimeline({ events }: { events: readonly RadicadoEvent[] }) {
  return (
    <ol className="space-y-0">
      {events.map((e, i) => {
        const meta = META[e.type];
        const Icon = meta.icon;
        const last = i === events.length - 1;
        return (
          <li key={e.id} className="relative grid grid-cols-[28px_1fr] gap-3 pb-5 last:pb-0">
            {!last ? <span aria-hidden className="absolute bottom-0 left-[13px] top-8 w-0.5 bg-border" /> : null}
            <span className={cn("grid size-7 place-items-center rounded-full", meta.tone)}>
              <Icon className="size-3.5" />
            </span>
            <div className="min-w-0 text-sm">
              <p className="font-semibold">
                {meta.label}
                {e.internal ? <span className="ml-2 text-xs font-medium text-muted-foreground">· no visible al radicante</span> : null}
              </p>
              {e.detail ? <p className="text-muted-foreground">{e.detail}</p> : null}
              <p className="text-xs text-muted-foreground">
                {formatDateTime(e.at)} · {e.actor}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
