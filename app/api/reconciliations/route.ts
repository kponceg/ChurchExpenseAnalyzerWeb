import { NextResponse } from "next/server";
import { startAccountReconciliation } from "@/server/accounting/start-account-reconciliation";

export async function POST(request: Request) {
  try {
    const result = await startAccountReconciliation(await request.json());
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
    return NextResponse.json({ reconciliationId: result.reconciliationId }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}
