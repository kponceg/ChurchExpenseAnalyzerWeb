import { NextResponse } from "next/server";
import { createFinancialAccount } from "@/server/accounting/create-financial-account";

export async function POST(request: Request) {
  try {
    const result = await createFinancialAccount(await request.json());
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
    return NextResponse.json({ account: result.account }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}
