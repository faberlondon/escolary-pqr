interface PageHeaderProps {
  title: string;
  description?: string;
  eyebrow?: React.ReactNode;
  actions?: React.ReactNode;
}

/** Mismo encabezado de página que el Centro de Reportes de eScolary. */
export function PageHeader({ title, description, eyebrow, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
      <div className="min-w-0 space-y-1">
        {eyebrow}
        <h1 className="text-balance bg-gradient-to-br from-foreground via-foreground/80 to-foreground/50 bg-clip-text text-3xl font-black tracking-tight text-transparent sm:text-4xl">
          {title}
        </h1>
        {description ? <p className="text-base font-medium text-muted-foreground sm:text-lg">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}
