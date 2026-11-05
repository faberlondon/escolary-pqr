"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";

import { useVentanilla } from "@/components/providers/ventanilla-provider";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  QUESTION_KIND_LABELS,
  SURVEY_AUDIENCES,
  SURVEY_CHANNEL_LABELS,
  SURVEY_CHANNELS,
  SURVEY_REMINDER_LABELS,
  SURVEY_REMINDERS,
  SURVEY_TEMPLATES,
} from "@/lib/ventanilla/surveys";
import type { QuestionKind, SurveyAudience, SurveyChannel, SurveyQuestion, SurveyReminder } from "@/lib/ventanilla/surveys";

const KINDS = Object.keys(QUESTION_KIND_LABELS) as QuestionKind[];
const needsOptions = (k: QuestionKind): boolean => k === "single" || k === "multiple";

function Field({ id, label, children }: { id: string; label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0 space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  );
}

/** UC-ENC-08: crear desde plantilla o clonando una encuesta previa, con constructor de preguntas. */
export function NewSurveyDialog() {
  const router = useRouter();
  const { dispatch, state, actor } = useVentanilla();
  const [open, setOpen] = React.useState(false);
  const [source, setSource] = React.useState<string>(`t:${SURVEY_TEMPLATES[0].id}`);
  const [title, setTitle] = React.useState("");
  const [objective, setObjective] = React.useState("");
  const [audience, setAudience] = React.useState<SurveyAudience>("Acudientes");
  const [audienceDetail, setAudienceDetail] = React.useState("");
  const [evaluates, setEvaluates] = React.useState("ninguno");
  const [closesAt, setClosesAt] = React.useState("");
  const [target, setTarget] = React.useState("");
  const [reminder, setReminder] = React.useState<SurveyReminder>("ninguno");
  const [channels, setChannels] = React.useState<SurveyChannel[]>(["whatsapp"]);
  const [anonymous, setAnonymous] = React.useState(false);
  const [questions, setQuestions] = React.useState<SurveyQuestion[]>(SURVEY_TEMPLATES[0].questions);

  const applySource = (value: string) => {
    setSource(value);
    if (value.startsWith("t:")) {
      setQuestions(SURVEY_TEMPLATES.find((t) => `t:${t.id}` === value)?.questions ?? []);
      return;
    }
    const prev = state.surveys.find((s) => `s:${s.id}` === value);
    if (!prev) return;
    setQuestions(prev.questions);
    setTitle(`${prev.title} (copia)`);
    setObjective(prev.objective ?? "");
    setAudience(prev.audience);
    setChannels(prev.channels);
    setAnonymous(prev.anonymous);
    setEvaluates(prev.evaluates ?? "ninguno");
  };

  const updateQ = (i: number, patch: Partial<SurveyQuestion>) =>
    setQuestions((qs) => qs.map((q, j) => (j === i ? { ...q, ...patch } : q)));

  const toggle = (c: SurveyChannel, on: boolean) => setChannels((prev) => (on ? [...prev, c] : prev.filter((x) => x !== c)));

  const questionsValid =
    questions.length > 0 &&
    questions.every((q) => q.text.trim().length >= 5 && (!needsOptions(q.kind) || (q.options ?? []).filter(Boolean).length >= 2));
  const valid = title.trim().length >= 4 && channels.length > 0 && questionsValid;

  const create = () => {
    const id = `enc-${crypto.randomUUID().slice(0, 8)}`;
    dispatch({
      type: "createSurvey",
      actor,
      survey: {
        id,
        title: title.trim(),
        objective: objective.trim() || undefined,
        audience,
        audienceDetail: audience === "Grupo específico" ? audienceDetail.trim() || undefined : undefined,
        evaluates: evaluates === "ninguno" ? undefined : evaluates,
        channels,
        anonymous,
        status: "borrador",
        closesAt: closesAt ? new Date(`${closesAt}T23:59:00-05:00`).toISOString() : undefined,
        target: Number(target) > 0 ? Number(target) : undefined,
        reminder,
        questions: questions.map((q, i) => ({
          ...q,
          id: q.id || `p${i + 1}`,
          text: q.text.trim(),
          options: needsOptions(q.kind) ? (q.options ?? []).map((o) => o.trim()).filter(Boolean) : undefined,
        })),
        responses: [],
      },
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
      <DialogContent className="max-h-[90dvh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nueva encuesta</DialogTitle>
          <DialogDescription>Parte de una plantilla o clona una encuesta previa. Queda en borrador hasta publicarla.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Field id="survey-source" label="Partir de">
            <Select value={source} onValueChange={applySource}>
              <SelectTrigger id="survey-source">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SURVEY_TEMPLATES.map((t) => (
                  <SelectItem key={t.id} value={`t:${t.id}`}>
                    Plantilla · {t.name} ({t.description})
                  </SelectItem>
                ))}
                {state.surveys.map((s) => (
                  <SelectItem key={s.id} value={`s:${s.id}`}>
                    Clonar · {s.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="survey-title" label="Nombre">
              <Input id="survey-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Satisfacción cierre de año" />
            </Field>
            <Field id="survey-evaluates" label="Evalúa a (docente o área)">
              <Select value={evaluates} onValueChange={setEvaluates}>
                <SelectTrigger id="survey-evaluates">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ninguno">La institución en general</SelectItem>
                  {state.config.areas.map((a) => (
                    <SelectItem key={a.name} value={a.name}>
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
          <Field id="survey-objective" label="Objetivo">
            <Textarea id="survey-objective" rows={2} value={objective} onChange={(e) => setObjective(e.target.value)} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field id="survey-audience" label="Público">
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
            </Field>
            <Field id="survey-closes" label="Vigente hasta">
              <Input id="survey-closes" type="date" value={closesAt} onChange={(e) => setClosesAt(e.target.value)} />
            </Field>
            <Field id="survey-target" label="Meta de respuestas">
              <Input id="survey-target" type="number" min={1} value={target} onChange={(e) => setTarget(e.target.value)} placeholder="Opcional" />
            </Field>
          </div>
          {audience === "Grupo específico" ? (
            <Field id="survey-group" label="Grupos">
              <Input id="survey-group" value={audienceDetail} onChange={(e) => setAudienceDetail(e.target.value)} placeholder="Acudientes de 9°A y 9°B" />
            </Field>
          ) : null}
          <div className="grid gap-4 sm:grid-cols-2">
            <fieldset className="space-y-2">
              <legend className="text-sm font-medium">Canales</legend>
              {SURVEY_CHANNELS.map((c) => (
                <label key={c} className="flex items-center gap-2 text-sm">
                  <Checkbox id={`ch-${c}`} checked={channels.includes(c)} onCheckedChange={(v) => toggle(c, v === true)} />
                  {SURVEY_CHANNEL_LABELS[c]}
                </label>
              ))}
            </fieldset>
            <div className="space-y-4">
              <Field id="survey-reminder" label="Recordatorios">
                <Select value={reminder} onValueChange={(v) => setReminder(v as SurveyReminder)}>
                  <SelectTrigger id="survey-reminder">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SURVEY_REMINDERS.map((r) => (
                      <SelectItem key={r} value={r}>
                        {SURVEY_REMINDER_LABELS[r]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <label className="flex items-start gap-2 text-sm">
                <Checkbox id="survey-anon" checked={anonymous} onCheckedChange={(v) => setAnonymous(v === true)} />
                Anónima: las respuestas no se vinculan a personas, ni siquiera en la exportación
              </label>
            </div>
          </div>

          <fieldset className="space-y-3">
            <div className="flex items-center justify-between">
              <legend className="text-sm font-medium">Preguntas ({questions.length})</legend>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setQuestions((qs) => [...qs, { id: `p${Date.now()}`, text: "", kind: "csat" }])}
              >
                <Plus className="size-4" />
                Pregunta
              </Button>
            </div>
            {questions.map((q, i) => (
              <div key={q.id + i} className="space-y-2 rounded-xl border p-3">
                <div className="grid grid-cols-[minmax(0,1fr)_10rem_auto] gap-2">
                  <Input aria-label={`Texto de la pregunta ${i + 1}`} value={q.text} placeholder="Texto de la pregunta" onChange={(e) => updateQ(i, { text: e.target.value })} />
                  <Select value={q.kind} onValueChange={(v) => updateQ(i, { kind: v as QuestionKind, options: needsOptions(v as QuestionKind) ? q.options ?? ["", ""] : undefined })}>
                    <SelectTrigger aria-label={`Tipo de la pregunta ${i + 1}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {KINDS.map((k) => (
                        <SelectItem key={k} value={k}>
                          {QUESTION_KIND_LABELS[k]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button variant="ghost" size="icon" aria-label={`Quitar pregunta ${i + 1}`} onClick={() => setQuestions((qs) => qs.filter((_, j) => j !== i))}>
                    <Trash2 className="size-4" />
                  </Button>
                </div>
                {needsOptions(q.kind) ? (
                  <Input
                    aria-label={`Opciones de la pregunta ${i + 1}`}
                    value={(q.options ?? []).join(", ")}
                    placeholder="Opciones separadas por coma"
                    onChange={(e) => updateQ(i, { options: e.target.value.split(",").map((o) => o.trimStart()) })}
                  />
                ) : null}
              </div>
            ))}
            {!questionsValid ? (
              <p className="text-xs text-muted-foreground">Cada pregunta necesita texto (5+ caracteres) y las de selección al menos 2 opciones.</p>
            ) : null}
          </fieldset>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button disabled={!valid} onClick={create}>
            Crear borrador
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
