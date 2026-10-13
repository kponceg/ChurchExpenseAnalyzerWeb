import { createOrganizationBackupArchive, createOrganizationBackupFilename } from "@/server/backups/create-backup-archive";
import { getOrganizationBackupData } from "@/server/backups/get-organization-backup-data";

export const runtime = "nodejs";

export async function GET() {
  const result = await getOrganizationBackupData();
  if (!result.ok) return Response.json({ error: result.error }, { status: 403 });

  const archive = createOrganizationBackupArchive(result.data);
  const filename = createOrganizationBackupFilename(result.data.organization.name, result.data.generatedAt);
  const body = archive.buffer.slice(archive.byteOffset, archive.byteOffset + archive.byteLength) as ArrayBuffer;
  return new Response(body, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
