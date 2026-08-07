import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { requireHost, jsonError, withApiErrorHandling } from "@/lib/apiHelpers";

/** Host-only: advances to the next question, or finishes the game. */
async function handlePost(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const auth = await requireHost(code, req.headers.get("x-host-token"));
  if ("errorResponse" in auth) return auth.errorResponse;
  const { game } = auth;

  if (game.status !== "active" || game.question_state !== "revealed") {
    return jsonError("Luk det aktuelle spørgsmål, før du går videre.", 409);
  }

  const supabase = getSupabaseServerClient();
  const { count } = await supabase
    .from("questions")
    .select("id", { count: "exact", head: true })
    .eq("game_id", game.id);
  const totalQuestions = count ?? 0;
  const nextIndex = game.current_question_index + 1;

  if (nextIndex >= totalQuestions) {
    const { error } = await supabase
      .from("games")
      .update({ status: "finished", question_state: "idle" })
      .eq("id", game.id);
    if (error) return jsonError(error.message, 500);
    return NextResponse.json({ ok: true, finished: true });
  }

  const { error } = await supabase
    .from("games")
    .update({
      current_question_index: nextIndex,
      question_state: "answering",
      question_started_at: new Date().toISOString(),
    })
    .eq("id", game.id);
  if (error) return jsonError(error.message, 500);

  return NextResponse.json({ ok: true, finished: false });
}

export const POST = withApiErrorHandling(handlePost);
