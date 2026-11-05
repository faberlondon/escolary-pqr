"use client";

import * as React from "react";
import { Search } from "lucide-react";

import { useVentanilla } from "@/components/providers/ventanilla-provider";
import { PublicShell } from "@/components/radicar/public-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PublicStatus } from "@/components/ventanilla/public-status";

/** UC-ENC-06: número de radicado + documento del radicante (o solo el número si es anónimo). */
export default function ConsultarPage() {
  const { state, ready } = useVentanilla();
  const [number, setNumber] = React.useState("");
  const [documentId, setDocumentId] = React.useState("");
  const [resultId, setResultId] = React.useState<string | null>(null);
  const [missing, setMissing] = React.useState(false);
  // Se busca por id en el estado vivo: si el radicado cambia (respuesta, info aportada) la vista se actualiza.
  const result = resultId ? state.radicados.find((r) => r.id === resultId) : undefined;

  const search = (e: React.FormEvent) => {
    e.preventDefault();
    const n = number.trim().toUpperCase();
    const doc = documentId.trim();
    const found = state.radicados.find((r) => r.number === n);
    const ok = found && (found.requester.anonymous || (found.requester.documentId ?? "") === doc);
    setResultId(ok ? found.id : null);
    // Mismo mensaje si el número no existe o el documento no coincide: no revela qué falló.
    setMissing(!ok);
  };

  return (
    <PublicShell title="Consulta tu radicado" description="Escribe el número que recibiste en el acuse y tu documento.">
      <Card className="rounded-2xl">
        <CardContent className="p-5 sm:p-6">
          <form onSubmit={search} className="grid gap-3 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_auto] sm:items-end">
            <div className="space-y-1.5">
              <Label htmlFor="numero">Número de radicado</Label>
              <Input
                id="numero"
                value={number}
                onChange={(e) => setNumber(e.target.value)}
                placeholder="IEWS-2026-PET-000009"
                className="font-mono text-base uppercase sm:text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="documento">Documento del radicante</Label>
              <Input
                id="documento"
                value={documentId}
                onChange={(e) => setDocumentId(e.target.value)}
                inputMode="numeric"
                placeholder="Déjalo vacío si fue anónimo"
                className="text-base sm:text-sm"
              />
            </div>
            <Button type="submit" disabled={!ready || number.trim().length < 6}>
              <Search className="size-4" />
              Consultar
            </Button>
          </form>
          {missing ? (
            <p role="alert" className="mt-4 text-sm text-destructive">
              No encontramos un radicado con esos datos. Revisa el número (con guiones, tal como aparece en el acuse) y el
              documento con el que radicaste.
            </p>
          ) : null}
        </CardContent>
      </Card>
      {result ? <PublicStatus radicado={result} /> : null}
    </PublicShell>
  );
}
