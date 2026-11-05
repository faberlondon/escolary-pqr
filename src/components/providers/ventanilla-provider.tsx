"use client";

import * as React from "react";

import { computeAutoEvents } from "@/lib/ventanilla/alerts";
import { DEFAULT_CONFIG, withConfigDefaults } from "@/lib/ventanilla/config";
import { createRadicado, type CreateRadicadoInput } from "@/lib/ventanilla/create-radicado";
import { ventanillaReducer, type Actor, type VentanillaAction, type VentanillaState } from "@/lib/ventanilla/reducer";
import { formatRadicadoNumber, maxSequence, sequencePrefix } from "@/lib/ventanilla/rules";
import { seedRadicados, seedSurveys } from "@/lib/ventanilla/seed";
import { DEFAULT_USER, DEMO_USERS, ROLE_LABELS, type DemoUser } from "@/lib/ventanilla/users";
import type { Radicado } from "@/lib/ventanilla/types";

const STORAGE_KEY = "ventanilla-demo-v4";
const USER_KEY = "ventanilla-demo-user";
/** La revisión de vencimientos corre al abrir y luego cada minuto (en producción: tarea diaria). */
const ALERT_INTERVAL_MS = 60_000;

interface VentanillaContextValue {
  state: VentanillaState;
  ready: boolean;
  user: DemoUser;
  actor: Actor;
  setUser: (id: string) => void;
  dispatch: React.Dispatch<VentanillaAction>;
  radicate: (input: CreateRadicadoInput) => Promise<Radicado>;
  log: (action: string, target?: string, detail?: string) => void;
  resetDemo: () => void;
}

const VentanillaContext = React.createContext<VentanillaContextValue | null>(null);

const freshState = (): VentanillaState => ({
  radicados: seedRadicados(),
  surveys: seedSurveys(),
  config: DEFAULT_CONFIG,
  audit: [],
});

function readStored(): VentanillaState | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<VentanillaState>;
    if (!Array.isArray(parsed.radicados) || !Array.isArray(parsed.surveys)) return null;
    return {
      radicados: parsed.radicados,
      surveys: parsed.surveys,
      config: withConfigDefaults(parsed.config),
      audit: Array.isArray(parsed.audit) ? parsed.audit : [],
    };
  } catch {
    return null;
  }
}

export function VentanillaProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = React.useReducer(ventanillaReducer, undefined, freshState);
  const [ready, setReady] = React.useState(false);
  const [user, setUserState] = React.useState<DemoUser>(DEFAULT_USER);
  const stateRef = React.useRef(state);
  stateRef.current = state;
  /** Último consecutivo entregado por prefijo: garantiza números únicos y continuos aun con envíos simultáneos. */
  const issued = React.useRef(new Map<string, number>());

  React.useEffect(() => {
    const stored = readStored();
    if (stored) dispatch({ type: "hydrate", state: stored });
    try {
      const u = DEMO_USERS.find((x) => x.id === window.localStorage.getItem(USER_KEY));
      if (u) setUserState(u);
    } catch {
      // Sin almacenamiento: queda el usuario por defecto.
    }
    setReady(true);
    // Sincroniza pestañas: radicar en el formulario público actualiza la bandeja abierta.
    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY) return;
      const next = readStored();
      if (next) dispatch({ type: "hydrate", state: next });
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  React.useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Almacenamiento no disponible: la demo sigue funcionando en memoria.
    }
  }, [state, ready]);

  // UC-ENC-07: revisión de vencimientos y cierre sin réplica.
  React.useEffect(() => {
    if (!ready) return;
    const run = () => {
      const events = computeAutoEvents(stateRef.current.radicados, new Date(), stateRef.current.config);
      if (events.length) dispatch({ type: "autoEvents", events });
    };
    run();
    const t = window.setInterval(run, ALERT_INTERVAL_MS);
    return () => window.clearInterval(t);
  }, [ready, state.radicados.length]);

  const actor = React.useMemo<Actor>(() => ({ name: user.name, role: ROLE_LABELS[user.role] }), [user]);

  const setUser = React.useCallback((id: string) => {
    const u = DEMO_USERS.find((x) => x.id === id);
    if (!u) return;
    setUserState(u);
    try {
      window.localStorage.setItem(USER_KEY, u.id);
    } catch {
      // Ignorado: preferencia solo de esta pestaña.
    }
  }, []);

  const radicate = React.useCallback<VentanillaContextValue["radicate"]>(
    async (input) => {
      const { config } = stateRef.current;
      const radicado = await createRadicado(input, config, (kind, year) => {
        const prefix = sequencePrefix(config.acronym, kind, year);
        const next = Math.max(maxSequence(stateRef.current.radicados, prefix), issued.current.get(prefix) ?? 0) + 1;
        issued.current.set(prefix, next);
        return formatRadicadoNumber(config.acronym, kind, year, next);
      });
      // El radicante externo no es el usuario de la demo: la bitácora registra quién radicó realmente.
      const by: Actor = input.onBehalfOf
        ? actor
        : { name: radicado.requester.anonymous ? "Anónimo" : radicado.requester.name, role: "Radicante" };
      dispatch({ type: "radicate", radicado, actor: by });
      return radicado;
    },
    [actor]
  );

  const log = React.useCallback(
    (action: string, target?: string, detail?: string) => dispatch({ type: "log", action, target, detail, actor }),
    [actor]
  );

  const resetDemo = React.useCallback(() => {
    issued.current.clear();
    dispatch({ type: "hydrate", state: freshState() });
  }, []);

  const value = React.useMemo(
    () => ({ state, ready, user, actor, setUser, dispatch, radicate, log, resetDemo }),
    [state, ready, user, actor, setUser, radicate, log, resetDemo]
  );
  return <VentanillaContext.Provider value={value}>{children}</VentanillaContext.Provider>;
}

export function useVentanilla(): VentanillaContextValue {
  const ctx = React.useContext(VentanillaContext);
  if (!ctx) throw new Error("useVentanilla debe usarse dentro de VentanillaProvider");
  return ctx;
}
