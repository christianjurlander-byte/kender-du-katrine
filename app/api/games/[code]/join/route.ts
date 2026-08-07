import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { getGameByCode, jsonError, withApiErrorHandling } from "@/lib/apiHelpers";
import { toPublicPlayer } from "@/lib/sanitize";
import { isValidAvatar, AVATAR_OPTIONS } from "@/lib/avatars";
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

  const requestedAvatar = isValidAvatar(body?.avatar) ? body.avatar : AVATAR_OPTIONS[0];

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

  // Keep avatars unique per game where possible. If someone else grabbed the
  // requested one in the meantime, silently hand out the next free avatar
  // instead of failing the join — running out entirely (40+ players) just
  // falls back to allowing a duplicate rather than blocking someone from playing.
  const { data: takenRows } = await supabase
    .from("players")
    .select("avatar")
    .eq("game_id", game.id);
  const taken = new Set((takenRows ?? []).map((r) => r.avatar).filter(Boolean));
  const avatar = taken.has(requestedAvatar)
    ? (AVATAR_OPTIONS.find((a) => !taken.has(a)) ?? requestedAvatar)
    : requestedAvatar;

  const { data, error } = await supabase
    .from("players")
    .insert({ game_id: game.id, name, avatar })
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
