"use client";

import * as React from "react";
import Link from "next/link";

import { PublicShell } from "@/components/radicar/public-shell";
import { RadicarForm } from "@/components/radicar/radicar-form";
import { ReceiptCard } from "@/components/radicar/receipt-card";
import { Card, CardContent } from "@/components/ui/card";
import type { Radicado } from "@/lib/ventanilla/types";

export default function RadicarPage() {
  const [done, setDone] = React.useState<Radicado | null>(null);

  return (
    <PublicShell
      title="Ventanilla única de radicación"
      description="Radica documentos y PQRSF. Recibes tu número de radicado al instante."
    >
      {done ? (
        <ReceiptCard radicado={done} onAnother={() => setDone(null)} />
      ) : (
        <Card className="rounded-2xl">
          <CardContent className="p-5 sm:p-8">
            <RadicarForm channel="web" onDone={(r) => {
              setDone(r);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }} />
          </CardContent>
        </Card>
      )}
      <p className="text-center text-sm text-muted-foreground">
        ¿Ya radicaste?{" "}
        <Link href="/consultar" className="font-semibold text-primary hover:underline">
          Consulta el estado
        </Link>
      </p>
    </PublicShell>
  );
}
