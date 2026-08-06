import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { requireHost, jsonError, withApiErrorHandling } from "@/lib/apiHelpers";

/** Host designates which player is "Katrine". Only allowed in the lobby. */
async function handlePost(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const auth = await requireHost(code, req.headers.get("x-host-token"));
  if ("errorResponse" in auth) return auth.errorResponse;
  const { game } = auth;

  if (game.status !== "lobby") {
    return jsonError("Katrine kan kun vælges, mens spillet er i lobbyen.", 409);
  }

  const body = await req.json().catch(() => null);
  const playerId = typeof body?.playerId === "string" ? body.playerId : "";
  if (!playerId) return jsonError("Mangler spiller-id.", 400);

  const supabase = getSupabaseServerClient();

  const { data: player, error: playerError } = await supabase
    .from("players")
    .select("id, game_id")
    .eq("id", playerId)
    .maybeSingle();
  if (playerError) return jsonError(playerError.message, 500);
  if (!player || player.game_id !== game.id) {
    return jsonError("Spilleren findes ikke i dette spil.", 404);
  }

  const { error: clearError } = await supabase
    .from("players")
    .update({ is_katrine: false })
    .eq("game_id", game.id);
  if (clearError) return jsonError(clearError.message, 500);

  const { error: setError } = await supabase
    .from("players")
    .update({ is_katrine: true })
    .eq("id", playerId);
  if (setError) return jsonError(setError.message, 500);

  const { error: gameError } = await supabase
    .from("games")
    .update({ katrine_player_id: playerId })
    .eq("id", game.id);
  if (gameError) return jsonError(gameError.message, 500);

  return NextResponse.json({ ok: true });
}

export const POST = withApiErrorHandling(handlePost);
