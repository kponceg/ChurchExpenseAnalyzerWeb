import { describe, expect, it } from "vitest";
import { getAuditEventDescription } from "@/lib/audit-event-descriptions";

describe("audit event descriptions", () => {
  it("translates known events into English and Spanish", () => {
    expect(getAuditEventDescription("en", "transaction.approved")).toBe("Approved a transaction");
    expect(getAuditEventDescription("es", "transaction.approved")).toBe("Aprobó una transacción");
  });

  it("uses a safe description for future event types", () => {
    expect(getAuditEventDescription("en", "future.event")).toBe("Made a system change");
    expect(getAuditEventDescription("es", "future.event")).toBe("Realizó un cambio en el sistema");
  });
});
