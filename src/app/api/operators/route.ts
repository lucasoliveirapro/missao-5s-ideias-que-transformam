import { NextResponse } from "next/server";
import { operatorSchema } from "@/lib/manusis/validators";
import { writeAuditLog } from "@/lib/security/audit";
import { safeErrorMessage } from "@/lib/security/sanitize";
import { getApiContext, requireApiRole } from "@/lib/supabase/api-auth";

export async function GET() {
  const context = await getApiContext();
  if (!context.ok) {
    return context.response;
  }

  const { data, error } = await context.supabase
    .from("operators")
    .select("*, operator_aliases(alias)")
    .order("name", { ascending: true });

  if (error) {
    return NextResponse.json({ error: safeErrorMessage(error) }, { status: 400 });
  }

  return NextResponse.json({ items: data ?? [] });
}

export async function POST(request: Request) {
  const context = await requireApiRole(["admin", "leader"]);
  if (!context.ok) {
    return context.response;
  }

  try {
    const body = operatorSchema.parse(await request.json());
    const db = context.supabase;

    const { data: operator, error } = await db
      .from("operators")
      .insert({
        name: body.name,
        badge: body.badge || null,
        shift: body.shift || null,
        team: body.team || null,
        ute: body.ute || null,
        active: body.active
      })
      .select("*")
      .single();

    if (error || !operator) {
      throw error ?? new Error("Nao foi possivel criar o condutor.");
    }

    const aliases = body.aliases.filter(Boolean);
    if (aliases.length > 0) {
      const { error: aliasError } = await db.from("operator_aliases").insert(
        aliases.map((alias) => ({
          operator_id: operator.id,
          alias
        }))
      );

      if (aliasError) {
        throw aliasError;
      }
    }

    await writeAuditLog(db, {
      actorUserId: context.user.id,
      action: "operator_created",
      entityType: "operator",
      entityId: operator.id,
      metadata: { name: body.name },
      request
    });

    return NextResponse.json({ item: operator }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: safeErrorMessage(error) }, { status: 400 });
  }
}
