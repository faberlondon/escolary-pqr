"use client";

import Link from "next/link";
import { Ban, CalendarClock, CheckCircle2, FilePlus2, Forward, HelpCircle, Lock, MessageSquarePlus, PenLine, Undo2 } from "lucide-react";

import { useVentanilla } from "@/components/providers/ventanilla-provider";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TextActionDialog } from "@/components/ventanilla/text-action-dialog";
import { useToast } from "@/hooks/use-toast";
import { deadlineState, extendedDueDate, formatCivilDate } from "@/lib/ventanilla/rules";
import { permissionsFor } from "@/lib/ventanilla/users";
import type { Radicado } from "@/lib/ventanilla/types";

export function DetailActions({ radicado }: { radicado: Radicado }) {
  const { dispatch, state, user, actor } = useVentanilla();
  const { toast } = useToast();
  const id = radicado.id;
  const can = permissionsFor(user, radicado);
  const locked = radicado.status === "cerrado" || radicado.status === "anulado";

  const note = can.note ? (
    <TextActionDialog
      trigger={
        <Button variant="outline" disabled={locked}>
          <PenLine className="size-4" />
          Nota interna
        </Button>
      }
      title="Agregar nota interna"
      description="Queda en la trazabilidad y nunca se muestra al radicante."
      label="Nota"
      confirmLabel="Guardar nota"
      onConfirm={(text) => dispatch({ type: "note", id, text, actor })}
    />
  ) : null;

  // RN-03: solo coordinación anula, con motivo obligatorio. El consecutivo no se reutiliza.
  const annul =
    can.annul && radicado.status !== "anulado" ? (
      <TextActionDialog
        trigger={
          <Button variant="ghost" className="text-destructive hover:text-destructive">
            <Ban className="size-4" />
            Anular
          </Button>
        }
        title="Anular radicado"
        description="El radicado queda visible como “Anulado” y su número no se reutiliza. Esta acción no se puede deshacer."
        label="Motivo de la anulación"
        confirmLabel="Anular"
        destructive
        minLength={15}
        onConfirm={(text) => {
          dispatch({ type: "annul", id, reason: text, actor });
          toast({ title: "Radicado anulado", description: radicado.number });
        }}
      />
    ) : null;

  if (radicado.kind === "DOC") {
    const reviewed = radicado.status !== "radicado";
    const ownReturned = user.role === "docente" && radicado.status === "devuelto";
    return (
      <div className="flex flex-wrap gap-2">
        {ownReturned ? (
          <Button asChild>
            <Link href={`/radicar?corrige=${radicado.number}`}>
              <FilePlus2 className="size-4" />
              Radicar corrección
            </Link>
          </Button>
        ) : null}
        {note}
        {can.reviewDocs ? (
          <>
            <TextActionDialog
              trigger={
                <Button variant="outline" disabled={reviewed}>
                  <Undo2 className="size-4" />
                  Devolver
                </Button>
              }
              title="Devolver con observaciones"
              description="El radicado se conserva. El docente radica la corrección como un documento nuevo vinculado."
              label="Observaciones para el docente"
              confirmLabel="Devolver"
              destructive
              onConfirm={(text) => dispatch({ type: "return", id, reason: text, actor })}
            />
            <Button
              disabled={reviewed}
              onClick={() => {
                dispatch({ type: "accept", id, actor });
                toast({ title: "Documento recibido conforme", description: "Se notificó al docente." });
              }}
            >
              <CheckCircle2 className="size-4" />
              Recibido conforme
            </Button>
          </>
        ) : null}
        {annul}
      </div>
    );
  }

  const running = ["radicado", "asignado", "en_tramite"].includes(radicado.status);
  // La prórroga se registra antes del vencimiento (RN-06): vencido ya no se puede prorrogar.
  const canExtend = running && deadlineState(radicado, new Date()).state !== "overdue";
  const newDue = extendedDueDate(radicado, state.config);
  const open = !["respondido", "cerrado", "anulado", "trasladado"].includes(radicado.status);
  const assignedArea = radicado.assignedArea && state.config.areas.some((a) => a.name === radicado.assignedArea) ? radicado.assignedArea : undefined;

  return (
    <div className="flex flex-wrap gap-2">
      {can.assign ? (
        <Select
          value={assignedArea}
          onValueChange={(area) => {
            const responsible = state.config.areas.find((a) => a.name === area)?.responsible ?? area;
            dispatch({ type: "assign", id, area, responsible, actor });
            toast({ title: `Asignado a ${responsible}`, description: area });
          }}
          disabled={!open}
        >
          <SelectTrigger className="w-60" aria-label="Asignar a">
            <SelectValue placeholder="Asignar a…" />
          </SelectTrigger>
          <SelectContent>
            {state.config.areas.map((a) => (
              <SelectItem key={a.name} value={a.name}>
                {a.responsible} · {a.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : null}
      {note}
      {can.extend ? (
        <TextActionDialog
          trigger={
            <Button variant="outline" disabled={!canExtend}>
              <CalendarClock className="size-4" />
              Prorrogar
            </Button>
          }
          title="Prórroga motivada"
          description={`Se notifica al radicante antes del vencimiento. Nueva fecha: ${newDue ? formatCivilDate(newDue) : "—"} (máximo el doble del término).`}
          label="Motivo de la prórroga"
          confirmLabel="Prorrogar"
          minLength={15}
          onConfirm={(text) => {
            dispatch({ type: "extend", id, reason: text, actor });
            toast({ title: "Prórroga registrada", description: "Se notificó al radicante la nueva fecha." });
          }}
        />
      ) : null}
      {can.requestInfo && running ? (
        <TextActionDialog
          trigger={
            <Button variant="outline">
              <HelpCircle className="size-4" />
              Solicitar información
            </Button>
          }
          title="Solicitar información adicional"
          description="Se notifica al radicante y el término queda suspendido hasta que responda; luego se reactiva completo (Ley 1755, art. 17)."
          label="¿Qué información necesita?"
          confirmLabel="Solicitar"
          minLength={10}
          onConfirm={(text) => {
            dispatch({ type: "requestInfo", id, text, actor });
            toast({ title: "Información solicitada", description: "El término quedó suspendido." });
          }}
        />
      ) : null}
      {can.requestInfo && radicado.status === "en_espera" ? (
        <TextActionDialog
          trigger={
            <Button variant="outline">
              <MessageSquarePlus className="size-4" />
              Registrar información recibida
            </Button>
          }
          title="Información recibida del radicante"
          description="Para lo que llegue por correo, WhatsApp o en persona. El término se reactiva desde hoy."
          label="Resumen de lo recibido"
          confirmLabel="Registrar"
          onConfirm={(text) => dispatch({ type: "infoReceived", id, text: `Recibido por ${actor.name}: ${text}`, actor })}
        />
      ) : null}
      {can.transfer && open ? (
        <TextActionDialog
          trigger={
            <Button variant="outline">
              <Forward className="size-4" />
              Trasladar
            </Button>
          }
          title="Trasladar por competencia"
          description="Para lo que no le corresponde a la institución. Se notifica al peticionario la entidad destino."
          inputLabel="Entidad destino"
          inputPlaceholder="Secretaría de Educación Departamental"
          label="Motivo del traslado"
          confirmLabel="Trasladar"
          minLength={10}
          onConfirm={(text, entity) => {
            dispatch({ type: "transfer", id, entity, reason: text, actor });
            toast({ title: "Radicado trasladado", description: entity });
          }}
        />
      ) : null}
      {can.close && radicado.status === "respondido" ? (
        <Button variant="outline" onClick={() => dispatch({ type: "close", id, actor })}>
          <Lock className="size-4" />
          Cerrar radicado
        </Button>
      ) : null}
      {annul}
    </div>
  );
}
