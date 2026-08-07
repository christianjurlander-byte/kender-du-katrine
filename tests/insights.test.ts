import { describe, expect, it } from "vitest";
import {
  computeAwards,
  computePlayerInsights,
  pickHighlightFacts,
  type QuestionAnswerRecord,
} from "@/lib/insights";
import type { Answer } from "@/lib/types";

function answer(playerId: string, optionIndex: number, createdAt: string): Answer {
  return {
    id: `a-${playerId}-${createdAt}`,
    question_id: "q",
    player_id: playerId,
    option_index: optionIndex,
    created_at: createdAt,
  };
}

const KATRINE = "katrine";

describe("computePlayerInsights", () => {
  it("tracks a growing streak across consecutive correct rounds", () => {
    const records: QuestionAnswerRecord[] = [
      {
        questionIndex: 0,
        correctOptionIndex: 1,
        answers: [answer(KATRINE, 1, "t0"), answer("alice", 1, "t0")],
      },
      {
        questionIndex: 1,
        correctOptionIndex: 0,
        answers: [answer(KATRINE, 0, "t1"), answer("alice", 0, "t1")],
      },
      {
        questionIndex: 2,
        correctOptionIndex: 2,
        answers: [answer(KATRINE, 2, "t2"), answer("alice", 2, "t2")],
      },
    ];

    const insights = computePlayerInsights(records, KATRINE);
    const alice = insights.find((i) => i.playerId === "alice")!;
    expect(alice.currentStreak).toBe(3);
    expect(alice.bestStreak).toBe(3);
    expect(alice.correctCount).toBe(3);
  });

  it("resets the current streak on a wrong answer, but keeps the best streak", () => {
    const records: QuestionAnswerRecord[] = [
      { questionIndex: 0, correctOptionIndex: 0, answers: [answer(KATRINE, 0, "t0"), answer("bob", 0, "t0")] },
      { questionIndex: 1, correctOptionIndex: 0, answers: [answer(KATRINE, 0, "t1"), answer("bob", 0, "t1")] },
      { questionIndex: 2, correctOptionIndex: 0, answers: [answer(KATRINE, 0, "t2"), answer("bob", 1, "t2")] },
    ];

    const insights = computePlayerInsights(records, KATRINE);
    const bob = insights.find((i) => i.playerId === "bob")!;
    expect(bob.bestStreak).toBe(2);
    expect(bob.currentStreak).toBe(0);
  });

  it("credits the earliest correct answer each round as 'fastest'", () => {
    const records: QuestionAnswerRecord[] = [
      {
        questionIndex: 0,
        correctOptionIndex: 1,
        answers: [
          answer(KATRINE, 1, "2024-01-01T00:00:00.000Z"),
          answer("alice", 1, "2024-01-01T00:00:02.000Z"),
          answer("bob", 1, "2024-01-01T00:00:01.000Z"),
        ],
      },
    ];

    const insights = computePlayerInsights(records, KATRINE);
    const bob = insights.find((i) => i.playerId === "bob")!;
    const alice = insights.find((i) => i.playerId === "alice")!;
    expect(bob.timesFastestCorrect).toBe(1);
    expect(alice.timesFastestCorrect).toBe(0);
  });

  it("never counts Katrine among the ranked players", () => {
    const records: QuestionAnswerRecord[] = [
      { questionIndex: 0, correctOptionIndex: 0, answers: [answer(KATRINE, 0, "t0")] },
    ];
    const insights = computePlayerInsights(records, KATRINE);
    expect(insights.find((i) => i.playerId === KATRINE)).toBeUndefined();
  });

  it("does not award a streak point when Katrine hasn't answered", () => {
    const records: QuestionAnswerRecord[] = [
      { questionIndex: 0, correctOptionIndex: null, answers: [answer("alice", 0, "t0")] },
    ];
    const insights = computePlayerInsights(records, KATRINE);
    const alice = insights.find((i) => i.playerId === "alice")!;
    expect(alice.currentStreak).toBe(0);
    expect(alice.correctCount).toBe(0);
  });
});

describe("computeAwards", () => {
  const players = [
    { id: "alice", name: "Alice", score: 5, is_katrine: false },
    { id: "bob", name: "Bob", score: 1, is_katrine: false },
    { id: KATRINE, name: "Katrine", score: 0, is_katrine: true },
  ];

  it("gives the top-score award to the highest scorer, excluding Katrine", () => {
    const awards = computeAwards(players, []);
    const topAward = awards.find((a) => a.title === "Kender Katrine bedst");
    expect(topAward?.playerName).toBe("Alice");
    expect(awards.every((a) => a.playerName !== "Katrine")).toBe(true);
  });

  it("gives the streak award only when someone actually has a streak of 2+", () => {
    const noStreaks = computeAwards(players, [
      { playerId: "alice", currentStreak: 0, bestStreak: 1, timesFastestCorrect: 0, correctCount: 1 },
    ]);
    expect(noStreaks.some((a) => a.title.includes("stime"))).toBe(false);

    const withStreak = computeAwards(players, [
      { playerId: "alice", currentStreak: 3, bestStreak: 3, timesFastestCorrect: 0, correctCount: 3 },
    ]);
    expect(withStreak.some((a) => a.title.includes("stime"))).toBe(true);
  });

  it("returns no awards when there are no non-Katrine players", () => {
    const awards = computeAwards([{ id: KATRINE, name: "Katrine", score: 0, is_katrine: true }], []);
    expect(awards).toEqual([]);
  });
});

describe("pickHighlightFacts", () => {
  it("mentions a streak of 2 or more, but not a streak of 1", () => {
    const names = { alice: "Alice" };
    const withStreak = pickHighlightFacts(
      [{ playerId: "alice", currentStreak: 2, bestStreak: 2, timesFastestCorrect: 0, correctCount: 2 }],
      names
    );
    expect(withStreak.some((f) => f.includes("Alice") && f.includes("2 rigtige i træk"))).toBe(true);

    const noStreak = pickHighlightFacts(
      [{ playerId: "alice", currentStreak: 1, bestStreak: 1, timesFastestCorrect: 0, correctCount: 1 }],
      names
    );
    expect(noStreak).toEqual([]);
  });

  it("mentions being fastest at least twice, but not just once", () => {
    const names = { bob: "Bob" };
    const facts = pickHighlightFacts(
      [{ playerId: "bob", currentStreak: 0, bestStreak: 0, timesFastestCorrect: 2, correctCount: 2 }],
      names
    );
    expect(facts.some((f) => f.includes("Bob") && f.includes("hurtigst 2 gange"))).toBe(true);

    const notYet = pickHighlightFacts(
      [{ playerId: "bob", currentStreak: 0, bestStreak: 0, timesFastestCorrect: 1, correctCount: 1 }],
      names
    );
    expect(notYet).toEqual([]);
  });
});
