"use client";

import Link from "next/link";
import { FileSpreadsheet, Plus, Send, Settings } from "lucide-react";

import { useVentanilla } from "@/components/providers/ventanilla-provider";
import { PageHeader } from "@/components/shell/page-header";
import { PageSkeleton } from "@/components/shell/page-skeleton";
import { Button } from "@/components/ui/button";
import { InboxKpis } from "@/components/ventanilla/inbox-kpis";
import { InboxTable } from "@/components/ventanilla/inbox-table";
import { exportRadicadosXlsx } from "@/lib/ventanilla/export";
import { canSee } from "@/lib/ventanilla/users";

export default function InboxPage() {
  const { state, ready, user, log } = useVentanilla();
  if (!ready) return <PageSkeleton />;
  const now = new Date();

  if (user.role === "admin") {
    return (
      <div className="space-y-6">
        <PageHeader title="Bandeja de radicados" description="El administrador IE configura la ventanilla; no ve el contenido de los radicados." />
        <Button asChild>
          <Link href="/ventanilla/configuracion">
            <Settings className="size-4" />
            Ir a configuración
          </Link>
        </Button>
      </div>
    );
  }

  // RN-07: cada rol ve solo lo que le corresponde.
  const visible = state.radicados.filter((r) => canSee(user, r));
  const docente = user.role === "docente";

  return (
    <div className="space-y-8 duration-500 animate-in fade-in">
      <PageHeader
        title={docente ? "Mis radicados" : user.role === "responsable" ? "Radicados asignados" : "Bandeja de radicados"}
        description={
          docente
            ? "Historial de todo lo que has radicado, con su estado y acuse."
            : "Documentos docentes y PQRSF con número de radicado, trazabilidad y plazo legal."
        }
        actions={
          docente ? (
            <Button asChild>
              <Link href="/radicar" target="_blank">
                <Send className="size-4" />
                Radicar documento
              </Link>
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  exportRadicadosXlsx(visible, now);
                  log("Exportar radicados", undefined, `${visible.length} registros`);
                }}
              >
                <FileSpreadsheet className="size-4" />
                Exportar Excel
              </Button>
              {user.role === "coordinador" ? (
                <Button asChild>
                  <Link href="/ventanilla/nuevo">
                    <Plus className="size-4" />
                    Radicar en nombre de
                  </Link>
                </Button>
              ) : null}
            </>
          )
        }
      />
      {docente ? null : <InboxKpis radicados={visible} now={now} />}
      <InboxTable radicados={visible} areas={state.config.areas.map((a) => a.name)} now={now} />
    </div>
  );
}
