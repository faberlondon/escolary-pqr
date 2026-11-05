"use client";

import { ShieldOff } from "lucide-react";

import { useVentanilla } from "@/components/providers/ventanilla-provider";
import { PageSkeleton } from "@/components/shell/page-skeleton";
import { ROLE_LABELS, type DemoUser } from "@/lib/ventanilla/users";

/** Muestra la página solo a los roles autorizados (autenticación por rol, RNF-08). */
export function RoleGate({ allow, children }: { allow: (u: DemoUser) => boolean; children: React.ReactNode }) {
  const { ready, user } = useVentanilla();
  if (!ready) return <PageSkeleton />;
  if (!allow(user)) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border p-6 text-sm">
        <ShieldOff className="size-5 text-muted-foreground" />
        <p>
          El rol <span className="font-semibold">{ROLE_LABELS[user.role]}</span> no tiene acceso a esta sección. Cambia de usuario
          arriba a la derecha.
        </p>
      </div>
    );
  }
  return <>{children}</>;
}
