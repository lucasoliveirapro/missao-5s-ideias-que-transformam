import { NextResponse } from "next/server";
import { validateOperatorPhotoMeta } from "@/lib/security/upload-validation";
import { safeErrorMessage } from "@/lib/security/sanitize";
import { requireApiRole } from "@/lib/supabase/api-auth";

export async function POST(request: Request) {
  const context = await requireApiRole(["admin", "leader"]);
  if (!context.ok) {
    return context.response;
  }

  try {
    const body = await request.json();
    const operatorId = String(body.operatorId || "");

    if (!operatorId) {
      return NextResponse.json({ error: "operatorId e obrigatorio." }, { status: 400 });
    }

    const meta = validateOperatorPhotoMeta(body);
    const extension = meta.fileName.split(".").pop()?.toLowerCase() ?? "webp";
    const path = `operators/${operatorId}/profile.${extension}`;
    const { data, error } = await context.supabase.storage
      .from("operator-photos")
      .createSignedUploadUrl(path, {
        upsert: true
      });

    if (error || !data) {
      throw error ?? new Error("Nao foi possivel criar URL de upload.");
    }

    return NextResponse.json({
      path,
      signedUrl: data.signedUrl,
      token: data.token
    });
  } catch (error) {
    return NextResponse.json({ error: safeErrorMessage(error) }, { status: 400 });
  }
}
