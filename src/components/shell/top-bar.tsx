"use client";

import { Moon, RotateCcw, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { CURRENT_USER, useVentanilla } from "@/components/providers/ventanilla-provider";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export function TopBar() {
  const { resolvedTheme, setTheme } = useTheme();
  const { resetDemo } = useVentanilla();
  const { toast } = useToast();
  const initials = CURRENT_USER.name
    .split(" ")
    .map((p) => p[0])
    .join("");

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          resetDemo();
          toast({ title: "Datos de ejemplo restablecidos" });
        }}
      >
        <RotateCcw className="size-4" />
        <span className="hidden sm:inline">Restablecer demo</span>
      </Button>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Cambiar tema"
        onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      >
        <Sun className="size-4 dark:hidden" />
        <Moon className="hidden size-4 dark:block" />
      </Button>
      <div className="flex items-center gap-2.5 pl-2">
        <div className="text-right text-sm leading-tight">
          <p className="font-semibold">{CURRENT_USER.name}</p>
          <p className="text-xs text-muted-foreground">{CURRENT_USER.role}</p>
        </div>
        <span className="grid size-9 place-items-center rounded-full bg-primary/10 text-sm font-bold text-primary">
          {initials}
        </span>
      </div>
    </div>
  );
}
