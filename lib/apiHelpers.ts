import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "./supabaseServer";
import type { Game } from "./types";

export function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

/**
 * Wraps a route handler so any unexpected exception (e.g. a Supabase
 * network hiccup) still comes back as a proper JSON error response instead
 * of crashing the request and leaving the client with an empty/invalid
 * body to parse.
 */
export function withApiErrorHandling<Args extends unknown[]>(
  handler: (...args: Args) => Promise<NextResponse>
) {
  return async (...args: Args): Promise<NextResponse> => {
    try {
      return await handler(...args);
    } catch (err) {
      console.error(err);
      return jsonError("Der opstod en uventet fejl. Prøv igen om lidt.", 500);
    }
  };
}

export async function getGameByCode(code: string): Promise<Game | null> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("games")
    .select("*")
    .eq("code", code)
    .maybeSingle();

  if (error) throw error;
  return data as Game | null;
}

/**
 * Verifies the caller supplied the correct host token for this game via the
 * "x-host-token" header. Returns the game if authorized, or a NextResponse
 * error to return immediately if not.
 */
export async function requireHost(
  code: string,
  hostToken: string | null
): Promise<{ game: Game } | { errorResponse: NextResponse }> {
  const game = await getGameByCode(code);
  if (!game) {
    return { errorResponse: jsonError("Spillet blev ikke fundet.", 404) };
  }
  if (!hostToken || hostToken !== game.host_token) {
    return { errorResponse: jsonError("Kun værten kan gøre dette.", 403) };
  }
  return { game };
}
