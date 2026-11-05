"use client";

import * as React from "react";
import { FileText, UploadCloud, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatBytes } from "@/lib/ventanilla/rules";
import { ACCEPTED_FILE_TYPES, MAX_FILE_BYTES } from "@/lib/ventanilla/types";

interface FileDropProps {
  files: File[];
  onChange: (files: File[]) => void;
  onReject: (message: string) => void;
}

const ALLOWED = ACCEPTED_FILE_TYPES.split(",");

export function FileDrop({ files, onChange, onReject }: FileDropProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = React.useState(false);

  const add = (list: FileList | null) => {
    if (!list) return;
    const accepted: File[] = [];
    for (const f of Array.from(list)) {
      const ext = `.${f.name.split(".").pop()?.toLowerCase() ?? ""}`;
      // A1: archivo inválido se rechaza antes de radicar; no consume consecutivo.
      if (!ALLOWED.includes(ext)) onReject(`${f.name}: formato no permitido`);
      else if (f.size > MAX_FILE_BYTES) onReject(`${f.name}: supera los 10 MB`);
      else accepted.push(f);
    }
    onChange([...files, ...accepted]);
  };

  return (
    <div className="space-y-2">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          add(e.dataTransfer.files);
        }}
        className={cn(
          "rounded-xl border-2 border-dashed p-6 text-center text-sm text-muted-foreground transition-colors",
          dragging && "border-primary bg-primary/5"
        )}
      >
        <UploadCloud className="mx-auto mb-2 size-6" />
        Arrastra archivos aquí o{" "}
        <button type="button" className="font-semibold text-primary hover:underline" onClick={() => inputRef.current?.click()}>
          selecciónalos
        </button>
        <p className="mt-1 text-xs">PDF, Word, Excel o imagen · máximo 10 MB por archivo</p>
        <input
          ref={inputRef}
          id="attachments"
          type="file"
          multiple
          accept={ACCEPTED_FILE_TYPES}
          className="sr-only"
          onChange={(e) => {
            add(e.target.files);
            e.target.value = "";
          }}
        />
      </div>
      {files.map((f, i) => (
        <div key={`${f.name}-${i}`} className="flex items-center gap-3 rounded-xl border p-3">
          <FileText className="size-4 shrink-0 text-primary" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{f.name}</p>
            <p className="text-xs text-muted-foreground">{formatBytes(f.size)}</p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={`Quitar ${f.name}`}
            onClick={() => onChange(files.filter((_, j) => j !== i))}
          >
            <X className="size-4" />
          </Button>
        </div>
      ))}
    </div>
  );
}
