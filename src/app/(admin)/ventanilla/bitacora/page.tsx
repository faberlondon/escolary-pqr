"use client";

import * as React from "react";
import Link from "next/link";
import { Search } from "lucide-react";

import { useVentanilla } from "@/components/providers/ventanilla-provider";
import { PageHeader } from "@/components/shell/page-header";
import { RoleGate } from "@/components/shell/role-gate";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDateTime } from "@/lib/ventanilla/rules";
import { canSeeAudit } from "@/lib/ventanilla/users";

const PAGE = 200;

function AuditContent() {
  const { state } = useVentanilla();
  const [query, setQuery] = React.useState("");
  const q = query.trim().toLowerCase();
  const rows = state.audit.filter((e) =>
    !q ? true : [e.actor, e.role, e.action, e.target ?? "", e.detail ?? ""].some((v) => v.toLowerCase().includes(q))
  );
  const idByNumber = new Map(state.radicados.map((r) => [r.number, r.id]));

  return (
    <div className="space-y-8 duration-500 animate-in fade-in">
      <PageHeader
        title="Bitácora"
        description="Registro append-only de cada acción: ver, radicar, asignar, responder, anular, exportar y configurar (RN-12)."
      />
      <Card className="overflow-hidden rounded-2xl">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b p-4">
          <p className="text-sm text-muted-foreground">{state.audit.length} eventos registrados</p>
          <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Usuario, acción o radicado" aria-label="Buscar en la bitácora" className="pl-9" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead>Fecha y hora</TableHead>
                <TableHead>Usuario</TableHead>
                <TableHead>Acción</TableHead>
                <TableHead>Objeto</TableHead>
                <TableHead>Detalle</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-12 text-center text-sm text-muted-foreground">
                    Aún no hay acciones registradas. Abre un radicado o expórtalo y aparecerá aquí.
                  </TableCell>
                </TableRow>
              ) : (
                rows.slice(0, PAGE).map((e) => {
                  const rid = e.target ? idByNumber.get(e.target) : undefined;
                  return (
                    <TableRow key={e.id}>
                      <TableCell className="whitespace-nowrap text-xs tabular-nums">{formatDateTime(e.at)}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        <p className="font-semibold">{e.actor}</p>
                        <p className="text-xs text-muted-foreground">{e.role}</p>
                      </TableCell>
                      <TableCell className="whitespace-nowrap font-medium">{e.action}</TableCell>
                      <TableCell className="whitespace-nowrap font-mono text-xs">
                        {rid ? (
                          <Link href={`/ventanilla/${rid}`} className="text-primary hover:underline">
                            {e.target}
                          </Link>
                        ) : (
                          e.target ?? "—"
                        )}
                      </TableCell>
                      <TableCell className="min-w-48 text-xs text-muted-foreground">{e.detail ?? ""}</TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
        {rows.length > PAGE ? <p className="border-t p-3 text-center text-xs text-muted-foreground">Mostrando los {PAGE} más recientes.</p> : null}
      </Card>
    </div>
  );
}

export default function AuditPage() {
  return (
    <RoleGate allow={canSeeAudit}>
      <AuditContent />
    </RoleGate>
  );
}
