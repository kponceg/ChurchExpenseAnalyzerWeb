import { NextResponse } from "next/server";
import { requestPasswordReset } from "@/server/auth/request-password-reset";

export async function POST(request: Request) {
  try {
    const result = await requestPasswordReset(await request.json());
    if (!result.ok) return NextResponse.json({ sent: false }, { status: result.status });
    return NextResponse.json({ sent: true });
  } catch {
    return NextResponse.json({ sent: true });
  }
}
