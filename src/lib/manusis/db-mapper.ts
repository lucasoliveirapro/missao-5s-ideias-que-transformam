import type { Database } from "@/types/database";
import type { NormalizedSsCard } from "@/types/ss-card";

type SsCardInsert = Database["public"]["Tables"]["ss_cards"]["Insert"];

export function toSsCardInsert(
  card: NormalizedSsCard,
  importBatchId: string,
  userId: string
): SsCardInsert {
  return {
    ss_number: card.ss_number,
    status: card.status,
    company: card.company,
    unit: card.unit,
    location_1: card.location_1,
    location_2: card.location_2,
    location_3: card.location_3,
    location_4: card.location_4,
    line: card.line,
    operation: card.operation,
    ute_mapped: card.ute_mapped,
    asset: card.asset,
    requester_name: card.requester_name,
    requester_email: card.requester_email,
    user_name: card.user_name,
    main_subject: card.main_subject,
    secondary_subject: card.secondary_subject,
    z_type: card.z_type,
    description: card.description,
    machine_stopped: card.machine_stopped,
    safety_item: card.safety_item,
    created_at_manusis: card.created_at,
    classification: card.classification,
    safety: card.safety,
    production: card.production,
    quality: card.quality,
    environment: card.environment,
    cost_center: card.cost_center,
    work_center: card.work_center,
    has_wcm_tag: card.has_wcm_tag,
    wcm_pillar: card.wcm_pillar,
    om_number: card.om_number,
    om_status: card.om_status,
    om_service_type: card.om_service_type,
    om_service_nature: card.om_service_nature,
    om_opened_at: card.om_opened_at,
    om_description: card.om_description,
    om_closed_at: card.om_closed_at,
    is_closed_for_operator: card.is_closed_for_operator,
    raw_data: toJson(card.raw_data),
    import_batch_id: importBatchId,
    imported_by: userId,
    updated_by: userId
  };
}

function toJson(value: unknown) {
  return JSON.parse(JSON.stringify(value)) as Database["public"]["Tables"]["ss_cards"]["Insert"]["raw_data"];
}
