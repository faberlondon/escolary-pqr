import { businessDaysBetween, businessDaysUntil, civilKey, computeDueDate, parseCivil } from "./business-days";
import { DEFAULT_CONFIG, type VentanillaConfig } from "./config";
import type { PetitionSubtype, Radicado, RadicadoKind, RadicadoStatus } from "./types";

export const SCHOOL = {
  name: "Institución Educativa Wiwa Shenzhawimaku",
  campus: "Sede principal",
} as const;

/** Plazos en días hábiles según la configuración (Ley 1755 de 2015). Los documentos no tienen término. */
export function legalTermDays(
  kind: RadicadoKind,
  subtype?: PetitionSubtype,
  config: VentanillaConfig = DEFAULT_CONFIG
): number | null {
  if (kind === "DOC") return null;
  if (kind === "PET") return config.terms[subtype ?? "general"];
  return config.terms[kind];
}

export function dueDateFor(
  kind: RadicadoKind,
  createdAt: Date,
  subtype?: PetitionSubtype,
  config: VentanillaConfig = DEFAULT_CONFIG
): string | undefined {
  const days = legalTermDays(kind, subtype, config);
  return days === null ? undefined : civilKey(computeDueDate(createdAt, days, config.cutoffHour));
}

/** Consecutivo por institución, año y tipología; nunca se reutiliza (RN-01). */
export function formatRadicadoNumber(acronym: string, kind: RadicadoKind, year: number, sequence: number): string {
  return `${acronym}-${year}-${kind}-${String(sequence).padStart(6, "0")}`;
}

export const sequencePrefix = (acronym: string, kind: RadicadoKind, year: number): string => `${acronym}-${year}-${kind}-`;

export function maxSequence(existing: readonly Radicado[], prefix: string): number {
  return existing
    .filter((r) => r.number.startsWith(prefix))
    .reduce((acc, r) => Math.max(acc, Number(r.number.slice(prefix.length))), 0);
}

export async function sha256Hex(data: ArrayBuffer | string): Promise<string> {
  const bytes = typeof data === "string" ? new TextEncoder().encode(data) : new Uint8Array(data);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Estados con término corriendo. "En espera de información" suspende el término. */
const RUNNING: readonly RadicadoStatus[] = ["radicado", "asignado", "en_tramite", "prorrogado"];
const OPEN: readonly RadicadoStatus[] = [...RUNNING, "en_espera"];

export const isOpen = (r: Radicado): boolean => OPEN.includes(r.status) && r.kind !== "DOC";
export const isRunning = (r: Radicado): boolean => RUNNING.includes(r.status) && r.kind !== "DOC";

export const isPendingReview = (r: Radicado): boolean => r.kind === "DOC" && r.status === "radicado";

export type DeadlineState = "none" | "ok" | "soon" | "today" | "overdue" | "suspended";

export function deadlineState(r: Radicado, now: Date): { state: DeadlineState; days: number } {
  if (r.kind !== "DOC" && r.status === "en_espera") return { state: "suspended", days: 0 };
  if (!r.dueAt || !isRunning(r)) return { state: "none", days: 0 };
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
    case "suspended":
      return "Término suspendido";
    case "overdue":
      return `Vencido hace ${-days} día${days === -1 ? "" : "s"} háb.`;
    case "today":
      return "Vence hoy";
    default:
      return `En ${days} día${days === 1 ? "" : "s"} háb.`;
  }
}

/** Prórroga motivada: hasta el doble del término inicial, contada desde el vencimiento (RN-06). */
export function extendedDueDate(r: Radicado, config: VentanillaConfig = DEFAULT_CONFIG): string | undefined {
  const days = legalTermDays(r.kind, r.petitionSubtype, config);
  if (!r.dueAt || days === null) return undefined;
  const due = parseCivil(r.dueAt);
  // Mediodía de Bogotá del día de vencimiento: el conteo arranca el día hábil siguiente.
  const anchor = new Date(Date.UTC(due.y, due.m - 1, due.d, 17, 0));
  return civilKey(computeDueDate(anchor, days, config.cutoffHour));
}

/** Al recibir la información solicitada, el término se reactiva completo (Ley 1755, art. 17). */
export function resumedDueDate(r: Radicado, now: Date, config: VentanillaConfig = DEFAULT_CONFIG): string | undefined {
  const days = legalTermDays(r.kind, r.petitionSubtype, config);
  return days === null ? undefined : civilKey(computeDueDate(now, days, config.cutoffHour));
}

export const bogotaDateKey = (d: Date): string => d.toLocaleDateString("en-CA", { timeZone: "America/Bogota" });

/** A2: entrega posterior a la fecha límite de la tipología. Devuelve la fecha límite incumplida. */
export function lateDeadline(documentType: string | undefined, createdAt: Date, config: VentanillaConfig): string | null {
  const deadline = config.documentTypes.find((d) => d.name === documentType)?.deadline;
  if (!deadline) return null;
  return bogotaDateKey(createdAt) > deadline ? deadline : null;
}

const answeredAt = (r: Radicado): string | undefined => r.events.find((e) => e.type === "answered")?.at;

/** Días hábiles que tomó responder (UC-ENC-10). */
export function responseBusinessDays(r: Radicado): number | null {
  const at = answeredAt(r);
  return at ? businessDaysBetween(new Date(r.createdAt), new Date(at)) : null;
}

export function answeredOnTime(r: Radicado): boolean | null {
  const at = answeredAt(r);
  if (!at) return null;
  return !r.dueAt || bogotaDateKey(new Date(at)) <= r.dueAt;
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
