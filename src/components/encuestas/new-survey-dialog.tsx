"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

import { useVentanilla } from "@/components/providers/ventanilla-provider";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DEFAULT_QUESTIONS, SURVEY_AUDIENCES, SURVEY_CHANNEL_LABELS, SURVEY_CHANNELS } from "@/lib/ventanilla/surveys";
import type { SurveyAudience, SurveyChannel } from "@/lib/ventanilla/surveys";

export function NewSurveyDialog() {
  const router = useRouter();
  const { dispatch } = useVentanilla();
  const [open, setOpen] = React.useState(false);
  const [title, setTitle] = React.useState("");
  const [audience, setAudience] = React.useState<SurveyAudience>("Acudientes");
  const [channels, setChannels] = React.useState<SurveyChannel[]>(["whatsapp"]);
  const [anonymous, setAnonymous] = React.useState(false);

  const toggle = (c: SurveyChannel, on: boolean) =>
    setChannels((prev) => (on ? [...prev, c] : prev.filter((x) => x !== c)));

  const create = () => {
    const id = `enc-${crypto.randomUUID().slice(0, 8)}`;
    dispatch({
      type: "createSurvey",
      survey: { id, title: title.trim(), audience, channels, anonymous, status: "borrador", questions: DEFAULT_QUESTIONS, responses: [] },
    });
    setOpen(false);
    router.push(`/ventanilla/encuestas/${id}`);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" />
          Nueva encuesta
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nueva encuesta</DialogTitle>
          <DialogDescription>Inicia con la plantilla de satisfacción (1 pregunta NPS y 3 CSAT). Queda en borrador.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="survey-title">Nombre</Label>
            <Input id="survey-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Satisfacción cierre de año" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="survey-audience">Público</Label>
            <Select value={audience} onValueChange={(v) => setAudience(v as SurveyAudience)}>
              <SelectTrigger id="survey-audience">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SURVEY_AUDIENCES.map((a) => (
                  <SelectItem key={a} value={a}>
                    {a}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">Canales</legend>
            {SURVEY_CHANNELS.map((c) => (
              <label key={c} className="flex items-center gap-2 text-sm">
                <Checkbox id={`ch-${c}`} checked={channels.includes(c)} onCheckedChange={(v) => toggle(c, v === true)} />
                {SURVEY_CHANNEL_LABELS[c]}
              </label>
            ))}
          </fieldset>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox id="survey-anon" checked={anonymous} onCheckedChange={(v) => setAnonymous(v === true)} />
            Anónima (las respuestas no se vinculan a personas)
          </label>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button disabled={title.trim().length < 4 || channels.length === 0} onClick={create}>
            Crear borrador
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
