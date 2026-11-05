"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Paperclip, Search } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DeadlineText, StatusBadge } from "@/components/ventanilla/status-badge";
import { deadlineState, isOpen, isPendingReview } from "@/lib/ventanilla/rules";
import { KIND_LABELS, RADICADO_KINDS } from "@/lib/ventanilla/types";
import type { Radicado } from "@/lib/ventanilla/types";

type Scope = "todos" | "pqrsf" | "documentos";
type StatusFilter = "todos" | "abiertos" | "vencidos" | "finalizados";

interface Filters {
  scope: Scope;
  status: StatusFilter;
  area: string;
  kind: string;
  query: string;
}

function matches(r: Radicado, { scope, status, area, kind, query }: Filters, now: Date): boolean {
  if (scope === "pqrsf" && r.kind === "DOC") return false;
  if (area !== "todas" && r.area !== area && r.assignedArea !== area) return false;
  if (kind !== "todos" && r.kind !== kind) return false;
  if (scope === "documentos" && r.kind !== "DOC") return false;
  const open = isOpen(r) || isPendingReview(r);
  if (status === "abiertos" && !open) return false;
  if (status === "finalizados" && open) return false;
  if (status === "vencidos" && deadlineState(r, now).state !== "overdue") return false;
  if (!query) return true;
  const q = query.toLowerCase();
  return [r.number, r.subject, r.requester.name, r.assignee ?? ""].some((v) => v.toLowerCase().includes(q));
}

export function InboxTable({ radicados, areas, now }: { radicados: readonly Radicado[]; areas: readonly string[]; now: Date }) {
  const router = useRouter();
  const [scope, setScope] = React.useState<Scope>("todos");
  const [status, setStatus] = React.useState<StatusFilter>("todos");
  const [area, setArea] = React.useState("todas");
  const [kind, setKind] = React.useState("todos");
  const [query, setQuery] = React.useState("");
  const rows = radicados.filter((r) => matches(r, { scope, status, area, kind, query: query.trim() }, now));

  return (
    <Card className="overflow-hidden rounded-2xl">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b p-4">
        <Tabs value={scope} onValueChange={(v) => setScope(v as Scope)}>
          <TabsList>
            <TabsTrigger value="todos">Todos</TabsTrigger>
            <TabsTrigger value="pqrsf">PQRSF</TabsTrigger>
            <TabsTrigger value="documentos">Documentos docentes</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex w-full flex-wrap gap-2 sm:w-auto">
          <div className="relative min-w-0 flex-1 sm:w-64 sm:flex-none">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Radicado, asunto, radicante o responsable"
              aria-label="Buscar radicados"
              className="pl-9"
            />
          </div>
          <Select value={status} onValueChange={(v) => setStatus(v as StatusFilter)}>
            <SelectTrigger className="w-40" aria-label="Filtrar por estado">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los estados</SelectItem>
              <SelectItem value="abiertos">Abiertos</SelectItem>
              <SelectItem value="vencidos">Vencidos</SelectItem>
              <SelectItem value="finalizados">Finalizados</SelectItem>
            </SelectContent>
          </Select>
          <Select value={kind} onValueChange={setKind}>
            <SelectTrigger className="w-36" aria-label="Filtrar por tipo">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los tipos</SelectItem>
              {RADICADO_KINDS.map((k) => (
                <SelectItem key={k} value={k}>
                  {KIND_LABELS[k]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={area} onValueChange={setArea}>
            <SelectTrigger className="w-52" aria-label="Filtrar por área">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas las áreas</SelectItem>
              {areas.map((a) => (
                <SelectItem key={a} value={a}>
                  {a}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead>Radicado</TableHead>
              <TableHead>Radicante</TableHead>
              <TableHead>Asunto</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Término</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-12 text-center text-sm text-muted-foreground">
                  No hay radicados con estos filtros.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((r) => (
                <TableRow
                  key={r.id}
                  tabIndex={0}
                  className="cursor-pointer"
                  onClick={() => router.push(`/ventanilla/${r.id}`)}
                  onKeyDown={(e) => e.key === "Enter" && router.push(`/ventanilla/${r.id}`)}
                >
                  <TableCell>
                    <p className="whitespace-nowrap font-mono text-xs font-medium text-primary">{r.number}</p>
                    <span className="mt-1 inline-block whitespace-nowrap rounded-md bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">
                      {r.documentType ?? KIND_LABELS[r.kind]}
                    </span>
                  </TableCell>
                  <TableCell>
                    <p className="whitespace-nowrap font-semibold">{r.requester.name}</p>
                    <p className="whitespace-nowrap text-xs text-muted-foreground">
                      {r.requester.detail ?? "Sin identificar"}
                      {r.assignee ? ` · ${r.assignee}` : ""}
                    </p>
                  </TableCell>
                  <TableCell className="min-w-48">
                    <span className="inline-flex items-center gap-1.5">
                      {r.subject}
                      {r.attachments.length > 0 ? <Paperclip className="size-3.5 shrink-0 text-muted-foreground" /> : null}
                    </span>
                  </TableCell>
                  <TableCell>
                    <StatusBadge radicado={r} now={now} />
                  </TableCell>
                  <TableCell>
                    {r.lateDelivery ? (
                      <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">Extemporáneo</span>
                    ) : (
                      <DeadlineText radicado={r} now={now} />
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
