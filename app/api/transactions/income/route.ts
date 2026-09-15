import { NextResponse } from "next/server";
import { validateIncomeTransaction } from "@/server/accounting/validate-income-transaction";

export async function POST(request: Request) {
  try {
    const result = validateIncomeTransaction(await request.json());
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
    return NextResponse.json({ transaction: result.transaction }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}
