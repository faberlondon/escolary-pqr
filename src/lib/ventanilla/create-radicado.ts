import { dueDateFor, formatRadicadoNumber, nextSequence, sha256Hex } from "./rules";
import { bogotaParts } from "./business-days";
import { CHANNEL_LABELS, REQUESTER_ROLE_LABELS } from "./types";
import type { Attachment, Channel, Radicado, RadicarFormValues } from "./types";

interface CreateRadicadoInput {
  values: RadicarFormValues;
  files: File[];
  existing: readonly Radicado[];
  channel: Channel;
  /** Usuario interno que radica en nombre de otra persona (A4 / petición verbal). */
  onBehalfOf?: string;
}

async function hashFile(file: File): Promise<Attachment> {
  const buffer = await file.arrayBuffer();
  return { name: file.name, sizeBytes: file.size, sha256: await sha256Hex(buffer) };
}

/**
 * Arma el radicado inmutable: consecutivo, sello de tiempo, hashes de adjuntos
 * y del registro, y vencimiento legal. En producción esto ocurre en el servidor
 * (la hora nunca sale del cliente, RN-04); en la demo corre en el navegador.
 */
export async function createRadicado({ values, files, existing, channel, onBehalfOf }: CreateRadicadoInput): Promise<Radicado> {
  const now = new Date();
  const year = bogotaParts(now).y;
  const number = formatRadicadoNumber(values.kind, year, nextSequence(existing, values.kind, year));
  const attachments = await Promise.all(files.map(hashFile));
  const createdAt = now.toISOString();

  const requester = values.anonymous
    ? { name: "Anónimo", role: values.role, anonymous: true }
    : {
        name: values.name ?? "",
        role: values.role,
        email: values.email || undefined,
        phone: values.phone || undefined,
        detail: REQUESTER_ROLE_LABELS[values.role],
        anonymous: false,
      };

  const content = {
    number,
    kind: values.kind,
    subject: values.subject,
    description: values.description,
    requester,
    attachments,
    createdAt,
  };
  const recordHash = await sha256Hex(JSON.stringify(content));
  const ackDetail = values.anonymous
    ? "Código de radicado mostrado en pantalla (radicado anónimo)"
    : "Acuse enviado por correo y WhatsApp";

  return {
    id: number.toLowerCase(),
    ...content,
    documentType: values.kind === "DOC" ? values.documentType : undefined,
    petitionSubtype: values.kind === "PET" ? values.petitionSubtype ?? "general" : undefined,
    area: values.area,
    channel,
    dueAt: dueDateFor(values.kind, now, values.petitionSubtype),
    recordHash,
    status: "radicado",
    events: [
      {
        id: crypto.randomUUID(),
        type: "radicated",
        at: createdAt,
        actor: onBehalfOf ?? "Sistema",
        detail: onBehalfOf ? `Radicado en nombre del ciudadano · ${CHANNEL_LABELS[channel]}` : `Vía ${CHANNEL_LABELS[channel]}`,
      },
      { id: crypto.randomUUID(), type: "ack_sent", at: createdAt, actor: "Sistema", detail: ackDetail },
    ],
  };
}
