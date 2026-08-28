import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export function formatCurrency(value: number | string) {
  const num = typeof value === "string" ? Number(value) : value;
  return currencyFormatter.format(num);
}

const dateFormatter = new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" });

export function formatDate(value: Date | string) {
  const date = typeof value === "string" ? new Date(value) : value;
  return dateFormatter.format(date);
}

/**
 * "2026" quando o ano fiscal coincide com o ano civil; "2026/2027" quando o
 * ano fiscal da empresa começa num mês diferente de janeiro, para deixar
 * claro que o período não é jan–dez.
 */
export function formatAnoFiscal(ano: number, mesInicioAnoFiscal: number) {
  if (mesInicioAnoFiscal === 1) return String(ano);
  return `${ano}/${ano + 1}`;
}
