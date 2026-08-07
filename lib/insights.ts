import type { Answer, Award } from "./types";

export interface QuestionAnswerRecord {
  questionIndex: number;
  correctOptionIndex: number | null;
  answers: Answer[];
}

export interface PlayerInsight {
  playerId: string;
  currentStreak: number;
  bestStreak: number;
  timesFastestCorrect: number;
  correctCount: number;
}

/**
 * Walks through every revealed round (in question order) and, for each
 * non-Katrine player, tracks their correct-answer streaks and how many
 * times they were the first to lock in the correct answer. Pure and
 * data-only — no timers, no randomness, so it's easy to unit test and to
 * later hand off to an LLM for witty phrasing without touching this logic.
 */
export function computePlayerInsights(
  records: QuestionAnswerRecord[],
  katrinePlayerId: string | null
): PlayerInsight[] {
  const insights = new Map<string, PlayerInsight>();

  function get(playerId: string): PlayerInsight {
    let insight = insights.get(playerId);
    if (!insight) {
      insight = { playerId, currentStreak: 0, bestStreak: 0, timesFastestCorrect: 0, correctCount: 0 };
      insights.set(playerId, insight);
    }
    return insight;
  }

  const sorted = [...records].sort((a, b) => a.questionIndex - b.questionIndex);

  for (const record of sorted) {
    const playerIdsThisRound = new Set(
      record.answers.map((a) => a.player_id).filter((id) => id !== katrinePlayerId)
    );

    let fastestPlayerId: string | null = null;
    let fastestTime: number | null = null;

    for (const playerId of playerIdsThisRound) {
      const answer = record.answers.find((a) => a.player_id === playerId);
      const insight = get(playerId);
      const isCorrect =
        record.correctOptionIndex !== null && answer?.option_index === record.correctOptionIndex;

      if (isCorrect) {
        insight.correctCount += 1;
        insight.currentStreak += 1;
        insight.bestStreak = Math.max(insight.bestStreak, insight.currentStreak);

        const time = answer ? new Date(answer.created_at).getTime() : null;
        if (time !== null && (fastestTime === null || time < fastestTime)) {
          fastestTime = time;
          fastestPlayerId = playerId;
        }
      } else {
        insight.currentStreak = 0;
      }
    }

    if (fastestPlayerId) {
      get(fastestPlayerId).timesFastestCorrect += 1;
    }
  }

  return [...insights.values()];
}

interface AwardCandidate {
  id: string;
  name: string;
  score: number;
  is_katrine: boolean;
}

/** Turns the raw numbers into a handful of light-hearted end-of-game awards. */
export function computeAwards(
  players: AwardCandidate[],
  insights: PlayerInsight[]
): Award[] {
  const contenders = players.filter((p) => !p.is_katrine);
  if (contenders.length === 0) return [];

  const awards: Award[] = [];
  const byId = new Map(insights.map((i) => [i.playerId, i]));

  const topScore = [...contenders].sort((a, b) => b.score - a.score)[0];
  if (topScore && topScore.score > 0) {
    awards.push({ emoji: "🏆", title: "Kender Katrine bedst", playerName: topScore.name });
  }

  const fastest = [...contenders].sort(
    (a, b) => (byId.get(b.id)?.timesFastestCorrect ?? 0) - (byId.get(a.id)?.timesFastestCorrect ?? 0)
  )[0];
  if (fastest && (byId.get(fastest.id)?.timesFastestCorrect ?? 0) > 0) {
    awards.push({ emoji: "⚡", title: "Hurtigste fingre", playerName: fastest.name });
  }

  const streakiest = [...contenders].sort(
    (a, b) => (byId.get(b.id)?.bestStreak ?? 0) - (byId.get(a.id)?.bestStreak ?? 0)
  )[0];
  if (streakiest && (byId.get(streakiest.id)?.bestStreak ?? 0) >= 2) {
    awards.push({ emoji: "🔥", title: "Længste stime af rigtige svar", playerName: streakiest.name });
  }

  if (contenders.length > 1) {
    const lowestScore = [...contenders].sort((a, b) => a.score - b.score)[0];
    if (lowestScore) {
      awards.push({ emoji: "🐢", title: "Tog den med ro", playerName: lowestScore.name });
    }
  }

  return awards;
}

/**
 * A couple of short, live "fun fact" lines for the shared screen —
 * whoever's currently on a hot streak or has been fastest most often.
 * Rule-based today; designed so an LLM could later replace just this
 * function with wittier phrasing, without touching the underlying stats.
 */
export function pickHighlightFacts(
  insights: PlayerInsight[],
  playerNames: Record<string, string>
): string[] {
  const facts: string[] = [];

  const streakLeader = [...insights].sort((a, b) => b.currentStreak - a.currentStreak)[0];
  if (streakLeader && streakLeader.currentStreak >= 2) {
    const name = playerNames[streakLeader.playerId] ?? "Nogen";
    facts.push(`🔥 ${name} har ${streakLeader.currentStreak} rigtige i træk!`);
  }

  const fastestLeader = [...insights].sort(
    (a, b) => b.timesFastestCorrect - a.timesFastestCorrect
  )[0];
  if (fastestLeader && fastestLeader.timesFastestCorrect >= 2) {
    const name = playerNames[fastestLeader.playerId] ?? "Nogen";
    facts.push(`⚡ ${name} har svaret hurtigst ${fastestLeader.timesFastestCorrect} gange!`);
  }

  return facts;
}
