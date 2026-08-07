import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { generateGameCode } from "@/lib/gameCode";
import { DEFAULT_QUESTIONS } from "@/lib/defaultQuestions";
import { jsonError, withApiErrorHandling } from "@/lib/apiHelpers";

/** Creates a new game with a unique 4-digit code and the default questions. */
async function handlePost() {
  const supabase = getSupabaseServerClient();

  let code = "";
  let gameId: string | null = null;

  // Extremely unlikely to collide, but retry a few times just in case.
  for (let attempt = 0; attempt < 10 && !gameId; attempt++) {
    code = generateGameCode();
    const { data, error } = await supabase
      .from("games")
      .insert({ code })
      .select("id, code, host_token")
      .maybeSingle();

    if (error) {
      if (error.code === "23505") continue; // unique_violation on code, retry
      return jsonError(error.message, 500);
    }
    if (data) {
      gameId = data.id;
      const { error: qError } = await supabase.from("questions").insert(
        DEFAULT_QUESTIONS.map((q, index) => ({
          game_id: data.id,
          index,
          text: q.text,
          options: q.options,
        }))
      );
      if (qError) return jsonError(qError.message, 500);

      return NextResponse.json({
        gameId: data.id,
        code: data.code,
        hostToken: data.host_token,
      });
    }
  }

  return jsonError("Kunne ikke oprette spil, prøv igen.", 500);
}

export const POST = withApiErrorHandling(handlePost);
