import { NextResponse } from "next/server";
import { uploadTransactionAttachment } from "@/server/accounting/upload-transaction-attachment";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const formData = await request.formData();
    const result = await uploadTransactionAttachment((await params).id, formData.get("file"));
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
    return NextResponse.json({ attachment: result.attachment }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid upload request." }, { status: 400 });
  }
}
