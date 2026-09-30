import { NextResponse } from "next/server";
import { addOrganizationMember } from "@/server/organizations/add-organization-member";

export async function POST(request: Request) {
  try {
    const result = await addOrganizationMember(await request.json());
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
    return NextResponse.json({ member: result.member }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}
