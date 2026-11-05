"use client";

import * as React from "react";
import { Download, FileText, Send } from "lucide-react";

import { useVentanilla } from "@/components/providers/ventanilla-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { EventTimeline } from "@/components/ventanilla/event-timeline";
import { StatusBadge } from "@/components/ventanilla/status-badge";
import { useToast } from "@/hooks/use-toast";
import { downloadReceiptPdf } from "@/lib/ventanilla/receipt-pdf";
import { formatBytes, formatCivilDate, formatDateTime } from "@/lib/ventanilla/rules";
import { KIND_LABELS } from "@/lib/ventanilla/types";
import type { Radicado } from "@/lib/ventanilla/types";

/** Lo que ve el radicante: nunca las notas internas (RN-08). */
export function PublicStatus({ radicado }: { radicado: Radicado }) {
  const { dispatch, state } = useVentanilla();
  const { toast } = useToast();
  const [info, setInfo] = React.useState("");
  const now = new Date();
  const publicEvents = radicado.events.filter((e) => !e.internal);
  const waiting = radicado.status === "en_espera";

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
          <div className="flex items-center gap-2">
            <StatusBadge radicado={radicado} now={now} />
            {/* El acuse queda descargable desde la consulta aunque falle el envío (UC-ENC-04). */}
            <Button variant="outline" size="sm" onClick={() => downloadReceiptPdf(radicado, state.config.ackTemplate)}>
              <Download className="size-4" />
              Acuse
            </Button>
          </div>
        </div>
        {radicado.dueAt && !["respondido", "cerrado", "trasladado", "anulado"].includes(radicado.status) ? (
          <p className="text-sm">
            {waiting ? "Término suspendido hasta recibir la información solicitada." : (
              <>
                Respuesta a más tardar el <span className="font-semibold">{formatCivilDate(radicado.dueAt)}</span>.
              </>
            )}
          </p>
        ) : null}
        {radicado.transferredTo ? (
          <p className="rounded-xl bg-muted p-4 text-sm">
            Su solicitud fue trasladada por competencia a <span className="font-semibold">{radicado.transferredTo}</span>, entidad que
            le responderá directamente.
          </p>
        ) : null}
        {radicado.response ? (
          <div className="space-y-2 rounded-xl bg-muted p-4 text-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Respuesta de la institución</p>
            <p className="whitespace-pre-line">{radicado.response}</p>
            {radicado.responseAttachments?.map((a) => (
              <p key={a.sha256} className="flex items-center gap-2 text-xs text-muted-foreground">
                <FileText className="size-3.5 text-primary" />
                {a.name} ({formatBytes(a.sizeBytes)})
              </p>
            ))}
          </div>
        ) : null}
        {waiting ? (
          <div className="space-y-2 rounded-xl border border-primary/30 p-4">
            <Label htmlFor="aporte">Aportar la información solicitada</Label>
            <Textarea id="aporte" rows={3} value={info} onChange={(e) => setInfo(e.target.value)} className="text-base sm:text-sm" />
            <Button
              size="sm"
              disabled={info.trim().length < 5}
              onClick={() => {
                dispatch({
                  type: "infoReceived",
                  id: radicado.id,
                  text: `El radicante aportó: ${info.trim()}`,
                  actor: { name: radicado.requester.anonymous ? "Anónimo" : radicado.requester.name, role: "Radicante" },
                });
                setInfo("");
                toast({ title: "Información enviada", description: "El término de respuesta se reactivó." });
              }}
            >
              <Send className="size-4" />
              Enviar información
            </Button>
          </div>
        ) : null}
        <EventTimeline events={publicEvents} />
      </CardContent>
    </Card>
  );
}
