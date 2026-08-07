import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { getGameByCode, jsonError, withApiErrorHandling } from "@/lib/apiHelpers";
import { toPublicGame, toPublicPlayer } from "@/lib/sanitize";
import { computeRoundResults } from "@/lib/scoring";
import type { Answer, Player, Question } from "@/lib/types";

/**
 * Public game state, safe for both host and player screens.
 * Only includes the CURRENT question (not future ones, to avoid spoilers),
 * and only includes the round result once the host has revealed it.
 */
async function handleGet(
  _req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const game = await getGameByCode(code);
  if (!game) return jsonError("Spillet blev ikke fundet.", 404);

  const supabase = getSupabaseServerClient();

  const { data: playersData, error: playersError } = await supabase
    .from("players")
    .select("*")
    .eq("game_id", game.id)
    .order("created_at", { ascending: true });
  if (playersError) return jsonError(playersError.message, 500);
  const players = (playersData ?? []) as Player[];

  let currentQuestion: Pick<Question, "id" | "index" | "text" | "options" | "image_url"> | null =
    null;
  let totalQuestions = 0;
  let roundResult: ReturnType<typeof computeRoundResults> | null = null;
  let answeredCount = 0;
  let answeredPlayerIds: string[] = [];

  const { count } = await supabase
    .from("questions")
    .select("id", { count: "exact", head: true })
    .eq("game_id", game.id);
  totalQuestions = count ?? 0;

  if (game.status !== "lobby") {
    const { data: qData, error: qError } = await supabase
      .from("questions")
      .select("id, index, text, options, image_url")
      .eq("game_id", game.id)
      .eq("index", game.current_question_index)
      .maybeSingle();
    if (qError) return jsonError(qError.message, 500);
    currentQuestion = qData;

    if (currentQuestion) {
      const { data: receiptData } = await supabase
        .from("answer_receipts")
        .select("player_id")
        .eq("question_id", currentQuestion.id);
      answeredPlayerIds = (receiptData ?? []).map((r) => r.player_id as string);
      answeredCount = answeredPlayerIds.length;

      if (game.question_state === "revealed") {
        const { data: answersData, error: answersError } = await supabase
          .from("answers")
          .select("*")
          .eq("question_id", currentQuestion.id);
        if (answersError) return jsonError(answersError.message, 500);

        roundResult = computeRoundResults(
          currentQuestion.id,
          (answersData ?? []) as Answer[],
          players,
          game.katrine_player_id,
          currentQuestion.options.length,
          game.question_started_at
        );
      }
    }
  }

  return NextResponse.json({
    game: toPublicGame(game),
    players: players.map(toPublicPlayer),
    currentQuestion,
    totalQuestions,
    answeredCount,
    answeredPlayerIds,
    roundResult,
  });
}

export const GET = withApiErrorHandling(handleGet);
