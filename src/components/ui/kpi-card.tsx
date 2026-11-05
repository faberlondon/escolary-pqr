"use client";

import * as React from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * Retícula estándar del panel admin. Responde al ancho del contenedor
 * (container queries), no al viewport: el mismo componente funciona con el
 * sidebar abierto, colapsado, o en pantallas sin sidebar.
 *
 * La consulta de contenedor (`@container`) va en un wrapper propio, no en el
 * mismo elemento que trae las variantes `@md:`/`@2xl:`/`@4xl:` — un elemento
 * nunca puede consultar su propio tamaño de contenedor, solo el de un
 * ancestro, así que si van juntos las variantes nunca activan.
 */
export const kpiCardGridClassName = "grid gap-6 @md:grid-cols-2 @2xl:grid-cols-3 @4xl:grid-cols-4";

export type KpiCardGridProps = React.ComponentPropsWithoutRef<"div">;

export const KpiCardGrid = React.forwardRef<HTMLDivElement, KpiCardGridProps>(
  ({ className, ...props }, ref) => (
    <div className="@container">
      <div ref={ref} className={cn(kpiCardGridClassName, className)} {...props} />
    </div>
  )
);
KpiCardGrid.displayName = "KpiCardGrid";

export const kpiCardClassName = cn(
  "relative rounded-2xl border shadow-sm bg-card/50 backdrop-blur-sm",
  "hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group overflow-hidden"
);

/** Acentos cerrados de KpiCard: bar lateral, fondo del icono y color del icono resueltos aquí, no en cada página. */
export type KpiCardAccent = "primary" | "success" | "warning" | "danger" | "info";

const ACCENT_STYLES: Record<KpiCardAccent, { bar: string; iconWrapper: string; icon: string }> = {
  primary: { bar: "bg-primary", iconWrapper: "bg-primary/10", icon: "text-primary" },
  success: {
    bar: "bg-emerald-600 dark:bg-emerald-400",
    iconWrapper: "bg-emerald-100/50 dark:bg-emerald-900/30",
    icon: "text-emerald-600 dark:text-emerald-400",
  },
  warning: {
    bar: "bg-amber-600 dark:bg-amber-400",
    iconWrapper: "bg-amber-100/50 dark:bg-amber-900/30",
    icon: "text-amber-600 dark:text-amber-400",
  },
  danger: { bar: "bg-destructive", iconWrapper: "bg-destructive/10", icon: "text-destructive" },
  // No usa --accent: en dark mode --accent y --primary son el mismo HSL (195 100% 47%),
  // lo que volvería indistinguibles los acentos "info" y "primary" en ese tema.
  info: {
    bar: "bg-blue-600 dark:bg-blue-400",
    iconWrapper: "bg-blue-100/50 dark:bg-blue-900/30",
    icon: "text-blue-600 dark:text-blue-400",
  },
};

export type KpiCardProps = Omit<React.ComponentPropsWithoutRef<typeof Card>, "title"> & {
  title: string;
  description?: string;
  /** Contenido principal del indicador (número, porcentaje, texto corto). */
  value?: React.ReactNode;
  /** Icono decorativo (Lucide); el color lo resuelve `accent`, no hace falta pasarlo en el icono. */
  icon: React.ReactElement<{ className?: string }>;
  /** Acento semántico cerrado: bar lateral, fondo y color del icono se resuelven aquí. */
  accent: KpiCardAccent;
  isLoading?: boolean;
  skeletonClassName?: string;
  valueClassName?: string;
  descriptionClassName?: string;
  /** Clases extra para el título (ej. `text-destructive` en KPIs de mora). */
  titleClassName?: string;
  /** Contenido bajo el título en el encabezado (ej. badge “Prioritario”). */
  headerEnd?: React.ReactNode;
};

const KpiCard = React.forwardRef<HTMLDivElement, KpiCardProps>(
  (
    {
      title,
      description,
      value,
      icon,
      accent,
      isLoading,
      className,
      skeletonClassName,
      valueClassName,
      descriptionClassName,
      titleClassName,
      headerEnd,
      children,
      ...cardProps
    },
    ref
  ) => {
    const accentStyle = ACCENT_STYLES[accent];
    const coloredIcon = React.cloneElement(icon, {
      className: cn(accentStyle.icon, icon.props.className),
    });

    return (
      <Card ref={ref} className={cn(kpiCardClassName, className)} {...cardProps}>
        <div
          aria-hidden
          className={cn(
            "absolute left-0 top-2 bottom-2 w-2 rounded-r-full opacity-90 transition-all duration-300 group-hover:opacity-100 group-hover:w-2.5",
            accentStyle.bar
          )}
        />
        <div
          aria-hidden
          className={cn(
            "pointer-events-none absolute left-0 top-2 bottom-2 w-2 rounded-r-full blur-[6px] opacity-25 transition-opacity duration-300 group-hover:opacity-40",
            accentStyle.bar
          )}
        />
        <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 pb-3">
          <div className="min-w-0 flex-1 space-y-1.5">
            <CardTitle
              className={cn(
                "text-xs font-bold uppercase tracking-widest text-muted-foreground",
                titleClassName
              )}
            >
              {title}
            </CardTitle>
            {headerEnd}
          </div>
          <div className={cn("shrink-0 rounded-xl p-2 transition-colors duration-300", accentStyle.iconWrapper)}>
            {coloredIcon}
          </div>
        </CardHeader>
        <CardContent>
          {children !== undefined ? (
            children
          ) : isLoading ? (
            <>
              <Skeleton className={cn("mb-1 h-9 w-16 rounded-md", skeletonClassName)} />
              {description ? (
                <p
                  className={cn(
                    "truncate text-xs font-medium leading-relaxed text-muted-foreground/70",
                    descriptionClassName
                  )}
                >
                  {description}
                </p>
              ) : null}
            </>
          ) : (
            <>
              <div
                className={cn(
                  "mb-0.5 text-3xl font-black tracking-tight text-foreground",
                  valueClassName
                )}
              >
                {value}
              </div>
              {description ? (
                <p
                  className={cn(
                    "truncate text-xs font-medium leading-relaxed text-muted-foreground/70",
                    descriptionClassName
                  )}
                >
                  {description}
                </p>
              ) : null}
            </>
          )}
        </CardContent>
        <div
          aria-hidden
          className={cn(
            "absolute bottom-0 left-0 right-0 h-1 opacity-0 transition-opacity duration-300 group-hover:opacity-100",
            accentStyle.bar
          )}
        />
      </Card>
    );
  }
);
KpiCard.displayName = "KpiCard";

export { KpiCard };
