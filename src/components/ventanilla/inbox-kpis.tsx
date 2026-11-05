"use client";

import { AlertTriangle, CheckCircle2, Clock, Inbox } from "lucide-react";

import { KpiCard, KpiCardGrid } from "@/components/ui/kpi-card";
import { deadlineState, isOpen, isPendingReview } from "@/lib/ventanilla/rules";
import type { Radicado } from "@/lib/ventanilla/types";

/** % de PQRSF respondidas dentro del término sobre las respondidas. */
function onTimeRate(radicados: readonly Radicado[]): number | null {
  const answered = radicados.filter((r) => r.kind !== "DOC" && (r.status === "respondido" || r.status === "cerrado"));
  if (answered.length === 0) return null;
  const onTime = answered.filter((r) => {
    const answeredAt = r.events.find((e) => e.type === "answered")?.at;
    return !r.dueAt || !answeredAt || answeredAt.slice(0, 10) <= r.dueAt;
  });
  return Math.round((onTime.length / answered.length) * 100);
}

export function InboxKpis({ radicados, now }: { radicados: readonly Radicado[]; now: Date }) {
  const open = radicados.filter(isOpen);
  const docs = radicados.filter(isPendingReview);
  const soon = open.filter((r) => ["soon", "today"].includes(deadlineState(r, now).state)).length;
  const overdue = open.filter((r) => deadlineState(r, now).state === "overdue").length;
  const rate = onTimeRate(radicados);

  return (
    <KpiCardGrid>
      <KpiCard
        title="Abiertos"
        accent="primary"
        icon={<Inbox className="size-5" />}
        value={open.length + docs.length}
        description={`${open.length} PQRSF · ${docs.length} por revisar`}
      />
      <KpiCard title="Por vencer" accent="warning" icon={<Clock className="size-5" />} value={soon} description="3 días hábiles o menos" />
      <KpiCard
        title="Vencidos"
        accent="danger"
        icon={<AlertTriangle className="size-5" />}
        value={overdue}
        description={overdue ? "Requieren respuesta inmediata" : "Ninguno fuera de término"}
      />
      <KpiCard
        title="En término"
        accent="success"
        icon={<CheckCircle2 className="size-5" />}
        value={rate === null ? "—" : `${rate}%`}
        description="PQRSF respondidas a tiempo"
      />
    </KpiCardGrid>
  );
}
