"use client";

import { FolderUp, Heart, HelpCircle, Lightbulb, MessageSquareWarning, Scale } from "lucide-react";

import { cn } from "@/lib/utils";
import type { RadicadoKind } from "@/lib/ventanilla/types";

const OPTIONS: Array<{ kind: RadicadoKind; label: string; hint: string; icon: typeof FolderUp }> = [
  { kind: "DOC", label: "Documento docente", hint: "Actas, asistencias, informes", icon: FolderUp },
  { kind: "PET", label: "Petición", hint: "Solicitar algo o información", icon: HelpCircle },
  { kind: "QUE", label: "Queja", hint: "Inconformidad con una persona", icon: MessageSquareWarning },
  { kind: "REC", label: "Reclamo", hint: "Inconformidad con un servicio", icon: Scale },
  { kind: "SUG", label: "Sugerencia", hint: "Propuesta de mejora", icon: Lightbulb },
  { kind: "FEL", label: "Felicitación", hint: "Reconocer algo positivo", icon: Heart },
];

interface KindPickerProps {
  value: RadicadoKind;
  onChange: (kind: RadicadoKind) => void;
}

export function KindPicker({ value, onChange }: KindPickerProps) {
  return (
    <div role="radiogroup" aria-label="¿Qué quieres radicar?" className="@container">
      <div className="grid grid-cols-2 gap-2 @lg:grid-cols-3">
        {OPTIONS.map(({ kind, label, hint, icon: Icon }) => {
          const selected = value === kind;
          return (
            <button
              key={kind}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(kind)}
              className={cn(
                "flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                selected ? "border-primary bg-primary/5 text-primary" : "hover:bg-muted/60"
              )}
            >
              <Icon className="size-5" />
              <span className="text-sm font-semibold">{label}</span>
              <span className={cn("text-xs", selected ? "text-primary/80" : "text-muted-foreground")}>{hint}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
