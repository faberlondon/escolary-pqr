"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { AnswerValue, SurveyQuestion } from "@/lib/ventanilla/surveys";

interface ChoiceQuestionProps {
  question: SurveyQuestion;
  index: number;
  value: AnswerValue | undefined;
  onChange: (v: AnswerValue) => void;
}

/** Preguntas de selección única, múltiple y abierta (UC-ENC-08). */
export function ChoiceQuestion({ question, index, value, onChange }: ChoiceQuestionProps) {
  const legend = (
    <legend className="text-base font-semibold">
      <span className="mr-2 text-muted-foreground">{index}.</span>
      {question.text}
      {question.kind === "open" ? <span className="ml-2 text-xs font-normal text-muted-foreground">(opcional)</span> : null}
      {question.kind === "multiple" ? <span className="ml-2 text-xs font-normal text-muted-foreground">(puedes marcar varias)</span> : null}
    </legend>
  );

  if (question.kind === "open") {
    return (
      <fieldset className="space-y-3">
        {legend}
        <Textarea
          aria-label={question.text}
          rows={3}
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value)}
          className="text-base sm:text-sm"
        />
      </fieldset>
    );
  }

  const options = question.options ?? [];
  if (question.kind === "multiple") {
    const selected = Array.isArray(value) ? value : [];
    return (
      <fieldset className="space-y-3">
        {legend}
        <div className="grid gap-2 sm:grid-cols-2">
          {options.map((o) => (
            <label key={o} className="flex items-center gap-3 rounded-xl border p-3 text-sm hover:bg-muted/60">
              <Checkbox
                checked={selected.includes(o)}
                onCheckedChange={(v) => onChange(v === true ? [...selected, o] : selected.filter((x) => x !== o))}
              />
              {o}
            </label>
          ))}
        </div>
      </fieldset>
    );
  }

  return (
    <fieldset className="space-y-3">
      {legend}
      <div role="radiogroup" aria-label={question.text} className="grid gap-2 sm:grid-cols-2">
        {options.map((o) => {
          const on = value === o;
          return (
            <button
              key={o}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => onChange(o)}
              className={cn(
                "rounded-xl border p-3 text-left text-sm font-medium transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                on ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted"
              )}
            >
              {o}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
