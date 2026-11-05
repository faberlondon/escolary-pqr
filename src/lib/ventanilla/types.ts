import { z } from "zod";

/** Tipología del radicado. El código va dentro del número de radicado. */
export const RADICADO_KINDS = ["DOC", "PET", "QUE", "REC", "SUG", "FEL"] as const;
export type RadicadoKind = (typeof RADICADO_KINDS)[number];

export const KIND_LABELS: Record<RadicadoKind, string> = {
  DOC: "Documento",
  PET: "Petición",
  QUE: "Queja",
  REC: "Reclamo",
  SUG: "Sugerencia",
  FEL: "Felicitación",
};

/** Subtipo de petición: define el plazo legal (Ley 1755 de 2015, art. 14). */
export const PETITION_SUBTYPES = ["general", "informacion", "consulta"] as const;
export type PetitionSubtype = (typeof PETITION_SUBTYPES)[number];

export const PETITION_SUBTYPE_LABELS: Record<PetitionSubtype, string> = {
  general: "Petición general",
  informacion: "Solicitud de documentos o información",
  consulta: "Consulta",
};

export const REQUESTER_ROLES = ["docente", "acudiente", "estudiante", "administrativo", "ciudadano"] as const;
export type RequesterRole = (typeof REQUESTER_ROLES)[number];

export const REQUESTER_ROLE_LABELS: Record<RequesterRole, string> = {
  docente: "Docente",
  acudiente: "Padre o acudiente",
  estudiante: "Estudiante",
  administrativo: "Administrativo",
  ciudadano: "Otro / ciudadano",
};

export const PERIODS = ["Periodo 1", "Periodo 2", "Periodo 3", "Periodo 4"] as const;

export const CHANNELS = ["web", "whatsapp", "presencial", "telefonico"] as const;
export type Channel = (typeof CHANNELS)[number];

export const CHANNEL_LABELS: Record<Channel, string> = {
  web: "Portal web",
  whatsapp: "WhatsApp",
  presencial: "Presencial",
  telefonico: "Telefónico",
};

export type RadicadoStatus =
  | "radicado"
  | "asignado"
  | "en_tramite"
  | "prorrogado"
  | "en_espera"
  | "trasladado"
  | "respondido"
  | "cerrado"
  | "recibido_conforme"
  | "devuelto"
  | "anulado";

export const STATUS_LABELS: Record<RadicadoStatus, string> = {
  radicado: "Radicado",
  asignado: "Asignado",
  en_tramite: "En trámite",
  prorrogado: "Prorrogado",
  en_espera: "En espera de información",
  trasladado: "Trasladado",
  respondido: "Respondido",
  cerrado: "Cerrado",
  recibido_conforme: "Recibido conforme",
  devuelto: "Devuelto con observaciones",
  anulado: "Anulado",
};

export type EventType =
  | "radicated"
  | "ack_sent"
  | "area_notified"
  | "assigned"
  | "note"
  | "extended"
  | "info_requested"
  | "info_received"
  | "transferred"
  | "answered"
  | "closed"
  | "accepted"
  | "returned"
  | "annulled"
  | "due_alert";

export interface RadicadoEvent {
  id: string;
  type: EventType;
  at: string;
  actor: string;
  detail?: string;
  /** Las notas internas nunca se muestran al radicante (RN-08). */
  internal?: boolean;
  /** Llave de idempotencia de eventos automáticos (alertas, cierre). */
  key?: string;
}

export interface Attachment {
  name: string;
  sizeBytes: number;
  sha256: string;
}

export interface Requester {
  name: string;
  role: RequesterRole;
  /** Número de documento: con él y el radicado se consulta el estado (UC-ENC-06). */
  documentId?: string;
  email?: string;
  phone?: string;
  detail?: string;
  anonymous: boolean;
}

export const RESPONSE_OUTCOMES = ["favorable", "parcial", "negada", "informativa"] as const;
export type ResponseOutcome = (typeof RESPONSE_OUTCOMES)[number];
export const RESPONSE_OUTCOME_LABELS: Record<ResponseOutcome, string> = {
  favorable: "Favorable",
  parcial: "Parcialmente favorable",
  negada: "Negada",
  informativa: "Informativa",
};

/** Registro inmutable: tras radicar solo crecen `events` y los campos de gestión (RN-02). */
export interface Radicado {
  id: string;
  number: string;
  kind: RadicadoKind;
  documentType?: string;
  petitionSubtype?: PetitionSubtype;
  subject: string;
  description: string;
  /** Área destinataria elegida al radicar. */
  area: string;
  /** Documentos docentes: grupo, asignatura y periodo si aplica. */
  group?: string;
  course?: string;
  period?: string;
  /** PQRSF: estudiante o grupo involucrado (dato sensible, RN-11). */
  involved?: string;
  /** Corrección de un documento devuelto (A3): número del radicado original. */
  linkedTo?: string;
  channel: Channel;
  requester: Requester;
  attachments: Attachment[];
  createdAt: string;
  dueAt?: string;
  lateDelivery?: boolean;
  recordHash: string;
  // --- Gestión (cambia por eventos, nunca el contenido radicado) ---
  assignee?: string;
  assignedArea?: string;
  status: RadicadoStatus;
  response?: string;
  responseOutcome?: ResponseOutcome;
  responseAttachments?: Attachment[];
  transferredTo?: string;
  events: RadicadoEvent[];
}

export const radicarFormSchema = z
  .object({
    kind: z.enum(RADICADO_KINDS),
    documentType: z.string().optional(),
    petitionSubtype: z.enum(PETITION_SUBTYPES).optional(),
    area: z.string().min(1, "Selecciona el área"),
    group: z.string().trim().max(40).optional(),
    course: z.string().trim().max(60).optional(),
    period: z.string().optional(),
    involved: z.string().trim().max(120).optional(),
    role: z.enum(REQUESTER_ROLES),
    anonymous: z.boolean(),
    name: z.string().trim().max(120).optional(),
    documentId: z.string().trim().max(20).optional(),
    email: z.string().trim().email("Correo no válido").optional().or(z.literal("")),
    phone: z.string().trim().max(20).optional(),
    subject: z.string().trim().min(5, "Escribe un asunto de al menos 5 caracteres").max(140),
    description: z.string().trim().min(10, "Describe tu solicitud (mínimo 10 caracteres)").max(4000),
    habeasData: z.boolean().refine((v) => v, "Debes aceptar la política de tratamiento de datos"),
    /** Campo trampa contra bots (RNF-08): debe quedar vacío. */
    website: z.string().max(0).optional(),
  })
  .superRefine((v, ctx) => {
    if (v.kind === "DOC" && !v.documentType) {
      ctx.addIssue({ code: "custom", path: ["documentType"], message: "Selecciona el tipo de documento" });
    }
    if (v.kind === "DOC" && v.role !== "docente") {
      ctx.addIssue({ code: "custom", path: ["role"], message: "Solo docentes radican documentos institucionales" });
    }
    const anonymousAllowed = v.kind === "QUE" || v.kind === "REC" || v.kind === "SUG";
    if (v.anonymous && !anonymousAllowed) {
      ctx.addIssue({ code: "custom", path: ["anonymous"], message: "Solo quejas, reclamos y sugerencias pueden ser anónimas" });
    }
    if (!v.anonymous && (!v.name || v.name.length < 3)) {
      ctx.addIssue({ code: "custom", path: ["name"], message: "Escribe tu nombre completo" });
    }
    if (!v.anonymous && (!v.documentId || !/^[0-9A-Za-z]{5,15}$/.test(v.documentId))) {
      ctx.addIssue({ code: "custom", path: ["documentId"], message: "Escribe tu número de documento (sin puntos)" });
    }
    if (!v.anonymous && !v.email) {
      ctx.addIssue({ code: "custom", path: ["email"], message: "Necesitamos un correo para enviarte el acuse" });
    }
  });

export type RadicarFormValues = z.infer<typeof radicarFormSchema>;
