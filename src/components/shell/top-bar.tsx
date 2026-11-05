"use client";

import { Moon, RotateCcw, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { useVentanilla } from "@/components/providers/ventanilla-provider";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { DEMO_USERS, ROLE_LABELS } from "@/lib/ventanilla/users";

export function TopBar() {
  const { resolvedTheme, setTheme } = useTheme();
  const { resetDemo, user, setUser } = useVentanilla();
  const { toast } = useToast();
  const initials = user.name
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
        {/* Demo: cambia de usuario para ver qué ve cada rol (RN-07). */}
        <Select value={user.id} onValueChange={setUser}>
          <SelectTrigger className="h-auto w-auto gap-2 border-0 bg-transparent px-2 py-1 text-right shadow-none" aria-label="Ver la demo como">
            <SelectValue>
              <span className="block text-sm font-semibold leading-tight">{user.name}</span>
              <span className="block text-xs leading-tight text-muted-foreground">{ROLE_LABELS[user.role]}</span>
            </SelectValue>
          </SelectTrigger>
          <SelectContent align="end">
            {DEMO_USERS.map((u) => (
              <SelectItem key={u.id} value={u.id}>
                {u.name} · {ROLE_LABELS[u.role]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="grid size-9 place-items-center rounded-full bg-primary/10 text-sm font-bold text-primary">{initials}</span>
      </div>
    </div>
  );
}
