import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { requireHost, jsonError, withApiErrorHandling } from "@/lib/apiHelpers";

/** Host-only: leaves the lobby and starts question #0. */
async function handlePost(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const auth = await requireHost(code, req.headers.get("x-host-token"));
  if ("errorResponse" in auth) return auth.errorResponse;
  const { game } = auth;

  if (game.status !== "lobby") {
    return jsonError("Spillet er allerede startet.", 409);
  }
  if (!game.katrine_player_id) {
    return jsonError("Vælg hvem der er Katrine, før spillet startes.", 400);
  }

  const supabase = getSupabaseServerClient();
  const { count } = await supabase
    .from("players")
    .select("id", { count: "exact", head: true })
    .eq("game_id", game.id);
  if (!count || count < 2) {
    return jsonError("Der skal være mindst 2 spillere (inkl. Katrine) for at starte.", 400);
  }

  const { error } = await supabase
    .from("games")
    .update({ status: "active", current_question_index: 0, question_state: "answering" })
    .eq("id", game.id);
  if (error) return jsonError(error.message, 500);

  return NextResponse.json({ ok: true });
}

export const POST = withApiErrorHandling(handlePost);
