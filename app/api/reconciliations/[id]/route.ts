import { NextResponse } from "next/server";
import { cancelAccountReconciliation } from "@/server/accounting/update-account-reconciliation";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const result = await cancelAccountReconciliation((await params).id);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json({ reconciliationId: result.reconciliationId });
}
