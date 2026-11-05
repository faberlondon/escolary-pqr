"use client";

import Link from "next/link";
import { FileText, Link2, Lock, ShieldAlert } from "lucide-react";

import { useVentanilla } from "@/components/providers/ventanilla-provider";
import { Card, CardContent } from "@/components/ui/card";
import { formatBytes, formatCivilDate } from "@/lib/ventanilla/rules";
import { canSeeMinorData } from "@/lib/ventanilla/users";
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
  const { state, user } = useVentanilla();
  const r = radicado;
  const corrections = state.radicados.filter((x) => x.linkedTo === r.number);
  const original = r.linkedTo ? state.radicados.find((x) => x.number === r.linkedTo) : undefined;
  const context = [r.group, r.course, r.period].filter(Boolean).join(" · ");

  return (
    <Card className="rounded-2xl">
      <CardContent className="space-y-5 p-5 sm:p-6">
        <div className="@container">
          <dl className="grid grid-cols-2 gap-4 @xl:grid-cols-4">
            <Meta label="Radicante">{r.requester.name}</Meta>
            <Meta label="Calidad">{r.requester.detail ?? "Sin identificar"}</Meta>
            <Meta label={r.kind === "DOC" ? "Destinatario" : "Asignado a"}>
              {r.kind === "DOC" ? r.area : r.assignee ? `${r.assignee} · ${r.assignedArea ?? r.area}` : `Sin asignar · ${r.area}`}
            </Meta>
            <Meta label="Vence">{r.dueAt ? formatCivilDate(r.dueAt) : "No aplica"}</Meta>
          </dl>
        </div>
        {context ? <p className="text-sm text-muted-foreground">Grupo / asignatura / periodo: <span className="font-semibold text-foreground">{context}</span></p> : null}
        {!r.requester.anonymous && (r.requester.email || r.requester.phone || r.requester.documentId) ? (
          <p className="text-xs text-muted-foreground">
            Contacto: {[r.requester.documentId ? `Doc. ${r.requester.documentId}` : null, r.requester.email, r.requester.phone].filter(Boolean).join(" · ")}
          </p>
        ) : null}
        {r.involved ? (
          canSeeMinorData(user, r) ? (
            <p className="flex items-center gap-2 text-sm">
              <ShieldAlert className="size-4 text-amber-600" />
              Involucra a: <span className="font-semibold">{r.involved}</span>
            </p>
          ) : (
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <ShieldAlert className="size-4" />
              Involucra a un estudiante: dato visible solo para quienes atienden el caso.
            </p>
          )
        ) : null}
        {original || corrections.length ? (
          <div className="space-y-1 rounded-xl bg-primary/5 p-3 text-sm">
            {original ? (
              <p className="flex items-center gap-2">
                <Link2 className="size-4 text-primary" />
                Corrección de{" "}
                <Link href={`/ventanilla/${original.id}`} className="font-mono font-semibold text-primary hover:underline">
                  {original.number}
                </Link>
              </p>
            ) : null}
            {corrections.map((c) => (
              <p key={c.id} className="flex items-center gap-2">
                <Link2 className="size-4 text-primary" />
                Corregido en{" "}
                <Link href={`/ventanilla/${c.id}`} className="font-mono font-semibold text-primary hover:underline">
                  {c.number}
                </Link>
              </p>
            ))}
          </div>
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
