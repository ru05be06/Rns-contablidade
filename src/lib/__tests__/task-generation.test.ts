import { describe, expect, it } from "vitest";
import { competenceLabel, computeCompetenceDates } from "@/lib/task-generation";
import { Periodicity } from "@prisma/client";

describe("computeCompetenceDates (seção 15/16 — recorrência e competência)", () => {
  const now = new Date(2026, 8, 1); // 09/2026

  it("gera uma única competência para serviços de periodicidade única", () => {
    const dates = computeCompetenceDates(Periodicity.UNICA, now, 3);
    expect(dates).toHaveLength(1);
    expect(competenceLabel(dates[0])).toBe("09/2026");
  });

  it("gera competências mensais consecutivas", () => {
    const dates = computeCompetenceDates(Periodicity.MENSAL, now, 3);
    const labels = dates.map(competenceLabel);
    expect(labels).toEqual(["09/2026", "10/2026", "11/2026", "12/2026"]);
  });

  it("gera competências trimestrais espaçadas corretamente", () => {
    const dates = computeCompetenceDates(Periodicity.TRIMESTRAL, now, 6);
    const labels = dates.map(competenceLabel);
    expect(labels).toEqual(["09/2026", "12/2026", "03/2027"]);
  });

  it("gera competências anuais espaçadas corretamente", () => {
    const dates = computeCompetenceDates(Periodicity.ANUAL, now, 12);
    const labels = dates.map(competenceLabel);
    expect(labels).toEqual(["09/2026", "09/2027"]);
  });
});

describe("competenceLabel", () => {
  it("formata como MM/AAAA", () => {
    expect(competenceLabel(new Date(2026, 0, 15))).toBe("01/2026");
    expect(competenceLabel(new Date(2026, 11, 1))).toBe("12/2026");
  });
});
