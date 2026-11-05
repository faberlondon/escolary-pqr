"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2, Send } from "lucide-react";

import { ChoiceQuestion } from "@/components/encuestas/choice-question";
import { ScaleQuestion } from "@/components/encuestas/scale-question";
import { useVentanilla } from "@/components/providers/ventanilla-provider";
import { PublicShell } from "@/components/radicar/public-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { isAnswerable, type AnswerValue, type SurveyAudience } from "@/lib/ventanilla/surveys";
import type { RequesterRole } from "@/lib/ventanilla/types";

const KIOSK_RESET_MS = 6000;

const ROLE_BY_AUDIENCE: Record<SurveyAudience, RequesterRole> = {
  Acudientes: "acudiente",
  Estudiantes: "estudiante",
  Docentes: "docente",
  Visitantes: "ciudadano",
  "Grupo específico": "ciudadano",
};

function AnswerSurvey() {
  const { id } = useParams<{ id: string }>();
  const params = useSearchParams();
  const token = params.get("t") ?? undefined;
  const capture = params.get("captura") === "1";
  const { state, ready, dispatch, radicate } = useVentanilla();
  const [answers, setAnswers] = React.useState<Record<string, AnswerValue>>({});
  const [comment, setComment] = React.useState("");
  const [asPqrsf, setAsPqrsf] = React.useState(false);
  const [sending, setSending] = React.useState(false);
  const [sent, setSent] = React.useState<{ radicado?: string } | null>(null);
  const survey = state.surveys.find((s) => s.id === id);
  // Modo kiosco: la tablet admite múltiples respuestas anónimas y se reinicia sola.
  const kiosk = !token && !capture && (survey?.channels.includes("tablet") ?? false);

  const reset = React.useCallback(() => {
    setSent(null);
    setAnswers({});
    setComment("");
    setAsPqrsf(false);
  }, []);

  React.useEffect(() => {
    if (!sent || !(kiosk || capture)) return;
    const t = setTimeout(reset, kiosk ? KIOSK_RESET_MS : 1500);
    return () => clearTimeout(t);
  }, [sent, kiosk, capture, reset]);

  if (!ready) return null;
  if (!survey || !isAnswerable(survey, new Date())) {
    return (
      <PublicShell title="Encuesta no disponible" description="Esta encuesta no está abierta en este momento.">
        <span />
      </PublicShell>
    );
  }
  if (token && survey.usedTokens?.includes(token) && !sent) {
    return (
      <PublicShell title={survey.title} description="Este enlace personal ya se usó.">
        <Card className="rounded-2xl">
          <CardContent className="p-6 text-sm text-muted-foreground">
            Cada enlace personal admite una sola respuesta. Si necesitas contarnos algo más,{" "}
            <Link href="/radicar" className="font-semibold text-primary hover:underline">
              radica una PQRSF
            </Link>
            .
          </CardContent>
        </Card>
      </PublicShell>
    );
  }

  const complete = survey.questions.every((q) => {
    const v = answers[q.id];
    if (q.kind === "open") return true;
    if (q.kind === "multiple") return Array.isArray(v) && v.length > 0;
    return v !== undefined && v !== "";
  });

  const submit = async () => {
    setSending(true);
    try {
      let radicadoNumber: string | undefined;
      // UC-ENC-09: el comentario se tramita como sugerencia anónima con radicado propio.
      if (asPqrsf && comment.trim().length >= 10) {
        const r = await radicate({
          channel: "web",
          files: [],
          values: {
            kind: "SUG",
            area: survey.evaluates ?? state.config.areas[0]?.name ?? "Rectoría",
            role: ROLE_BY_AUDIENCE[survey.audience],
            anonymous: true,
            subject: `Desde la encuesta: ${survey.title}`.slice(0, 140),
            description: comment.trim(),
            habeasData: true,
          },
        });
        radicadoNumber = r.number;
      }
      dispatch({
        type: "answerSurvey",
        id: survey.id,
        token,
        response: {
          id: crypto.randomUUID(),
          at: new Date().toISOString(),
          answers,
          comment: comment.trim() || undefined,
          channel: capture ? "fisica" : kiosk ? "tablet" : survey.channels.includes("whatsapp") && !survey.channels.includes("web") ? "whatsapp" : "web",
          radicado: radicadoNumber,
        },
      });
      setSent({ radicado: radicadoNumber });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setSending(false);
    }
  };

  const meta = [
    `${survey.questions.length} preguntas`,
    survey.anonymous ? "anónima" : null,
    capture ? "captura de formulario físico" : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <PublicShell title={survey.title} description={survey.objective ? `${survey.objective} · ${meta}` : meta}>
      {sent ? (
        <Card className="rounded-2xl text-center duration-500 animate-in fade-in zoom-in-95">
          <CardContent className="space-y-3 p-8">
            <CheckCircle2 className="mx-auto size-12 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-2xl font-black">{capture ? "Respuesta digitada" : "¡Gracias por responder!"}</h2>
            {sent.radicado ? (
              <p className="text-sm">
                Tu comentario quedó radicado como sugerencia con el número{" "}
                <span className="font-mono font-semibold text-primary">{sent.radicado}</span>. Guárdalo para{" "}
                <Link href="/consultar" className="font-semibold text-primary hover:underline">
                  consultar la respuesta
                </Link>
                .
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Tu opinión nos ayuda a mejorar. ¿Necesitas que te respondamos algo puntual?{" "}
                <Link href="/radicar" className="font-semibold text-primary hover:underline">
                  Radica una PQRSF
                </Link>
                .
              </p>
            )}
            {kiosk ? <p className="text-xs text-muted-foreground">La pantalla se reinicia en unos segundos.</p> : null}
          </CardContent>
        </Card>
      ) : (
        <Card className="rounded-2xl">
          <CardContent className="space-y-8 p-5 sm:p-8">
            {survey.questions.map((q, i) =>
              q.kind === "nps" || q.kind === "csat" ? (
                <ScaleQuestion
                  key={q.id}
                  question={q}
                  index={i + 1}
                  value={typeof answers[q.id] === "number" ? (answers[q.id] as number) : undefined}
                  onChange={(v) => setAnswers((prev) => ({ ...prev, [q.id]: v }))}
                />
              ) : (
                <ChoiceQuestion
                  key={q.id}
                  question={q}
                  index={i + 1}
                  value={answers[q.id]}
                  onChange={(v) => setAnswers((prev) => ({ ...prev, [q.id]: v }))}
                />
              )
            )}
            <div className="space-y-2">
              <Label htmlFor="comment">¿Algo más que quieras contarnos? (opcional)</Label>
              <Textarea id="comment" rows={3} value={comment} onChange={(e) => setComment(e.target.value)} className="text-base sm:text-sm" />
              {comment.trim().length >= 10 && !capture ? (
                <label className="flex items-start gap-2 text-sm">
                  <Checkbox checked={asPqrsf} onCheckedChange={(v) => setAsPqrsf(v === true)} />
                  Quiero que tramiten este comentario como sugerencia (PQRSF) y recibir un número de radicado.
                </label>
              ) : null}
            </div>
            <Button size="lg" className="w-full" disabled={!complete || sending} onClick={submit}>
              {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
              {capture ? "Guardar respuesta digitada" : "Enviar respuestas"}
            </Button>
          </CardContent>
        </Card>
      )}
    </PublicShell>
  );
}

export default function AnswerSurveyPage() {
  return (
    <React.Suspense>
      <AnswerSurvey />
    </React.Suspense>
  );
}
