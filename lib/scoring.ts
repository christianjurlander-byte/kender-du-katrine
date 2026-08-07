import type { Answer, Player, RoundResult } from "./types";

/**
 * Pure scoring function for one round.
 *
 * Rules:
 * - Katrine's own selected answer becomes the "correct" answer.
 * - Every other player who picked the same option as Katrine gets 1 point.
 * - Katrine never receives points.
 * - Players who did not answer get nothing.
 * - If Katrine did not answer, there is no correct answer and nobody scores.
 */
export function computeRoundResults(
  questionId: string,
  answers: Answer[],
  players: Pick<Player, "id">[],
  katrinePlayerId: string | null,
  optionCount: number,
  questionStartedAt: string | null = null
): RoundResult {
  const distribution = new Array(optionCount).fill(0) as number[];
  const pointsAwarded: Record<string, number> = {};

  const katrineAnswer = katrinePlayerId
    ? answers.find((a) => a.player_id === katrinePlayerId)
    : undefined;

  const correctOptionIndex = katrineAnswer ? katrineAnswer.option_index : null;

  for (const answer of answers) {
    if (answer.option_index >= 0 && answer.option_index < optionCount) {
      distribution[answer.option_index] += 1;
    }
  }

  let fastestCorrectPlayerId: string | null = null;
  let fastestCorrectMs: number | null = null;

  if (correctOptionIndex !== null) {
    const startMs = questionStartedAt ? new Date(questionStartedAt).getTime() : null;

    for (const answer of answers) {
      if (answer.player_id === katrinePlayerId) continue;
      if (answer.option_index === correctOptionIndex) {
        pointsAwarded[answer.player_id] = 1;

        if (startMs !== null) {
          const elapsedMs = new Date(answer.created_at).getTime() - startMs;
          if (elapsedMs >= 0 && (fastestCorrectMs === null || elapsedMs < fastestCorrectMs)) {
            fastestCorrectMs = elapsedMs;
            fastestCorrectPlayerId = answer.player_id;
          }
        }
      }
    }
  }

  return {
    questionId,
    correctOptionIndex,
    distribution,
    totalAnswers: answers.length,
    pointsAwarded,
    katrinePlayerId: katrinePlayerId ?? null,
    fastestCorrectPlayerId,
    fastestCorrectMs,
  };
}

/** Applies round results to a list of players, returning new scores keyed by player id. */
export function applyPointsToScores(
  players: Pick<Player, "id" | "score">[],
  pointsAwarded: Record<string, number>
): Record<string, number> {
  const newScores: Record<string, number> = {};
  for (const player of players) {
    const gained = pointsAwarded[player.id] ?? 0;
    newScores[player.id] = player.score + gained;
  }
  return newScores;
}
