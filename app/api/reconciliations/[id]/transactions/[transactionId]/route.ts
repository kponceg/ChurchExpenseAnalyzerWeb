import { NextResponse } from "next/server";
import { setReconciliationTransactionCleared } from "@/server/accounting/update-account-reconciliation";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string; transactionId: string }> }) {
  try {
    const { id, transactionId } = await params;
    const result = await setReconciliationTransactionCleared(id, transactionId, await request.json());
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
    return NextResponse.json({ cleared: result.cleared });
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}
