"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link2, Loader2, Stamp } from "lucide-react";
import { Controller, useForm } from "react-hook-form";

import { useVentanilla } from "@/components/providers/ventanilla-provider";
import { FileDrop } from "@/components/radicar/file-drop";
import { FormField } from "@/components/radicar/form-field";
import { KindPicker } from "@/components/radicar/kind-picker";
import { RequestDetailFields } from "@/components/radicar/request-detail-fields";
import { RequesterFields } from "@/components/radicar/requester-fields";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { radicarFormSchema } from "@/lib/ventanilla/types";
import type { Channel, Radicado, RadicarFormValues } from "@/lib/ventanilla/types";

interface RadicarFormProps {
  channel: Channel;
  onBehalfOf?: string;
  /** A3: corrección de un documento devuelto, con los datos del original. */
  correctionOf?: Radicado;
  onDone: (radicado: Radicado) => void;
}

/** RNF-08 (demo): límite de envíos por navegador en el formulario público. */
const RATE_KEY = "ventanilla-demo-rate";
const RATE_MAX = 5;
const RATE_WINDOW_MS = 10 * 60_000;

function rateLimited(): boolean {
  try {
    const now = Date.now();
    const recent = (JSON.parse(window.localStorage.getItem(RATE_KEY) ?? "[]") as number[]).filter((t) => now - t < RATE_WINDOW_MS);
    if (recent.length >= RATE_MAX) return true;
    window.localStorage.setItem(RATE_KEY, JSON.stringify([...recent, now]));
    return false;
  } catch {
    return false;
  }
}

export function RadicarForm({ channel, onBehalfOf, correctionOf, onDone }: RadicarFormProps) {
  const { radicate, state } = useVentanilla();
  const { config } = state;
  const { toast } = useToast();
  const [files, setFiles] = React.useState<File[]>([]);

  const defaults = React.useMemo<RadicarFormValues>(() => {
    const base: RadicarFormValues = {
      kind: "PET",
      petitionSubtype: "general",
      area: config.areas[0]?.name ?? "",
      role: "acudiente",
      anonymous: false,
      name: "",
      documentId: "",
      email: "",
      phone: "",
      subject: "",
      description: "",
      habeasData: false,
      website: "",
    };
    if (!correctionOf) return base;
    const req = correctionOf.requester;
    return {
      ...base,
      kind: "DOC",
      documentType: correctionOf.documentType,
      area: correctionOf.area,
      group: correctionOf.group ?? "",
      course: correctionOf.course ?? "",
      period: correctionOf.period,
      role: "docente",
      name: req.name,
      documentId: req.documentId ?? "",
      email: req.email ?? "",
      phone: req.phone ?? "",
      subject: `Corrección: ${correctionOf.subject}`,
    };
  }, [config.areas, correctionOf]);

  const form = useForm<RadicarFormValues>({ resolver: zodResolver(radicarFormSchema), defaultValues: defaults });
  const { control, register, handleSubmit, watch, setValue, formState } = form;
  const kind = watch("kind");
  const anonymous = watch("anonymous");

  const onKindChange = (next: RadicarFormValues["kind"]) => {
    setValue("kind", next);
    if (next === "DOC") {
      setValue("role", "docente");
      setValue("documentType", config.documentTypes[0]?.name);
    }
    if (!["QUE", "REC", "SUG"].includes(next)) setValue("anonymous", false);
  };

  const onSubmit = handleSubmit(async (values) => {
    if (channel === "web" && !onBehalfOf && rateLimited()) {
      toast({ variant: "destructive", title: "Demasiados envíos", description: "Espera unos minutos antes de radicar de nuevo." });
      return;
    }
    try {
      const radicado = await radicate({ values, files, channel, onBehalfOf, linkedTo: correctionOf?.number });
      setFiles([]);
      form.reset(defaults);
      onDone(radicado);
    } catch {
      toast({ variant: "destructive", title: "No se pudo radicar", description: "Revisa los adjuntos e inténtalo de nuevo." });
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      {correctionOf ? (
        <div className="flex items-start gap-3 rounded-xl bg-primary/5 p-3 text-sm">
          <Link2 className="mt-0.5 size-4 shrink-0 text-primary" />
          <p>
            Radicas la corrección del documento <span className="font-mono font-semibold">{correctionOf.number}</span>. Quedará como
            un radicado nuevo vinculado al original, que se conserva sin cambios.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-sm font-bold uppercase tracking-wider text-muted-foreground">¿Qué quieres radicar?</p>
          <KindPicker value={kind} onChange={onKindChange} />
        </div>
      )}
      <RequesterFields kind={kind} anonymous={anonymous} control={control} register={register} errors={formState.errors} />
      <RequestDetailFields kind={kind} config={config} control={control} register={register} errors={formState.errors} />
      <FormField id="attachments" label="Adjuntos" hint="Cada archivo queda con su huella SHA-256 en el acuse">
        <FileDrop
          files={files}
          onChange={setFiles}
          accept={config.acceptedFormats}
          maxMb={config.maxFileMb}
          onReject={(m) => toast({ variant: "destructive", title: "Archivo rechazado", description: m })}
        />
      </FormField>
      {/* Campo trampa: invisible para personas, los bots lo llenan y el envío se rechaza. */}
      <input type="text" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" {...register("website")} />
      <Controller
        control={control}
        name="habeasData"
        render={({ field, fieldState }) => (
          <div className="space-y-1">
            <label className="flex items-start gap-3 text-sm">
              <Checkbox id="habeasData" checked={field.value} onCheckedChange={(v) => field.onChange(v === true)} />
              <span>{config.habeasText}</span>
            </label>
            {fieldState.error ? <p className="text-xs font-medium text-destructive">{fieldState.error.message}</p> : null}
          </div>
        )}
      />
      <Button type="submit" size="lg" className="w-full" disabled={formState.isSubmitting}>
        {formState.isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <Stamp className="size-4" />}
        Radicar y obtener número
      </Button>
    </form>
  );
}
