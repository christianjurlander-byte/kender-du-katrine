import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { getGameByCode, jsonError, withApiErrorHandling } from "@/lib/apiHelpers";
import { toPublicPlayer } from "@/lib/sanitize";
import type { Player } from "@/lib/types";

async function handlePost(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const game = await getGameByCode(code);
  if (!game) return jsonError("Spilkoden findes ikke.", 404);
  if (game.status !== "lobby") {
    return jsonError("Spillet er allerede i gang, du kan ikke længere deltage.", 409);
  }

  const body = await req.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  if (!name) return jsonError("Indtast et navn.", 400);
  if (name.length > 30) return jsonError("Navnet er for langt (max 30 tegn).", 400);

  const supabase = getSupabaseServerClient();

  const { data: existing } = await supabase
    .from("players")
    .select("id")
    .eq("game_id", game.id)
    .ilike("name", name)
    .maybeSingle();
  if (existing) {
    return jsonError("Der er allerede en spiller med det navn i dette spil.", 409);
  }

  const { data, error } = await supabase
    .from("players")
    .insert({ game_id: game.id, name })
    .select("*")
    .maybeSingle();
  if (error) return jsonError(error.message, 500);

  const player = data as Player;
  return NextResponse.json({
    player: toPublicPlayer(player),
    playerToken: player.player_token,
  });
}

export const POST = withApiErrorHandling(handlePost);
