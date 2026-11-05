import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  choiceDistribution,
  computeCsat,
  computeNps,
  openAnswers,
  responseRate,
  SURVEY_CHANNEL_LABELS,
  type Survey,
  type SurveyQuestion,
} from "@/lib/ventanilla/surveys";

const pct = (n: number): string => `${Math.round(n)}%`;
const Heading = ({ children }: { children: React.ReactNode }) => (
  <p className="mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">{children}</p>
);

function NpsBlock({ survey, q }: { survey: Survey; q: SurveyQuestion }) {
  const nps = computeNps(survey.responses, q.id);
  if (!nps) return null;
  const segments = [
    { label: "Promotores (9-10)", value: nps.promoters, className: "bg-emerald-600 dark:bg-emerald-400" },
    { label: "Pasivos (7-8)", value: nps.passives, className: "bg-muted-foreground/30" },
    { label: "Detractores (0-6)", value: nps.detractors, className: "bg-destructive" },
  ];
  return (
    <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
      <div className="shrink-0">
        <Heading>Net Promoter Score</Heading>
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

function Bar({ label, value, display }: { label: string; value: number; display: string }) {
  return (
    <li className="grid grid-cols-[minmax(0,1fr)_3.5rem] items-center gap-x-4 gap-y-1.5 border-t py-3 first:border-t-0 sm:grid-cols-[minmax(0,1fr)_10rem_3.5rem]">
      <span className="text-sm">{label}</span>
      <div className="order-3 col-span-2 h-2 overflow-hidden rounded-full bg-muted sm:order-none sm:col-span-1">
        <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, value)}%` }} />
      </div>
      <span className="text-right text-sm font-bold tabular-nums">{display}</span>
    </li>
  );
}

export function SurveyResults({ survey }: { survey: Survey }) {
  const nps = survey.questions.filter((q) => q.kind === "nps");
  const csat = survey.questions.filter((q) => q.kind === "csat");
  const choices = survey.questions.filter((q) => q.kind === "single" || q.kind === "multiple");
  const open = survey.questions.filter((q) => q.kind === "open");
  const rate = responseRate(survey);
  const byChannel = survey.responses.reduce<Record<string, number>>((acc, r) => {
    const k = r.channel ? SURVEY_CHANNEL_LABELS[r.channel] : "Sin canal";
    acc[k] = (acc[k] ?? 0) + 1;
    return acc;
  }, {});
  const comments = survey.responses.filter((r) => r.comment).slice(-5).reverse();

  return (
    <Card className="rounded-2xl">
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0">
        <CardTitle className="text-lg">Resultados</CardTitle>
        <p className="text-xs text-muted-foreground">
          {survey.responses.length} respuestas{rate !== null ? ` · tasa de respuesta ${rate}% de ${survey.target}` : ""}
          {Object.keys(byChannel).length ? ` · ${Object.entries(byChannel).map(([k, v]) => `${k} ${v}`).join(" · ")}` : ""}
        </p>
      </CardHeader>
      <CardContent className="space-y-8">
        {survey.responses.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Aún no hay respuestas. Publica la encuesta y comparte el enlace para empezar a recibirlas.
          </p>
        ) : (
          <>
            {nps.map((q) => (
              <NpsBlock key={q.id} survey={survey} q={q} />
            ))}
            {csat.length > 0 ? (
              <div>
                <Heading>CSAT por pregunta (1 a 5)</Heading>
                <ul>
                  {csat.map((q) => {
                    const avg = computeCsat(survey.responses, q.id);
                    return <Bar key={q.id} label={q.text} value={((avg ?? 0) / 5) * 100} display={avg?.toFixed(1).replace(".", ",") ?? "—"} />;
                  })}
                </ul>
              </div>
            ) : null}
            {choices.map((q) => (
              <div key={q.id}>
                <Heading>{q.text}</Heading>
                <ul>
                  {choiceDistribution(survey, q).map((d) => (
                    <Bar key={d.option} label={d.option} value={d.pct} display={pct(d.pct)} />
                  ))}
                </ul>
              </div>
            ))}
            {open.map((q) => {
              const items = openAnswers(survey, q).slice(-5).reverse();
              return items.length ? (
                <div key={q.id}>
                  <Heading>{q.text}</Heading>
                  <ul className="space-y-2">
                    {items.map((t, i) => (
                      <li key={i} className="rounded-xl bg-muted p-3 text-sm">
                        {t}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null;
            })}
            {comments.length ? (
              <div>
                <Heading>Comentarios recientes</Heading>
                <ul className="space-y-2">
                  {comments.map((r) => (
                    <li key={r.id} className="rounded-xl bg-muted p-3 text-sm">
                      {r.comment}
                      {r.radicado ? <span className="ml-2 font-mono text-xs text-primary">→ {r.radicado}</span> : null}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </>
        )}
      </CardContent>
    </Card>
  );
}
