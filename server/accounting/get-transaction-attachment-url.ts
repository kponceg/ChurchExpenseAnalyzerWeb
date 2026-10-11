import "server-only";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export async function getTransactionAttachmentUrl(transactionId: string, attachmentId: string) {
  if (!z.string().uuid().safeParse(transactionId).success || !z.string().uuid().safeParse(attachmentId).success) {
    return { ok: false as const, status: 404, error: "Attachment not found." };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, status: 401, error: "Sign in before viewing an attachment." };

  const { data: attachment } = await supabase
    .from("transaction_attachments")
    .select("storage_path")
    .eq("id", attachmentId)
    .eq("transaction_id", transactionId)
    .maybeSingle();
  if (!attachment) return { ok: false as const, status: 404, error: "Attachment not found." };

  const signed = await supabase.storage
    .from("transaction-attachments")
    .createSignedUrl(attachment.storage_path, 60);
  if (signed.error || !signed.data) {
    return { ok: false as const, status: 500, error: "The attachment could not be opened." };
  }

  return { ok: true as const, url: signed.data.signedUrl };
}
