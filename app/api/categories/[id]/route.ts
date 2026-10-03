import { NextResponse } from "next/server";
import { updateFinancialCategory } from "@/server/accounting/update-financial-category";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const result = await updateFinancialCategory(id, await request.json());
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
    return NextResponse.json({ category: result.category });
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}
