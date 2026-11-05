"use client";

import * as React from "react";
import { Send } from "lucide-react";

import { CURRENT_USER, useVentanilla } from "@/components/providers/ventanilla-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import type { Radicado } from "@/lib/ventanilla/types";

export function ResponseCard({ radicado }: { radicado: Radicado }) {
  const { dispatch } = useVentanilla();
  const { toast } = useToast();
  const [text, setText] = React.useState("");

  if (radicado.response) {
    return (
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-lg">Respuesta enviada</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="whitespace-pre-line rounded-xl bg-muted p-4 text-sm">{radicado.response}</div>
        </CardContent>
      </Card>
    );
  }

  if (radicado.status === "anulado" || radicado.status === "cerrado") return null;

  const greeting = radicado.requester.anonymous ? "Cordial saludo." : `Señor(a) ${radicado.requester.name}, cordial saludo.`;

  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle className="text-lg">Responder al radicante</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Textarea
          rows={6}
          aria-label="Respuesta"
          placeholder={`${greeting}\n\nEn atención a su ${radicado.kind === "PET" ? "petición" : "comunicación"} radicada con el número ${radicado.number}…`}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">
            {radicado.requester.anonymous
              ? "Radicado anónimo: la respuesta queda visible en la consulta por número."
              : "Se envía por correo y WhatsApp y queda visible en la consulta."}
          </p>
          <Button
            disabled={text.trim().length < 20}
            onClick={() => {
              dispatch({ type: "respond", id: radicado.id, text: text.trim(), actor: CURRENT_USER.name });
              setText("");
              toast({ title: "Respuesta enviada", description: radicado.number });
            }}
          >
            <Send className="size-4" />
            Enviar respuesta
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
