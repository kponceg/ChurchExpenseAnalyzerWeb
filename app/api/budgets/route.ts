import { NextResponse } from "next/server";
import { saveMonthlyBudget } from "@/server/accounting/save-monthly-budget";

export async function POST(request: Request) {
  try { const result = await saveMonthlyBudget(await request.json()); if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status }); return NextResponse.json({ budget: result.budget }, { status: 201 }); }
  catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }
}
