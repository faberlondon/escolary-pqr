"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { CheckCircle2, Send } from "lucide-react";

import { ScaleQuestion } from "@/components/encuestas/scale-question";
import { useVentanilla } from "@/components/providers/ventanilla-provider";
import { PublicShell } from "@/components/radicar/public-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const KIOSK_RESET_MS = 6000;

export default function AnswerSurveyPage() {
  const { id } = useParams<{ id: string }>();
  const { state, ready, dispatch } = useVentanilla();
  const [answers, setAnswers] = React.useState<Record<string, number>>({});
  const [comment, setComment] = React.useState("");
  const [sent, setSent] = React.useState(false);
  const survey = state.surveys.find((s) => s.id === id);
  const kiosk = survey?.channels.includes("tablet") ?? false;

  React.useEffect(() => {
    if (!sent || !kiosk) return;
    // Modo tablet: vuelve a quedar lista para la siguiente persona.
    const t = setTimeout(() => {
      setSent(false);
      setAnswers({});
      setComment("");
    }, KIOSK_RESET_MS);
    return () => clearTimeout(t);
  }, [sent, kiosk]);

  if (!ready) return null;
  if (!survey || survey.status !== "activa") {
    return (
      <PublicShell title="Encuesta no disponible" description="Esta encuesta no está abierta en este momento.">
        <span />
      </PublicShell>
    );
  }

  const complete = survey.questions.every((q) => typeof answers[q.id] === "number");
  const submit = () => {
    dispatch({
      type: "answerSurvey",
      id: survey.id,
      response: { id: crypto.randomUUID(), at: new Date().toISOString(), answers, comment: comment.trim() || undefined },
    });
    setSent(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <PublicShell title={survey.title} description={`${survey.questions.length} preguntas · menos de 1 minuto${survey.anonymous ? " · anónima" : ""}`}>
      {sent ? (
        <Card className="rounded-2xl text-center duration-500 animate-in fade-in zoom-in-95">
          <CardContent className="space-y-3 p-8">
            <CheckCircle2 className="mx-auto size-12 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-2xl font-black">¡Gracias por responder!</h2>
            <p className="text-sm text-muted-foreground">
              Tu opinión nos ayuda a mejorar. ¿Necesitas que te respondamos algo puntual?{" "}
              <Link href="/radicar" className="font-semibold text-primary hover:underline">
                Radica una PQRSF
              </Link>
              .
            </p>
            {kiosk ? <p className="text-xs text-muted-foreground">La pantalla se reinicia en unos segundos.</p> : null}
          </CardContent>
        </Card>
      ) : (
        <Card className="rounded-2xl">
          <CardContent className="space-y-8 p-5 sm:p-8">
            {survey.questions.map((q, i) => (
              <ScaleQuestion
                key={q.id}
                question={q}
                index={i + 1}
                value={answers[q.id]}
                onChange={(v) => setAnswers((prev) => ({ ...prev, [q.id]: v }))}
              />
            ))}
            <div className="space-y-1.5">
              <Label htmlFor="comment">¿Algo más que quieras contarnos? (opcional)</Label>
              <Textarea id="comment" rows={3} value={comment} onChange={(e) => setComment(e.target.value)} className="text-base sm:text-sm" />
            </div>
            <Button size="lg" className="w-full" disabled={!complete} onClick={submit}>
              <Send className="size-4" />
              Enviar respuestas
            </Button>
          </CardContent>
        </Card>
      )}
    </PublicShell>
  );
}
