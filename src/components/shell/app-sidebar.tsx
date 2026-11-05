"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, ClipboardCheck, ExternalLink, GraduationCap, Inbox, ScrollText, Search, Send, Settings } from "lucide-react";

import { useVentanilla } from "@/components/providers/ventanilla-provider";
import { cn } from "@/lib/utils";
import { isOpen, isPendingReview, SCHOOL } from "@/lib/ventanilla/rules";
import { canManageConfig, canManageSurveys, canSee, canSeeAudit, canSeeReports, type DemoUser } from "@/lib/ventanilla/users";

interface NavItem {
  href: string;
  label: string;
  icon: typeof Inbox;
  external?: boolean;
  match: (path: string) => boolean;
  show?: (u: DemoUser) => boolean;
}

const SECTIONS = ["encuestas", "reportes", "bitacora", "configuracion"];

const NAV: NavItem[] = [
  {
    href: "/ventanilla",
    label: "Bandeja",
    icon: Inbox,
    match: (p) => p === "/ventanilla" || (p.startsWith("/ventanilla/") && !SECTIONS.some((s) => p.startsWith(`/ventanilla/${s}`))),
    show: (u) => u.role !== "admin",
  },
  { href: "/ventanilla/encuestas", label: "Encuestas", icon: ClipboardCheck, match: (p) => p.startsWith("/ventanilla/encuestas"), show: canManageSurveys },
  { href: "/ventanilla/reportes", label: "Reportes", icon: BarChart3, match: (p) => p.startsWith("/ventanilla/reportes"), show: canSeeReports },
  { href: "/ventanilla/bitacora", label: "Bitácora", icon: ScrollText, match: (p) => p.startsWith("/ventanilla/bitacora"), show: canSeeAudit },
  { href: "/ventanilla/configuracion", label: "Configuración", icon: Settings, match: (p) => p.startsWith("/ventanilla/configuracion"), show: canManageConfig },
];

const PUBLIC_LINKS: NavItem[] = [
  { href: "/radicar", label: "Formulario público", icon: Send, external: true, match: () => false },
  { href: "/consultar", label: "Consultar radicado", icon: Search, external: true, match: () => false },
];

function NavLink({ item, active, badge }: { item: NavItem; active: boolean; badge?: number }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      target={item.external ? "_blank" : undefined}
      data-active={active}
      className={cn(
        "flex items-center gap-3 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
        active && "bg-sidebar-accent font-semibold shadow-[inset_3px_0_0_hsl(var(--sidebar-primary))]"
      )}
    >
      <Icon className="size-4 shrink-0" />
      <span className="truncate">{item.label}</span>
      {item.external ? <ExternalLink className="ml-auto size-3.5 shrink-0 opacity-70" /> : null}
      {badge ? (
        <span className="ml-auto rounded-full bg-sidebar-primary px-2 text-xs font-bold text-sidebar-primary-foreground">
          {badge}
        </span>
      ) : null}
    </Link>
  );
}

export function AppSidebar() {
  const pathname = usePathname();
  const { state, ready, user } = useVentanilla();
  const pending = ready ? state.radicados.filter((r) => canSee(user, r) && (isOpen(r) || isPendingReview(r))).length : 0;

  return (
    <aside className="flex flex-col gap-5 bg-sidebar px-3 py-4 text-sidebar-foreground lg:sticky lg:top-0 lg:h-dvh lg:w-sidebar lg:py-6">
      <div className="flex items-center gap-2.5 px-2 text-lg font-extrabold">
        <span className="grid size-9 place-items-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground">
          <GraduationCap className="size-5" />
        </span>
        eScolary
      </div>
      <div className="hidden rounded-xl bg-white/10 px-3 py-2.5 text-xs lg:block">
        <p className="text-sm font-semibold">{SCHOOL.name}</p>
        <p className="opacity-80">Ventanilla única · {SCHOOL.campus}</p>
      </div>
      <nav aria-label="Ventanilla única" className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
        <p className="hidden px-3 pb-1 text-xs font-semibold uppercase tracking-wider opacity-70 lg:block">Gestión</p>
        {NAV.filter((item) => !item.show || item.show(user)).map((item) => (
          <NavLink key={item.href} item={item} active={item.match(pathname)} badge={item.href === "/ventanilla" ? pending : undefined} />
        ))}
        <p className="hidden px-3 pb-1 pt-4 text-xs font-semibold uppercase tracking-wider opacity-70 lg:block">Ciudadanía</p>
        {PUBLIC_LINKS.map((item) => (
          <NavLink key={item.href} item={item} active={false} />
        ))}
      </nav>
      <p className="mt-auto hidden px-3 text-xs opacity-70 lg:block">Demo · datos de ejemplo</p>
    </aside>
  );
}
