import { describe, expect, it } from "vitest";
import { formatCountdown, getCountdownParts } from "@/lib/countdown";

describe("getCountdownParts", () => {
  it("breaks down a future time into days/hours/minutes/seconds", () => {
    const now = new Date("2026-01-01T00:00:00.000Z").getTime();
    const target = "2026-01-02T03:04:05.000Z"; // 1 day, 3h, 4m, 5s later

    const parts = getCountdownParts(target, now);
    expect(parts).toEqual({ days: 1, hours: 3, minutes: 4, seconds: 5, isPast: false });
  });

  it("reports isPast once the target time has passed", () => {
    const now = new Date("2026-01-02T00:00:00.000Z").getTime();
    const target = "2026-01-01T00:00:00.000Z";

    const parts = getCountdownParts(target, now);
    expect(parts.isPast).toBe(true);
    expect(parts).toEqual({ days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true });
  });

  it("treats the exact target moment as already past (no negative countdown)", () => {
    const now = new Date("2026-01-01T12:00:00.000Z").getTime();
    const parts = getCountdownParts("2026-01-01T12:00:00.000Z", now);
    expect(parts.isPast).toBe(true);
  });
});

describe("formatCountdown", () => {
  it("includes days when more than a day remains", () => {
    const text = formatCountdown({ days: 1, hours: 3, minutes: 4, seconds: 5, isPast: false });
    expect(text).toBe("1 dag 3 t 4 min");
  });

  it("drops days and seconds once under an hour remains", () => {
    const text = formatCountdown({ days: 0, hours: 0, minutes: 12, seconds: 30, isPast: false });
    expect(text).toBe("12 min 30 sek");
  });

  it("shows a friendly message once the target has passed", () => {
    expect(formatCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true })).toBe(
      "Starter snart!"
    );
  });
});
