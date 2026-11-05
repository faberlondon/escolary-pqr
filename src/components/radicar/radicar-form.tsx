"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Stamp } from "lucide-react";
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
  onDone: (radicado: Radicado) => void;
}

const DEFAULTS: RadicarFormValues = {
  kind: "PET",
  petitionSubtype: "general",
  area: "Coordinación académica",
  role: "acudiente",
  anonymous: false,
  name: "",
  email: "",
  phone: "",
  subject: "",
  description: "",
  habeasData: false,
};

export function RadicarForm({ channel, onBehalfOf, onDone }: RadicarFormProps) {
  const { radicate } = useVentanilla();
  const { toast } = useToast();
  const [files, setFiles] = React.useState<File[]>([]);
  const form = useForm<RadicarFormValues>({ resolver: zodResolver(radicarFormSchema), defaultValues: DEFAULTS });
  const { control, register, handleSubmit, watch, setValue, formState } = form;
  const kind = watch("kind");
  const anonymous = watch("anonymous");

  const onKindChange = (next: RadicarFormValues["kind"]) => {
    setValue("kind", next);
    if (next === "DOC") {
      setValue("role", "docente");
      setValue("documentType", "Acta de reunión");
    }
    if (!["QUE", "REC", "SUG"].includes(next)) setValue("anonymous", false);
  };

  const onSubmit = handleSubmit(async (values) => {
    try {
      const radicado = await radicate({ values, files, channel, onBehalfOf });
      setFiles([]);
      form.reset(DEFAULTS);
      onDone(radicado);
    } catch {
      toast({ variant: "destructive", title: "No se pudo radicar", description: "Revisa los adjuntos e inténtalo de nuevo." });
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      <div className="space-y-2">
        <p className="text-sm font-bold uppercase tracking-wider text-muted-foreground">¿Qué quieres radicar?</p>
        <KindPicker value={kind} onChange={onKindChange} />
      </div>
      <RequesterFields kind={kind} anonymous={anonymous} control={control} register={register} errors={formState.errors} />
      <RequestDetailFields kind={kind} control={control} register={register} errors={formState.errors} />
      <FormField id="attachments" label="Adjuntos" hint="Cada archivo queda con su huella SHA-256 en el acuse">
        <FileDrop
          files={files}
          onChange={setFiles}
          onReject={(m) => toast({ variant: "destructive", title: "Archivo rechazado", description: m })}
        />
      </FormField>
      <Controller
        control={control}
        name="habeasData"
        render={({ field, fieldState }) => (
          <div className="space-y-1">
            <label className="flex items-start gap-3 text-sm">
              <Checkbox id="habeasData" checked={field.value} onCheckedChange={(v) => field.onChange(v === true)} />
              <span>
                Autorizo el tratamiento de mis datos personales para gestionar esta solicitud, según la política de la
                institución (Ley 1581 de 2012).
              </span>
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
