import { NextResponse } from "next/server";
import { reviewTransaction } from "@/server/accounting/review-transaction";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const result = await reviewTransaction((await params).id, await request.json());
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
    return NextResponse.json({ decision: result.decision });
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}
