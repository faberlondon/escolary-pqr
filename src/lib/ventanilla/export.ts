import { utils, writeFile } from "xlsx";

import { deadlineLabel, formatCivilDate, formatDateTime, responseBusinessDays } from "./rules";
import { CHANNEL_LABELS, KIND_LABELS, RESPONSE_OUTCOME_LABELS, STATUS_LABELS } from "./types";
import type { Radicado } from "./types";

export function radicadoRows(radicados: readonly Radicado[], now: Date): Array<Record<string, string | number>> {
  return radicados.map((r) => ({
    Radicado: r.number,
    Tipo: KIND_LABELS[r.kind],
    "Tipo de documento": r.documentType ?? "",
    Asunto: r.subject,
    Radicante: r.requester.name,
    Calidad: r.requester.detail ?? r.requester.role,
    Canal: CHANNEL_LABELS[r.channel],
    "Dirigido a": r.area,
    Responsable: r.assignee ?? "",
    "Grupo / asignatura / periodo": [r.group, r.course, r.period].filter(Boolean).join(" · "),
    "Fecha de radicación": formatDateTime(r.createdAt),
    Vencimiento: r.dueAt ? formatCivilDate(r.dueAt) : "",
    Estado: STATUS_LABELS[r.status],
    Término: deadlineLabel(r, now),
    "Días hábiles para responder": responseBusinessDays(r) ?? "",
    "Sentido de la respuesta": r.responseOutcome ? RESPONSE_OUTCOME_LABELS[r.responseOutcome] : "",
    "Trasladado a": r.transferredTo ?? "",
    Extemporáneo: r.lateDelivery ? "Sí" : "",
    "Vinculado a": r.linkedTo ?? "",
    Adjuntos: r.attachments.map((a) => a.name).join(", "),
    "Hash del registro (SHA-256)": r.recordHash,
  }));
}

/** Listado de radicados en Excel (UC-ENC-10). */
export function exportRadicadosXlsx(radicados: readonly Radicado[], now: Date): void {
  const book = utils.book_new();
  utils.book_append_sheet(book, utils.json_to_sheet(radicadoRows(radicados, now)), "Radicados");
  writeFile(book, `radicados-${now.toISOString().slice(0, 10)}.xlsx`);
}
