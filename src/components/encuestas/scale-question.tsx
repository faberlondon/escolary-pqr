"use client";

import { cn } from "@/lib/utils";
import type { SurveyQuestion } from "@/lib/ventanilla/surveys";

const CSAT_LABELS = ["Muy en desacuerdo", "En desacuerdo", "Neutral", "De acuerdo", "Muy de acuerdo"];

interface ScaleQuestionProps {
  question: SurveyQuestion;
  index: number;
  value: number | undefined;
  onChange: (v: number) => void;
}

export function ScaleQuestion({ question, index, value, onChange }: ScaleQuestionProps) {
  const options = question.kind === "nps" ? Array.from({ length: 11 }, (_, i) => i) : [1, 2, 3, 4, 5];
  const legend =
    question.kind === "nps" ? ["0 · Nada probable", "10 · Muy probable"] : [CSAT_LABELS[0], CSAT_LABELS[4]];

  return (
    <fieldset className="space-y-3">
      <legend className="text-base font-semibold">
        <span className="mr-2 text-muted-foreground">{index}.</span>
        {question.text}
      </legend>
      <div className={cn("grid gap-1.5", question.kind === "nps" ? "grid-cols-6 sm:grid-cols-11" : "grid-cols-5")}>
        {options.map((o) => {
          const selected = value === o;
          return (
            <button
              key={o}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={question.kind === "csat" ? `${o} · ${CSAT_LABELS[o - 1]}` : String(o)}
              onClick={() => onChange(o)}
              className={cn(
                "h-12 rounded-xl border text-base font-bold tabular-nums transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                selected ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted"
              )}
            >
              {o}
            </button>
          );
        })}
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{legend[0]}</span>
        <span>{legend[1]}</span>
      </div>
    </fieldset>
  );
}
