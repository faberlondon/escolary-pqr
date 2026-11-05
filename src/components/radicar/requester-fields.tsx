"use client";

import { Controller, type Control, type FieldErrors, type UseFormRegister } from "react-hook-form";

import { FormField } from "@/components/radicar/form-field";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { REQUESTER_ROLE_LABELS, REQUESTER_ROLES } from "@/lib/ventanilla/types";
import type { RadicadoKind, RadicarFormValues } from "@/lib/ventanilla/types";

interface RequesterFieldsProps {
  kind: RadicadoKind;
  anonymous: boolean;
  control: Control<RadicarFormValues>;
  register: UseFormRegister<RadicarFormValues>;
  errors: FieldErrors<RadicarFormValues>;
}

const canBeAnonymous = (k: RadicadoKind): boolean => k === "QUE" || k === "REC" || k === "SUG";

export function RequesterFields({ kind, anonymous, control, register, errors }: RequesterFieldsProps) {
  return (
    <fieldset className="space-y-4">
      <legend className="mb-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">Tus datos</legend>
      {canBeAnonymous(kind) ? (
        <Controller
          control={control}
          name="anonymous"
          render={({ field }) => (
            <label className="flex items-start gap-3 rounded-xl bg-muted/60 p-3 text-sm">
              <Checkbox id="anonymous" checked={field.value} onCheckedChange={(v) => field.onChange(v === true)} />
              <span>
                <span className="font-semibold">Radicar de forma anónima</span>
                <span className="block text-xs text-muted-foreground">
                  No recibirás correo; consultarás el estado solo con el número de radicado.
                </span>
              </span>
            </label>
          )}
        />
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField id="role" label="Calidad en la que radicas" error={errors.role?.message}>
          <Controller
            control={control}
            name="role"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange} disabled={kind === "DOC"}>
                <SelectTrigger id="role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {REQUESTER_ROLES.map((r) => (
                    <SelectItem key={r} value={r}>
                      {REQUESTER_ROLE_LABELS[r]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </FormField>
        {!anonymous ? (
          <FormField id="name" label="Nombre completo" error={errors.name?.message}>
            <Input id="name" autoComplete="name" className="text-base sm:text-sm" {...register("name")} />
          </FormField>
        ) : null}
      </div>
      {!anonymous ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField id="email" label="Correo para el acuse" error={errors.email?.message}>
            <Input id="email" type="email" autoComplete="email" className="text-base sm:text-sm" {...register("email")} />
          </FormField>
          <FormField id="phone" label="Celular (WhatsApp)" hint="Opcional · te enviamos el acuse también por WhatsApp">
            <Input id="phone" type="tel" autoComplete="tel" className="text-base sm:text-sm" {...register("phone")} />
          </FormField>
        </div>
      ) : null}
    </fieldset>
  );
}
