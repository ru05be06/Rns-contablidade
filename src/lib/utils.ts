import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrencyBRL(value: number | string | null | undefined) {
  const num = typeof value === "string" ? Number(value) : value ?? 0;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(num ?? 0);
}

export function formatDateBR(date: Date | string | null | undefined) {
  if (!date) return "-";
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo" }).format(d);
}

export function formatDateTimeBR(date: Date | string | null | undefined) {
  if (!date) return "-";
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    dateStyle: "short",
    timeStyle: "short",
  }).format(d);
}

export function daysUntil(date: Date | string | null | undefined) {
  if (!date) return null;
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfTarget = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffMs = startOfTarget.getTime() - startOfToday.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

export type DeadlineUrgency = "verde" | "amarelo" | "laranja" | "vermelho";

/** Classificação visual de prazos: seção 18 do escopo funcional. */
export function deadlineUrgency(date: Date | string | null | undefined): DeadlineUrgency {
  const days = daysUntil(date);
  if (days === null) return "verde";
  if (days <= 0) return "vermelho";
  if (days <= 2) return "laranja";
  if (days <= 5) return "amarelo";
  return "verde";
}

export function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join("");
}

export function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
