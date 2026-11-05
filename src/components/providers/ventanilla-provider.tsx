"use client";

import * as React from "react";

import { createRadicado } from "@/lib/ventanilla/create-radicado";
import { ventanillaReducer, type VentanillaAction, type VentanillaState } from "@/lib/ventanilla/reducer";
import { seedRadicados, seedSurveys } from "@/lib/ventanilla/seed";
import type { Channel, Radicado, RadicarFormValues } from "@/lib/ventanilla/types";

const STORAGE_KEY = "ventanilla-demo-v2";
export const CURRENT_USER = { name: "Inocencio Coronado", role: "Coordinador" } as const;

interface VentanillaContextValue {
  state: VentanillaState;
  ready: boolean;
  dispatch: React.Dispatch<VentanillaAction>;
  radicate: (input: { values: RadicarFormValues; files: File[]; channel: Channel; onBehalfOf?: string }) => Promise<Radicado>;
  resetDemo: () => void;
}

const VentanillaContext = React.createContext<VentanillaContextValue | null>(null);

const freshState = (): VentanillaState => ({ radicados: seedRadicados(), surveys: seedSurveys() });

function readStored(): VentanillaState | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<VentanillaState>;
    return Array.isArray(parsed.radicados) && Array.isArray(parsed.surveys)
      ? { radicados: parsed.radicados, surveys: parsed.surveys }
      : null;
  } catch {
    return null;
  }
}

export function VentanillaProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = React.useReducer(ventanillaReducer, undefined, freshState);
  const [ready, setReady] = React.useState(false);
  const stateRef = React.useRef(state);
  stateRef.current = state;

  React.useEffect(() => {
    const stored = readStored();
    if (stored) dispatch({ type: "hydrate", state: stored });
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

  const radicate = React.useCallback<VentanillaContextValue["radicate"]>(async (input) => {
    const radicado = await createRadicado({ ...input, existing: stateRef.current.radicados });
    dispatch({ type: "radicate", radicado });
    return radicado;
  }, []);

  const resetDemo = React.useCallback(() => dispatch({ type: "hydrate", state: freshState() }), []);

  const value = React.useMemo(
    () => ({ state, ready, dispatch, radicate, resetDemo }),
    [state, ready, radicate, resetDemo]
  );
  return <VentanillaContext.Provider value={value}>{children}</VentanillaContext.Provider>;
}

export function useVentanilla(): VentanillaContextValue {
  const ctx = React.useContext(VentanillaContext);
  if (!ctx) throw new Error("useVentanilla debe usarse dentro de VentanillaProvider");
  return ctx;
}
