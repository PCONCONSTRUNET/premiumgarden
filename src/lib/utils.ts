import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCpfCnpj(value: string) {
  const v = value.replace(/\D/g, "");
  if (v.length <= 11) {
    return v
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  }
  return v
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d{1,2})$/, "$1-$2")
    .substring(0, 18);
}

export function formatPhone(value: string) {
  const v = value.replace(/\D/g, "");
  if (v.length <= 10) {
    return v
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{4})(\d)/, "$1-$2")
      .substring(0, 14);
  }
  return v
    .replace(/(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2")
    .substring(0, 15);
}

/**
 * Formata o número do pedido com 4 dígitos (zero à esquerda).
 * Ex: 1 → "0001" | 42 → "0042" | 3282 → "3282" | 10000 → "10000"
 * Se não houver número, usa os primeiros 8 chars do ID em maiúsculo.
 */
export function formatNumero(numero?: number | string | null, id?: string | null): string {
  if (numero !== null && numero !== undefined && numero !== "") {
    return String(numero).padStart(4, "0");
  }
  if (id) return id.substring(0, 8).toUpperCase();
  return "S/N";
}
