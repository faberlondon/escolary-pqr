"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { useVentanilla } from "@/components/providers/ventanilla-provider";
import { PublicShell } from "@/components/radicar/public-shell";
import { RadicarForm } from "@/components/radicar/radicar-form";
import { ReceiptCard } from "@/components/radicar/receipt-card";
import { Card, CardContent } from "@/components/ui/card";
import type { Radicado } from "@/lib/ventanilla/types";

function RadicarContent() {
  const params = useSearchParams();
  const { state, ready } = useVentanilla();
  const [done, setDone] = React.useState<Radicado | null>(null);
  const correctionNumber = params.get("corrige")?.toUpperCase();
  const original = correctionNumber
    ? state.radicados.find((r) => r.number === correctionNumber && r.kind === "DOC" && r.status === "devuelto")
    : undefined;

  return (
    <PublicShell
      title={original ? "Radicar corrección" : "Ventanilla única de radicación"}
      description="Radica documentos y PQRSF. Recibes tu número de radicado al instante."
    >
      {done ? (
        <ReceiptCard radicado={done} onAnother={() => setDone(null)} />
      ) : ready ? (
        <Card className="rounded-2xl">
          <CardContent className="p-5 sm:p-8">
            <RadicarForm
              key={original?.id ?? "nuevo"}
              channel="web"
              correctionOf={original}
              onDone={(r) => {
                setDone(r);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            />
          </CardContent>
        </Card>
      ) : null}
      <p className="text-center text-sm text-muted-foreground">
        ¿Ya radicaste?{" "}
        <Link href="/consultar" className="font-semibold text-primary hover:underline">
          Consulta el estado
        </Link>
      </p>
    </PublicShell>
  );
}

export default function RadicarPage() {
  return (
    <React.Suspense>
      <RadicarContent />
    </React.Suspense>
  );
}
