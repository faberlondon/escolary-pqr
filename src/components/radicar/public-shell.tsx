import { SCHOOL } from "@/lib/ventanilla/rules";

interface PublicShellProps {
  title: string;
  description: string;
  children: React.ReactNode;
}

/** Marco de las páginas que ve la ciudadanía: sin sidebar, con identidad del colegio. */
export function PublicShell({ title, description, children }: PublicShellProps) {
  return (
    <div className="min-h-dvh bg-background">
      <div className="h-2 bg-primary" />
      <main className="mx-auto w-full max-w-3xl space-y-6 px-4 py-8 sm:py-12">
        <header className="flex items-center gap-4">
          <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-primary text-lg font-black text-primary-foreground">
            IE
          </span>
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{SCHOOL.name}</p>
            <h1 className="text-balance text-2xl font-black tracking-tight sm:text-3xl">{title}</h1>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </header>
        {children}
        <footer className="pt-4 text-center text-xs text-muted-foreground">
          Plataforma eScolary · Demo con datos de ejemplo
        </footer>
      </main>
    </div>
  );
}
