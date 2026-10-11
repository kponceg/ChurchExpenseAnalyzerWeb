import { NextResponse } from "next/server";
import { getTransactionAttachmentUrl } from "@/server/accounting/get-transaction-attachment-url";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string; attachmentId: string }> }) {
  const { id, attachmentId } = await params;
  const result = await getTransactionAttachmentUrl(id, attachmentId);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.redirect(result.url);
}
