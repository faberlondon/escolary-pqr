import type { PetitionSubtype, RadicadoKind } from "./types";

/** Configuración de la institución (UC-ENC-01). Editable por coordinación o el administrador IE. */
export interface AreaConfig {
  name: string;
  /** Persona que responde lo asignado al área. */
  responsible: string;
}

export interface DocumentTypeConfig {
  name: string;
  /** Fecha límite opcional (YYYY-MM-DD). Después de ella la entrega queda "extemporánea" (A2). */
  deadline?: string;
}

export type TermKey = PetitionSubtype | Exclude<RadicadoKind, "DOC" | "PET">;

export interface VentanillaConfig {
  acronym: string;
  /** Hora de corte (0-23): lo radicado desde esta hora cuenta desde el día hábil siguiente (RN-05). */
  cutoffHour: number;
  maxFileMb: number;
  acceptedFormats: string;
  /** Plazos en días hábiles por tipo de PQRSF (Ley 1755 de 2015). */
  terms: Record<TermKey, number>;
  /** Días hábiles tras la respuesta sin réplica para cerrar el radicado. */
  closeAfterDays: number;
  areas: AreaConfig[];
  documentTypes: DocumentTypeConfig[];
  habeasText: string;
  ackTemplate: string;
}

export const TERM_LABELS: Record<TermKey, string> = {
  general: "Petición general",
  informacion: "Petición de documentos o información",
  consulta: "Consulta",
  QUE: "Queja",
  REC: "Reclamo",
  SUG: "Sugerencia",
  FEL: "Felicitación",
};

export const DEFAULT_CONFIG: VentanillaConfig = {
  acronym: "IEWS",
  cutoffHour: 17,
  maxFileMb: 10,
  acceptedFormats: ".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png",
  terms: { general: 15, informacion: 10, consulta: 30, QUE: 15, REC: 15, SUG: 15, FEL: 15 },
  closeAfterDays: 10,
  areas: [
    { name: "Coordinación académica", responsible: "Inocencio Coronado" },
    { name: "Coordinación de convivencia", responsible: "Rafael Pushaina" },
    { name: "Rectoría", responsible: "Rosa Gil" },
    { name: "Secretaría", responsible: "Marta Villa" },
  ],
  documentTypes: [
    { name: "Acta de reunión" },
    { name: "Planilla de asistencia", deadline: "2026-11-03" },
    { name: "Informe", deadline: "2026-11-20" },
    { name: "Evidencias de trabajo" },
    { name: "Otro documento" },
  ],
  habeasText:
    "Autorizo el tratamiento de mis datos personales para gestionar esta solicitud, según la política de la institución (Ley 1581 de 2012). Los datos de menores de edad reciben protección reforzada.",
  ackTemplate:
    "Su solicitud fue radicada con el número {radicado} el {fecha}. Fecha estimada de respuesta: {vence}. Consulte el estado con este número.",
};

export function responsibleFor(config: VentanillaConfig, area: string): string | undefined {
  return config.areas.find((a) => a.name === area)?.responsible;
}

/** Completa una configuración guardada con valores nuevos que no existían en versiones previas. */
export function withConfigDefaults(stored: Partial<VentanillaConfig> | undefined): VentanillaConfig {
  return {
    ...DEFAULT_CONFIG,
    ...stored,
    terms: { ...DEFAULT_CONFIG.terms, ...stored?.terms },
    areas: stored?.areas?.length ? stored.areas : DEFAULT_CONFIG.areas,
    documentTypes: stored?.documentTypes?.length ? stored.documentTypes : DEFAULT_CONFIG.documentTypes,
  };
}
