"use client";

import * as React from "react";
import { Check, Copy, Download, RotateCcw } from "lucide-react";

import { useVentanilla } from "@/components/providers/ventanilla-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { downloadReceiptPdf } from "@/lib/ventanilla/receipt-pdf";
import { formatCivilDate, formatDateTime } from "@/lib/ventanilla/rules";
import type { Radicado } from "@/lib/ventanilla/types";

interface ReceiptCardProps {
  radicado: Radicado;
  onAnother: () => void;
}

export function ReceiptCard({ radicado, onAnother }: ReceiptCardProps) {
  const { state } = useVentanilla();
  const [copied, setCopied] = React.useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(radicado.number);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <Card className="rounded-2xl text-center duration-500 animate-in fade-in zoom-in-95">
      <CardContent className="space-y-5 p-6 sm:p-8">
        <span className="mx-auto grid size-14 place-items-center rounded-full bg-emerald-100/60 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
          <Check className="size-7" />
        </span>
        <div className="space-y-1">
          <h2 className="text-2xl font-black tracking-tight">Radicado con éxito</h2>
          <p className="text-sm text-muted-foreground">
            {radicado.requester.anonymous
              ? "Guarda este número: es la única forma de consultar tu radicado anónimo."
              : `Enviamos el acuse a ${radicado.requester.email ?? "tu correo"}${radicado.requester.phone ? " y por WhatsApp" : ""}.`}
          </p>
        </div>
        <button
          type="button"
          onClick={copy}
          className="mx-auto flex items-center gap-2 rounded-xl bg-primary/10 px-5 py-3 font-mono text-lg font-medium text-primary sm:text-2xl"
        >
          {radicado.number}
          {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
        </button>
        <dl className="grid gap-3 text-left sm:grid-cols-3">
          <div className="rounded-xl bg-muted p-3">
            <dt className="text-xs text-muted-foreground">Fecha y hora</dt>
            <dd className="text-sm font-semibold">{formatDateTime(radicado.createdAt)}</dd>
          </div>
          <div className="rounded-xl bg-muted p-3">
            <dt className="text-xs text-muted-foreground">Dirigido a</dt>
            <dd className="text-sm font-semibold">{radicado.area}</dd>
          </div>
          <div className="rounded-xl bg-muted p-3">
            <dt className="text-xs text-muted-foreground">Respuesta a más tardar</dt>
            <dd className="text-sm font-semibold">{radicado.dueAt ? formatCivilDate(radicado.dueAt) : "No aplica"}</dd>
          </div>
        </dl>
        <p className="break-all text-left font-mono text-xs text-muted-foreground">
          Huella del registro (SHA-256): {radicado.recordHash}
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          <Button variant="outline" onClick={() => downloadReceiptPdf(radicado, state.config.ackTemplate)}>
            <Download className="size-4" />
            Descargar acuse PDF
          </Button>
          <Button variant="ghost" onClick={onAnother}>
            <RotateCcw className="size-4" />
            Radicar otro
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
