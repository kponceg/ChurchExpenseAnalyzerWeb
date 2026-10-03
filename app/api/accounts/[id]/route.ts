import { NextResponse } from "next/server";
import { updateFinancialAccount } from "@/server/accounting/update-financial-account";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const result = await updateFinancialAccount(id, await request.json());
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
    return NextResponse.json({ account: result.account });
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}
