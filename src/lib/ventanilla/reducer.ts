import type { VentanillaConfig } from "./config";
import { extendedDueDate, resumedDueDate } from "./rules";
import type { Survey, SurveyResponse } from "./surveys";
import type { Attachment, EventType, Radicado, RadicadoEvent, RadicadoStatus, ResponseOutcome } from "./types";

/** Bitácora append-only (RN-12, RNF-03): quién hizo qué, cuándo y sobre qué. */
export interface AuditEntry {
  id: string;
  at: string;
  actor: string;
  role: string;
  action: string;
  target?: string;
  detail?: string;
}

export interface VentanillaState {
  radicados: Radicado[];
  surveys: Survey[];
  config: VentanillaConfig;
  audit: AuditEntry[];
}

export interface Actor {
  name: string;
  role: string;
}

/** Evento automático calculado fuera del reducer (alertas de vencimiento, cierre sin réplica). */
export interface AutoEvent {
  id: string;
  event: RadicadoEvent;
  status?: RadicadoStatus;
}

export type VentanillaAction =
  | { type: "hydrate"; state: VentanillaState }
  | { type: "radicate"; radicado: Radicado; actor: Actor }
  | { type: "assign"; id: string; area: string; responsible: string; actor: Actor }
  | { type: "note"; id: string; text: string; actor: Actor }
  | {
      type: "respond";
      id: string;
      text: string;
      outcome: ResponseOutcome;
      attachments: Attachment[];
      actor: Actor;
    }
  | { type: "extend"; id: string; reason: string; actor: Actor }
  | { type: "requestInfo"; id: string; text: string; actor: Actor }
  | { type: "infoReceived"; id: string; text: string; actor: Actor }
  | { type: "transfer"; id: string; entity: string; reason: string; actor: Actor }
  | { type: "annul"; id: string; reason: string; actor: Actor }
  | { type: "accept"; id: string; actor: Actor }
  | { type: "return"; id: string; reason: string; actor: Actor }
  | { type: "close"; id: string; actor: Actor }
  | { type: "autoEvents"; events: AutoEvent[] }
  | { type: "updateConfig"; config: VentanillaConfig; actor: Actor }
  | { type: "log"; action: string; target?: string; detail?: string; actor: Actor }
  | { type: "createSurvey"; survey: Survey; actor: Actor }
  | { type: "publishSurvey"; id: string; actor: Actor }
  | { type: "closeSurvey"; id: string; actor: Actor }
  | { type: "answerSurvey"; id: string; response: SurveyResponse; token?: string };

const newEvent = (type: EventType, actor: string, detail?: string, internal?: boolean): RadicadoEvent => ({
  id: crypto.randomUUID(),
  type,
  at: new Date().toISOString(),
  actor,
  detail,
  internal,
});

const audit = (state: VentanillaState, actor: Actor, action: string, target?: string, detail?: string): VentanillaState => ({
  ...state,
  audit: [
    { id: crypto.randomUUID(), at: new Date().toISOString(), actor: actor.name, role: actor.role, action, target, detail },
    ...state.audit,
  ],
});

type GestionPatch = Partial<
  Pick<
    Radicado,
    "status" | "assignee" | "assignedArea" | "response" | "responseOutcome" | "responseAttachments" | "dueAt" | "transferredTo"
  >
>;

/** Solo agrega eventos y campos de gestión: el contenido radicado nunca se toca (RN-02). */
function appendEvent(r: Radicado, event: RadicadoEvent, patch: GestionPatch = {}): Radicado {
  return { ...r, ...patch, events: [...r.events, event] };
}

const LOCKED: readonly RadicadoStatus[] = ["cerrado", "anulado"];

function updateRadicado(
  state: VentanillaState,
  id: string,
  actor: Actor,
  action: string,
  fn: (r: Radicado) => Radicado,
  allowLocked = false
): VentanillaState {
  const target = state.radicados.find((r) => r.id === id);
  if (!target || (!allowLocked && LOCKED.includes(target.status)) || target.status === "anulado") return state;
  const next = { ...state, radicados: state.radicados.map((r) => (r.id === id ? fn(r) : r)) };
  return audit(next, actor, action, target.number);
}

const updateSurvey = (state: VentanillaState, id: string, fn: (s: Survey) => Survey): VentanillaState => ({
  ...state,
  surveys: state.surveys.map((s) => (s.id === id ? fn(s) : s)),
});

export function ventanillaReducer(state: VentanillaState, action: VentanillaAction): VentanillaState {
  switch (action.type) {
    case "hydrate":
      return action.state;
    case "radicate":
      return audit(
        { ...state, radicados: [action.radicado, ...state.radicados] },
        action.actor,
        "Radicar",
        action.radicado.number
      );
    case "assign":
      return updateRadicado(state, action.id, action.actor, "Asignar", (r) =>
        appendEvent(r, newEvent("assigned", action.actor.name, `Asignado a ${action.responsible} · ${action.area}`), {
          assignee: action.responsible,
          assignedArea: action.area,
          status: r.status === "radicado" ? "asignado" : r.status,
        })
      );
    case "note":
      return updateRadicado(state, action.id, action.actor, "Nota interna", (r) =>
        appendEvent(r, newEvent("note", action.actor.name, action.text, true), {
          // El responsable registra gestiones: el radicado pasa a "En trámite".
          status: r.status === "asignado" ? "en_tramite" : r.status,
        })
      );
    case "respond":
      return updateRadicado(state, action.id, action.actor, "Responder", (r) =>
        appendEvent(r, newEvent("answered", action.actor.name, "Respuesta enviada al radicante por correo y WhatsApp"), {
          status: "respondido",
          response: action.text,
          responseOutcome: action.outcome,
          responseAttachments: action.attachments,
        })
      );
    case "extend":
      return updateRadicado(state, action.id, action.actor, "Prorrogar", (r) => {
        const dueAt = extendedDueDate(r, state.config);
        return appendEvent(r, newEvent("extended", action.actor.name, `Prórroga: ${action.reason}`), {
          status: "prorrogado",
          dueAt,
        });
      });
    case "requestInfo":
      return updateRadicado(state, action.id, action.actor, "Solicitar información", (r) =>
        appendEvent(r, newEvent("info_requested", action.actor.name, `Se solicita al radicante: ${action.text}. El término queda suspendido.`), {
          status: "en_espera",
        })
      );
    case "infoReceived":
      return updateRadicado(state, action.id, action.actor, "Información recibida", (r) => {
        const dueAt = resumedDueDate(r, new Date(), state.config);
        return appendEvent(r, newEvent("info_received", action.actor.name, `${action.text} · El término se reactiva.`), {
          status: "en_tramite",
          dueAt,
        });
      });
    case "transfer":
      return updateRadicado(state, action.id, action.actor, "Trasladar", (r) =>
        appendEvent(
          r,
          newEvent("transferred", action.actor.name, `Trasladado por competencia a ${action.entity}: ${action.reason}. Se notificó al peticionario.`),
          { status: "trasladado", transferredTo: action.entity }
        )
      );
    case "annul":
      return updateRadicado(
        state,
        action.id,
        action.actor,
        "Anular",
        (r) => appendEvent(r, newEvent("annulled", action.actor.name, `Anulado: ${action.reason}`), { status: "anulado" }),
        true
      );
    case "accept":
      return updateRadicado(state, action.id, action.actor, "Recibido conforme", (r) =>
        appendEvent(r, newEvent("accepted", action.actor.name, "Recibido conforme"), { status: "recibido_conforme" })
      );
    case "return":
      return updateRadicado(state, action.id, action.actor, "Devolver", (r) =>
        appendEvent(r, newEvent("returned", action.actor.name, action.reason), { status: "devuelto" })
      );
    case "close":
      return updateRadicado(state, action.id, action.actor, "Cerrar", (r) =>
        appendEvent(r, newEvent("closed", action.actor.name, "Cerrado por el gestor"), { status: "cerrado" })
      );
    case "autoEvents": {
      if (action.events.length === 0) return state;
      let next: VentanillaState = {
        ...state,
        radicados: state.radicados.map((r) => {
          const auto = action.events.filter((e) => e.id === r.id);
          if (auto.length === 0 || r.status === "anulado") return r;
          const status = auto.reduce<RadicadoStatus>((s, e) => e.status ?? s, r.status);
          return { ...r, status, events: [...r.events, ...auto.map((e) => e.event)] };
        }),
      };
      for (const e of action.events) {
        const number = state.radicados.find((r) => r.id === e.id)?.number;
        next = audit(next, { name: "Sistema", role: "Automático" }, e.event.type === "closed" ? "Cierre automático" : "Alerta de vencimiento", number, e.event.detail);
      }
      return next;
    }
    case "updateConfig":
      return audit({ ...state, config: action.config }, action.actor, "Actualizar configuración");
    case "log":
      return audit(state, action.actor, action.action, action.target, action.detail);
    case "createSurvey":
      return audit({ ...state, surveys: [action.survey, ...state.surveys] }, action.actor, "Crear encuesta", action.survey.title);
    case "publishSurvey": {
      const s = state.surveys.find((x) => x.id === action.id);
      return audit(
        updateSurvey(state, action.id, (x) => ({ ...x, status: "activa", publishedAt: new Date().toISOString() })),
        action.actor,
        "Publicar encuesta",
        s?.title,
        "Invitaciones enviadas por los canales elegidos"
      );
    }
    case "closeSurvey": {
      const s = state.surveys.find((x) => x.id === action.id);
      return audit(updateSurvey(state, action.id, (x) => ({ ...x, status: "cerrada" })), action.actor, "Cerrar encuesta", s?.title);
    }
    case "answerSurvey":
      return updateSurvey(state, action.id, (s) => ({
        ...s,
        responses: [...s.responses, action.response],
        usedTokens: action.token ? [...(s.usedTokens ?? []), action.token] : s.usedTokens,
      }));
  }
}
