"use client";

import * as React from "react";
import { Plus, Save, Trash2, Undo2 } from "lucide-react";

import { useVentanilla } from "@/components/providers/ventanilla-provider";
import { PageHeader } from "@/components/shell/page-header";
import { RoleGate } from "@/components/shell/role-gate";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { TERM_LABELS, type TermKey, type VentanillaConfig } from "@/lib/ventanilla/config";
import { canManageConfig } from "@/lib/ventanilla/users";

function Field({ id, label, hint, children }: { id: string; label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0 space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

const int = (v: string, min: number, max: number): number => Math.min(max, Math.max(min, Math.round(Number(v) || 0)));

function validate(c: VentanillaConfig): string | null {
  if (!/^[A-Z]{2,8}$/.test(c.acronym)) return "La sigla debe tener de 2 a 8 letras mayúsculas.";
  if (c.areas.some((a) => !a.name.trim() || !a.responsible.trim())) return "Cada área necesita nombre y responsable.";
  if (new Set(c.areas.map((a) => a.name.trim())).size !== c.areas.length) return "Hay áreas repetidas.";
  if (c.documentTypes.some((d) => !d.name.trim())) return "Cada tipología documental necesita nombre.";
  if (!c.acceptedFormats.split(",").every((f) => /^\.[a-z0-9]{2,5}$/.test(f.trim()))) return "Formatos: extensiones separadas por coma, p. ej. .pdf,.docx";
  return null;
}

function ConfigContent() {
  const { state, dispatch, actor } = useVentanilla();
  const { toast } = useToast();
  const [draft, setDraft] = React.useState<VentanillaConfig>(state.config);
  const dirty = JSON.stringify(draft) !== JSON.stringify(state.config);
  const set = <K extends keyof VentanillaConfig>(key: K, value: VentanillaConfig[K]) => setDraft((d) => ({ ...d, [key]: value }));

  const save = () => {
    const clean: VentanillaConfig = {
      ...draft,
      acronym: draft.acronym.trim().toUpperCase(),
      acceptedFormats: draft.acceptedFormats.split(",").map((f) => f.trim().toLowerCase()).filter(Boolean).join(","),
      areas: draft.areas.map((a) => ({ name: a.name.trim(), responsible: a.responsible.trim() })),
      documentTypes: draft.documentTypes.map((d) => ({ name: d.name.trim(), deadline: d.deadline || undefined })),
    };
    const error = validate(clean);
    if (error) {
      toast({ variant: "destructive", title: "Revisa la configuración", description: error });
      return;
    }
    dispatch({ type: "updateConfig", config: clean, actor });
    setDraft(clean);
    toast({ title: "Configuración guardada", description: "Aplica a los radicados nuevos; los existentes no cambian." });
  };

  return (
    <div className="space-y-8 duration-500 animate-in fade-in">
      <PageHeader
        title="Configuración"
        description="Sigla, áreas, tipologías, plazos, adjuntos y textos legales de la ventanilla (UC-ENC-01)."
        actions={
          <>
            <Button variant="outline" disabled={!dirty} onClick={() => setDraft(state.config)}>
              <Undo2 className="size-4" />
              Descartar
            </Button>
            <Button disabled={!dirty} onClick={save}>
              <Save className="size-4" />
              Guardar cambios
            </Button>
          </>
        }
      />
      <div className="@container">
        <div className="grid gap-6 @5xl:grid-cols-2">
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="text-lg">Institución y consecutivo</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-3">
              <Field id="acronym" label="Sigla de la IE" hint={`Ej.: ${draft.acronym || "IEWS"}-2026-PET-000001`}>
                <Input id="acronym" value={draft.acronym} maxLength={8} className="font-mono uppercase" onChange={(e) => set("acronym", e.target.value.toUpperCase())} />
              </Field>
              <Field id="cutoff" label="Hora de corte" hint="Desde esta hora cuenta el día hábil siguiente">
                <Input id="cutoff" type="number" min={0} max={23} value={draft.cutoffHour} onChange={(e) => set("cutoffHour", int(e.target.value, 0, 23))} />
              </Field>
              <Field id="close" label="Cierre sin réplica" hint="Días hábiles tras responder">
                <Input id="close" type="number" min={1} max={60} value={draft.closeAfterDays} onChange={(e) => set("closeAfterDays", int(e.target.value, 1, 60))} />
              </Field>
              {draft.acronym !== state.config.acronym ? (
                <p className="text-xs text-amber-700 sm:col-span-3 dark:text-amber-400">
                  Cambiar la sigla inicia un consecutivo nuevo. Los radicados existentes conservan su número (RN-01).
                </p>
              ) : null}
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="text-lg">Plazos de respuesta (días hábiles)</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              {(Object.keys(TERM_LABELS) as TermKey[]).map((k) => (
                <Field key={k} id={`term-${k}`} label={TERM_LABELS[k]}>
                  <Input
                    id={`term-${k}`}
                    type="number"
                    min={1}
                    max={60}
                    value={draft.terms[k]}
                    onChange={(e) => set("terms", { ...draft.terms, [k]: int(e.target.value, 1, 60) })}
                  />
                </Field>
              ))}
              <p className="text-xs text-muted-foreground sm:col-span-2">
                Ley 1755 de 2015: 15 general, 10 documentos e información, 30 consultas. La prórroga admite hasta el doble.
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-lg">Áreas y responsables</CardTitle>
              <Button variant="outline" size="sm" onClick={() => set("areas", [...draft.areas, { name: "", responsible: "" }])}>
                <Plus className="size-4" />
                Área
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {draft.areas.map((a, i) => (
                <div key={i} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] gap-2">
                  <Input
                    aria-label={`Área ${i + 1}`}
                    placeholder="Área"
                    value={a.name}
                    onChange={(e) => set("areas", draft.areas.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))}
                  />
                  <Input
                    aria-label={`Responsable del área ${i + 1}`}
                    placeholder="Responsable"
                    value={a.responsible}
                    onChange={(e) => set("areas", draft.areas.map((x, j) => (j === i ? { ...x, responsible: e.target.value } : x)))}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Quitar área ${a.name}`}
                    disabled={draft.areas.length <= 1}
                    onClick={() => set("areas", draft.areas.filter((_, j) => j !== i))}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-lg">Tipologías documentales</CardTitle>
              <Button variant="outline" size="sm" onClick={() => set("documentTypes", [...draft.documentTypes, { name: "" }])}>
                <Plus className="size-4" />
                Tipología
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-muted-foreground">Con fecha límite, lo entregado después queda marcado “extemporáneo” sin bloquear la entrega.</p>
              {draft.documentTypes.map((d, i) => (
                <div key={i} className="grid grid-cols-[minmax(0,1fr)_10rem_auto] gap-2">
                  <Input
                    aria-label={`Tipología ${i + 1}`}
                    placeholder="Tipo de documento"
                    value={d.name}
                    onChange={(e) => set("documentTypes", draft.documentTypes.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))}
                  />
                  <Input
                    type="date"
                    aria-label={`Fecha límite de ${d.name || "la tipología"}`}
                    value={d.deadline ?? ""}
                    onChange={(e) => set("documentTypes", draft.documentTypes.map((x, j) => (j === i ? { ...x, deadline: e.target.value } : x)))}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Quitar ${d.name}`}
                    disabled={draft.documentTypes.length <= 1}
                    onClick={() => set("documentTypes", draft.documentTypes.filter((_, j) => j !== i))}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="text-lg">Adjuntos</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_8rem]">
              <Field id="formats" label="Formatos permitidos" hint="Extensiones separadas por coma">
                <Input id="formats" value={draft.acceptedFormats} className="font-mono" onChange={(e) => set("acceptedFormats", e.target.value)} />
              </Field>
              <Field id="maxmb" label="Tamaño máximo" hint="MB por archivo">
                <Input id="maxmb" type="number" min={1} max={50} value={draft.maxFileMb} onChange={(e) => set("maxFileMb", int(e.target.value, 1, 50))} />
              </Field>
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="text-lg">Textos legales y plantillas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Field id="habeas" label="Política de tratamiento de datos" hint="Se muestra al radicar (Ley 1581 de 2012)">
                <Textarea id="habeas" rows={3} value={draft.habeasText} onChange={(e) => set("habeasText", e.target.value)} />
              </Field>
              <Field id="ack" label="Plantilla del acuse" hint="Variables: {radicado}, {fecha}, {vence}">
                <Textarea id="ack" rows={3} value={draft.ackTemplate} onChange={(e) => set("ackTemplate", e.target.value)} />
              </Field>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function ConfigPage() {
  return (
    <RoleGate allow={canManageConfig}>
      <ConfigContent />
    </RoleGate>
  );
}
