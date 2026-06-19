import { pingDatabase } from "@repo/db";

export async function GET() {
  await pingDatabase();

  return Response.json({ ok: true });
}
