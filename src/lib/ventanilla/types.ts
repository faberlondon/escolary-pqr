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

export const DOCUMENT_TYPES = [
  "Acta de reunión",
  "Planilla de asistencia",
  "Informe",
  "Evidencias de trabajo",
  "Otro documento",
] as const;
export type DocumentType = (typeof DOCUMENT_TYPES)[number];

/** Subtipo de petición: define el plazo legal (Ley 1755 de 2015, art. 14). */
export const PETITION_SUBTYPES = ["general", "informacion", "consulta"] as const;
export type PetitionSubtype = (typeof PETITION_SUBTYPES)[number];

export const PETITION_SUBTYPE_LABELS: Record<PetitionSubtype, string> = {
  general: "Petición general (15 días hábiles)",
  informacion: "Solicitud de documentos o información (10 días hábiles)",
  consulta: "Consulta (30 días hábiles)",
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

export const AREAS = [
  "Coordinación académica",
  "Coordinación de convivencia",
  "Rectoría",
  "Secretaría",
] as const;
export type Area = (typeof AREAS)[number];

export const CHANNELS = ["web", "whatsapp", "presencial"] as const;
export type Channel = (typeof CHANNELS)[number];

export const CHANNEL_LABELS: Record<Channel, string> = {
  web: "Portal web",
  whatsapp: "WhatsApp",
  presencial: "Presencial",
};

export type RadicadoStatus =
  | "radicado"
  | "en_tramite"
  | "prorrogado"
  | "respondido"
  | "cerrado"
  | "recibido_conforme"
  | "devuelto"
  | "anulado";

export type EventType =
  | "radicated"
  | "ack_sent"
  | "assigned"
  | "note"
  | "extended"
  | "answered"
  | "closed"
  | "accepted"
  | "returned"
  | "due_alert";

export interface RadicadoEvent {
  id: string;
  type: EventType;
  at: string;
  actor: string;
  detail?: string;
  /** Las notas internas nunca se muestran al radicante (RN-08). */
  internal?: boolean;
}

export interface Attachment {
  name: string;
  sizeBytes: number;
  sha256: string;
}

export interface Requester {
  name: string;
  role: RequesterRole;
  email?: string;
  phone?: string;
  detail?: string;
  anonymous: boolean;
}

/** Registro inmutable: tras radicar solo crece `events` (RN-02). */
export interface Radicado {
  id: string;
  number: string;
  kind: RadicadoKind;
  documentType?: DocumentType;
  petitionSubtype?: PetitionSubtype;
  subject: string;
  description: string;
  area: Area;
  channel: Channel;
  requester: Requester;
  attachments: Attachment[];
  createdAt: string;
  dueAt?: string;
  lateDelivery?: boolean;
  recordHash: string;
  assignee?: string;
  status: RadicadoStatus;
  response?: string;
  events: RadicadoEvent[];
}

export const radicarFormSchema = z
  .object({
    kind: z.enum(RADICADO_KINDS),
    documentType: z.enum(DOCUMENT_TYPES).optional(),
    petitionSubtype: z.enum(PETITION_SUBTYPES).optional(),
    area: z.enum(AREAS),
    role: z.enum(REQUESTER_ROLES),
    anonymous: z.boolean(),
    name: z.string().trim().max(120).optional(),
    email: z.string().trim().email("Correo no válido").optional().or(z.literal("")),
    phone: z.string().trim().max(20).optional(),
    subject: z.string().trim().min(5, "Escribe un asunto de al menos 5 caracteres").max(140),
    description: z.string().trim().min(10, "Describe tu solicitud (mínimo 10 caracteres)").max(4000),
    habeasData: z.boolean().refine((v) => v, "Debes aceptar la política de tratamiento de datos"),
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
    if (!v.anonymous && !v.email) {
      ctx.addIssue({ code: "custom", path: ["email"], message: "Necesitamos un correo para enviarte el acuse" });
    }
  });

export type RadicarFormValues = z.infer<typeof radicarFormSchema>;

export const MAX_FILE_BYTES = 10 * 1024 * 1024;
export const ACCEPTED_FILE_TYPES = ".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png";
