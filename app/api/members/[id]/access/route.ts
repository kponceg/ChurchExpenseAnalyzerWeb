import { NextResponse } from "next/server";
import { setMemberActive } from "@/server/organizations/set-member-active";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try { const result = await setMemberActive((await params).id, await request.json()); if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status }); return NextResponse.json({ active: result.active }); }
  catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }
}
