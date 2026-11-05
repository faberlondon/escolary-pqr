import { businessDaysBetween } from "./business-days";
import { responsibleFor, type VentanillaConfig } from "./config";
import type { AutoEvent } from "./reducer";
import { deadlineState, formatCivilDate } from "./rules";
import type { Radicado, RadicadoEvent } from "./types";

const event = (key: string, type: RadicadoEvent["type"], detail: string, at: string): RadicadoEvent => ({
  id: crypto.randomUUID(),
  key,
  type,
  at,
  actor: "Sistema",
  detail,
});

/**
 * Tarea diaria (UC-ENC-07): alerta al responsable 3 días hábiles antes, a coordinación y rectoría el día
 * del vencimiento y marca "Vencido" al día siguiente. También cierra lo respondido sin réplica (UC-ENC-05).
 * Idempotente: cada alerta lleva una llave con la fecha de vencimiento vigente.
 */
export function computeAutoEvents(radicados: readonly Radicado[], now: Date, config: VentanillaConfig): AutoEvent[] {
  const at = now.toISOString();
  const out: AutoEvent[] = [];
  for (const r of radicados) {
    const has = (key: string): boolean => r.events.some((e) => e.key === key);
    const { state, days } = deadlineState(r, now);
    if (r.dueAt) {
      const due = formatCivilDate(r.dueAt);
      const who = r.assignee ?? responsibleFor(config, r.area) ?? r.area;
      if (state === "soon" && !has(`soon-${r.dueAt}`)) {
        out.push({
          id: r.id,
          event: event(`soon-${r.dueAt}`, "due_alert", `Alerta a ${who}: vence en ${days} día${days === 1 ? "" : "s"} hábil${days === 1 ? "" : "es"} (${due})`, at),
        });
      }
      if (state === "today" && !has(`today-${r.dueAt}`)) {
        out.push({ id: r.id, event: event(`today-${r.dueAt}`, "due_alert", `Vence hoy (${due}): se notificó a coordinación y rectoría`, at) });
      }
      if (state === "overdue" && !has(`overdue-${r.dueAt}`)) {
        out.push({ id: r.id, event: event(`overdue-${r.dueAt}`, "due_alert", `Vencido el ${due}: marcado en rojo en la bandeja`, at) });
      }
    }
    if (r.status === "respondido" && !has("auto-close")) {
      const answered = r.events.find((e) => e.type === "answered");
      if (answered && businessDaysBetween(new Date(answered.at), now) >= config.closeAfterDays) {
        out.push({
          id: r.id,
          status: "cerrado",
          event: event("auto-close", "closed", `Cerrado sin réplica tras ${config.closeAfterDays} días hábiles`, at),
        });
      }
    }
  }
  return out;
}
