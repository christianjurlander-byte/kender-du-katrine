import { describe, expect, it } from "vitest";
import { FALLBACK_LOBBY_MESSAGES, pickRandomFallback } from "@/lib/lobbyVibes";

describe("pickRandomFallback", () => {
  it("always returns one of the fixed fallback messages", () => {
    for (let i = 0; i < 20; i++) {
      expect(FALLBACK_LOBBY_MESSAGES).toContain(pickRandomFallback());
    }
  });

  it("has more than one message so it doesn't repeat immediately", () => {
    expect(FALLBACK_LOBBY_MESSAGES.length).toBeGreaterThan(5);
  });
});
