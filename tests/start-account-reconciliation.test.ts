import { beforeEach, describe, expect, it, vi } from "vitest";

const { createClientMock } = vi.hoisted(() => ({ createClientMock: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: createClientMock }));

import { startAccountReconciliation } from "@/server/accounting/start-account-reconciliation";

const validInput = {
  accountId: "11111111-1111-4111-8111-111111111111",
  periodStart: "2026-09-01",
  periodEnd: "2026-09-30",
  statementEndingBalance: "123.45",
  notes: " September statement ",
};

function clientWith(user: { id: string } | null, rpcResult: { data: string | null; error: { message: string } | null } = { data: "22222222-2222-4222-8222-222222222222", error: null }) {
  return {
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user } }) },
    rpc: vi.fn().mockResolvedValue(rpcResult),
  };
}

describe("startAccountReconciliation", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rejects invalid periods and money before contacting Supabase", async () => {
    const result = await startAccountReconciliation({ ...validInput, periodStart: "2026-10-01", periodEnd: "2026-09-30", statementEndingBalance: "1.999" });
    expect(result).toMatchObject({ ok: false, status: 400 });
    expect(createClientMock).not.toHaveBeenCalled();
  });

  it("requires an authenticated user", async () => {
    createClientMock.mockResolvedValue(clientWith(null));
    const result = await startAccountReconciliation(validInput);
    expect(result).toEqual({ ok: false, status: 401, error: "Sign in before starting a reconciliation." });
  });

  it("sends trimmed and validated values to the protected database function", async () => {
    const client = clientWith({ id: "user-id" });
    createClientMock.mockResolvedValue(client);
    const result = await startAccountReconciliation(validInput);
    expect(client.rpc).toHaveBeenCalledWith("start_account_reconciliation", {
      target_account_id: validInput.accountId,
      statement_period_start: "2026-09-01",
      statement_period_end: "2026-09-30",
      statement_balance: "123.45",
      reconciliation_notes: "September statement",
    });
    expect(result).toEqual({ ok: true, reconciliationId: "22222222-2222-4222-8222-222222222222" });
  });

  it("returns database permission errors without creating a draft", async () => {
    createClientMock.mockResolvedValue(clientWith({ id: "user-id" }, { data: null, error: { message: "Only administrators and treasurers can reconcile accounts" } }));
    const result = await startAccountReconciliation(validInput);
    expect(result).toEqual({ ok: false, status: 400, error: "Only administrators and treasurers can reconcile accounts" });
  });
});
