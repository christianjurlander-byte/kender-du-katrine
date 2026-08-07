import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { getGameByCode, jsonError, withApiErrorHandling } from "@/lib/apiHelpers";
import { buildRoundVibePrompt, pickRoundFallback, type RoundVibeInput, type RoundVibePlayer } from "@/lib/roundVibes";
import type { Answer, Player, Question } from "@/lib/types";

/**
 * Public: a short, funny AI (or fallback) "live commentator" line for the
 * just-revealed round, referencing players by name/avatar and comparing
 * correctness and answer speed. Uses Claude if ANTHROPIC_API_KEY is
 * configured, otherwise falls back to a rule-based message — this endpoint
 * must never be the reason the reveal screen breaks.
 */
async function handleGet(
  _req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const game = await getGameByCode(code);
  if (!game) return jsonError("Spillet blev ikke fundet.", 404);

  if (game.question_state !== "revealed") {
    return jsonError("Ingen runde er afsløret endnu.", 409);
  }

  const supabase = getSupabaseServerClient();

  const { data: questionData, error: qError } = await supabase
    .from("questions")
    .select("id, index, text, options")
    .eq("game_id", game.id)
    .eq("index", game.current_question_index)
    .maybeSingle();
  if (qError) return jsonError(qError.message, 500);
  if (!questionData) return jsonError("Spørgsmålet blev ikke fundet.", 404);
  const question = questionData as Pick<Question, "id" | "index" | "text" | "options">;

  const { count } = await supabase
    .from("questions")
    .select("id", { count: "exact", head: true })
    .eq("game_id", game.id);
  const totalQuestions = count ?? 0;

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

  const answersByPlayer = new Map(answers.map((a) => [a.player_id, a]));
  const katrineAnswer = game.katrine_player_id ? answersByPlayer.get(game.katrine_player_id) : undefined;
  const correctOptionIndex = katrineAnswer ? katrineAnswer.option_index : null;
  const correctOptionText = correctOptionIndex !== null ? (question.options[correctOptionIndex] ?? null) : null;

  const startMs = game.question_started_at ? new Date(game.question_started_at).getTime() : null;

  const roundPlayers: RoundVibePlayer[] = players.map((p) => {
    const answer = answersByPlayer.get(p.id);
    if (!answer) {
      return { name: p.name, avatar: p.avatar, isKatrine: p.is_katrine, didAnswer: false, isCorrect: null, elapsedMs: null };
    }
    const isCorrect = correctOptionIndex !== null ? answer.option_index === correctOptionIndex : null;
    const elapsedMsRaw = startMs !== null ? new Date(answer.created_at).getTime() - startMs : null;
    const elapsedMs = elapsedMsRaw !== null && elapsedMsRaw >= 0 ? elapsedMsRaw : null;
    return { name: p.name, avatar: p.avatar, isKatrine: p.is_katrine, didAnswer: true, isCorrect, elapsedMs };
  });

  const input: RoundVibeInput = {
    questionIndex: question.index,
    totalQuestions,
    questionText: question.text,
    correctOptionText,
    players: roundPlayers,
    katrineFacts: game.katrine_facts,
  };

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ message: pickRoundFallback(input), source: "fallback" });
  }

  try {
    const client = new Anthropic({ apiKey });
    const response = await client.messages.create({
      model: "claude-opus-5",
      max_tokens: 160,
      output_config: { effort: "low" },
      messages: [{ role: "user", content: buildRoundVibePrompt(input) }],
    });

    if (response.stop_reason === "refusal") {
      return NextResponse.json({ message: pickRoundFallback(input), source: "fallback" });
    }

    const textBlock = response.content.find((block) => block.type === "text");
    const message = textBlock?.type === "text" ? textBlock.text.trim() : "";

    if (!message || response.stop_reason === "max_tokens") {
      return NextResponse.json({ message: pickRoundFallback(input), source: "fallback" });
    }

    return NextResponse.json({ message, source: "ai" });
  } catch (err) {
    console.error("Round vibe generation failed, using fallback:", err);
    return NextResponse.json({ message: pickRoundFallback(input), source: "fallback" });
  }
}

export const GET = withApiErrorHandling(handleGet);
