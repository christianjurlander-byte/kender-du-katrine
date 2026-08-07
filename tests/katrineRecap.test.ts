import { describe, expect, it } from "vitest";
import { buildKatrineRecapPrompt, pickRecapFallback, type KatrineRecapInput } from "@/lib/katrineRecap";

function baseInput(overrides: Partial<KatrineRecapInput> = {}): KatrineRecapInput {
  return {
    katrineName: "Katrine",
    answers: [],
    ...overrides,
  };
}

describe("pickRecapFallback", () => {
  it("handles no recorded answers", () => {
    const message = pickRecapFallback(baseInput());
    expect(message).toContain("Katrine");
    expect(message).toMatch(/18 år/);
  });

  it("includes up to 3 of her answers by name", () => {
    const input = baseInput({
      answers: [
        { questionText: "Yndlingsfarve?", answerText: "Lyserød" },
        { questionText: "Yndlingsmad?", answerText: "Pizza" },
        { questionText: "Yndlingsdyr?", answerText: "Hund" },
        { questionText: "Yndlingsfilm?", answerText: "Notting Hill" },
      ],
    });
    const message = pickRecapFallback(input);
    expect(message).toContain("Lyserød");
    expect(message).toContain("Pizza");
    expect(message).toContain("Hund");
    expect(message).not.toContain("Notting Hill");
    expect(message).toMatch(/18 år/);
  });

  it("uses the provided Katrine name throughout", () => {
    const message = pickRecapFallback(baseInput({ katrineName: "Katrine Hansen" }));
    expect(message).toContain("Katrine Hansen");
  });
});

describe("buildKatrineRecapPrompt", () => {
  it("lists every question and answer pair", () => {
    const input = baseInput({
      answers: [{ questionText: "Yndlingsfarve?", answerText: "Lyserød" }],
    });
    const prompt = buildKatrineRecapPrompt(input);
    expect(prompt).toContain('"Yndlingsfarve?"');
    expect(prompt).toContain('"Lyserød"');
  });

  it("mentions turning 18 and centers Katrine", () => {
    const prompt = buildKatrineRecapPrompt(baseInput());
    expect(prompt).toMatch(/18-års fødselsdag/);
    expect(prompt).toMatch(/centrum/);
  });

  it("includes katrine facts when provided", () => {
    const prompt = buildKatrineRecapPrompt(baseInput({ katrineFacts: "Elsker chokolade" }));
    expect(prompt).toContain("Elsker chokolade");
  });

  it("instructs against em dashes", () => {
    const prompt = buildKatrineRecapPrompt(baseInput());
    expect(prompt).toMatch(/uden tankestreger/);
  });
});
