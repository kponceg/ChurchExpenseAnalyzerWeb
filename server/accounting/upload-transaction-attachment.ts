import "server-only";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const fileTypes = {
  "application/pdf": { extension: "pdf", signature: (bytes: Uint8Array) => text(bytes, 0, 5) === "%PDF-" },
  "image/jpeg": { extension: "jpg", signature: (bytes: Uint8Array) => bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff },
  "image/png": { extension: "png", signature: (bytes: Uint8Array) => bytes.slice(0, 8).every((value, index) => value === [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a][index]) },
  "image/webp": { extension: "webp", signature: (bytes: Uint8Array) => text(bytes, 0, 4) === "RIFF" && text(bytes, 8, 12) === "WEBP" },
} as const;

function text(bytes: Uint8Array, start: number, end: number) {
  return String.fromCharCode(...bytes.slice(start, end));
}

function safeFilename(filename: string) {
  return (filename.split(/[\\/]/).pop() ?? "receipt").replace(/[\u0000-\u001f\u007f]/g, "").trim().slice(0, 180);
}

export async function uploadTransactionAttachment(transactionId: string, file: unknown) {
  if (!z.string().uuid().safeParse(transactionId).success) {
    return { ok: false as const, status: 404, error: "Transaction not found." };
  }
  if (!(file instanceof File) || file.size < 1 || file.size > MAX_FILE_SIZE) {
    return { ok: false as const, status: 400, error: "Choose a file smaller than 10 MB." };
  }

  const fileType = fileTypes[file.type as keyof typeof fileTypes];
  if (!fileType) {
    return { ok: false as const, status: 400, error: "Only PDF, JPEG, PNG, and WebP files are accepted." };
  }

  const originalFilename = safeFilename(file.name);
  if (!originalFilename) {
    return { ok: false as const, status: 400, error: "The file must have a valid name." };
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!fileType.signature(bytes)) {
    return { ok: false as const, status: 400, error: "The file contents do not match the selected file type." };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, status: 401, error: "Sign in before uploading a receipt." };

  const { data: transaction } = await supabase
    .from("transactions")
    .select("organization_id")
    .eq("id", transactionId)
    .maybeSingle();
  if (!transaction) return { ok: false as const, status: 404, error: "Transaction not found." };

  const { data: membership } = await supabase
    .from("organization_memberships")
    .select("role")
    .eq("organization_id", transaction.organization_id)
    .eq("user_id", user.id)
    .eq("active", true)
    .maybeSingle();
  if (!membership || !["administrator", "treasurer", "data_entry"].includes(membership.role)) {
    return { ok: false as const, status: 403, error: "Your role cannot upload transaction receipts." };
  }

  const storagePath = `${transaction.organization_id}/${transactionId}/${randomUUID()}.${fileType.extension}`;
  const upload = await supabase.storage.from("transaction-attachments").upload(storagePath, bytes, {
    contentType: file.type,
    upsert: false,
  });
  if (upload.error) return { ok: false as const, status: 500, error: "The receipt file could not be uploaded." };

  const attachment = await supabase
    .from("transaction_attachments")
    .insert({
      organization_id: transaction.organization_id,
      transaction_id: transactionId,
      storage_path: storagePath,
      original_filename: originalFilename,
      mime_type: file.type,
      size_bytes: file.size,
      uploaded_by: user.id,
    })
    .select("id, original_filename, mime_type, size_bytes, created_at")
    .single();

  if (attachment.error || !attachment.data) {
    await supabase.storage.from("transaction-attachments").remove([storagePath]);
    return { ok: false as const, status: 500, error: "The receipt record could not be saved." };
  }

  return { ok: true as const, attachment: attachment.data };
}
