import type { OrganizationRole } from "@/server/organizations/get-organization-members";

export function getRoleCapabilities(role: OrganizationRole) {
  return {
    canManage: role === "administrator",
    canRecordTransactions: ["administrator", "treasurer", "data_entry"].includes(role),
    canVoidTransactions: ["administrator", "treasurer"].includes(role),
    canReviewTransactions: ["administrator", "treasurer", "approver"].includes(role),
    canReconcile: ["administrator", "treasurer"].includes(role),
    canViewAuditLog: ["administrator", "treasurer"].includes(role),
  };
}
