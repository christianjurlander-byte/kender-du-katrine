import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { requireHost, jsonError, withApiErrorHandling } from "@/lib/apiHelpers";

/** Host-only: fetch the full, unabridged list of questions for editing. */
async function handleGet(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const auth = await requireHost(code, req.headers.get("x-host-token"));
  if ("errorResponse" in auth) return auth.errorResponse;
  const { game } = auth;

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("questions")
    .select("id, index, text, options")
    .eq("game_id", game.id)
    .order("index", { ascending: true });
  if (error) return jsonError(error.message, 500);

  return NextResponse.json({ questions: data ?? [] });
}

export const GET = withApiErrorHandling(handleGet);

interface QuestionInput {
  index: number;
  text: string;
  options: string[];
}

/** Host-only: replace question text/options. Only allowed before the game starts. */
async function handlePatch(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const auth = await requireHost(code, req.headers.get("x-host-token"));
  if ("errorResponse" in auth) return auth.errorResponse;
  const { game } = auth;

  if (game.status !== "lobby") {
    return jsonError("Spørgsmål kan kun redigeres, mens spillet er i lobbyen.", 409);
  }

  const body = await req.json().catch(() => null);
  const questions = Array.isArray(body?.questions) ? (body.questions as QuestionInput[]) : null;
  if (!questions || questions.length === 0) {
    return jsonError("Mangler spørgsmål.", 400);
  }

  for (const q of questions) {
    if (typeof q.text !== "string" || !q.text.trim()) {
      return jsonError("Alle spørgsmål skal have en tekst.", 400);
    }
    if (!Array.isArray(q.options) || q.options.length < 2 || q.options.length > 4) {
      return jsonError("Hvert spørgsmål skal have 2-4 svarmuligheder.", 400);
    }
    if (q.options.some((o) => typeof o !== "string" || !o.trim())) {
      return jsonError("Svarmuligheder må ikke være tomme.", 400);
    }
  }

  const supabase = getSupabaseServerClient();
  const { error } = await supabase.from("questions").upsert(
    questions.map((q) => ({
      game_id: game.id,
      index: q.index,
      text: q.text.trim(),
      options: q.options.map((o) => o.trim()),
    })),
    { onConflict: "game_id,index" }
  );
  if (error) return jsonError(error.message, 500);

  return NextResponse.json({ ok: true });
}

export const PATCH = withApiErrorHandling(handlePatch);
