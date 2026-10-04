import { NextResponse } from "next/server";
import { inviteOrganizationMember } from "@/server/organizations/invite-organization-member";

export async function POST(request: Request) {
  try {
    const result = await inviteOrganizationMember(await request.json());
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
    return NextResponse.json({ email: result.email, role: result.role }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}
