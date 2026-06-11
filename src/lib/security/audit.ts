import type { Json } from "@/types/database";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

type AuditInput = {
  actorUserId?: string | null;
  action: string;
  entityType?: string | null;
  entityId?: string | null;
  metadata?: Json;
  request?: Request;
};

export async function writeAuditLog(
  supabase: SupabaseClient<Database>,
  input: AuditInput
) {
  const forwardedFor = input.request?.headers.get("x-forwarded-for");
  const ip = forwardedFor?.split(",")[0]?.trim() ?? null;
  const userAgent = input.request?.headers.get("user-agent") ?? null;

  await supabase.from("audit_logs").insert({
    actor_user_id: input.actorUserId ?? null,
    action: input.action,
    entity_type: input.entityType ?? null,
    entity_id: input.entityId ?? null,
    ip_address: ip,
    user_agent: userAgent,
    metadata: input.metadata ?? {}
  });
}
