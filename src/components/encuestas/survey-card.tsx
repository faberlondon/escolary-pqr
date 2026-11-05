import Link from "next/link";

import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Pill } from "@/components/ventanilla/status-badge";
import { computeNps, SURVEY_CHANNEL_LABELS } from "@/lib/ventanilla/surveys";
import type { Survey } from "@/lib/ventanilla/surveys";

const STATUS_TONE = { activa: "success", borrador: "primary", cerrada: "muted" } as const;
const STATUS_LABEL = { activa: "Activa", borrador: "Borrador", cerrada: "Cerrada" } as const;

export function SurveyCard({ survey }: { survey: Survey }) {
  const count = survey.responses.length;
  const nps = computeNps(survey.responses, "nps");
  const progress = survey.target ? Math.min(100, Math.round((count / survey.target) * 100)) : null;

  return (
    <Link href={`/ventanilla/encuestas/${survey.id}`} className="group block rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
      <Card className="flex h-full flex-col gap-4 rounded-2xl p-5 transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Pill tone={STATUS_TONE[survey.status]}>{STATUS_LABEL[survey.status]}</Pill>
          <div className="flex flex-wrap gap-1">
            {survey.channels.map((c) => (
              <span key={c} className="rounded-md bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">
                {SURVEY_CHANNEL_LABELS[c]}
              </span>
            ))}
          </div>
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-bold">{survey.title}</h3>
          <p className="text-xs text-muted-foreground">
            {survey.audience} · {survey.anonymous ? "anónima" : "identificada"} · {survey.questions.length} preguntas
          </p>
        </div>
        <div className="mt-auto space-y-2">
          {progress !== null ? <Progress value={progress} className="h-2" /> : null}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="tabular-nums">
              {count} respuestas{survey.target ? ` de ${survey.target}` : ""}
            </span>
            {nps ? (
              <span className="font-bold tabular-nums text-foreground">
                NPS {nps.score > 0 ? "+" : ""}
                {nps.score}
              </span>
            ) : null}
          </div>
        </div>
      </Card>
    </Link>
  );
}
