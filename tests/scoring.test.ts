import { describe, expect, it } from "vitest";
import { applyPointsToScores, computeRoundResults } from "@/lib/scoring";
import type { Answer } from "@/lib/types";

function answer(playerId: string, optionIndex: number): Answer {
  return {
    id: `answer-${playerId}`,
    question_id: "q1",
    player_id: playerId,
    option_index: optionIndex,
    created_at: new Date().toISOString(),
  };
}

describe("computeRoundResults", () => {
  it("awards 1 point to every player who matched Katrine's answer", () => {
    const answers = [
      answer("katrine", 2),
      answer("alice", 2),
      answer("bob", 2),
      answer("carol", 0),
    ];
    const result = computeRoundResults("q1", answers, [], "katrine", 4);

    expect(result.correctOptionIndex).toBe(2);
    expect(result.pointsAwarded).toEqual({ alice: 1, bob: 1 });
    expect(result.pointsAwarded.carol).toBeUndefined();
  });

  it("never awards Katrine a point, even if she 'matches' herself", () => {
    const answers = [answer("katrine", 1), answer("alice", 1)];
    const result = computeRoundResults("q1", answers, [], "katrine", 3);

    expect(result.pointsAwarded.katrine).toBeUndefined();
    expect(result.pointsAwarded.alice).toBe(1);
  });

  it("produces a correct answer distribution across all options", () => {
    const answers = [
      answer("katrine", 0),
      answer("alice", 0),
      answer("bob", 1),
      answer("carol", 2),
    ];
    const result = computeRoundResults("q1", answers, [], "katrine", 3);

    expect(result.distribution).toEqual([2, 1, 1]);
    expect(result.totalAnswers).toBe(4);
  });

  it("has no correct answer and awards nobody when Katrine did not answer", () => {
    const answers = [answer("alice", 0), answer("bob", 0)];
    const result = computeRoundResults("q1", answers, [], "katrine", 3);

    expect(result.correctOptionIndex).toBeNull();
    expect(result.pointsAwarded).toEqual({});
  });

  it("awards nobody when Katrine is not yet assigned", () => {
    const answers = [answer("alice", 0), answer("bob", 0)];
    const result = computeRoundResults("q1", answers, [], null, 3);

    expect(result.correctOptionIndex).toBeNull();
    expect(result.pointsAwarded).toEqual({});
  });

  it("gives no points to players who did not answer", () => {
    const answers = [answer("katrine", 1)];
    const result = computeRoundResults("q1", answers, [], "katrine", 3);

    expect(result.pointsAwarded).toEqual({});
    expect(result.totalAnswers).toBe(1);
  });
});

describe("applyPointsToScores", () => {
  it("adds gained points on top of existing scores", () => {
    const players = [
      { id: "alice", score: 3 },
      { id: "bob", score: 0 },
      { id: "katrine", score: 0 },
    ];
    const newScores = applyPointsToScores(players, { alice: 1 });

    expect(newScores).toEqual({ alice: 4, bob: 0, katrine: 0 });
  });

  it("leaves scores unchanged when nobody scored", () => {
    const players = [{ id: "alice", score: 5 }];
    expect(applyPointsToScores(players, {})).toEqual({ alice: 5 });
  });
});
