import { NextResponse } from "next/server";
import { createFinancialCategory } from "@/server/accounting/create-financial-category";

export async function POST(request: Request) {
  try {
    const result = await createFinancialCategory(await request.json());
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
    return NextResponse.json({ category: result.category }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}
