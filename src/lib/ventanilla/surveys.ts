export type QuestionKind = "nps" | "csat" | "single" | "multiple" | "open";

export const QUESTION_KIND_LABELS: Record<QuestionKind, string> = {
  nps: "NPS (0 a 10)",
  csat: "CSAT (1 a 5)",
  single: "Selección única",
  multiple: "Selección múltiple",
  open: "Abierta",
};

export interface SurveyQuestion {
  id: string;
  text: string;
  kind: QuestionKind;
  /** Opciones de las preguntas de selección. */
  options?: string[];
}

export const SURVEY_CHANNELS = ["web", "whatsapp", "tablet", "fisica"] as const;
export type SurveyChannel = (typeof SURVEY_CHANNELS)[number];

export const SURVEY_CHANNEL_LABELS: Record<SurveyChannel, string> = {
  web: "Web",
  whatsapp: "WhatsApp",
  tablet: "Tablet en sitio",
  fisica: "Captura física digitada",
};

export const SURVEY_AUDIENCES = ["Acudientes", "Estudiantes", "Docentes", "Visitantes", "Grupo específico"] as const;
export type SurveyAudience = (typeof SURVEY_AUDIENCES)[number];

export const SURVEY_REMINDERS = ["ninguno", "cada3", "semanal"] as const;
export type SurveyReminder = (typeof SURVEY_REMINDERS)[number];
export const SURVEY_REMINDER_LABELS: Record<SurveyReminder, string> = {
  ninguno: "Sin recordatorios",
  cada3: "Cada 3 días",
  semanal: "Semanal",
};

export type SurveyStatus = "activa" | "borrador" | "cerrada";

export type AnswerValue = number | string | string[];

export interface SurveyResponse {
  id: string;
  at: string;
  answers: Record<string, AnswerValue>;
  comment?: string;
  channel?: SurveyChannel;
  /** Radicado generado si el encuestado pidió tramitar su comentario como PQRSF (UC-ENC-09). */
  radicado?: string;
}

export interface Survey {
  id: string;
  title: string;
  objective?: string;
  audience: SurveyAudience;
  /** Grupo específico cuando el público es "Grupo específico". */
  audienceDetail?: string;
  /** Docente o área evaluada, para reportar por docente/área. */
  evaluates?: string;
  channels: SurveyChannel[];
  status: SurveyStatus;
  anonymous: boolean;
  startsAt?: string;
  closesAt?: string;
  reminder?: SurveyReminder;
  target?: number;
  questions: SurveyQuestion[];
  responses: SurveyResponse[];
  /**
   * Huellas de enlaces personales ya usados: un enlace personal admite una sola respuesta.
   * Se guardan aparte de las respuestas para no vincularlas con personas (RN-10).
   */
  usedTokens?: string[];
  publishedAt?: string;
}

export const DEFAULT_QUESTIONS: SurveyQuestion[] = [
  { id: "nps", text: "¿Qué tan probable es que recomiende la institución a otra familia?", kind: "nps" },
  { id: "q1", text: "La información que recibe del colegio es clara", kind: "csat" },
  { id: "q2", text: "La atención en secretaría es oportuna", kind: "csat" },
  { id: "q3", text: "Las PQRSF se responden a tiempo", kind: "csat" },
];

export interface SurveyTemplate {
  id: string;
  name: string;
  description: string;
  questions: SurveyQuestion[];
}

/** Plantillas de UC-ENC-08 (alterno): satisfacción de atención, clima escolar y evaluación de servicio. */
export const SURVEY_TEMPLATES: SurveyTemplate[] = [
  {
    id: "atencion",
    name: "Satisfacción de atención",
    description: "1 NPS, 3 CSAT y una abierta",
    questions: [...DEFAULT_QUESTIONS, { id: "q4", text: "¿Qué deberíamos mejorar en la atención?", kind: "open" }],
  },
  {
    id: "clima",
    name: "Clima escolar",
    description: "Convivencia y seguridad, con selección única y múltiple",
    questions: [
      { id: "c1", text: "Me siento seguro(a) dentro de la institución", kind: "csat" },
      { id: "c2", text: "La convivencia entre estudiantes es respetuosa", kind: "csat" },
      {
        id: "c3",
        text: "¿Con qué frecuencia presencia situaciones de acoso escolar?",
        kind: "single",
        options: ["Nunca", "Rara vez", "A veces", "Con frecuencia"],
      },
      {
        id: "c4",
        text: "¿Qué espacios considera que necesitan más acompañamiento?",
        kind: "multiple",
        options: ["Patio", "Portería", "Baños", "Restaurante escolar", "Transporte"],
      },
      { id: "c5", text: "Cuéntenos una propuesta para mejorar la convivencia", kind: "open" },
    ],
  },
  {
    id: "servicio",
    name: "Evaluación de servicio",
    description: "Evalúa un área o docente con CSAT y recomendación",
    questions: [
      { id: "s1", text: "El servicio recibido resolvió su necesidad", kind: "csat" },
      { id: "s2", text: "El tiempo de atención fue adecuado", kind: "csat" },
      { id: "s3", text: "El trato fue amable y respetuoso", kind: "csat" },
      { id: "nps", text: "¿Recomendaría este servicio a otra persona?", kind: "nps" },
    ],
  },
];

export interface NpsBreakdown {
  score: number;
  promoters: number;
  passives: number;
  detractors: number;
  total: number;
}

const numericAnswers = (responses: readonly SurveyResponse[], questionId: string): number[] =>
  responses.map((r) => r.answers[questionId]).filter((v): v is number => typeof v === "number");

/** NPS = % promotores (9-10) − % detractores (0-6), redondeado a entero. */
export function computeNps(responses: readonly SurveyResponse[], questionId: string): NpsBreakdown | null {
  const values = numericAnswers(responses, questionId);
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
  const values = numericAnswers(responses, questionId);
  if (values.length === 0) return null;
  return Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10;
}

/** Promedio de todas las preguntas CSAT de la encuesta. */
export function overallCsat(survey: Survey): number | null {
  const avgs = survey.questions
    .filter((q) => q.kind === "csat")
    .map((q) => computeCsat(survey.responses, q.id))
    .filter((v): v is number => v !== null);
  if (avgs.length === 0) return null;
  return Math.round((avgs.reduce((a, b) => a + b, 0) / avgs.length) * 10) / 10;
}

/** Conteo por opción en preguntas de selección (porcentaje sobre quienes respondieron la pregunta). */
export function choiceDistribution(survey: Survey, q: SurveyQuestion): Array<{ option: string; count: number; pct: number }> {
  const answered = survey.responses.map((r) => r.answers[q.id]).filter((v) => v !== undefined && v !== "");
  return (q.options ?? []).map((option) => {
    const count = answered.filter((v) => (Array.isArray(v) ? v.includes(option) : v === option)).length;
    return { option, count, pct: answered.length ? (count / answered.length) * 100 : 0 };
  });
}

export function openAnswers(survey: Survey, q: SurveyQuestion): string[] {
  return survey.responses
    .map((r) => r.answers[q.id])
    .filter((v): v is string => typeof v === "string" && v.trim().length > 0);
}

export const responseRate = (s: Survey): number | null =>
  s.target ? Math.min(100, Math.round((s.responses.length / s.target) * 100)) : null;

export const isAnswerable = (s: Survey, now: Date): boolean =>
  s.status === "activa" && (!s.closesAt || new Date(s.closesAt) >= now) && (!s.startsAt || new Date(s.startsAt) <= now);

export function formatAnswer(v: AnswerValue | undefined): string | number {
  if (v === undefined) return "";
  return Array.isArray(v) ? v.join(", ") : v;
}
