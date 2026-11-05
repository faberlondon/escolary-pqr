"use client";

import * as React from "react";
import { Search } from "lucide-react";

import { useVentanilla } from "@/components/providers/ventanilla-provider";
import { PublicShell } from "@/components/radicar/public-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PublicStatus } from "@/components/ventanilla/public-status";
import type { Radicado } from "@/lib/ventanilla/types";

export default function ConsultarPage() {
  const { state, ready } = useVentanilla();
  const [query, setQuery] = React.useState("");
  const [result, setResult] = React.useState<Radicado | null | "missing">(null);

  const search = (e: React.FormEvent) => {
    e.preventDefault();
    const n = query.trim().toUpperCase();
    setResult(state.radicados.find((r) => r.number === n) ?? "missing");
  };

  return (
    <PublicShell title="Consulta tu radicado" description="Escribe el número que recibiste en el acuse.">
      <Card className="rounded-2xl">
        <CardContent className="p-5 sm:p-6">
          <form onSubmit={search} className="flex flex-col gap-2 sm:flex-row">
            <Input
              id="numero"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="IEWE-2026-PET-000009"
              aria-label="Número de radicado"
              className="font-mono text-base uppercase sm:text-sm"
            />
            <Button type="submit" disabled={!ready || query.trim().length < 6}>
              <Search className="size-4" />
              Consultar
            </Button>
          </form>
          {result === "missing" ? (
            <p role="alert" className="mt-4 text-sm text-destructive">
              No encontramos ese número. Revisa que esté completo, con guiones, tal como aparece en el acuse.
            </p>
          ) : null}
        </CardContent>
      </Card>
      {result && result !== "missing" ? <PublicStatus radicado={result} /> : null}
    </PublicShell>
  );
}
