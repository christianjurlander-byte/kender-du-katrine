import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { requireHost, jsonError, withApiErrorHandling } from "@/lib/apiHelpers";
import { applyPointsToScores, computeRoundResults } from "@/lib/scoring";
import type { Answer, Player } from "@/lib/types";

/**
 * Host-only: closes voting on the current question, computes Katrine's
 * answer as correct, awards points, and reveals the distribution.
 */
async function handlePost(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const auth = await requireHost(code, req.headers.get("x-host-token"));
  if ("errorResponse" in auth) return auth.errorResponse;
  const { game } = auth;

  if (game.status !== "active" || game.question_state !== "answering") {
    return jsonError("Der er ikke et åbent spørgsmål at lukke lige nu.", 409);
  }

  const supabase = getSupabaseServerClient();

  const { data: question, error: questionError } = await supabase
    .from("questions")
    .select("id, options")
    .eq("game_id", game.id)
    .eq("index", game.current_question_index)
    .maybeSingle();
  if (questionError) return jsonError(questionError.message, 500);
  if (!question) return jsonError("Spørgsmålet findes ikke.", 404);

  const { data: playersData, error: playersError } = await supabase
    .from("players")
    .select("*")
    .eq("game_id", game.id);
  if (playersError) return jsonError(playersError.message, 500);
  const players = (playersData ?? []) as Player[];

  const { data: answersData, error: answersError } = await supabase
    .from("answers")
    .select("*")
    .eq("question_id", question.id);
  if (answersError) return jsonError(answersError.message, 500);
  const answers = (answersData ?? []) as Answer[];

  const result = computeRoundResults(
    question.id,
    answers,
    players,
    game.katrine_player_id,
    question.options.length
  );

  const newScores = applyPointsToScores(players, result.pointsAwarded);
  await Promise.all(
    Object.entries(newScores).map(([playerId, score]) =>
      supabase.from("players").update({ score }).eq("id", playerId)
    )
  );

  const { error: gameError } = await supabase
    .from("games")
    .update({ question_state: "revealed" })
    .eq("id", game.id);
  if (gameError) return jsonError(gameError.message, 500);

  return NextResponse.json({ roundResult: result });
}

export const POST = withApiErrorHandling(handlePost);
