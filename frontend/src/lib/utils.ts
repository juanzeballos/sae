import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Combina clases CSS de Tailwind de forma inteligente.
 *
 * Problema que resuelve:
 *   Si tenes "p-4" y le pasas "p-2", Tailwind genera ambas clases pero
 *   solo una gana. twMerge resuelve el conflicto y deja la ultima.
 *
 * Uso:
 *   cn("p-4 text-sm", isActive && "bg-blue-500", "p-2")
 *   → "text-sm bg-blue-500 p-2"  (p-4 fue reemplazado por p-2)
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
