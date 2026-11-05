import { formatBytes, formatCivilDate, formatDateTime, SCHOOL } from "./rules";
import { CHANNEL_LABELS, KIND_LABELS } from "./types";
import type { Radicado } from "./types";

const PRIMARY: [number, number, number] = [31, 72, 199];

/** Acuse de recibo en PDF (UC-ENC-04, paso 5). jsPDF se carga solo al descargar. */
export async function downloadReceiptPdf(r: Radicado, ackTemplate?: string): Promise<void> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "letter" });
  const left = 20;
  let y = 22;

  doc.setFillColor(...PRIMARY);
  doc.rect(0, 0, 216, 12, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(SCHOOL.name, left, (y += 4));
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("Ventanilla única de radicación · Acuse de recibo", left, (y += 6));

  doc.setDrawColor(...PRIMARY);
  doc.setLineWidth(0.6);
  doc.roundedRect(left, (y += 8), 176, 18, 3, 3);
  doc.setFontSize(9);
  doc.text("NÚMERO DE RADICADO", left + 6, y + 7);
  doc.setFont("courier", "bold");
  doc.setFontSize(16);
  doc.setTextColor(...PRIMARY);
  doc.text(r.number, left + 6, y + 14);
  doc.setTextColor(0, 0, 0);
  y += 28;

  const rows: Array<[string, string]> = [
    ["Tipo", r.documentType ? `${KIND_LABELS[r.kind]} · ${r.documentType}` : KIND_LABELS[r.kind]],
    ["Fecha y hora de radicación", formatDateTime(r.createdAt)],
    ["Canal", CHANNEL_LABELS[r.channel]],
    ["Radicante", r.requester.anonymous ? "Anónimo" : `${r.requester.name} (${r.requester.detail ?? r.requester.role})`],
    ["Dirigido a", r.area],
    ["Asunto", r.subject],
    ["Respuesta a más tardar", r.dueAt ? `${formatCivilDate(r.dueAt)} (días hábiles, Ley 1755 de 2015)` : "No aplica"],
  ];
  const context = [r.group, r.course, r.period].filter(Boolean).join(" · ");
  if (context) rows.push(["Grupo / asignatura / periodo", context]);
  if (r.linkedTo) rows.push(["Corrección del radicado", r.linkedTo]);
  if (r.lateDelivery) rows.push(["Entrega", "Extemporánea (después de la fecha límite)"]);
  doc.setFontSize(10);
  for (const [label, value] of rows) {
    doc.setFont("helvetica", "bold");
    doc.text(label, left, y);
    doc.setFont("helvetica", "normal");
    const lines = doc.splitTextToSize(value, 116) as string[];
    doc.text(lines, left + 60, y);
    y += 6 * lines.length + 1;
  }

  y += 4;
  doc.setFont("helvetica", "bold");
  doc.text("Adjuntos e integridad", left, y);
  doc.setFont("courier", "normal");
  doc.setFontSize(8);
  y += 6;
  if (r.attachments.length === 0) {
    doc.text("Sin adjuntos", left, y);
    y += 5;
  }
  for (const a of r.attachments) {
    doc.text(`${a.name} (${formatBytes(a.sizeBytes)})`, left, y);
    doc.text(`SHA-256 ${a.sha256}`, left, (y += 4));
    y += 6;
  }
  doc.text(`Huella del registro SHA-256 ${r.recordHash}`, left, (y += 2));

  if (ackTemplate) {
    const ack = ackTemplate
      .replaceAll("{radicado}", r.number)
      .replaceAll("{fecha}", formatDateTime(r.createdAt))
      .replaceAll("{vence}", r.dueAt ? formatCivilDate(r.dueAt) : "no aplica");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    doc.text(doc.splitTextToSize(ack, 176) as string[], left, 236);
  }
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(90, 90, 90);
  const legal = doc.splitTextToSize(
    "Este acuse es un mensaje de datos (Ley 527 de 1999). El contenido radicado y sus adjuntos no pueden modificarse; " +
      "cualquier novedad queda registrada como un evento nuevo en el historial del radicado. Consulte el estado con el número de radicado.",
    176
  ) as string[];
  doc.text(legal, left, 250);
  doc.save(`acuse-${r.number}.pdf`);
}
