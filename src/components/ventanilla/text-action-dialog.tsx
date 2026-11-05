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
  onConfirm: (text: string) => void;
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
  onConfirm,
}: TextActionDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [text, setText] = React.useState("");
  const id = React.useId();
  const valid = text.trim().length >= minLength;

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) setText("");
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
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
              onConfirm(text.trim());
              setOpen(false);
              setText("");
            }}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
