import { utils, writeFile } from "xlsx";

import { radicadoRows } from "./export";
import { answeredOnTime, deadlineState, formatDateTime, isOpen, responseBusinessDays, SCHOOL } from "./rules";
import { computeNps, overallCsat, responseRate, type Survey } from "./surveys";
import { KIND_LABELS, RADICADO_KINDS, type Radicado, type RadicadoKind } from "./types";

export interface KindRow {
  kind: RadicadoKind;
  label: string;
  received: number;
  open: number;
  overdue: number;
  answered: number;
  onTimePct: number | null;
  avgDays: number | null;
  transferred: number;
  denied: number;
  annulled: number;
}

export interface AreaRow {
  area: string;
  received: number;
  open: number;
  overdue: number;
  avgDays: number | null;
}

export interface TeacherRow {
  name: string;
  delivered: number;
  late: number;
  returned: number;
}

export interface SurveyRow {
  title: string;
  evaluates: string;
  responses: number;
  rate: number | null;
  nps: number | null;
  csat: number | null;
}

export interface Report {
  totals: Omit<KindRow, "kind" | "label">;
  byKind: KindRow[];
  byArea: AreaRow[];
  teachers: TeacherRow[];
  surveys: SurveyRow[];
}

const avg = (xs: number[]): number | null => (xs.length ? Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 10) / 10 : null);

function summarize(list: readonly Radicado[], now: Date): Omit<KindRow, "kind" | "label"> {
  const valid = list.filter((r) => r.status !== "anulado");
  const answered = valid.filter((r) => r.events.some((e) => e.type === "answered"));
  const onTime = answered.filter((r) => answeredOnTime(r) === true).length;
  return {
    received: list.length,
    open: valid.filter(isOpen).length,
    overdue: valid.filter((r) => deadlineState(r, now).state === "overdue").length,
    answered: answered.length,
    onTimePct: answered.length ? Math.round((onTime / answered.length) * 100) : null,
    avgDays: avg(answered.map(responseBusinessDays).filter((d): d is number => d !== null)),
    transferred: valid.filter((r) => r.status === "trasladado").length,
    denied: valid.filter((r) => r.responseOutcome === "negada").length,
    annulled: list.length - valid.length,
  };
}

/** UC-ENC-10: indicadores de radicados y encuestas. */
export function buildReport(radicados: readonly Radicado[], surveys: readonly Survey[], now: Date): Report {
  const pqrsf = radicados.filter((r) => r.kind !== "DOC");
  const byKind = RADICADO_KINDS.filter((k) => k !== "DOC").map((kind) => ({
    kind,
    label: KIND_LABELS[kind],
    ...summarize(pqrsf.filter((r) => r.kind === kind), now),
  }));

  const areas = Array.from(new Set(radicados.map((r) => r.area)));
  const byArea = areas
    .map((area) => {
      const s = summarize(radicados.filter((r) => r.area === area), now);
      return { area, received: s.received, open: s.open, overdue: s.overdue, avgDays: s.avgDays };
    })
    .sort((a, b) => b.received - a.received);

  const docs = radicados.filter((r) => r.kind === "DOC" && r.status !== "anulado");
  const teacherNames = Array.from(new Set(docs.map((r) => r.requester.name)));
  const teachers = teacherNames
    .map((name) => {
      const mine = docs.filter((r) => r.requester.name === name);
      return {
        name,
        delivered: mine.length,
        late: mine.filter((r) => r.lateDelivery).length,
        returned: mine.filter((r) => r.status === "devuelto").length,
      };
    })
    .sort((a, b) => b.late - a.late || b.delivered - a.delivered);

  const surveyRows = surveys
    .filter((s) => s.status !== "borrador")
    .map((s) => ({
      title: s.title,
      evaluates: s.evaluates ?? "Institución",
      responses: s.responses.length,
      rate: responseRate(s),
      nps: s.questions.some((q) => q.kind === "nps")
        ? computeNps(s.responses, s.questions.find((q) => q.kind === "nps")!.id)?.score ?? null
        : null,
      csat: overallCsat(s),
    }));

  return { totals: summarize(pqrsf, now), byKind, byArea, teachers, surveys: surveyRows };
}

const dash = (v: number | null, suffix = ""): string | number => (v === null ? "—" : suffix ? `${v}${suffix}` : v);

export function exportReportXlsx(report: Report, radicados: readonly Radicado[], now: Date): void {
  const book = utils.book_new();
  const t = report.totals;
  utils.book_append_sheet(
    book,
    utils.json_to_sheet([
      { Indicador: "PQRSF recibidas", Valor: t.received },
      { Indicador: "Abiertas", Valor: t.open },
      { Indicador: "Vencidas", Valor: t.overdue },
      { Indicador: "Respondidas", Valor: t.answered },
      { Indicador: "% respondidas en término", Valor: dash(t.onTimePct, "%") },
      { Indicador: "Tiempo promedio de respuesta (días hábiles)", Valor: dash(t.avgDays) },
      { Indicador: "Trasladadas por competencia", Valor: t.transferred },
      { Indicador: "Negadas", Valor: t.denied },
      { Indicador: "Anuladas", Valor: t.annulled },
    ]),
    "Resumen"
  );
  utils.book_append_sheet(
    book,
    utils.json_to_sheet(
      report.byKind.map((k) => ({
        Tipo: k.label,
        Recibidas: k.received,
        Abiertas: k.open,
        Vencidas: k.overdue,
        Respondidas: k.answered,
        "% en término": dash(k.onTimePct, "%"),
        "Promedio días hábiles": dash(k.avgDays),
        Trasladadas: k.transferred,
        Negadas: k.denied,
      }))
    ),
    "Por tipo"
  );
  utils.book_append_sheet(
    book,
    utils.json_to_sheet(
      report.byArea.map((a) => ({ Área: a.area, Recibidos: a.received, Abiertos: a.open, Vencidos: a.overdue, "Promedio días hábiles": dash(a.avgDays) }))
    ),
    "Por área"
  );
  utils.book_append_sheet(
    book,
    utils.json_to_sheet(
      report.teachers.map((d) => ({ Docente: d.name, Entregas: d.delivered, Extemporáneas: d.late, Devueltas: d.returned }))
    ),
    "Docentes"
  );
  utils.book_append_sheet(
    book,
    utils.json_to_sheet(
      report.surveys.map((s) => ({
        Encuesta: s.title,
        "Docente / área": s.evaluates,
        Respuestas: s.responses,
        "Tasa de respuesta": dash(s.rate, "%"),
        NPS: dash(s.nps),
        "CSAT promedio": dash(s.csat),
      }))
    ),
    "Encuestas"
  );
  utils.book_append_sheet(book, utils.json_to_sheet(radicadoRows(radicados, now)), "Detalle");
  writeFile(book, `reporte-ventanilla-${now.toISOString().slice(0, 10)}.xlsx`);
}

/** Informe de PQRSF listo para publicar por transparencia (Ley 1712 de 2014, art. 11 lit. h). */
export async function downloadTransparencyPdf(report: Report, now: Date): Promise<void> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "letter" });
  const left = 18;
  let y = 20;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text(SCHOOL.name, left, y);
  doc.setFontSize(12);
  doc.text("Informe de peticiones, quejas, reclamos, sugerencias y felicitaciones", left, (y += 7));
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Generado el ${formatDateTime(now.toISOString())} · Ley 1712 de 2014 (transparencia) · Ley 1755 de 2015`, left, (y += 6));

  const t = report.totals;
  y += 10;
  const summary: Array<[string, string]> = [
    ["PQRSF recibidas", String(t.received)],
    ["Respondidas", String(t.answered)],
    ["Respondidas dentro del término", t.onTimePct === null ? "—" : `${t.onTimePct}%`],
    ["Tiempo promedio de respuesta", t.avgDays === null ? "—" : `${String(t.avgDays).replace(".", ",")} días hábiles`],
    ["Trasladadas a otra entidad por competencia", String(t.transferred)],
    ["Negadas", String(t.denied)],
    ["En trámite al corte", String(t.open)],
    ["Vencidas al corte", String(t.overdue)],
  ];
  doc.setFontSize(10);
  for (const [label, value] of summary) {
    doc.setFont("helvetica", "normal");
    doc.text(label, left, y);
    doc.setFont("helvetica", "bold");
    doc.text(value, 196, y, { align: "right" });
    y += 6;
  }

  y += 6;
  const cols = ["Tipo", "Recibidas", "Respondidas", "En término", "Prom. días", "Trasladadas", "Negadas"];
  const x = [left, 62, 88, 116, 142, 164, 186];
  doc.setFillColor(31, 72, 199);
  doc.setTextColor(255, 255, 255);
  doc.rect(left - 2, y - 5, 182, 8, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  cols.forEach((c, i) => doc.text(c, x[i], y));
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "normal");
  for (const k of report.byKind) {
    y += 7;
    const cells = [
      k.label,
      String(k.received),
      String(k.answered),
      k.onTimePct === null ? "—" : `${k.onTimePct}%`,
      k.avgDays === null ? "—" : String(k.avgDays).replace(".", ","),
      String(k.transferred),
      String(k.denied),
    ];
    cells.forEach((c, i) => doc.text(c, x[i], y));
  }

  doc.setFontSize(8);
  doc.setTextColor(90, 90, 90);
  doc.text(
    doc.splitTextToSize(
      "Los plazos se cuentan en días hábiles desde el día siguiente a la radicación, excluyendo fines de semana y festivos nacionales. " +
        "Los radicados anulados no se incluyen en los indicadores. Informe generado desde la ventanilla única de la institución.",
      178
    ) as string[],
    left,
    250
  );
  doc.save(`informe-pqrsf-transparencia-${now.toISOString().slice(0, 10)}.pdf`);
}
