"use client";

import { CalendarClock, CheckCircle2, Lock, PenLine, Undo2 } from "lucide-react";

import { CURRENT_USER, useVentanilla } from "@/components/providers/ventanilla-provider";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TextActionDialog } from "@/components/ventanilla/text-action-dialog";
import { useToast } from "@/hooks/use-toast";
import { deadlineState, extendedDueDate, formatCivilDate } from "@/lib/ventanilla/rules";
import { AREAS } from "@/lib/ventanilla/types";
import type { Area, Radicado } from "@/lib/ventanilla/types";

export function DetailActions({ radicado }: { radicado: Radicado }) {
  const { dispatch } = useVentanilla();
  const { toast } = useToast();
  const actor = CURRENT_USER.name;
  const id = radicado.id;
  const locked = radicado.status === "cerrado" || radicado.status === "anulado";

  const note = (
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
  );

  if (radicado.kind === "DOC") {
    const reviewed = radicado.status !== "radicado";
    return (
      <div className="flex flex-wrap gap-2">
        {note}
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
      </div>
    );
  }

  // La prórroga se registra antes del vencimiento (RN-06): vencido ya no se puede prorrogar.
  const canExtend =
    ["radicado", "en_tramite"].includes(radicado.status) && deadlineState(radicado, new Date()).state !== "overdue";
  const newDue = extendedDueDate(radicado);
  const open = !["respondido", "cerrado", "anulado"].includes(radicado.status);

  return (
    <div className="flex flex-wrap gap-2">
      <Select
        value={radicado.assignee && (AREAS as readonly string[]).includes(radicado.assignee) ? radicado.assignee : undefined}
        onValueChange={(area) => {
          dispatch({ type: "assign", id, area: area as Area, actor });
          toast({ title: `Asignado a ${area}` });
        }}
        disabled={!open}
      >
        <SelectTrigger className="w-56" aria-label="Asignar a">
          <SelectValue placeholder="Asignar a…" />
        </SelectTrigger>
        <SelectContent>
          {AREAS.map((a) => (
            <SelectItem key={a} value={a}>
              {a}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {note}
      <TextActionDialog
        trigger={
          <Button variant="outline" disabled={!canExtend}>
            <CalendarClock className="size-4" />
            Prorrogar
          </Button>
        }
        title="Prórroga motivada"
        description={`Se notifica al radicante antes del vencimiento. Nueva fecha: ${newDue ? formatCivilDate(newDue) : "—"}.`}
        label="Motivo de la prórroga"
        confirmLabel="Prorrogar"
        minLength={15}
        onConfirm={(text) => {
          dispatch({ type: "extend", id, reason: text, actor });
          toast({ title: "Prórroga registrada", description: "Se notificó al radicante la nueva fecha." });
        }}
      />
      {radicado.status === "respondido" ? (
        <Button variant="outline" onClick={() => dispatch({ type: "close", id, actor })}>
          <Lock className="size-4" />
          Cerrar radicado
        </Button>
      ) : null}
    </div>
  );
}
