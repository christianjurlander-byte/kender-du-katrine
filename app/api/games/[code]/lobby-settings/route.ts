import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { requireHost, jsonError, withApiErrorHandling } from "@/lib/apiHelpers";

const MAX_TEASER_IMAGES = 8;
const MAX_KATRINE_FACTS_LENGTH = 600;

/**
 * Host-only: sets the hype-building "quiz starts at" countdown target and
 * the teaser photos shown in the lobby. Both are optional and only
 * editable while the game is in the lobby.
 */
async function handlePatch(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const auth = await requireHost(code, req.headers.get("x-host-token"));
  if ("errorResponse" in auth) return auth.errorResponse;
  const { game } = auth;

  if (game.status !== "lobby") {
    return jsonError("Lobby-indstillinger kan kun ændres, mens spillet er i lobbyen.", 409);
  }

  const body = await req.json().catch(() => null);
  const update: Record<string, unknown> = {};

  if ("scheduledStartAt" in (body ?? {})) {
    const value = body.scheduledStartAt;
    if (value === null) {
      update.scheduled_start_at = null;
    } else if (typeof value === "string" && !Number.isNaN(new Date(value).getTime())) {
      update.scheduled_start_at = new Date(value).toISOString();
    } else {
      return jsonError("Ugyldigt tidspunkt.", 400);
    }
  }

  if ("teaserImageUrls" in (body ?? {})) {
    const value = body.teaserImageUrls;
    if (
      !Array.isArray(value) ||
      value.some((u) => typeof u !== "string") ||
      value.length > MAX_TEASER_IMAGES
    ) {
      return jsonError(`Ugyldig billedliste (max ${MAX_TEASER_IMAGES} billeder).`, 400);
    }
    update.teaser_image_urls = value;
  }

  if ("katrineFacts" in (body ?? {})) {
    const value = body.katrineFacts;
    if (typeof value !== "string" || value.length > MAX_KATRINE_FACTS_LENGTH) {
      return jsonError(`Fakta om Katrine må max være ${MAX_KATRINE_FACTS_LENGTH} tegn.`, 400);
    }
    update.katrine_facts = value.trim();
  }

  if (Object.keys(update).length === 0) {
    return jsonError("Intet at opdatere.", 400);
  }

  const supabase = getSupabaseServerClient();
  const { error } = await supabase.from("games").update(update).eq("id", game.id);
  if (error) return jsonError(error.message, 500);

  return NextResponse.json({ ok: true });
}

export const PATCH = withApiErrorHandling(handlePatch);
