import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { computeCsat, computeNps } from "@/lib/ventanilla/surveys";
import type { Survey } from "@/lib/ventanilla/surveys";

const pct = (n: number): string => `${Math.round(n)}%`;

function NpsBlock({ survey }: { survey: Survey }) {
  const q = survey.questions.find((x) => x.kind === "nps");
  const nps = q ? computeNps(survey.responses, q.id) : null;
  if (!q || !nps) return null;
  const segments = [
    { label: "Promotores (9-10)", value: nps.promoters, className: "bg-emerald-600 dark:bg-emerald-400" },
    { label: "Pasivos (7-8)", value: nps.passives, className: "bg-muted-foreground/30" },
    { label: "Detractores (0-6)", value: nps.detractors, className: "bg-destructive" },
  ];
  return (
    <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
      <div className="shrink-0">
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Net Promoter Score</p>
        <p className="text-5xl font-black tabular-nums tracking-tight">
          {nps.score > 0 ? "+" : ""}
          {nps.score}
        </p>
        <p className="text-xs text-muted-foreground">Escala −100 a +100 · {nps.total} respuestas</p>
      </div>
      <div className="min-w-0 flex-1 space-y-2">
        <p className="text-sm text-muted-foreground">{q.text}</p>
        <div className="flex h-3.5 overflow-hidden rounded-full bg-muted" role="img" aria-label="Distribución de promotores, pasivos y detractores">
          {segments.map((s) => (
            <div key={s.label} className={s.className} style={{ width: `${s.value}%` }} />
          ))}
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          {segments.map((s) => (
            <span key={s.label} className="inline-flex items-center gap-1.5">
              <span className={`size-2.5 rounded-sm ${s.className}`} />
              {s.label} <span className="font-semibold tabular-nums text-foreground">{pct(s.value)}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export function SurveyResults({ survey }: { survey: Survey }) {
  const csatQuestions = survey.questions.filter((q) => q.kind === "csat");

  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle className="text-lg">Resultados</CardTitle>
      </CardHeader>
      <CardContent className="space-y-8">
        {survey.responses.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Aún no hay respuestas. Publica la encuesta y comparte el enlace para empezar a recibirlas.
          </p>
        ) : (
          <>
            <NpsBlock survey={survey} />
            {csatQuestions.length > 0 ? (
              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">CSAT por pregunta (1 a 5)</p>
                <ul>
                  {csatQuestions.map((q) => {
                    const avg = computeCsat(survey.responses, q.id);
                    return (
                      <li key={q.id} className="grid grid-cols-[minmax(0,1fr)_3rem] items-center gap-x-4 gap-y-1.5 border-t py-3 first:border-t-0 sm:grid-cols-[minmax(0,1fr)_10rem_3rem]">
                        <span className="text-sm">{q.text}</span>
                        <div className="order-3 col-span-2 h-2 overflow-hidden rounded-full bg-muted sm:order-none sm:col-span-1">
                          <div className="h-full rounded-full bg-primary" style={{ width: `${((avg ?? 0) / 5) * 100}%` }} />
                        </div>
                        <span className="text-right text-sm font-bold tabular-nums">{avg?.toFixed(1).replace(".", ",") ?? "—"}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ) : null}
          </>
        )}
      </CardContent>
    </Card>
  );
}
