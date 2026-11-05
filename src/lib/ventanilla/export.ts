import { utils, writeFile } from "xlsx";

import { deadlineLabel, formatCivilDate, formatDateTime } from "./rules";
import { CHANNEL_LABELS, KIND_LABELS } from "./types";
import type { Radicado } from "./types";

const STATUS_TEXT: Record<Radicado["status"], string> = {
  radicado: "Radicado",
  en_tramite: "En trámite",
  prorrogado: "Prorrogado",
  respondido: "Respondido",
  cerrado: "Cerrado",
  recibido_conforme: "Recibido conforme",
  devuelto: "Devuelto",
  anulado: "Anulado",
};

/** Reporte de radicados en Excel (UC-ENC-10). */
export function exportRadicadosXlsx(radicados: readonly Radicado[], now: Date): void {
  const rows = radicados.map((r) => ({
    Radicado: r.number,
    Tipo: KIND_LABELS[r.kind],
    "Tipo de documento": r.documentType ?? "",
    Asunto: r.subject,
    Radicante: r.requester.name,
    Calidad: r.requester.detail ?? r.requester.role,
    Canal: CHANNEL_LABELS[r.channel],
    "Dirigido a": r.area,
    "Fecha de radicación": formatDateTime(r.createdAt),
    Vencimiento: r.dueAt ? formatCivilDate(r.dueAt) : "",
    Estado: STATUS_TEXT[r.status],
    Término: deadlineLabel(r, now),
    Extemporáneo: r.lateDelivery ? "Sí" : "",
    Adjuntos: r.attachments.map((a) => a.name).join(", "),
    "Hash del registro (SHA-256)": r.recordHash,
  }));
  const sheet = utils.json_to_sheet(rows);
  const book = utils.book_new();
  utils.book_append_sheet(book, sheet, "Radicados");
  writeFile(book, `radicados-${now.toISOString().slice(0, 10)}.xlsx`);
}
