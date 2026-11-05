import { FileText, Lock } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { formatBytes, formatCivilDate } from "@/lib/ventanilla/rules";
import type { Radicado } from "@/lib/ventanilla/types";

function Meta({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-semibold text-muted-foreground">{label}</dt>
      <dd className="truncate text-sm font-semibold">{children}</dd>
    </div>
  );
}

export function DetailSummary({ radicado }: { radicado: Radicado }) {
  const r = radicado;
  return (
    <Card className="rounded-2xl">
      <CardContent className="space-y-5 p-5 sm:p-6">
        <div className="@container">
          <dl className="grid grid-cols-2 gap-4 @xl:grid-cols-4">
            <Meta label="Radicante">{r.requester.name}</Meta>
            <Meta label="Calidad">{r.requester.detail ?? "Sin identificar"}</Meta>
            <Meta label="Asignado a">{r.assignee ?? r.area}</Meta>
            <Meta label="Vence">{r.dueAt ? formatCivilDate(r.dueAt) : "No aplica"}</Meta>
          </dl>
        </div>
        {!r.requester.anonymous && (r.requester.email || r.requester.phone) ? (
          <p className="text-xs text-muted-foreground">
            Contacto: {[r.requester.email, r.requester.phone].filter(Boolean).join(" · ")}
          </p>
        ) : null}
        <div className="whitespace-pre-line rounded-xl bg-muted p-4 text-sm">{r.description}</div>
        {r.attachments.map((a) => (
          <div key={a.sha256 + a.name} className="flex items-center gap-3 rounded-xl border p-3">
            <FileText className="size-4 shrink-0 text-primary" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{a.name}</p>
              <p className="break-all font-mono text-xs text-muted-foreground">
                {formatBytes(a.sizeBytes)} · sha256 {a.sha256}
              </p>
            </div>
          </div>
        ))}
        <div className="flex items-start gap-3 rounded-xl bg-primary/5 p-3 text-xs text-muted-foreground">
          <Lock className="mt-0.5 size-4 shrink-0 text-primary" />
          <p>
            Contenido, adjuntos y sello de tiempo inmodificables. Cualquier novedad queda como un evento nuevo en la
            trazabilidad. <span className="break-all font-mono">Huella del registro: {r.recordHash}</span>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
