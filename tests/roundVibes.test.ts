import { describe, expect, it } from "vitest";
import { buildRoundVibePrompt, pickRoundFallback, type RoundVibeInput } from "@/lib/roundVibes";

function baseInput(overrides: Partial<RoundVibeInput> = {}): RoundVibeInput {
  return {
    questionIndex: 2,
    totalQuestions: 10,
    questionText: "Hvad er Katrines yndlingsfarve?",
    correctOptionText: "Lyserød",
    players: [],
    ...overrides,
  };
}

describe("pickRoundFallback", () => {
  it("handles nobody answering", () => {
    const input = baseInput({
      players: [
        { name: "Anna", avatar: "🦊", isKatrine: false, didAnswer: false, isCorrect: null, elapsedMs: null },
      ],
    });
    expect(pickRoundFallback(input)).toMatch(/ingen nåede at svare/i);
  });

  it("handles everyone answering wrong", () => {
    const input = baseInput({
      players: [
        { name: "Anna", avatar: "🦊", isKatrine: false, didAnswer: true, isCorrect: false, elapsedMs: 4000 },
        { name: "Bo", avatar: "🐢", isKatrine: false, didAnswer: true, isCorrect: false, elapsedMs: 6000 },
      ],
    });
    expect(pickRoundFallback(input)).toMatch(/sværere|gættede/i);
  });

  it("names the fastest correct player, including their avatar", () => {
    const input = baseInput({
      players: [
        { name: "Anna", avatar: "🦊", isKatrine: false, didAnswer: true, isCorrect: true, elapsedMs: 2000 },
        { name: "Bo", avatar: "🐢", isKatrine: false, didAnswer: true, isCorrect: true, elapsedMs: 6000 },
      ],
    });
    const message = pickRoundFallback(input);
    expect(message).toContain("Anna");
    expect(message).toContain("🦊");
    expect(message).not.toContain("Bo var hurtigst");
  });

  it("excludes Katrine from the tally", () => {
    const input = baseInput({
      players: [
        { name: "Katrine", avatar: "👑", isKatrine: true, didAnswer: true, isCorrect: null, elapsedMs: 1000 },
      ],
    });
    expect(pickRoundFallback(input)).toMatch(/logbogen/i);
  });
});

describe("buildRoundVibePrompt", () => {
  it("includes each non-Katrine player's name, avatar and verdict", () => {
    const input = baseInput({
      players: [
        { name: "Anna", avatar: "🦊", isKatrine: false, didAnswer: true, isCorrect: true, elapsedMs: 2500 },
        { name: "Katrine", avatar: "👑", isKatrine: true, didAnswer: true, isCorrect: null, elapsedMs: 500 },
      ],
    });
    const prompt = buildRoundVibePrompt(input);
    expect(prompt).toContain("🦊 Anna: gættede RIGTIGT, brugte 2.5 sekunder");
    expect(prompt).not.toContain("👑 Katrine:");
  });

  it("includes katrine facts when provided", () => {
    const input = baseInput({ players: [], katrineFacts: "Elsker chokolade" });
    expect(buildRoundVibePrompt(input)).toContain("Elsker chokolade");
  });
});
