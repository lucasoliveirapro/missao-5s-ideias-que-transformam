import { NextResponse } from "next/server";
import { normalizeSsRow } from "@/lib/manusis/normalize-ss";
import { parseSsXlsx } from "@/lib/manusis/parse-ss-xlsx";
import { toSsCardInsert } from "@/lib/manusis/db-mapper";
import type { ImportCounters, RawSsRow } from "@/lib/manusis/ss-types";
import { writeAuditLog } from "@/lib/security/audit";
import {
  validateXlsxFileMeta,
  validateXlsxMagicBytes
} from "@/lib/security/upload-validation";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { safeErrorMessage, sanitizeFileName } from "@/lib/security/sanitize";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { requireApiRole } from "@/lib/supabase/api-auth";
import type { Database } from "@/types/database";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  const rateLimit = checkRateLimit(`import:${ip}`, 8, 60_000);

  if (!rateLimit.allowed) {
    return NextResponse.json({ error: "Muitas importacoes em pouco tempo." }, { status: 429 });
  }

  const context = await requireApiRole(["admin", "leader"]);
  if (!context.ok) {
    return context.response;
  }

  try {
    const formData = await request.formData();
    const entries = formData.getAll("files").length
      ? formData.getAll("files")
      : formData.getAll("file");
    const files = entries.filter((entry): entry is File => entry instanceof File);

    if (files.length === 0) {
      return NextResponse.json({ error: "Envie pelo menos um arquivo .xlsx." }, { status: 400 });
    }

    const admin = createAdminSupabaseClient();
    const results = [];

    for (const file of files) {
      validateXlsxFileMeta(file);
      const buffer = Buffer.from(await file.arrayBuffer());
      validateXlsxMagicBytes(buffer);

      const rows = parseSsXlsx(buffer);
      const { data: batch, error: batchError } = await admin
        .from("import_batches")
        .insert({
          file_name: sanitizeFileName(file.name),
          imported_by: context.user.id,
          status: "processing",
          metadata: {
            originalSize: file.size
          }
        })
        .select("id")
        .single();

      if (batchError || !batch) {
        throw batchError ?? new Error("Nao foi possivel criar o lote de importacao.");
      }

      const processed = processRows(rows, batch.id, context.user.id);
      const chunks = chunk(processed.cards, 500);

      for (const cards of chunks) {
        const { error } = await admin.from("ss_cards").upsert(cards, {
          onConflict: "ss_number"
        });

        if (error) {
          throw error;
        }
      }

      for (const errors of chunk(processed.errors, 500)) {
        if (errors.length === 0) continue;
        const { error } = await admin.from("import_errors").insert(errors);
        if (error) {
          throw error;
        }
      }

      const { error: updateError } = await admin
        .from("import_batches")
        .update({
          total_rows: processed.counters.totalRows,
          valid_cards: processed.counters.validCards,
          ignored_rows: processed.counters.ignoredRows,
          error_rows: processed.counters.errorRows,
          z2_count: processed.counters.z2,
          z3_count: processed.counters.z3,
          z4_count: processed.counters.z4,
          min_created_at: processed.counters.minCreatedAt,
          max_created_at: processed.counters.maxCreatedAt,
          status: "completed",
          metadata: {
            duplicateOrUpdated: processed.counters.duplicateOrUpdated
          }
        })
        .eq("id", batch.id);

      if (updateError) {
        throw updateError;
      }

      await writeAuditLog(admin, {
        actorUserId: context.user.id,
        action: "ss_import_completed",
        entityType: "import_batch",
        entityId: batch.id,
        metadata: {
          fileName: sanitizeFileName(file.name),
          counters: processed.counters
        },
        request
      });

      results.push({
        batchId: batch.id,
        fileName: sanitizeFileName(file.name),
        ...processed.counters
      });
    }

    return NextResponse.json({ files: results });
  } catch (error) {
    return NextResponse.json({ error: safeErrorMessage(error) }, { status: 400 });
  }
}

function processRows(rows: RawSsRow[], importBatchId: string, userId: string) {
  const counters: ImportCounters = {
    totalRows: rows.length,
    validCards: 0,
    ignoredRows: 0,
    errorRows: 0,
    duplicateOrUpdated: 0,
    z2: 0,
    z3: 0,
    z4: 0,
    minCreatedAt: null,
    maxCreatedAt: null
  };

  const cards: Database["public"]["Tables"]["ss_cards"]["Insert"][] = [];
  const errors: Database["public"]["Tables"]["import_errors"]["Insert"][] = [];

  rows.forEach((row, index) => {
    try {
      const normalized = normalizeSsRow(row);

      if (!normalized.ss_number || !normalized.z_type) {
        counters.ignoredRows += 1;
        return;
      }

      counters.validCards += 1;
      counters.duplicateOrUpdated += 1;
      if (normalized.z_type === "Z2") counters.z2 += 1;
      if (normalized.z_type === "Z3") counters.z3 += 1;
      if (normalized.z_type === "Z4") counters.z4 += 1;
      counters.minCreatedAt = minIso(counters.minCreatedAt, normalized.created_at);
      counters.maxCreatedAt = maxIso(counters.maxCreatedAt, normalized.created_at);
      cards.push(toSsCardInsert(normalized, importBatchId, userId));
    } catch (error) {
      counters.errorRows += 1;
      errors.push({
        import_batch_id: importBatchId,
        row_number: index + 2,
        error_code: "NORMALIZE_ERROR",
        error_message: safeErrorMessage(error),
        raw_row: JSON.parse(JSON.stringify(row))
      });
    }
  });

  return { counters, cards, errors };
}

function minIso(current: string | null, next: string | null) {
  if (!next) return current;
  if (!current) return next;
  return new Date(next) < new Date(current) ? next : current;
}

function maxIso(current: string | null, next: string | null) {
  if (!next) return current;
  if (!current) return next;
  return new Date(next) > new Date(current) ? next : current;
}

function chunk<T>(items: T[], size: number) {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}
