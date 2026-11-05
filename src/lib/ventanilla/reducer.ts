import { extendedDueDate } from "./rules";
import type { Survey, SurveyResponse } from "./surveys";
import type { Area, EventType, Radicado, RadicadoEvent, RadicadoStatus } from "./types";

export interface VentanillaState {
  radicados: Radicado[];
  surveys: Survey[];
}

export type VentanillaAction =
  | { type: "hydrate"; state: VentanillaState }
  | { type: "radicate"; radicado: Radicado }
  | { type: "assign"; id: string; area: Area; actor: string }
  | { type: "note"; id: string; text: string; actor: string }
  | { type: "respond"; id: string; text: string; actor: string }
  | { type: "extend"; id: string; reason: string; actor: string }
  | { type: "accept"; id: string; actor: string }
  | { type: "return"; id: string; reason: string; actor: string }
  | { type: "close"; id: string; actor: string }
  | { type: "createSurvey"; survey: Survey }
  | { type: "publishSurvey"; id: string }
  | { type: "answerSurvey"; id: string; response: SurveyResponse };

const newEvent = (type: EventType, actor: string, detail?: string, internal?: boolean): RadicadoEvent => ({
  id: crypto.randomUUID(),
  type,
  at: new Date().toISOString(),
  actor,
  detail,
  internal,
});

/** Solo agrega eventos y cambia estado: el contenido radicado nunca se toca (RN-02). */
function appendEvent(
  r: Radicado,
  event: RadicadoEvent,
  patch: Partial<Pick<Radicado, "status" | "assignee" | "response" | "dueAt">> = {}
): Radicado {
  return { ...r, ...patch, events: [...r.events, event] };
}

const LOCKED: readonly RadicadoStatus[] = ["cerrado", "anulado"];

function updateRadicado(state: VentanillaState, id: string, fn: (r: Radicado) => Radicado): VentanillaState {
  return {
    ...state,
    radicados: state.radicados.map((r) => (r.id === id && !LOCKED.includes(r.status) ? fn(r) : r)),
  };
}

export function ventanillaReducer(state: VentanillaState, action: VentanillaAction): VentanillaState {
  switch (action.type) {
    case "hydrate":
      return action.state;
    case "radicate":
      return { ...state, radicados: [action.radicado, ...state.radicados] };
    case "assign":
      return updateRadicado(state, action.id, (r) =>
        appendEvent(r, newEvent("assigned", action.actor, `Asignado a ${action.area}`), {
          assignee: action.area,
          status: r.status === "radicado" ? "en_tramite" : r.status,
        })
      );
    case "note":
      return updateRadicado(state, action.id, (r) => appendEvent(r, newEvent("note", action.actor, action.text, true)));
    case "respond":
      return updateRadicado(state, action.id, (r) =>
        appendEvent(r, newEvent("answered", action.actor, "Respuesta enviada al radicante por correo y WhatsApp"), {
          status: "respondido",
          response: action.text,
        })
      );
    case "extend":
      return updateRadicado(state, action.id, (r) => {
        const dueAt = extendedDueDate(r);
        return appendEvent(r, newEvent("extended", action.actor, `Prórroga: ${action.reason}`), {
          status: "prorrogado",
          dueAt,
        });
      });
    case "accept":
      return updateRadicado(state, action.id, (r) =>
        appendEvent(r, newEvent("accepted", action.actor, "Recibido conforme"), { status: "recibido_conforme" })
      );
    case "return":
      return updateRadicado(state, action.id, (r) =>
        appendEvent(r, newEvent("returned", action.actor, action.reason), { status: "devuelto" })
      );
    case "close":
      return updateRadicado(state, action.id, (r) =>
        appendEvent(r, newEvent("closed", action.actor, "Cerrado por el gestor"), { status: "cerrado" })
      );
    case "createSurvey":
      return { ...state, surveys: [action.survey, ...state.surveys] };
    case "publishSurvey":
      return {
        ...state,
        surveys: state.surveys.map((s) => (s.id === action.id ? { ...s, status: "activa" } : s)),
      };
    case "answerSurvey":
      return {
        ...state,
        surveys: state.surveys.map((s) =>
          s.id === action.id ? { ...s, responses: [...s.responses, action.response] } : s
        ),
      };
  }
}
