import { bogotaParts } from "./business-days";
import { responsibleFor, type VentanillaConfig } from "./config";
import { dueDateFor, formatCivilDate, lateDeadline, sha256Hex } from "./rules";
import { CHANNEL_LABELS, REQUESTER_ROLE_LABELS } from "./types";
import type { Attachment, Channel, Radicado, RadicadoEvent, RadicadoKind, RadicarFormValues } from "./types";

export interface CreateRadicadoInput {
  values: RadicarFormValues;
  files: File[];
  channel: Channel;
  /** Usuario interno que radica en nombre de otra persona (A4 / petición verbal). */
  onBehalfOf?: string;
  /** Corrección de un documento devuelto (A3). */
  linkedTo?: string;
}

export async function hashFile(file: File): Promise<Attachment> {
  const buffer = await file.arrayBuffer();
  return { name: file.name, sizeBytes: file.size, sha256: await sha256Hex(buffer) };
}

const clean = (v: string | undefined): string | undefined => (v && v.trim() ? v.trim() : undefined);

/**
 * Arma el radicado inmutable: consecutivo, sello de tiempo, hashes de adjuntos
 * y del registro, y vencimiento legal. En producción esto ocurre en el servidor
 * (la hora nunca sale del cliente, RN-04); en la demo corre en el navegador.
 *
 * Los adjuntos se procesan ANTES de pedir el consecutivo: si un archivo falla no
 * se consume número (A1). `allocateNumber` es síncrono y atómico (RN-01).
 */
export async function createRadicado(
  { values, files, channel, onBehalfOf, linkedTo }: CreateRadicadoInput,
  config: VentanillaConfig,
  allocateNumber: (kind: RadicadoKind, year: number) => string
): Promise<Radicado> {
  const attachments = await Promise.all(files.map(hashFile));
  const now = new Date();
  const number = allocateNumber(values.kind, bogotaParts(now).y);
  const createdAt = now.toISOString();

  const requester = values.anonymous
    ? { name: "Anónimo", role: values.role, anonymous: true }
    : {
        name: values.name?.trim() ?? "",
        role: values.role,
        documentId: clean(values.documentId),
        email: clean(values.email),
        phone: clean(values.phone),
        detail: REQUESTER_ROLE_LABELS[values.role],
        anonymous: false,
      };

  const isDoc = values.kind === "DOC";
  const content = {
    number,
    kind: values.kind,
    subject: values.subject.trim(),
    description: values.description.trim(),
    area: values.area,
    requester,
    attachments,
    createdAt,
  };
  // RN-09: en anónimos no se guarda IP ni identificador del dispositivo; el registro solo lleva lo visible.
  const recordHash = await sha256Hex(JSON.stringify(content));
  const dueAt = dueDateFor(values.kind, now, values.petitionSubtype, config);
  const late = isDoc ? lateDeadline(values.documentType, now, config) : null;
  const responsible = responsibleFor(config, values.area);

  const ackDetail = values.anonymous
    ? "Código de radicado mostrado en pantalla (radicado anónimo, sin correo)"
    : `Acuse PDF enviado a ${requester.email ?? "correo"}${"phone" in requester && requester.phone ? " y WhatsApp" : ""}`;

  const events: RadicadoEvent[] = [
    {
      id: crypto.randomUUID(),
      type: "radicated",
      at: createdAt,
      actor: onBehalfOf ?? "Sistema",
      detail: [
        onBehalfOf ? `Radicado en nombre del radicante · ${CHANNEL_LABELS[channel]}` : `Vía ${CHANNEL_LABELS[channel]}`,
        linkedTo ? `Corrección vinculada a ${linkedTo}` : null,
        late ? `Entrega extemporánea (fecha límite ${formatCivilDate(late)})` : null,
      ]
        .filter(Boolean)
        .join(" · "),
    },
    { id: crypto.randomUUID(), type: "ack_sent", at: createdAt, actor: "Sistema", detail: ackDetail },
    {
      id: crypto.randomUUID(),
      type: "area_notified",
      at: createdAt,
      actor: "Sistema",
      detail: `Notificado a ${values.area}${responsible ? ` (${responsible})` : ""}`,
      internal: true,
    },
  ];

  return {
    id: number.toLowerCase(),
    ...content,
    documentType: isDoc ? values.documentType : undefined,
    petitionSubtype: values.kind === "PET" ? values.petitionSubtype ?? "general" : undefined,
    group: isDoc ? clean(values.group) : undefined,
    course: isDoc ? clean(values.course) : undefined,
    period: isDoc ? clean(values.period) : undefined,
    involved: isDoc ? undefined : clean(values.involved),
    linkedTo,
    channel,
    dueAt,
    lateDelivery: late ? true : undefined,
    recordHash,
    status: "radicado",
    events,
  };
}
