import { DEFAULT_CONFIG } from "./config";
import { dueDateFor, formatRadicadoNumber } from "./rules";
import { DEFAULT_QUESTIONS, SURVEY_TEMPLATES, type Survey, type SurveyResponse } from "./surveys";
import { CHANNEL_LABELS } from "./types";
import type { Radicado, RadicadoEvent, RadicadoKind, RadicadoStatus } from "./types";

/**
 * Datos de ejemplo para la demo. Las fechas se calculan relativas a "ahora"
 * para que los semáforos de vencimiento se vean igual cualquier día.
 */

const DAY = 86_400_000;

/** Hash de relleno con forma de SHA-256 (solo datos de ejemplo). */
function fakeHash(seed: string): string {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i += 1) h = Math.imul(h ^ seed.charCodeAt(i), 16777619) >>> 0;
  let out = "";
  for (let i = 0; out.length < 64; i += 1) {
    h = Math.imul(h ^ (i + 0x9e3779b9), 16777619) >>> 0;
    out += h.toString(16).padStart(8, "0");
  }
  return out.slice(0, 64);
}

interface SeedSpec {
  kind: RadicadoKind;
  seq: number;
  daysAgo: number;
  status: RadicadoStatus;
  extra: Partial<Radicado> & Pick<Radicado, "subject" | "description" | "area" | "requester">;
  events?: Array<Omit<RadicadoEvent, "id" | "at"> & { hoursAfter: number }>;
}

function build(spec: SeedSpec, now: number): Radicado {
  const created = new Date(now - spec.daysAgo * DAY);
  created.setUTCHours(14 + (spec.seq % 6), (spec.seq * 7) % 60, 0, 0);
  const year = created.getUTCFullYear();
  const number = formatRadicadoNumber(DEFAULT_CONFIG.acronym, spec.kind, year, spec.seq);
  const createdAt = created.toISOString();
  const base: RadicadoEvent[] = [
    { id: `${number}-e0`, type: "radicated", at: createdAt, actor: "Sistema", detail: `Vía ${CHANNEL_LABELS[spec.extra.channel ?? "web"]}` },
    {
      id: `${number}-e1`,
      type: "ack_sent",
      at: createdAt,
      actor: "Sistema",
      detail: spec.extra.requester.anonymous ? "Código de radicado mostrado en pantalla" : "Acuse por correo y WhatsApp entregado",
    },
    { id: `${number}-e2`, type: "area_notified", at: createdAt, actor: "Sistema", detail: `Notificado a ${spec.extra.area}`, internal: true },
  ];
  const extra = (spec.events ?? []).map((e, i) => ({
    id: `${number}-x${i}`,
    type: e.type,
    actor: e.actor,
    detail: e.detail,
    internal: e.internal,
    key: e.key,
    // Eventos en horario laboral de Bogotá, al menos un día después de radicar.
    at: (() => {
      const d = new Date(created.getTime() + Math.max(1, Math.round(e.hoursAfter / 24)) * DAY);
      d.setUTCHours(13 + (i % 5), (i * 17 + 5) % 60, 0, 0);
      return d.toISOString();
    })(),
  }));
  return {
    id: number.toLowerCase(),
    number,
    kind: spec.kind,
    channel: "web",
    attachments: [],
    createdAt,
    dueAt: dueDateFor(spec.kind, created, spec.extra.petitionSubtype),
    recordHash: fakeHash(number),
    status: spec.status,
    events: [...base, ...extra],
    ...spec.extra,
  };
}

const COORD = "Inocencio Coronado";
const CONV = "Rafael Pushaina";
const SECRE = "Marta Villa";

const SPECS: SeedSpec[] = [
  {
    kind: "QUE", seq: 14, daysAgo: 18, status: "en_tramite",
    extra: {
      subject: "Trato en portería a la salida", area: "Coordinación de convivencia", channel: "whatsapp",
      assignee: CONV, assignedArea: "Coordinación de convivencia", involved: "Estudiantes de 8°B",
      description: "El viernes a la salida el vigilante de portería le habló de forma grosera a mi hijo y a otros estudiantes porque estaban esperando el transporte afuera. Solicito que se revise el protocolo de salida y se converse con el personal.",
      requester: { name: "Martha Ruiz", role: "acudiente", documentId: "52814773", email: "martha.ruiz@correo.co", detail: "Acudiente · 8°B", anonymous: false },
      attachments: [{ name: "foto_porteria.jpg", sizeBytes: 421_888, sha256: fakeHash("foto") }],
    },
    events: [
      { type: "assigned", actor: COORD, detail: `Asignado a ${CONV} · Coordinación de convivencia`, hoursAfter: 18 },
      { type: "note", actor: CONV, detail: "Se cita al personal de vigilancia para revisar el protocolo.", internal: true, hoursAfter: 40 },
    ],
  },
  {
    kind: "PET", seq: 9, daysAgo: 17, status: "en_tramite",
    extra: {
      subject: "Solicitud de certificado de estudios", area: "Secretaría", petitionSubtype: "informacion",
      assignee: SECRE, assignedArea: "Secretaría", involved: "Samuel Gómez (5°A)",
      description: "Solicito certificado de estudios de mi hijo Samuel Gómez (5°A) para trámite de subsidio familiar.",
      requester: { name: "Carlos Gómez", role: "acudiente", documentId: "1065432198", email: "cgomez@correo.co", detail: "Acudiente · 5°A", anonymous: false },
    },
    events: [{ type: "assigned", actor: COORD, detail: `Asignado a ${SECRE} · Secretaría`, hoursAfter: 20 }],
  },
  {
    kind: "PET", seq: 11, daysAgo: 5, status: "en_espera",
    extra: {
      subject: "Copia del observador del estudiante", area: "Coordinación de convivencia", petitionSubtype: "informacion",
      assignee: CONV, assignedArea: "Coordinación de convivencia", involved: "Valentina Oñate (7°A)",
      description: "Solicito copia del observador de mi hija para presentarlo en el nuevo colegio.",
      requester: { name: "Luz Oñate", role: "acudiente", documentId: "49771203", email: "luz.onate@correo.co", detail: "Acudiente · 7°A", anonymous: false },
    },
    events: [
      { type: "assigned", actor: COORD, detail: `Asignado a ${CONV} · Coordinación de convivencia`, hoursAfter: 4 },
      { type: "info_requested", actor: CONV, detail: "Se solicita al radicante: copia del documento de identidad del acudiente. El término queda suspendido.", hoursAfter: 30 },
    ],
  },
  {
    kind: "PET", seq: 10, daysAgo: 8, status: "trasladado",
    extra: {
      subject: "Cupo para hermano en otra sede", area: "Rectoría", transferredTo: "Secretaría de Educación Departamental",
      description: "Solicito cupo para mi otro hijo en una institución cerca de la vereda, porque aquí no hay grado 10°.",
      requester: { name: "José Villazón", role: "acudiente", documentId: "77190345", email: "jvillazon@correo.co", detail: "Acudiente · 9°B", anonymous: false },
    },
    events: [
      { type: "transferred", actor: COORD, detail: "Trasladado por competencia a Secretaría de Educación Departamental: la asignación de cupos la hace la Secretaría. Se notificó al peticionario.", hoursAfter: 26 },
    ],
  },
  {
    kind: "DOC", seq: 231, daysAgo: 2, status: "radicado",
    extra: {
      subject: "Acta reunión de área — octubre", area: "Coordinación académica", documentType: "Acta de reunión",
      group: "Área de matemáticas", period: "Periodo 4",
      description: "Acta de la reunión del área de matemáticas con compromisos del cuarto periodo.",
      requester: { name: "Luis Pérez", role: "docente", documentId: "84012345", email: "lperez@iews.edu.co", detail: "Docente · Matemáticas", anonymous: false },
      attachments: [{ name: "acta_area_matematicas_oct.pdf", sizeBytes: 1_258_291, sha256: fakeHash("acta") }],
    },
  },
  {
    kind: "DOC", seq: 230, daysAgo: 4, status: "recibido_conforme",
    extra: {
      lateDelivery: true, subject: "Planillas de asistencia periodo 4", area: "Coordinación académica", documentType: "Planilla de asistencia",
      group: "3°B", period: "Periodo 4",
      description: "Planillas de asistencia del grado 3°B, semanas 33 a 38.",
      requester: { name: "Ana Díaz", role: "docente", documentId: "56098712", email: "adiaz@iews.edu.co", detail: "Docente · 3°B", anonymous: false },
      attachments: [{ name: "asistencia_3B_p4.xlsx", sizeBytes: 88_064, sha256: fakeHash("asis") }],
    },
    events: [{ type: "accepted", actor: COORD, detail: "Recibido conforme", hoursAfter: 22 }],
  },
  {
    kind: "DOC", seq: 228, daysAgo: 9, status: "devuelto",
    extra: {
      subject: "Informe de rendimiento 9°A", area: "Coordinación académica", documentType: "Informe",
      group: "9°A", course: "Matemáticas", period: "Periodo 3",
      description: "Informe de rendimiento académico del grupo 9°A en matemáticas, tercer periodo.",
      requester: { name: "Luis Pérez", role: "docente", documentId: "84012345", email: "lperez@iews.edu.co", detail: "Docente · Matemáticas", anonymous: false },
      attachments: [{ name: "informe_9A_p3.docx", sizeBytes: 214_016, sha256: fakeHash("inf9a") }],
    },
    events: [{ type: "returned", actor: COORD, detail: "Falta el plan de mejoramiento para los estudiantes con desempeño bajo.", hoursAfter: 30 }],
  },
  {
    kind: "SUG", seq: 6, daysAgo: 1, status: "radicado",
    extra: {
      subject: "Más bebederos en el patio", area: "Rectoría",
      description: "En los descansos no alcanzan los bebederos del patio principal. Sugerimos instalar dos más.",
      requester: { name: "Anónimo", role: "estudiante", anonymous: true },
    },
  },
  {
    kind: "DOC", seq: 229, daysAgo: 6, status: "devuelto",
    extra: {
      subject: "Evidencias proyecto ambiental", area: "Coordinación académica", documentType: "Evidencias de trabajo",
      course: "Ciencias sociales",
      description: "Registro fotográfico y bitácora del proyecto ambiental escolar (PRAE).",
      requester: { name: "Jorge Mena", role: "docente", documentId: "72155480", email: "jmena@iews.edu.co", detail: "Docente · Sociales", anonymous: false },
      attachments: [{ name: "evidencias_prae.zip.pdf", sizeBytes: 3_670_016, sha256: fakeHash("prae") }],
    },
    events: [{ type: "returned", actor: COORD, detail: "Falta la bitácora firmada por los estudiantes líderes.", hoursAfter: 26 }],
  },
  {
    kind: "REC", seq: 3, daysAgo: 9, status: "respondido",
    extra: {
      subject: "Error en el boletín del tercer periodo", area: "Coordinación académica",
      assignee: COORD, assignedArea: "Coordinación académica", involved: "Sofía Arias (9°A)",
      description: "En el boletín de mi hija aparece una nota de 2.8 en inglés, pero la docente le confirmó 3.6.",
      requester: { name: "Patricia Arias", role: "acudiente", documentId: "39876543", email: "parias@correo.co", detail: "Acudiente · 9°A", anonymous: false },
      response: "Se verificó con la docente y se corrigió la nota a 3.6. El boletín actualizado está disponible en secretaría.",
      responseOutcome: "favorable",
    },
    events: [
      { type: "assigned", actor: COORD, detail: `Asignado a ${COORD} · Coordinación académica`, hoursAfter: 3 },
      { type: "answered", actor: COORD, detail: "Respuesta enviada al radicante", hoursAfter: 70 },
    ],
  },
  {
    kind: "QUE", seq: 12, daysAgo: 14, status: "respondido",
    extra: {
      subject: "Cobro de fotocopias para evaluaciones", area: "Rectoría", assignee: "Rosa Gil", assignedArea: "Rectoría",
      description: "Están cobrando a los estudiantes las fotocopias de las evaluaciones finales, siendo un colegio público.",
      requester: { name: "Anónimo", role: "acudiente", anonymous: true },
      response: "La institución no autoriza cobros por evaluaciones. Se impartió la instrucción a los docentes y se devolverá lo cobrado.",
      responseOutcome: "favorable",
    },
    events: [
      { type: "assigned", actor: COORD, detail: "Asignado a Rosa Gil · Rectoría", hoursAfter: 5 },
      { type: "answered", actor: "Rosa Gil", detail: "Respuesta publicada en la consulta por número", hoursAfter: 240 },
    ],
  },
  {
    kind: "PET", seq: 8, daysAgo: 20, status: "anulado",
    extra: {
      subject: "Solicitud duplicada de certificado", area: "Secretaría", petitionSubtype: "informacion",
      description: "Solicito certificado de estudios de mi hijo Samuel Gómez (5°A).",
      requester: { name: "Carlos Gómez", role: "acudiente", documentId: "1065432198", email: "cgomez@correo.co", detail: "Acudiente · 5°A", anonymous: false },
    },
    events: [{ type: "annulled", actor: COORD, detail: "Anulado: radicado duplicado por doble envío del formulario; se tramita en el consecutivo PET-000009.", hoursAfter: 4 }],
  },
  {
    kind: "FEL", seq: 4, daysAgo: 12, status: "cerrado",
    extra: {
      subject: "Reconocimiento a la docente de 2°A", area: "Rectoría",
      description: "Queremos felicitar a la profesora de 2°A por el acompañamiento en la feria de la ciencia.",
      requester: { name: "Diana López", role: "acudiente", documentId: "1122334455", email: "dlopez@correo.co", detail: "Acudiente · 2°A", anonymous: false },
      response: "Gracias por su mensaje. Lo compartimos con la docente y quedará en su hoja de vida.",
      responseOutcome: "informativa",
    },
    events: [
      { type: "answered", actor: COORD, detail: "Respuesta enviada al radicante", hoursAfter: 26 },
      { type: "closed", actor: "Sistema", detail: "Cerrado sin réplica", key: "auto-close", hoursAfter: 140 },
    ],
  },
];

export function seedRadicados(now: number = Date.now()): Radicado[] {
  return SPECS.map((s) => build(s, now)).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** Generador pseudoaleatorio determinista para respuestas de ejemplo. */
function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const OPEN_SAMPLES = [
  "Que respondan más rápido por WhatsApp.",
  "Mejorar la sala de espera de secretaría.",
  "Muy buena atención de la coordinadora.",
  "Publicar los horarios de atención en la portería.",
];

function sampleResponses(count: number, seed: number, now: number, channel: SurveyResponse["channel"]): SurveyResponse[] {
  const rnd = mulberry32(seed);
  const pick = (weights: number[], offset: number): number => {
    const total = weights.reduce((a, b) => a + b, 0);
    let r = rnd() * total;
    for (let i = 0; i < weights.length; i += 1) {
      r -= weights[i];
      if (r <= 0) return i + offset;
    }
    return weights.length - 1 + offset;
  };
  return Array.from({ length: count }, (_, i) => ({
    id: `resp-${seed}-${i}`,
    at: new Date(now - rnd() * 14 * DAY).toISOString(),
    channel,
    answers: {
      nps: pick([2, 1, 1, 2, 2, 3, 4, 13, 16, 26, 30], 0),
      q1: pick([2, 4, 10, 40, 44], 1),
      q2: pick([6, 12, 22, 34, 26], 1),
      q3: pick([4, 7, 15, 40, 34], 1),
      ...(i % 9 === 0 ? { q4: OPEN_SAMPLES[i % OPEN_SAMPLES.length] } : {}),
    },
  }));
}

function climaResponses(count: number, now: number): SurveyResponse[] {
  const rnd = mulberry32(99);
  const [, , c3, c4] = SURVEY_TEMPLATES[1].questions;
  return Array.from({ length: count }, (_, i) => ({
    id: `clima-${i}`,
    at: new Date(now - rnd() * 10 * DAY).toISOString(),
    channel: "web",
    answers: {
      c1: 2 + Math.floor(rnd() * 4),
      c2: 1 + Math.floor(rnd() * 5),
      c3: c3.options![Math.floor(rnd() * 4)],
      c4: c4.options!.filter(() => rnd() > 0.6),
    },
  }));
}

export function seedSurveys(now: number = Date.now()): Survey[] {
  return [
    {
      id: "satisfaccion-2026", title: "Satisfacción con la atención 2026", audience: "Acudientes",
      objective: "Medir la satisfacción de las familias con la atención y la respuesta a PQRSF.",
      evaluates: "Secretaría", channels: ["whatsapp", "web"], status: "activa", anonymous: false, target: 300,
      reminder: "semanal", closesAt: new Date(now + 15 * DAY).toISOString(),
      questions: SURVEY_TEMPLATES[0].questions,
      responses: sampleResponses(186, 7, now, "whatsapp"),
    },
    {
      id: "atencion-secretaria", title: "Atención en secretaría", audience: "Visitantes",
      objective: "Calificar la atención presencial al salir de la oficina.",
      evaluates: "Secretaría", channels: ["tablet"], status: "activa", anonymous: true,
      questions: [DEFAULT_QUESTIONS[0], DEFAULT_QUESTIONS[2]],
      responses: sampleResponses(94, 21, now, "tablet"),
    },
    {
      id: "clima-escolar", title: "Clima escolar estudiantes", audience: "Estudiantes",
      objective: "Identificar espacios de riesgo para la convivencia.",
      evaluates: "Coordinación de convivencia", channels: ["web", "tablet"], status: "activa", anonymous: true, target: 120,
      questions: SURVEY_TEMPLATES[1].questions,
      responses: climaResponses(64, now),
    },
    {
      id: "clima-docente", title: "Clima laboral docente", audience: "Docentes",
      channels: ["web"], status: "borrador", anonymous: true, target: 60,
      questions: [
        { id: "nps", text: "¿Recomendaría la institución como lugar de trabajo?", kind: "nps" },
        { id: "q1", text: "Recibo la información institucional a tiempo", kind: "csat" },
      ],
      responses: [],
    },
  ];
}
