import { describe, expect, it } from "vitest";
import { deadlineUrgency, daysUntil, formatCurrencyBRL, slugify } from "@/lib/utils";

function addDays(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

describe("daysUntil / deadlineUrgency (seção 18 — alertas de prazo)", () => {
  it("retorna null para datas ausentes", () => {
    expect(daysUntil(null)).toBeNull();
    expect(deadlineUrgency(null)).toBe("verde");
  });

  it("classifica como vermelho quando o prazo já venceu ou é hoje", () => {
    expect(deadlineUrgency(addDays(-1))).toBe("vermelho");
    expect(deadlineUrgency(addDays(0))).toBe("vermelho");
  });

  it("classifica como laranja quando faltam 1 a 2 dias", () => {
    expect(deadlineUrgency(addDays(1))).toBe("laranja");
    expect(deadlineUrgency(addDays(2))).toBe("laranja");
  });

  it("classifica como amarelo quando faltam 3 a 5 dias", () => {
    expect(deadlineUrgency(addDays(3))).toBe("amarelo");
    expect(deadlineUrgency(addDays(5))).toBe("amarelo");
  });

  it("classifica como verde quando faltam mais de 5 dias", () => {
    expect(deadlineUrgency(addDays(6))).toBe("verde");
    expect(deadlineUrgency(addDays(30))).toBe("verde");
  });
});

describe("formatCurrencyBRL", () => {
  it("formata valores em Real brasileiro", () => {
    expect(formatCurrencyBRL(1234.5)).toBe("R$ 1.234,50");
    expect(formatCurrencyBRL(null)).toBe("R$ 0,00");
  });
});

describe("slugify", () => {
  it("remove acentos e caracteres especiais", () => {
    expect(slugify("Contabilidade Mensal Ltda.")).toBe("contabilidade-mensal-ltda");
  });
});
