import { NextResponse } from "next/server";
import { saveExpenseTransaction } from "@/server/accounting/save-expense-transaction";
import { validateExpenseTransaction } from "@/server/accounting/validate-expense-transaction";

export async function POST(request: Request) {
  try {
    const result = validateExpenseTransaction(await request.json());
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
    const saved = await saveExpenseTransaction(result.data);
    if (!saved.ok) return NextResponse.json({ error: saved.error }, { status: saved.status });
    return NextResponse.json({ transaction: { ...result.transaction, account: saved.accountName }, transactionId: saved.transactionId, createdAt: saved.createdAt }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}
