import { describe, expect, it } from "vitest";
import { getRoleCapabilities } from "@/server/organizations/role-capabilities";

describe("organization role capabilities", () => {
  it("gives administrators every application capability", () => {
    expect(getRoleCapabilities("administrator")).toEqual({ canManage: true, canRecordTransactions: true, canVoidTransactions: true, canReviewTransactions: true, canReconcile: true, canViewAuditLog: true, canExportBackup: true });
  });

  it("allows treasurers to operate finances without managing users", () => {
    expect(getRoleCapabilities("treasurer")).toEqual({ canManage: false, canRecordTransactions: true, canVoidTransactions: true, canReviewTransactions: true, canReconcile: true, canViewAuditLog: true, canExportBackup: false });
  });

  it("limits data-entry accounts to recording transactions", () => {
    expect(getRoleCapabilities("data_entry")).toEqual({ canManage: false, canRecordTransactions: true, canVoidTransactions: false, canReviewTransactions: false, canReconcile: false, canViewAuditLog: false, canExportBackup: false });
  });

  it("limits approvers to transaction review", () => {
    expect(getRoleCapabilities("approver")).toEqual({ canManage: false, canRecordTransactions: false, canVoidTransactions: false, canReviewTransactions: true, canReconcile: false, canViewAuditLog: false, canExportBackup: false });
  });

  it("keeps viewers read-only", () => {
    expect(getRoleCapabilities("viewer")).toEqual({ canManage: false, canRecordTransactions: false, canVoidTransactions: false, canReviewTransactions: false, canReconcile: false, canViewAuditLog: false, canExportBackup: false });
  });
});
