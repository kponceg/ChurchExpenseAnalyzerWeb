import { NextResponse } from "next/server";
import { validateIncomeTransaction } from "@/server/accounting/validate-income-transaction";
import { saveIncomeTransaction } from "@/server/accounting/save-income-transaction";

export async function POST(request: Request) {
  try {
    const result = validateIncomeTransaction(await request.json());
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
    const saved = await saveIncomeTransaction(result.data);
    if (!saved.ok) return NextResponse.json({ error: saved.error }, { status: saved.status });
    return NextResponse.json({ transaction: result.transaction, transactionId: saved.transactionId, createdAt: saved.createdAt }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}
