"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Check, ClipboardPen, Copy, ExternalLink, FileSpreadsheet, KeyRound, Lock, Rocket } from "lucide-react";

import { SurveyResults } from "@/components/encuestas/survey-results";
import { useVentanilla } from "@/components/providers/ventanilla-provider";
import { PageHeader } from "@/components/shell/page-header";
import { RoleGate } from "@/components/shell/role-gate";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { formatDateTime } from "@/lib/ventanilla/rules";
import { exportSurveyXlsx } from "@/lib/ventanilla/survey-export";
import { SURVEY_CHANNEL_LABELS, SURVEY_REMINDER_LABELS } from "@/lib/ventanilla/surveys";
import { canManageSurveys } from "@/lib/ventanilla/users";

function LinkRow({ label, path, onCopy, copied }: { label: string; path: string; onCopy: () => void; copied: boolean }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="w-40 text-sm font-semibold">{label}</span>
      <code className="min-w-0 flex-1 truncate rounded-lg bg-muted px-3 py-2 font-mono text-xs">{path}</code>
      <Button variant="outline" size="sm" onClick={onCopy}>
        {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
        Copiar
      </Button>
      <Button asChild variant="ghost" size="sm">
        <Link href={path} target="_blank">
          <ExternalLink className="size-4" />
          Abrir
        </Link>
      </Button>
    </div>
  );
}

function SurveyDetail() {
  const { id } = useParams<{ id: string }>();
  const { state, dispatch, actor, log } = useVentanilla();
  const { toast } = useToast();
  const [copied, setCopied] = React.useState<string | null>(null);
  const [personal, setPersonal] = React.useState<string | null>(null);
  const survey = state.surveys.find((s) => s.id === id);
  if (!survey) return <p className="text-lg font-semibold">No encontramos esa encuesta.</p>;

  const path = `/encuesta/${survey.id}`;
  const copy = async (p: string) => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${p}`);
      setCopied(p);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      toast({ title: "Copia el enlace manualmente", description: `${window.location.origin}${p}` });
    }
  };

  const details = [
    survey.audienceDetail ? `${survey.audience}: ${survey.audienceDetail}` : survey.audience,
    survey.evaluates ? `evalúa ${survey.evaluates}` : null,
    survey.channels.map((c) => SURVEY_CHANNEL_LABELS[c]).join(", "),
    survey.anonymous ? "anónima" : "identificada",
    survey.closesAt ? `hasta ${formatDateTime(survey.closesAt)}` : null,
    survey.reminder && survey.reminder !== "ninguno" ? `recordatorio ${SURVEY_REMINDER_LABELS[survey.reminder].toLowerCase()}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="space-y-8 duration-500 animate-in fade-in">
      <Link href="/ventanilla/encuestas" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" />
        Encuestas
      </Link>
      <PageHeader
        title={survey.title}
        description={details}
        actions={
          <>
            {survey.status === "borrador" ? (
              <Button
                onClick={() => {
                  dispatch({ type: "publishSurvey", id: survey.id, actor });
                  toast({ title: "Encuesta publicada", description: `Invitaciones enviadas a ${survey.audience.toLowerCase()} por ${survey.channels.map((c) => SURVEY_CHANNEL_LABELS[c]).join(", ")}.` });
                }}
              >
                <Rocket className="size-4" />
                Publicar
              </Button>
            ) : null}
            {survey.status === "activa" ? (
              <Button variant="outline" onClick={() => dispatch({ type: "closeSurvey", id: survey.id, actor })}>
                <Lock className="size-4" />
                Cerrar encuesta
              </Button>
            ) : null}
            <Button
              variant="outline"
              disabled={survey.responses.length === 0}
              onClick={() => {
                exportSurveyXlsx(survey);
                log("Exportar encuesta", survey.title);
              }}
            >
              <FileSpreadsheet className="size-4" />
              Exportar Excel
            </Button>
          </>
        }
      />
      {survey.objective ? <p className="-mt-4 text-sm text-muted-foreground">Objetivo: {survey.objective}</p> : null}
      {survey.status === "activa" ? (
        <Card className="rounded-2xl">
          <CardContent className="space-y-3 p-4">
            <LinkRow label="Enlace general" path={path} onCopy={() => copy(path)} copied={copied === path} />
            {personal ? (
              <LinkRow label="Enlace personal (1 uso)" path={personal} onCopy={() => copy(personal)} copied={copied === personal} />
            ) : null}
            <div className="flex flex-wrap gap-2 pt-1">
              <Button variant="outline" size="sm" onClick={() => setPersonal(`${path}?t=${crypto.randomUUID().slice(0, 12)}`)}>
                <KeyRound className="size-4" />
                Generar enlace personal
              </Button>
              {survey.channels.includes("fisica") ? (
                <Button asChild variant="outline" size="sm">
                  <Link href={`${path}?captura=1`} target="_blank">
                    <ClipboardPen className="size-4" />
                    Digitar respuesta física
                  </Link>
                </Button>
              ) : null}
            </div>
            <p className="text-xs text-muted-foreground">
              El enlace general en tablet funciona como kiosco (varias respuestas anónimas). El enlace personal admite una sola respuesta.
            </p>
          </CardContent>
        </Card>
      ) : null}
      <SurveyResults survey={survey} />
    </div>
  );
}

export default function SurveyDetailPage() {
  return (
    <RoleGate allow={canManageSurveys}>
      <SurveyDetail />
    </RoleGate>
  );
}
