"use client";

import * as React from "react";
import { FileText, Loader2, Send } from "lucide-react";

import { useVentanilla } from "@/components/providers/ventanilla-provider";
import { FileDrop } from "@/components/radicar/file-drop";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { hashFile } from "@/lib/ventanilla/create-radicado";
import { formatBytes } from "@/lib/ventanilla/rules";
import { permissionsFor } from "@/lib/ventanilla/users";
import { RESPONSE_OUTCOME_LABELS, RESPONSE_OUTCOMES, type Radicado, type ResponseOutcome } from "@/lib/ventanilla/types";

export function ResponseCard({ radicado }: { radicado: Radicado }) {
  const { dispatch, state, user, actor } = useVentanilla();
  const { toast } = useToast();
  const [text, setText] = React.useState("");
  const [outcome, setOutcome] = React.useState<ResponseOutcome>("favorable");
  const [files, setFiles] = React.useState<File[]>([]);
  const [sending, setSending] = React.useState(false);

  if (radicado.response) {
    return (
      <Card className="rounded-2xl">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-lg">Respuesta enviada</CardTitle>
          {radicado.responseOutcome ? (
            <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">
              {RESPONSE_OUTCOME_LABELS[radicado.responseOutcome]}
            </span>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="whitespace-pre-line rounded-xl bg-muted p-4 text-sm">{radicado.response}</div>
          {radicado.responseAttachments?.map((a) => (
            <div key={a.sha256} className="flex items-center gap-3 rounded-xl border p-3">
              <FileText className="size-4 shrink-0 text-primary" />
              <p className="min-w-0 truncate text-sm">
                {a.name} <span className="font-mono text-xs text-muted-foreground">· {formatBytes(a.sizeBytes)} · sha256 {a.sha256.slice(0, 16)}…</span>
              </p>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (["anulado", "cerrado", "trasladado"].includes(radicado.status) || !permissionsFor(user, radicado).respond) return null;

  const greeting = radicado.requester.anonymous ? "Cordial saludo." : `Señor(a) ${radicado.requester.name}, cordial saludo.`;

  const send = async () => {
    setSending(true);
    try {
      const attachments = await Promise.all(files.map(hashFile));
      dispatch({ type: "respond", id: radicado.id, text: text.trim(), outcome, attachments, actor });
      setText("");
      setFiles([]);
      toast({ title: "Respuesta enviada", description: radicado.number });
    } finally {
      setSending(false);
    }
  };

  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle className="text-lg">Responder al radicante</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          rows={6}
          aria-label="Respuesta"
          placeholder={`${greeting}\n\nEn atención a su ${radicado.kind === "PET" ? "petición" : "comunicación"} radicada con el número ${radicado.number}…`}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <div className="grid gap-4 sm:grid-cols-[14rem_minmax(0,1fr)]">
          <div className="space-y-1.5">
            <Label htmlFor="outcome">Sentido de la respuesta</Label>
            <Select value={outcome} onValueChange={(v) => setOutcome(v as ResponseOutcome)}>
              <SelectTrigger id="outcome">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RESPONSE_OUTCOMES.map((o) => (
                  <SelectItem key={o} value={o}>
                    {RESPONSE_OUTCOME_LABELS[o]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="attachments">Soportes de la respuesta</Label>
            <FileDrop
              files={files}
              onChange={setFiles}
              accept={state.config.acceptedFormats}
              maxMb={state.config.maxFileMb}
              onReject={(m) => toast({ variant: "destructive", title: "Archivo rechazado", description: m })}
            />
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">
            {radicado.requester.anonymous
              ? "Radicado anónimo: la respuesta queda visible en la consulta por número."
              : "Se envía por correo y WhatsApp y queda visible en la consulta."}
          </p>
          <Button disabled={text.trim().length < 20 || sending} onClick={send}>
            {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            Enviar respuesta
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
