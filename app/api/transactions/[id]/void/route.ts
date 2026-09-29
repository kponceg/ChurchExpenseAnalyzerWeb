import { NextResponse } from "next/server";
import { voidTransaction } from "@/server/accounting/void-transaction";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const result = await voidTransaction((await params).id, await request.json());
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
    return NextResponse.json({ transactionId: result.transactionId });
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}
