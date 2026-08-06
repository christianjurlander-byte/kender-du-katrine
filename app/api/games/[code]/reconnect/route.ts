import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { getGameByCode, jsonError, withApiErrorHandling } from "@/lib/apiHelpers";
import { toPublicPlayer } from "@/lib/sanitize";
import type { Player } from "@/lib/types";

/** Rehydrates a returning player using the token stored in their browser. */
async function handlePost(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const game = await getGameByCode(code);
  if (!game) return jsonError("Spilkoden findes ikke.", 404);

  const body = await req.json().catch(() => null);
  const playerToken = typeof body?.playerToken === "string" ? body.playerToken : "";
  if (!playerToken) return jsonError("Mangler spiller-token.", 400);

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("players")
    .select("*")
    .eq("game_id", game.id)
    .eq("player_token", playerToken)
    .maybeSingle();
  if (error) return jsonError(error.message, 500);
  if (!data) return jsonError("Kunne ikke genoprette forbindelsen.", 404);

  await supabase.from("players").update({ connected: true }).eq("id", data.id);

  const player = { ...(data as Player), connected: true };
  return NextResponse.json({ player: toPublicPlayer(player) });
}

export const POST = withApiErrorHandling(handlePost);
