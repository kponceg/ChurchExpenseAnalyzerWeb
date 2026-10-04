import { NextResponse } from "next/server";
import { sendMemberSetupLink } from "@/server/organizations/send-member-setup-link";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const result = await sendMemberSetupLink((await params).id);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json({ email: result.email });
}
