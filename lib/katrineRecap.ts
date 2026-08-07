export interface KatrineRecapAnswer {
  questionText: string;
  answerText: string;
}

export interface KatrineRecapInput {
  katrineName: string;
  answers: KatrineRecapAnswer[];
  katrineFacts?: string;
}

const FALLBACK_RECAP_INTROS = [
  "I aften har vi lært en masse nyt om aftenens fødselar!",
  "Nu ved vi lidt mere om, hvad der gemmer sig bag fødselarens smil!",
  "Endnu et år klogere på verdens bedste 18-årige!",
] as const;

/**
 * Rule-based fallback for the end-of-game "what we learned about Katrine"
 * recap, used whenever no ANTHROPIC_API_KEY is configured or the AI call
 * fails. The finale screen must never break because of this.
 */
export function pickRecapFallback(input: KatrineRecapInput): string {
  const intro = FALLBACK_RECAP_INTROS[Math.floor(Math.random() * FALLBACK_RECAP_INTROS.length)];

  if (input.answers.length === 0) {
    return `🎂 ${intro} Tillykke med de 18 år, ${input.katrineName}!`;
  }

  const picks = input.answers
    .slice(0, 3)
    .map((a) => `${a.questionText.replace(/\?$/, "")}: ${a.answerText}`)
    .join(". ");

  return `🎂 ${intro} Blandt andet ville ${input.katrineName} vælge: ${picks}. Tillykke med de 18 år, ${input.katrineName}!`;
}

/**
 * Builds the prompt sent to Claude for the end-of-game recap: a warm,
 * celebratory summary of what the guests learned about Katrine tonight,
 * based on her own answers through the quiz. Katrine, turning 18, is the
 * whole point of the evening, so the prompt keeps her at the center rather
 * than the quiz winners.
 */
export function buildKatrineRecapPrompt(input: KatrineRecapInput): string {
  const lines = input.answers
    .map((a, i) => `${i + 1}. Spørgsmål: "${a.questionText}" - Katrines svar: "${a.answerText}"`)
    .join("\n");

  const factsBlock =
    input.katrineFacts && input.katrineFacts.trim()
      ? `\n\nAndre sjove/personlige detaljer om ${input.katrineName}, skrevet af værten:\n${input.katrineFacts.trim()}`
      : "";

  return `Det er ${input.katrineName}s 18-års fødselsdag i aften, og hun er aftenens ubestridte hovedperson. Alle gæster har lige spillet en fest-quiz kaldet "Kender du Katrine?", hvor de skulle gætte hendes svar på ${input.answers.length} spørgsmål om hende selv. Quizzen er nu slut.

Her er de spørgsmål, hun fik, og hvad hun selv svarede:
${lines || "(ingen svar registreret)"}
${factsBlock}

Skriv en varm, sjov og fejrende opsummering på dansk af, hvad gæsterne har lært om ${input.katrineName} i aften, baseret på hendes svar. ${input.katrineName} skal være helt i centrum af teksten, som aftenens stjerne, der lige er fyldt 18.

Regler:
- 3 til 5 sætninger.
- Varm, kærlig og festlig tone, som en god ven der holder en kort tale for hende.
- Nævn gerne konkrete ting fra hendes svar.
- Skriv i almindeligt prosasprog uden tankestreger.
- Afslut med en hjertelig lykønskning med de 18 år.
- Svar KUN med selve teksten, ingen overskrift, ingen anførselstegn, ingen forklaring.`;
}
