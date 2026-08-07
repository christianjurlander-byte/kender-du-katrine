import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { getGameByCode, jsonError, withApiErrorHandling } from "@/lib/apiHelpers";
import { buildKatrineRecapPrompt, pickRecapFallback, type KatrineRecapInput } from "@/lib/katrineRecap";
import type { Answer, Player, Question } from "@/lib/types";

/**
 * Public: an end-of-game "what did we learn about Katrine tonight" recap,
 * built from her own answers through the quiz. Only available once the
 * game is finished. Uses Claude if ANTHROPIC_API_KEY is configured,
 * otherwise falls back to a rule-based summary.
 */
async function handleGet(
  _req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const game = await getGameByCode(code);
  if (!game) return jsonError("Spillet blev ikke fundet.", 404);

  if (game.status !== "finished") {
    return jsonError("Spillet er ikke slut endnu.", 409);
  }
  if (!game.katrine_player_id) {
    return NextResponse.json({ message: null, source: "fallback" });
  }

  const supabase = getSupabaseServerClient();

  const { data: katrineData } = await supabase
    .from("players")
    .select("name")
    .eq("id", game.katrine_player_id)
    .maybeSingle();
  const katrineName = (katrineData as Pick<Player, "name"> | null)?.name ?? "Katrine";

  const { data: questionsData, error: qError } = await supabase
    .from("questions")
    .select("id, index, text, options")
    .eq("game_id", game.id)
    .order("index", { ascending: true });
  if (qError) return jsonError(qError.message, 500);
  const questions = (questionsData ?? []) as Pick<Question, "id" | "index" | "text" | "options">[];

  const { data: answersData, error: answersError } = await supabase
    .from("answers")
    .select("*")
    .eq("player_id", game.katrine_player_id);
  if (answersError) return jsonError(answersError.message, 500);
  const answers = (answersData ?? []) as Answer[];
  const answersByQuestion = new Map(answers.map((a) => [a.question_id, a]));

  const recapAnswers = questions
    .map((q) => {
      const answer = answersByQuestion.get(q.id);
      if (!answer) return null;
      const answerText = q.options[answer.option_index];
      if (!answerText) return null;
      return { questionText: q.text, answerText };
    })
    .filter((a): a is { questionText: string; answerText: string } => a !== null);

  const input: KatrineRecapInput = {
    katrineName,
    answers: recapAnswers,
    katrineFacts: game.katrine_facts,
  };

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ message: pickRecapFallback(input), source: "fallback" });
  }

  try {
    const client = new Anthropic({ apiKey });
    const response = await client.messages.create({
      model: "claude-opus-5",
      max_tokens: 300,
      output_config: { effort: "low" },
      messages: [{ role: "user", content: buildKatrineRecapPrompt(input) }],
    });

    if (response.stop_reason === "refusal") {
      return NextResponse.json({ message: pickRecapFallback(input), source: "fallback" });
    }

    const textBlock = response.content.find((block) => block.type === "text");
    const message = textBlock?.type === "text" ? textBlock.text.trim() : "";

    if (!message) {
      return NextResponse.json({ message: pickRecapFallback(input), source: "fallback" });
    }

    return NextResponse.json({ message, source: "ai" });
  } catch (err) {
    console.error("Katrine recap generation failed, using fallback:", err);
    return NextResponse.json({ message: pickRecapFallback(input), source: "fallback" });
  }
}

export const GET = withApiErrorHandling(handleGet);
