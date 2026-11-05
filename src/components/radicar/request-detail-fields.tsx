"use client";

import { Controller, type Control, type FieldErrors, type UseFormRegister } from "react-hook-form";

import { FormField } from "@/components/radicar/form-field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { AREAS, DOCUMENT_TYPES, PETITION_SUBTYPE_LABELS, PETITION_SUBTYPES } from "@/lib/ventanilla/types";
import type { RadicadoKind, RadicarFormValues } from "@/lib/ventanilla/types";

interface RequestDetailFieldsProps {
  kind: RadicadoKind;
  control: Control<RadicarFormValues>;
  register: UseFormRegister<RadicarFormValues>;
  errors: FieldErrors<RadicarFormValues>;
}

function OptionSelect<T extends string>({
  id,
  value,
  onChange,
  options,
  labels,
}: {
  id: string;
  value: T | undefined;
  onChange: (v: T) => void;
  options: readonly T[];
  labels?: Record<T, string>;
}) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as T)}>
      <SelectTrigger id={id}>
        <SelectValue placeholder="Selecciona…" />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o} value={o}>
            {labels ? labels[o] : o}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function RequestDetailFields({ kind, control, register, errors }: RequestDetailFieldsProps) {
  return (
    <fieldset className="space-y-4">
      <legend className="mb-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">Tu solicitud</legend>
      <div className="grid gap-4 sm:grid-cols-2">
        {kind === "DOC" ? (
          <FormField id="documentType" label="Tipo de documento" error={errors.documentType?.message}>
            <Controller
              control={control}
              name="documentType"
              render={({ field }) => (
                <OptionSelect id="documentType" value={field.value} onChange={field.onChange} options={DOCUMENT_TYPES} />
              )}
            />
          </FormField>
        ) : null}
        {kind === "PET" ? (
          <FormField id="petitionSubtype" label="Tipo de petición">
            <Controller
              control={control}
              name="petitionSubtype"
              render={({ field }) => (
                <OptionSelect
                  id="petitionSubtype"
                  value={field.value}
                  onChange={field.onChange}
                  options={PETITION_SUBTYPES}
                  labels={PETITION_SUBTYPE_LABELS}
                />
              )}
            />
          </FormField>
        ) : null}
        <FormField id="area" label="Dirigido a">
          <Controller
            control={control}
            name="area"
            render={({ field }) => <OptionSelect id="area" value={field.value} onChange={field.onChange} options={AREAS} />}
          />
        </FormField>
      </div>
      <FormField id="subject" label="Asunto" error={errors.subject?.message}>
        <Input id="subject" className="text-base sm:text-sm" {...register("subject")} />
      </FormField>
      <FormField id="description" label="Descripción" error={errors.description?.message}>
        <Textarea id="description" rows={5} className="text-base sm:text-sm" {...register("description")} />
      </FormField>
    </fieldset>
  );
}
