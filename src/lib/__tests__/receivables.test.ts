import { describe, expect, it } from "vitest";
import { computeReceivableStatus } from "@/lib/receivables";

const today = new Date(2026, 8, 2); // 02/09/2026

describe("computeReceivableStatus (seção 26 — contas a receber)", () => {
  it("marca como vencido quando a data já passou", () => {
    expect(computeReceivableStatus(new Date(2026, 8, 1), today)).toBe("VENCIDO");
  });

  it("marca como vencendo hoje quando a data é hoje", () => {
    expect(computeReceivableStatus(new Date(2026, 8, 2), today)).toBe("VENCENDO_HOJE");
  });

  it("marca como a vencer quando a data é futura", () => {
    expect(computeReceivableStatus(new Date(2026, 8, 10), today)).toBe("A_VENCER");
  });

  it("nunca reverte status terminais (pago, parcialmente pago, cancelado)", () => {
    expect(computeReceivableStatus(new Date(2026, 7, 1), today, "PAGO")).toBe("PAGO");
    expect(computeReceivableStatus(new Date(2026, 7, 1), today, "PARCIALMENTE_PAGO")).toBe("PARCIALMENTE_PAGO");
    expect(computeReceivableStatus(new Date(2026, 7, 1), today, "CANCELADO")).toBe("CANCELADO");
  });
});
