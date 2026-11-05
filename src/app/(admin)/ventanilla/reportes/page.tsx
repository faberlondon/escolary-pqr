"use client";

import { AlertTriangle, CheckCircle2, Clock, FileDown, FileSpreadsheet, Inbox } from "lucide-react";

import { useVentanilla } from "@/components/providers/ventanilla-provider";
import { PageHeader } from "@/components/shell/page-header";
import { RoleGate } from "@/components/shell/role-gate";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KpiCard, KpiCardGrid } from "@/components/ui/kpi-card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { buildReport, downloadTransparencyPdf, exportReportXlsx } from "@/lib/ventanilla/reports";
import { canSeeReports } from "@/lib/ventanilla/users";

const fmt = (v: number | null, suffix = ""): string => (v === null ? "—" : `${String(v).replace(".", ",")}${suffix}`);

function ReportTable({ head, rows }: { head: string[]; rows: Array<Array<string | number>> }) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            {head.map((h, i) => (
              <TableHead key={h} className={i > 0 ? "text-right" : undefined}>
                {h}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={head.length} className="py-8 text-center text-sm text-muted-foreground">
                Sin datos todavía.
              </TableCell>
            </TableRow>
          ) : (
            rows.map((r) => (
              <TableRow key={String(r[0])}>
                {r.map((c, i) => (
                  <TableCell key={i} className={i > 0 ? "text-right tabular-nums" : "font-medium"}>
                    {c}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

function ReportsContent() {
  const { state, log } = useVentanilla();
  const now = new Date();
  const report = buildReport(state.radicados, state.surveys, now);
  const t = report.totals;

  return (
    <div className="space-y-8 duration-500 animate-in fade-in">
      <PageHeader
        title="Reportes"
        description="Indicadores de radicados y encuestas al corte de hoy. Los anulados no cuentan en los indicadores."
        actions={
          <>
            <Button
              variant="outline"
              onClick={() => {
                exportReportXlsx(report, state.radicados, now);
                log("Exportar reporte Excel");
              }}
            >
              <FileSpreadsheet className="size-4" />
              Exportar Excel
            </Button>
            <Button
              onClick={() => {
                void downloadTransparencyPdf(report, now);
                log("Exportar informe de transparencia PDF");
              }}
            >
              <FileDown className="size-4" />
              Informe de transparencia (PDF)
            </Button>
          </>
        }
      />
      <KpiCardGrid>
        <KpiCard title="PQRSF recibidas" accent="primary" icon={<Inbox className="size-5" />} value={t.received} description={`${t.open} abiertas · ${t.transferred} trasladadas`} />
        <KpiCard title="Vencidas" accent="danger" icon={<AlertTriangle className="size-5" />} value={t.overdue} description="Abiertas fuera de término" />
        <KpiCard title="En término" accent="success" icon={<CheckCircle2 className="size-5" />} value={fmt(t.onTimePct, "%")} description={`${t.answered} respondidas · ${t.denied} negadas`} />
        <KpiCard title="Tiempo promedio" accent="warning" icon={<Clock className="size-5" />} value={fmt(t.avgDays)} description="Días hábiles hasta la respuesta" />
      </KpiCardGrid>

      <div className="@container">
        <div className="grid gap-6 @5xl:grid-cols-2">
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="text-lg">PQRSF por tipo</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ReportTable
                head={["Tipo", "Recibidas", "Abiertas", "Vencidas", "En término", "Prom. días"]}
                rows={report.byKind.map((k) => [k.label, k.received, k.open, k.overdue, fmt(k.onTimePct, "%"), fmt(k.avgDays)])}
              />
            </CardContent>
          </Card>
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="text-lg">Radicados por área</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ReportTable
                head={["Área", "Recibidos", "Abiertos", "Vencidos", "Prom. días"]}
                rows={report.byArea.map((a) => [a.area, a.received, a.open, a.overdue, fmt(a.avgDays)])}
              />
            </CardContent>
          </Card>
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="text-lg">Entregas de docentes</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ReportTable
                head={["Docente", "Entregas", "Extemporáneas", "Devueltas"]}
                rows={report.teachers.map((d) => [d.name, d.delivered, d.late, d.returned])}
              />
            </CardContent>
          </Card>
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="text-lg">Encuestas por docente o área</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ReportTable
                head={["Encuesta", "Evalúa", "Respuestas", "Tasa", "NPS", "CSAT"]}
                rows={report.surveys.map((s) => [
                  s.title,
                  s.evaluates,
                  s.responses,
                  fmt(s.rate, "%"),
                  s.nps === null ? "—" : `${s.nps > 0 ? "+" : ""}${s.nps}`,
                  fmt(s.csat),
                ])}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function ReportsPage() {
  return (
    <RoleGate allow={canSeeReports}>
      <ReportsContent />
    </RoleGate>
  );
}
