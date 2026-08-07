import type { PublicGame, PublicPlayer, RoundResult } from "./types";

export interface GameStateResponse {
  game: PublicGame;
  players: PublicPlayer[];
  currentQuestion: {
    id: string;
    index: number;
    text: string;
    options: string[];
    image_url: string | null;
  } | null;
  totalQuestions: number;
  answeredCount: number;
  answeredPlayerIds: string[];
  roundResult: RoundResult | null;
}

export async function fetchGameState(code: string): Promise<GameStateResponse> {
  const res = await fetch(`/api/games/${code}`, { cache: "no-store" });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Kunne ikke hente spillets tilstand.");
  }
  return res.json();
}
