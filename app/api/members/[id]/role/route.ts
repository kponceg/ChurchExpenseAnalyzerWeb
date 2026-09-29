import { NextResponse } from "next/server";
import { changeMemberRole } from "@/server/organizations/change-member-role";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const result = await changeMemberRole((await params).id, await request.json());
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
    return NextResponse.json({ role: result.role });
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}
