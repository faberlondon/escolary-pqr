"use client";

import { Controller, type Control, type FieldErrors, type UseFormRegister } from "react-hook-form";

import { FormField } from "@/components/radicar/form-field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { VentanillaConfig } from "@/lib/ventanilla/config";
import { formatCivilDate } from "@/lib/ventanilla/rules";
import { PERIODS, PETITION_SUBTYPE_LABELS, PETITION_SUBTYPES } from "@/lib/ventanilla/types";
import type { RadicadoKind, RadicarFormValues } from "@/lib/ventanilla/types";

interface RequestDetailFieldsProps {
  kind: RadicadoKind;
  config: VentanillaConfig;
  control: Control<RadicarFormValues>;
  register: UseFormRegister<RadicarFormValues>;
  errors: FieldErrors<RadicarFormValues>;
}

function OptionSelect({
  id,
  value,
  onChange,
  options,
}: {
  id: string;
  value: string | undefined;
  onChange: (v: string) => void;
  options: ReadonlyArray<{ value: string; label: string }>;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger id={id}>
        <SelectValue placeholder="Selecciona…" />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function RequestDetailFields({ kind, config, control, register, errors }: RequestDetailFieldsProps) {
  const isDoc = kind === "DOC";
  const docOptions = config.documentTypes.map((d) => ({
    value: d.name,
    label: d.deadline ? `${d.name} · límite ${formatCivilDate(d.deadline)}` : d.name,
  }));
  const subtypeOptions = PETITION_SUBTYPES.map((s) => ({
    value: s,
    label: `${PETITION_SUBTYPE_LABELS[s]} (${config.terms[s]} días hábiles)`,
  }));
  const areaOptions = config.areas.map((a) => ({ value: a.name, label: a.name }));

  return (
    <fieldset className="space-y-4">
      <legend className="mb-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">Tu solicitud</legend>
      <div className="grid gap-4 sm:grid-cols-2">
        {isDoc ? (
          <FormField id="documentType" label="Tipo de documento" error={errors.documentType?.message}>
            <Controller
              control={control}
              name="documentType"
              render={({ field }) => <OptionSelect id="documentType" value={field.value} onChange={field.onChange} options={docOptions} />}
            />
          </FormField>
        ) : null}
        {kind === "PET" ? (
          <FormField id="petitionSubtype" label="Tipo de petición">
            <Controller
              control={control}
              name="petitionSubtype"
              render={({ field }) => (
                <OptionSelect id="petitionSubtype" value={field.value} onChange={field.onChange} options={subtypeOptions} />
              )}
            />
          </FormField>
        ) : null}
        <FormField id="area" label={isDoc ? "Destinatario" : "Área relacionada"} error={errors.area?.message}>
          <Controller
            control={control}
            name="area"
            render={({ field }) => <OptionSelect id="area" value={field.value} onChange={field.onChange} options={areaOptions} />}
          />
        </FormField>
      </div>
      {isDoc ? (
        <div className="grid gap-4 sm:grid-cols-3">
          <FormField id="group" label="Grupo" hint="Opcional">
            <Input id="group" placeholder="9°A" className="text-base sm:text-sm" {...register("group")} />
          </FormField>
          <FormField id="course" label="Asignatura" hint="Opcional">
            <Input id="course" placeholder="Matemáticas" className="text-base sm:text-sm" {...register("course")} />
          </FormField>
          <FormField id="period" label="Periodo" hint="Opcional">
            <Controller
              control={control}
              name="period"
              render={({ field }) => (
                <OptionSelect id="period" value={field.value} onChange={field.onChange} options={PERIODS.map((p) => ({ value: p, label: p }))} />
              )}
            />
          </FormField>
        </div>
      ) : (
        <FormField id="involved" label="Estudiante o grupo involucrado" hint="Opcional · solo lo ven quienes atienden el caso">
          <Input id="involved" className="text-base sm:text-sm" {...register("involved")} />
        </FormField>
      )}
      <FormField id="subject" label="Asunto" error={errors.subject?.message}>
        <Input id="subject" className="text-base sm:text-sm" {...register("subject")} />
      </FormField>
      <FormField id="description" label="Descripción" error={errors.description?.message}>
        <Textarea id="description" rows={5} className="text-base sm:text-sm" {...register("description")} />
      </FormField>
    </fieldset>
  );
}
