import { NextResponse } from "next/server";
import { createFinancialFund } from "@/server/accounting/create-financial-fund";

export async function POST(request: Request) {
  try {
    const result = await createFinancialFund(await request.json());
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
    return NextResponse.json({ fund: result.fund }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}
