import { beforeEach, describe, expect, it, vi } from "vitest";
import { createFakeSupabaseClient, type FakeSupabaseClient } from "./fakeSupabase";

vi.mock("@/lib/supabaseServer", () => ({
  getSupabaseServerClient: vi.fn(),
}));

import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { POST as setKatrine } from "@/app/api/games/[code]/katrine/route";
import { POST as startGame } from "@/app/api/games/[code]/start/route";
import { POST as revealQuestion } from "@/app/api/games/[code]/reveal/route";
import { POST as nextQuestion } from "@/app/api/games/[code]/next/route";

const HOST_TOKEN = "host-secret";

function game(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "game-1",
    code: "1234",
    status: "lobby",
    question_state: "idle",
    current_question_index: 0,
    katrine_player_id: null,
    host_token: HOST_TOKEN,
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

function player(id: string, overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id,
    game_id: "game-1",
    name: id,
    is_katrine: false,
    score: 0,
    connected: true,
    player_token: `${id}-token`,
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

function question(index: number, options = ["A", "B", "C"]) {
  return { id: `q-${index}`, game_id: "game-1", index, text: `Question ${index}`, options };
}

function req(body: unknown, hostToken: string | null = HOST_TOKEN) {
  const headers = new Headers({ "Content-Type": "application/json" });
  if (hostToken) headers.set("x-host-token", hostToken);
  return new Request("http://localhost/api/games/1234/action", {
    method: "POST",
    headers,
    body: JSON.stringify(body ?? {}),
  });
}

function useClient(client: FakeSupabaseClient) {
  vi.mocked(getSupabaseServerClient).mockReturnValue(client as never);
}

const codeParams = { params: Promise.resolve({ code: "1234" }) };

describe("Host controls: only the host can act", () => {
  beforeEach(() => vi.mocked(getSupabaseServerClient).mockReset());

  it("rejects setting Katrine without the correct host token", async () => {
    const client = createFakeSupabaseClient({ games: [game()], players: [player("alice")] });
    useClient(client);

    const res = await setKatrine(req({ playerId: "alice" }, "wrong-token") as never, codeParams);
    expect(res.status).toBe(403);
    expect(client.__store.players[0].is_katrine).toBe(false);
  });

  it("rejects starting the game without a host token at all", async () => {
    const client = createFakeSupabaseClient({ games: [game()], players: [] });
    useClient(client);

    const res = await startGame(req({}, null) as never, codeParams);
    expect(res.status).toBe(403);
  });
});

describe("POST /api/games/[code]/katrine", () => {
  beforeEach(() => vi.mocked(getSupabaseServerClient).mockReset());

  it("designates exactly one Katrine, clearing any previous choice", async () => {
    const client = createFakeSupabaseClient({
      games: [game()],
      players: [player("alice", { is_katrine: true }), player("bob")],
    });
    useClient(client);

    const res = await setKatrine(req({ playerId: "bob" }) as never, codeParams);
    expect(res.status).toBe(200);

    const players = client.__store.players;
    expect(players.find((p) => p.id === "alice")!.is_katrine).toBe(false);
    expect(players.find((p) => p.id === "bob")!.is_katrine).toBe(true);
    expect(client.__store.games[0].katrine_player_id).toBe("bob");
  });

  it("refuses to change Katrine once the game has started", async () => {
    const client = createFakeSupabaseClient({
      games: [game({ status: "active" })],
      players: [player("alice"), player("bob")],
    });
    useClient(client);

    const res = await setKatrine(req({ playerId: "bob" }) as never, codeParams);
    expect(res.status).toBe(409);
  });
});

describe("POST /api/games/[code]/start", () => {
  beforeEach(() => vi.mocked(getSupabaseServerClient).mockReset());

  it("refuses to start without Katrine chosen", async () => {
    const client = createFakeSupabaseClient({
      games: [game()],
      players: [player("alice"), player("bob")],
    });
    useClient(client);

    const res = await startGame(req({}) as never, codeParams);
    expect(res.status).toBe(400);
    expect(client.__store.games[0].status).toBe("lobby");
  });

  it("refuses to start with fewer than 2 players", async () => {
    const client = createFakeSupabaseClient({
      games: [game({ katrine_player_id: "alice" })],
      players: [player("alice", { is_katrine: true })],
    });
    useClient(client);

    const res = await startGame(req({}) as never, codeParams);
    expect(res.status).toBe(400);
  });

  it("moves the game from lobby to the first question once ready", async () => {
    const client = createFakeSupabaseClient({
      games: [game({ katrine_player_id: "alice" })],
      players: [player("alice", { is_katrine: true }), player("bob")],
    });
    useClient(client);

    const res = await startGame(req({}) as never, codeParams);
    expect(res.status).toBe(200);
    expect(client.__store.games[0].status).toBe("active");
    expect(client.__store.games[0].question_state).toBe("answering");
    expect(client.__store.games[0].current_question_index).toBe(0);
  });
});

describe("POST /api/games/[code]/reveal", () => {
  beforeEach(() => vi.mocked(getSupabaseServerClient).mockReset());

  it("refuses to reveal when there is no open question", async () => {
    const client = createFakeSupabaseClient({ games: [game()], players: [] });
    useClient(client);

    const res = await revealQuestion(req({}) as never, codeParams);
    expect(res.status).toBe(409);
  });

  it("scores the round and marks the question as revealed", async () => {
    const client = createFakeSupabaseClient({
      games: [game({ status: "active", question_state: "answering", katrine_player_id: "katrine" })],
      players: [
        player("katrine", { is_katrine: true }),
        player("alice"),
        player("bob"),
      ],
      questions: [question(0)],
      answers: [
        { id: "a1", question_id: "q-0", player_id: "katrine", option_index: 1, created_at: "" },
        { id: "a2", question_id: "q-0", player_id: "alice", option_index: 1, created_at: "" },
        { id: "a3", question_id: "q-0", player_id: "bob", option_index: 0, created_at: "" },
      ],
    });
    useClient(client);

    const res = await revealQuestion(req({}) as never, codeParams);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.roundResult.correctOptionIndex).toBe(1);
    expect(client.__store.games[0].question_state).toBe("revealed");

    const players = client.__store.players;
    expect(players.find((p) => p.id === "alice")!.score).toBe(1);
    expect(players.find((p) => p.id === "bob")!.score).toBe(0);
    expect(players.find((p) => p.id === "katrine")!.score).toBe(0);
  });
});

describe("POST /api/games/[code]/next", () => {
  beforeEach(() => vi.mocked(getSupabaseServerClient).mockReset());

  it("refuses to advance before the current question is revealed", async () => {
    const client = createFakeSupabaseClient({
      games: [game({ status: "active", question_state: "answering" })],
      questions: [question(0), question(1)],
    });
    useClient(client);

    const res = await nextQuestion(req({}) as never, codeParams);
    expect(res.status).toBe(409);
  });

  it("advances to the next question when more remain", async () => {
    const client = createFakeSupabaseClient({
      games: [game({ status: "active", question_state: "revealed", current_question_index: 0 })],
      questions: [question(0), question(1)],
    });
    useClient(client);

    const res = await nextQuestion(req({}) as never, codeParams);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.finished).toBe(false);
    expect(client.__store.games[0].current_question_index).toBe(1);
    expect(client.__store.games[0].question_state).toBe("answering");
  });

  it("finishes the game after the last question", async () => {
    const client = createFakeSupabaseClient({
      games: [game({ status: "active", question_state: "revealed", current_question_index: 1 })],
      questions: [question(0), question(1)],
    });
    useClient(client);

    const res = await nextQuestion(req({}) as never, codeParams);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.finished).toBe(true);
    expect(client.__store.games[0].status).toBe("finished");
  });
});
