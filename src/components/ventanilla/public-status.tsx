"use client";

import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ventanilla/status-badge";
import { EventTimeline } from "@/components/ventanilla/event-timeline";
import { formatCivilDate, formatDateTime } from "@/lib/ventanilla/rules";
import { KIND_LABELS } from "@/lib/ventanilla/types";
import type { Radicado } from "@/lib/ventanilla/types";

/** Lo que ve el radicante: nunca las notas internas (RN-08). */
export function PublicStatus({ radicado }: { radicado: Radicado }) {
  const now = new Date();
  const publicEvents = radicado.events.filter((e) => !e.internal);

  return (
    <Card className="rounded-2xl duration-300 animate-in fade-in">
      <CardContent className="space-y-5 p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-mono text-sm text-primary">{radicado.number}</p>
            <h2 className="text-lg font-bold">{radicado.subject}</h2>
            <p className="text-xs text-muted-foreground">
              {KIND_LABELS[radicado.kind]} · radicado el {formatDateTime(radicado.createdAt)}
            </p>
          </div>
          <StatusBadge radicado={radicado} now={now} />
        </div>
        {radicado.dueAt ? (
          <p className="text-sm">
            Respuesta a más tardar el <span className="font-semibold">{formatCivilDate(radicado.dueAt)}</span>.
          </p>
        ) : null}
        {radicado.response ? (
          <div className="rounded-xl bg-muted p-4 text-sm">
            <p className="mb-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">Respuesta de la institución</p>
            {radicado.response}
          </div>
        ) : null}
        <EventTimeline events={publicEvents} />
      </CardContent>
    </Card>
  );
}
