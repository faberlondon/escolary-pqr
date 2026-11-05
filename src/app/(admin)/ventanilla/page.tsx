"use client";

import Link from "next/link";
import { FileSpreadsheet, Plus } from "lucide-react";

import { useVentanilla } from "@/components/providers/ventanilla-provider";
import { PageHeader } from "@/components/shell/page-header";
import { PageSkeleton } from "@/components/shell/page-skeleton";
import { Button } from "@/components/ui/button";
import { InboxKpis } from "@/components/ventanilla/inbox-kpis";
import { InboxTable } from "@/components/ventanilla/inbox-table";
import { exportRadicadosXlsx } from "@/lib/ventanilla/export";

export default function InboxPage() {
  const { state, ready } = useVentanilla();
  if (!ready) return <PageSkeleton />;
  const now = new Date();

  return (
    <div className="space-y-8 duration-500 animate-in fade-in">
      <PageHeader
        title="Bandeja de radicados"
        description="Documentos docentes y PQRSF con número de radicado, trazabilidad y plazo legal."
        actions={
          <>
            <Button variant="outline" onClick={() => exportRadicadosXlsx(state.radicados, now)}>
              <FileSpreadsheet className="size-4" />
              Exportar Excel
            </Button>
            <Button asChild>
              <Link href="/ventanilla/nuevo">
                <Plus className="size-4" />
                Radicar en nombre de
              </Link>
            </Button>
          </>
        }
      />
      <InboxKpis radicados={state.radicados} now={now} />
      <InboxTable radicados={state.radicados} now={now} />
    </div>
  );
}
