import { NextResponse } from "next/server";
import { completeAccountReconciliation } from "@/server/accounting/update-account-reconciliation";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const result = await completeAccountReconciliation((await params).id);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json({ difference: result.difference });
}
