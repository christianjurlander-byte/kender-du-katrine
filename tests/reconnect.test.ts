import { beforeEach, describe, expect, it, vi } from "vitest";
import { createFakeSupabaseClient } from "./fakeSupabase";

vi.mock("@/lib/supabaseServer", () => ({
  getSupabaseServerClient: vi.fn(),
}));

import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { POST as reconnect } from "@/app/api/games/[code]/reconnect/route";

function seedGame() {
  return {
    id: "game-1",
    code: "1234",
    status: "lobby",
    question_state: "idle",
    current_question_index: 0,
    katrine_player_id: null,
    host_token: "host-secret",
    created_at: new Date().toISOString(),
  };
}

function seedPlayer(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "player-1",
    game_id: "game-1",
    name: "Alice",
    is_katrine: false,
    score: 0,
    connected: false,
    player_token: "player-secret-token",
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

function req(body: unknown) {
  return new Request("http://localhost/api/games/1234/reconnect", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

describe("POST /api/games/[code]/reconnect", () => {
  beforeEach(() => {
    vi.mocked(getSupabaseServerClient).mockReset();
  });

  it("reconnects a returning player and marks them connected", async () => {
    const client = createFakeSupabaseClient({
      games: [seedGame()],
      players: [seedPlayer({ connected: false })],
    });
    vi.mocked(getSupabaseServerClient).mockReturnValue(client as never);

    const res = await reconnect(req({ playerToken: "player-secret-token" }) as never, {
      params: Promise.resolve({ code: "1234" }),
    });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.player.name).toBe("Alice");
    expect(body.player.connected).toBe(true);
    // The secret token must never be sent back to the browser.
    expect(body.player.player_token).toBeUndefined();

    const storedPlayer = client.__store.players[0];
    expect(storedPlayer.connected).toBe(true);
  });

  it("rejects an unknown player token", async () => {
    const client = createFakeSupabaseClient({
      games: [seedGame()],
      players: [seedPlayer()],
    });
    vi.mocked(getSupabaseServerClient).mockReturnValue(client as never);

    const res = await reconnect(req({ playerToken: "not-a-real-token" }) as never, {
      params: Promise.resolve({ code: "1234" }),
    });

    expect(res.status).toBe(404);
  });

  it("rejects reconnecting to a game code that doesn't exist", async () => {
    const client = createFakeSupabaseClient({ games: [], players: [] });
    vi.mocked(getSupabaseServerClient).mockReturnValue(client as never);

    const res = await reconnect(req({ playerToken: "anything" }) as never, {
      params: Promise.resolve({ code: "9999" }),
    });

    expect(res.status).toBe(404);
  });

  it("rejects a request with no player token", async () => {
    const client = createFakeSupabaseClient({ games: [seedGame()], players: [] });
    vi.mocked(getSupabaseServerClient).mockReturnValue(client as never);

    const res = await reconnect(req({}) as never, {
      params: Promise.resolve({ code: "1234" }),
    });

    expect(res.status).toBe(400);
  });
});
