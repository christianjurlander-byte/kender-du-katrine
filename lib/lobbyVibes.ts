/**
 * Fun, rotating lobby messages shown while guests wait for the quiz to
 * start. Used as the zero-setup default and as the fallback whenever no
 * ANTHROPIC_API_KEY is configured (see app/api/games/[code]/vibe/route.ts).
 */
export const FALLBACK_LOBBY_MESSAGES = [
  "🎉 Snart går det løs — find telefonen frem og lad den lade op!",
  "👑 Et sted derude sidder Katrine og øver sig i at holde pokerfjæs.",
  "🧠 Tips: den, der kender Katrine bedst, vinder ikke nødvendigvis — det gør den, der tænker som hende!",
  "📸 Perfekt tidspunkt til at tage et gruppebillede, mens I venter.",
  "🍕 Nogen bør bestille snacks, inden quizzen går i gang.",
  "🎤 Værten tester lige mikrofonen... eller også finder de bare ud af reglerne.",
  "🔮 Spå med: hvem tror du får flest point i aften?",
  "🥳 Jo flere der er med, jo sjovere bliver det — del koden med de sidste!",
  "☕ Sidste kald til kaffe/vin/sodavand, inden hjernerne skal arbejde.",
  "🏆 Der er ingen præmie for hurtigst tastefingre — kun for at kende Katrine bedst.",
  "😅 Lidt nervøs på Katrines vegne? Det er helt normalt.",
  "🎶 Sæt lidt baggrundsmusik på, mens I venter — det plejer at hjælpe på stemningen.",
] as const;

export function pickRandomFallback(): string {
  return FALLBACK_LOBBY_MESSAGES[Math.floor(Math.random() * FALLBACK_LOBBY_MESSAGES.length)];
}

/**
 * Builds the prompt sent to Claude for a lobby hype-message. If the host
 * has written personal/fun facts about Katrine (via the lobby settings
 * panel), they're included so the AI can weave in something specific
 * instead of staying generic.
 */
export function buildLobbyVibePrompt(katrineFacts?: string): string {
  const factsBlock =
    katrineFacts && katrineFacts.trim()
      ? `\n\nHer er nogle sjove/personlige detaljer om Katrine, skrevet af værten. Brug dem løst og kreativt til at gøre sætningen mere personlig og sjov — du behøver ikke bruge dem alle på én gang:\n${katrineFacts.trim()}`
      : "";

  return `Skriv ÉN kort, sjov og hypende sætning på dansk til gæster, der venter i en lobby før en fest-quiz kaldet "Kender du Katrine?", afholdt i anledning af Katrines 18-års fødselsdag. Quizzen handler om at gætte, hvad Katrine ville svare på forskellige spørgsmål.

Regler:
- Maks 1-2 korte sætninger.
- Legende, varm og opstemt tone, som en hyggelig værtinde, ikke en reklame.
- Må gerne nævne Katrine, fødselsdagen, ventetiden, eller stemningen til festen.
- Ingen emojis er påkrævet, men du må gerne bruge 1 hvis det passer naturligt.
- Skriv i almindeligt prosasprog uden tankestreger.
- Svar KUN med selve sætningen, ingen anførselstegn, ingen forklaring.${factsBlock}`;
}
