"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Download } from "lucide-react";

import { useVentanilla } from "@/components/providers/ventanilla-provider";
import { PageHeader } from "@/components/shell/page-header";
import { PageSkeleton } from "@/components/shell/page-skeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DetailActions } from "@/components/ventanilla/detail-actions";
import { DetailSummary } from "@/components/ventanilla/detail-summary";
import { EventTimeline } from "@/components/ventanilla/event-timeline";
import { ResponseCard } from "@/components/ventanilla/response-card";
import { DeadlineText, Pill, StatusBadge } from "@/components/ventanilla/status-badge";
import { downloadReceiptPdf } from "@/lib/ventanilla/receipt-pdf";
import { formatDateTime } from "@/lib/ventanilla/rules";
import { CHANNEL_LABELS, KIND_LABELS } from "@/lib/ventanilla/types";
import { canSee } from "@/lib/ventanilla/users";

export default function RadicadoDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { state, ready, user, log } = useVentanilla();
  const radicado = state.radicados.find((r) => r.id === id);
  const visible = radicado ? canSee(user, radicado) : false;
  const number = radicado?.number;

  // RN-12: cada consulta del radicado queda en la bitácora.
  React.useEffect(() => {
    if (ready && number && visible) log("Ver radicado", number);
  }, [ready, number, visible, user.id, log]);

  if (!ready) return <PageSkeleton />;

  if (!radicado || !visible) {
    return (
      <div className="space-y-4">
        <p className="text-lg font-semibold">{radicado ? "No tienes acceso a este radicado." : "No encontramos ese radicado."}</p>
        <Button asChild variant="outline">
          <Link href="/ventanilla">Volver a la bandeja</Link>
        </Button>
      </div>
    );
  }

  const now = new Date();
  const kindLabel = radicado.documentType ? `${KIND_LABELS.DOC} · ${radicado.documentType}` : KIND_LABELS[radicado.kind];

  return (
    <div className="space-y-8 duration-500 animate-in fade-in">
      <Link href="/ventanilla" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" />
        Bandeja
      </Link>
      <PageHeader
        eyebrow={
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-sm font-medium text-primary">{radicado.number}</span>
            <StatusBadge radicado={radicado} now={now} />
            {radicado.lateDelivery ? <Pill tone="warning">Extemporáneo</Pill> : null}
            <DeadlineText radicado={radicado} now={now} />
          </div>
        }
        title={radicado.subject}
        description={`${kindLabel} · ${formatDateTime(radicado.createdAt)} · ${CHANNEL_LABELS[radicado.channel]}`}
        actions={<DetailActions radicado={radicado} />}
      />
      <div className="@container">
        <div className="grid gap-6 @4xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
          <div className="min-w-0 space-y-6">
            <DetailSummary radicado={radicado} />
            {radicado.kind !== "DOC" ? <ResponseCard radicado={radicado} /> : null}
          </div>
          <Card className="h-fit rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-lg">Trazabilidad</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => downloadReceiptPdf(radicado, state.config.ackTemplate)}>
                <Download className="size-4" />
                Acuse
              </Button>
            </CardHeader>
            <CardContent>
              {/* El docente ve su propio radicado sin las notas internas (RN-08). */}
              <EventTimeline events={user.role === "docente" ? radicado.events.filter((e) => !e.internal) : radicado.events} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
