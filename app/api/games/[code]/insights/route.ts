import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { getGameByCode, jsonError, withApiErrorHandling } from "@/lib/apiHelpers";
import { computeAwards, computePlayerInsights, type QuestionAnswerRecord } from "@/lib/insights";
import type { Answer } from "@/lib/types";

/**
 * Public (like the main game-state endpoint): streaks and end-of-game
 * awards, derived only from rounds that have already been revealed to
 * everyone. Never includes the currently-open, unrevealed round.
 */
async function handleGet(
  _req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const game = await getGameByCode(code);
  if (!game) return jsonError("Spillet blev ikke fundet.", 404);

  if (game.status === "lobby") {
    return NextResponse.json({ insights: [], awards: null });
  }

  const supabase = getSupabaseServerClient();

  const lastRevealedIndex =
    game.question_state === "revealed" ? game.current_question_index : game.current_question_index - 1;

  if (lastRevealedIndex < 0) {
    return NextResponse.json({ insights: [], awards: null });
  }

  const { data: questionsData, error: questionsError } = await supabase
    .from("questions")
    .select("id, index")
    .eq("game_id", game.id)
    .lte("index", lastRevealedIndex)
    .order("index", { ascending: true });
  if (questionsError) return jsonError(questionsError.message, 500);
  const questions = questionsData ?? [];

  const questionIds = questions.map((q) => q.id);
  let answers: Answer[] = [];
  if (questionIds.length > 0) {
    const { data: answersData, error: answersError } = await supabase
      .from("answers")
      .select("*")
      .in("question_id", questionIds);
    if (answersError) return jsonError(answersError.message, 500);
    answers = (answersData ?? []) as Answer[];
  }

  const records: QuestionAnswerRecord[] = questions.map((q) => {
    const questionAnswers = answers.filter((a) => a.question_id === q.id);
    const katrineAnswer = game.katrine_player_id
      ? questionAnswers.find((a) => a.player_id === game.katrine_player_id)
      : undefined;
    return {
      questionIndex: q.index,
      correctOptionIndex: katrineAnswer ? katrineAnswer.option_index : null,
      answers: questionAnswers,
    };
  });

  const insights = computePlayerInsights(records, game.katrine_player_id);

  let awards = null;
  if (game.status === "finished") {
    const { data: playersData, error: playersError } = await supabase
      .from("players")
      .select("id, name, score, is_katrine")
      .eq("game_id", game.id);
    if (playersError) return jsonError(playersError.message, 500);
    const candidates = (playersData ?? []) as {
      id: string;
      name: string;
      score: number;
      is_katrine: boolean;
    }[];
    awards = computeAwards(candidates, insights);
  }

  return NextResponse.json({ insights, awards });
}

export const GET = withApiErrorHandling(handleGet);
