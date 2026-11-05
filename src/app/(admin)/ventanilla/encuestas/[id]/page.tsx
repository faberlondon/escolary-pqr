"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Check, Copy, ExternalLink, FileSpreadsheet, Rocket } from "lucide-react";

import { SurveyResults } from "@/components/encuestas/survey-results";
import { useVentanilla } from "@/components/providers/ventanilla-provider";
import { PageHeader } from "@/components/shell/page-header";
import { PageSkeleton } from "@/components/shell/page-skeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { exportSurveyXlsx } from "@/lib/ventanilla/survey-export";
import { SURVEY_CHANNEL_LABELS } from "@/lib/ventanilla/surveys";

export default function SurveyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { state, ready, dispatch } = useVentanilla();
  const { toast } = useToast();
  const [copied, setCopied] = React.useState(false);
  if (!ready) return <PageSkeleton />;
  const survey = state.surveys.find((s) => s.id === id);
  if (!survey) return <p className="text-lg font-semibold">No encontramos esa encuesta.</p>;

  const path = `/encuesta/${survey.id}`;
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${path}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "Copia el enlace manualmente", description: `${window.location.origin}${path}` });
    }
  };

  return (
    <div className="space-y-8 duration-500 animate-in fade-in">
      <Link href="/ventanilla/encuestas" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" />
        Encuestas
      </Link>
      <PageHeader
        title={survey.title}
        description={`${survey.audience} · ${survey.channels.map((c) => SURVEY_CHANNEL_LABELS[c]).join(", ")} · ${survey.anonymous ? "anónima" : "identificada"}`}
        actions={
          <>
            {survey.status === "borrador" ? (
              <Button onClick={() => dispatch({ type: "publishSurvey", id: survey.id })}>
                <Rocket className="size-4" />
                Publicar
              </Button>
            ) : null}
            <Button variant="outline" disabled={survey.responses.length === 0} onClick={() => exportSurveyXlsx(survey)}>
              <FileSpreadsheet className="size-4" />
              Exportar Excel
            </Button>
          </>
        }
      />
      {survey.status === "activa" ? (
        <Card className="rounded-2xl">
          <CardContent className="flex flex-wrap items-center gap-3 p-4">
            <span className="text-sm font-semibold">Enlace para responder</span>
            <code className="min-w-0 flex-1 truncate rounded-lg bg-muted px-3 py-2 font-mono text-xs">{path}</code>
            <Button variant="outline" size="sm" onClick={copyLink}>
              {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
              Copiar
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link href={path} target="_blank">
                <ExternalLink className="size-4" />
                Abrir
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}
      <SurveyResults survey={survey} />
    </div>
  );
}
