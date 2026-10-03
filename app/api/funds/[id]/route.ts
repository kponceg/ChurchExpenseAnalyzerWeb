import { NextResponse } from "next/server";
import { updateFinancialFund } from "@/server/accounting/update-financial-fund";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const result = await updateFinancialFund(id, await request.json());
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
    return NextResponse.json({ fund: result.fund });
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}
