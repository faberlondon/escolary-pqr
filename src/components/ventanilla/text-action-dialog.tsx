"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface TextActionDialogProps {
  trigger: React.ReactNode;
  title: string;
  description: string;
  label: string;
  confirmLabel: string;
  minLength?: number;
  destructive?: boolean;
  /** Campo corto adicional obligatorio (p. ej. entidad destino de un traslado). */
  inputLabel?: string;
  inputPlaceholder?: string;
  onConfirm: (text: string, input: string) => void;
}

/** Diálogo con un campo de texto obligatorio (motivo, nota, respuesta). */
export function TextActionDialog({
  trigger,
  title,
  description,
  label,
  confirmLabel,
  minLength = 5,
  destructive,
  inputLabel,
  inputPlaceholder,
  onConfirm,
}: TextActionDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [text, setText] = React.useState("");
  const [input, setInput] = React.useState("");
  const id = React.useId();
  const valid = text.trim().length >= minLength && (!inputLabel || input.trim().length >= 3);

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) {
          setText("");
          setInput("");
        }
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {inputLabel ? (
          <div className="space-y-1.5">
            <Label htmlFor={`${id}-input`}>{inputLabel}</Label>
            <Input id={`${id}-input`} value={input} placeholder={inputPlaceholder} onChange={(e) => setInput(e.target.value)} />
          </div>
        ) : null}
        <div className="space-y-1.5">
          <Label htmlFor={id}>{label}</Label>
          <Textarea id={id} rows={4} value={text} onChange={(e) => setText(e.target.value)} />
          <p className="text-xs text-muted-foreground">Mínimo {minLength} caracteres.</p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button
            variant={destructive ? "destructive" : "default"}
            disabled={!valid}
            onClick={() => {
              onConfirm(text.trim(), input.trim());
              setOpen(false);
              setText("");
              setInput("");
            }}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
