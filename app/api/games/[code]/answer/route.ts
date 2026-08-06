import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { getGameByCode, jsonError, withApiErrorHandling } from "@/lib/apiHelpers";

/** A player (or Katrine) submits their secret answer to the current question. */
async function handlePost(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const game = await getGameByCode(code);
  if (!game) return jsonError("Spillet blev ikke fundet.", 404);

  if (game.status !== "active" || game.question_state !== "answering") {
    return jsonError("Der er ikke et aktivt spørgsmål lige nu.", 409);
  }

  const body = await req.json().catch(() => null);
  const playerToken = typeof body?.playerToken === "string" ? body.playerToken : "";
  const optionIndex = typeof body?.optionIndex === "number" ? body.optionIndex : -1;
  if (!playerToken) return jsonError("Mangler spiller-token.", 400);
  if (optionIndex < 0) return jsonError("Ugyldigt svar.", 400);

  const supabase = getSupabaseServerClient();

  const { data: player, error: playerError } = await supabase
    .from("players")
    .select("id, game_id")
    .eq("player_token", playerToken)
    .maybeSingle();
  if (playerError) return jsonError(playerError.message, 500);
  if (!player || player.game_id !== game.id) {
    return jsonError("Ukendt spiller.", 404);
  }

  const { data: question, error: questionError } = await supabase
    .from("questions")
    .select("id, options")
    .eq("game_id", game.id)
    .eq("index", game.current_question_index)
    .maybeSingle();
  if (questionError) return jsonError(questionError.message, 500);
  if (!question) return jsonError("Spørgsmålet findes ikke.", 404);
  if (optionIndex >= question.options.length) {
    return jsonError("Ugyldigt svar.", 400);
  }

  const { error: answerError } = await supabase.from("answers").insert({
    question_id: question.id,
    player_id: player.id,
    option_index: optionIndex,
  });
  if (answerError) {
    if (answerError.code === "23505") {
      return jsonError("Du har allerede svaret på dette spørgsmål.", 409);
    }
    return jsonError(answerError.message, 500);
  }

  await supabase.from("answer_receipts").insert({
    question_id: question.id,
    player_id: player.id,
  });

  return NextResponse.json({ ok: true });
}

export const POST = withApiErrorHandling(handlePost);
