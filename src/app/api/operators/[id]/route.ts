import { NextResponse } from "next/server";
import { operatorSchema } from "@/lib/manusis/validators";
import { writeAuditLog } from "@/lib/security/audit";
import { safeErrorMessage } from "@/lib/security/sanitize";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { requireApiRole } from "@/lib/supabase/api-auth";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const apiContext = await requireApiRole(["admin", "leader"]);
  if (!apiContext.ok) {
    return apiContext.response;
  }

  try {
    const { id } = await context.params;
    const json = await request.json();
    const admin = createAdminSupabaseClient();

    if ("photoPath" in json) {
      const { error } = await admin
        .from("operators")
        .update({ photo_path: String(json.photoPath || "") || null })
        .eq("id", id);

      if (error) throw error;

      await writeAuditLog(admin, {
        actorUserId: apiContext.user.id,
        action: "operator_photo_updated",
        entityType: "operator",
        entityId: id,
        request
      });

      return NextResponse.json({ ok: true });
    }

    const body = operatorSchema.partial().parse(json);
    const { aliases, ...operatorUpdate } = body;

    const { error } = await admin
      .from("operators")
      .update({
        name: operatorUpdate.name,
        badge: operatorUpdate.badge || null,
        shift: operatorUpdate.shift || null,
        team: operatorUpdate.team || null,
        ute: operatorUpdate.ute || null,
        active: operatorUpdate.active
      })
      .eq("id", id);

    if (error) throw error;

    if (aliases) {
      await admin.from("operator_aliases").delete().eq("operator_id", id);
      if (aliases.length > 0) {
        const { error: aliasError } = await admin.from("operator_aliases").insert(
          aliases.map((alias) => ({
            operator_id: id,
            alias
          }))
        );
        if (aliasError) throw aliasError;
      }
    }

    await writeAuditLog(admin, {
      actorUserId: apiContext.user.id,
      action: "operator_updated",
      entityType: "operator",
      entityId: id,
      request
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: safeErrorMessage(error) }, { status: 400 });
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const apiContext = await requireApiRole(["admin", "leader"]);
  if (!apiContext.ok) {
    return apiContext.response;
  }

  try {
    const { id } = await context.params;
    const admin = createAdminSupabaseClient();
    const { error } = await admin.from("operators").update({ active: false }).eq("id", id);

    if (error) throw error;

    await writeAuditLog(admin, {
      actorUserId: apiContext.user.id,
      action: "operator_deactivated",
      entityType: "operator",
      entityId: id,
      request
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: safeErrorMessage(error) }, { status: 400 });
  }
}
