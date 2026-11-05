import { clsx, type ClassValue } from "clsx"
import { extendTailwindMerge } from "tailwind-merge"

// tailwind-merge solo conoce la escala por defecto: sin esto no ve que
// `max-w-modal-md` (tailwind.config.ts) compite con `max-w-xl` o
// `max-w-[680px]`, deja las dos clases y el ancho que pide quien usa el
// componente pierde contra el de la primitiva (`dialog.tsx`).
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "max-w": [{ "max-w": ["modal-sm", "modal-md", "modal-lg", "modal-xl"] }],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

