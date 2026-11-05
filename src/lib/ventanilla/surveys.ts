export type QuestionKind = "nps" | "csat";

export interface SurveyQuestion {
  id: string;
  text: string;
  kind: QuestionKind;
}

export const SURVEY_CHANNELS = ["web", "whatsapp", "tablet"] as const;
export type SurveyChannel = (typeof SURVEY_CHANNELS)[number];

export const SURVEY_CHANNEL_LABELS: Record<SurveyChannel, string> = {
  web: "Web",
  whatsapp: "WhatsApp",
  tablet: "Tablet en sitio",
};

export const SURVEY_AUDIENCES = ["Acudientes", "Estudiantes", "Docentes", "Visitantes"] as const;
export type SurveyAudience = (typeof SURVEY_AUDIENCES)[number];

export type SurveyStatus = "activa" | "borrador" | "cerrada";

export interface SurveyResponse {
  id: string;
  at: string;
  answers: Record<string, number>;
  comment?: string;
}

export interface Survey {
  id: string;
  title: string;
  audience: SurveyAudience;
  channels: SurveyChannel[];
  status: SurveyStatus;
  anonymous: boolean;
  closesAt?: string;
  target?: number;
  questions: SurveyQuestion[];
  responses: SurveyResponse[];
}

export const DEFAULT_QUESTIONS: SurveyQuestion[] = [
  { id: "nps", text: "¿Qué tan probable es que recomiende la institución a otra familia?", kind: "nps" },
  { id: "q1", text: "La información que recibe del colegio es clara", kind: "csat" },
  { id: "q2", text: "La atención en secretaría es oportuna", kind: "csat" },
  { id: "q3", text: "Las PQRSF se responden a tiempo", kind: "csat" },
];

export interface NpsBreakdown {
  score: number;
  promoters: number;
  passives: number;
  detractors: number;
  total: number;
}

/** NPS = % promotores (9-10) − % detractores (0-6), redondeado a entero. */
export function computeNps(responses: readonly SurveyResponse[], questionId: string): NpsBreakdown | null {
  const values = responses.map((r) => r.answers[questionId]).filter((v): v is number => typeof v === "number");
  if (values.length === 0) return null;
  const promoters = values.filter((v) => v >= 9).length;
  const detractors = values.filter((v) => v <= 6).length;
  const passives = values.length - promoters - detractors;
  const pct = (n: number): number => (n / values.length) * 100;
  return {
    score: Math.round(pct(promoters) - pct(detractors)),
    promoters: pct(promoters),
    passives: pct(passives),
    detractors: pct(detractors),
    total: values.length,
  };
}

/** Promedio CSAT (1 a 5) con un decimal; null si no hay respuestas. */
export function computeCsat(responses: readonly SurveyResponse[], questionId: string): number | null {
  const values = responses.map((r) => r.answers[questionId]).filter((v): v is number => typeof v === "number");
  if (values.length === 0) return null;
  return Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10;
}
