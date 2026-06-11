import { NextResponse } from "next/server";
import { parseTopThreeFilters } from "@/lib/ranking/filters";
import { getTopThreeRanking } from "@/lib/ranking/top3";
import { getApiContext } from "@/lib/supabase/api-auth";
import { safeErrorMessage } from "@/lib/security/sanitize";

export async function GET(request: Request) {
  const context = await getApiContext();
  if (!context.ok) {
    return context.response;
  }

  try {
    const filters = parseTopThreeFilters(new URL(request.url).searchParams);
    const ranking = await getTopThreeRanking(context.supabase, filters, async (path) => {
      const { data } = await context.supabase.storage
        .from("operator-photos")
        .createSignedUrl(path, 600);

      return data?.signedUrl ?? null;
    });

    return NextResponse.json(ranking);
  } catch (error) {
    return NextResponse.json({ error: safeErrorMessage(error) }, { status: 400 });
  }
}
