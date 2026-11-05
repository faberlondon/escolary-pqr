import { businessDaysUntil, civilKey, computeDueDate, parseCivil } from "./business-days";
import type { PetitionSubtype, Radicado, RadicadoKind, RadicadoStatus } from "./types";

export const SCHOOL = {
  name: "Institución Educativa Wiwa Shenzhawimaku",
  acronym: "IEWS",
  campus: "Sede principal",
} as const;

/** Plazos en días hábiles (Ley 1755 de 2015). Los documentos no tienen término. */
export function legalTermDays(kind: RadicadoKind, subtype?: PetitionSubtype): number | null {
  if (kind === "DOC") return null;
  if (kind === "PET" && subtype === "informacion") return 10;
  if (kind === "PET" && subtype === "consulta") return 30;
  return 15;
}

export function dueDateFor(kind: RadicadoKind, createdAt: Date, subtype?: PetitionSubtype): string | undefined {
  const days = legalTermDays(kind, subtype);
  return days === null ? undefined : civilKey(computeDueDate(createdAt, days));
}

/** Consecutivo por institución, año y tipología; nunca se reutiliza (RN-01). */
export function formatRadicadoNumber(kind: RadicadoKind, year: number, sequence: number): string {
  return `${SCHOOL.acronym}-${year}-${kind}-${String(sequence).padStart(6, "0")}`;
}

export function nextSequence(existing: readonly Radicado[], kind: RadicadoKind, year: number): number {
  const prefix = `${SCHOOL.acronym}-${year}-${kind}-`;
  const max = existing
    .filter((r) => r.number.startsWith(prefix))
    .reduce((acc, r) => Math.max(acc, Number(r.number.slice(prefix.length))), 0);
  return max + 1;
}

export async function sha256Hex(data: ArrayBuffer | string): Promise<string> {
  const bytes = typeof data === "string" ? new TextEncoder().encode(data) : new Uint8Array(data);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

const OPEN_STATUSES: readonly RadicadoStatus[] = ["radicado", "en_tramite", "prorrogado"];

export const isOpen = (r: Radicado): boolean =>
  OPEN_STATUSES.includes(r.status) && r.kind !== "DOC";

export const isPendingReview = (r: Radicado): boolean => r.kind === "DOC" && r.status === "radicado";

export type DeadlineState = "none" | "ok" | "soon" | "today" | "overdue";

export function deadlineState(r: Radicado, now: Date): { state: DeadlineState; days: number } {
  if (!r.dueAt || !isOpen(r)) return { state: "none", days: 0 };
  const days = businessDaysUntil(parseCivil(r.dueAt), now);
  if (days < 0) return { state: "overdue", days };
  if (days === 0) return { state: "today", days };
  if (days <= 3) return { state: "soon", days };
  return { state: "ok", days };
}

export function deadlineLabel(r: Radicado, now: Date): string {
  const { state, days } = deadlineState(r, now);
  switch (state) {
    case "none":
      return "—";
    case "overdue":
      return `Vencido hace ${-days} día${days === -1 ? "" : "s"} háb.`;
    case "today":
      return "Vence hoy";
    default:
      return `En ${days} día${days === 1 ? "" : "s"} háb.`;
  }
}

/** Prórroga motivada: hasta el doble del término inicial, contada desde el vencimiento. */
export function extendedDueDate(r: Radicado): string | undefined {
  const days = legalTermDays(r.kind, r.petitionSubtype);
  if (!r.dueAt || days === null) return undefined;
  const due = parseCivil(r.dueAt);
  // Mediodía de Bogotá del día de vencimiento: el conteo arranca el día hábil siguiente.
  const anchor = new Date(Date.UTC(due.y, due.m - 1, due.d, 17, 0));
  return civilKey(computeDueDate(anchor, days));
}

export const formatBytes = (n: number): string =>
  n < 1024 * 1024 ? `${Math.max(1, Math.round(n / 1024))} KB` : `${(n / 1024 / 1024).toFixed(1).replace(".", ",")} MB`;

const DATE_TIME = new Intl.DateTimeFormat("es-CO", {
  timeZone: "America/Bogota",
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});
const DATE_ONLY = new Intl.DateTimeFormat("es-CO", { timeZone: "UTC", day: "2-digit", month: "short", year: "numeric" });

export const formatDateTime = (iso: string): string => DATE_TIME.format(new Date(iso));
export const formatCivilDate = (key: string): string => {
  const c = parseCivil(key);
  return DATE_ONLY.format(new Date(Date.UTC(c.y, c.m - 1, c.d)));
};
