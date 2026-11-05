"use client";

import { NewSurveyDialog } from "@/components/encuestas/new-survey-dialog";
import { SurveyCard } from "@/components/encuestas/survey-card";
import { useVentanilla } from "@/components/providers/ventanilla-provider";
import { PageHeader } from "@/components/shell/page-header";
import { RoleGate } from "@/components/shell/role-gate";
import { canManageSurveys } from "@/lib/ventanilla/users";

function SurveysContent() {
  const { state } = useVentanilla();

  return (
    <div className="space-y-8 duration-500 animate-in fade-in">
      <PageHeader
        title="Encuestas"
        description="NPS, CSAT y preguntas cerradas o abiertas por web, WhatsApp, tablet en sitio o captura física."
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

export default function SurveysPage() {
  return (
    <RoleGate allow={canManageSurveys}>
      <SurveysContent />
    </RoleGate>
  );
}
