"use client";

import { NewSurveyDialog } from "@/components/encuestas/new-survey-dialog";
import { SurveyCard } from "@/components/encuestas/survey-card";
import { useVentanilla } from "@/components/providers/ventanilla-provider";
import { PageHeader } from "@/components/shell/page-header";
import { PageSkeleton } from "@/components/shell/page-skeleton";

export default function SurveysPage() {
  const { state, ready } = useVentanilla();
  if (!ready) return <PageSkeleton />;

  return (
    <div className="space-y-8 duration-500 animate-in fade-in">
      <PageHeader
        title="Encuestas"
        description="Mida la satisfacción con NPS y CSAT por web, WhatsApp o tablet en sitio."
        actions={<NewSurveyDialog />}
      />
      <div className="@container">
        <div className="grid gap-6 @2xl:grid-cols-2 @5xl:grid-cols-3">
          {state.surveys.map((s) => (
            <SurveyCard key={s.id} survey={s} />
          ))}
        </div>
      </div>
    </div>
  );
}
