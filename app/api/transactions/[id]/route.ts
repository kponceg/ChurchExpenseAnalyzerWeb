import { NextResponse } from "next/server";
import { updateTransaction } from "@/server/accounting/update-transaction";
import { validateTransactionUpdate } from "@/server/accounting/validate-transaction-update";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const result = validateTransactionUpdate(await request.json());
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
    const saved = await updateTransaction((await params).id, result.data);
    if (!saved.ok) return NextResponse.json({ error: saved.error }, { status: saved.status });
    return NextResponse.json({ transactionId: saved.transactionId });
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}
