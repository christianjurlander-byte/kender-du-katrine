export interface RoundVibePlayer {
  name: string;
  avatar: string | null;
  isKatrine: boolean;
  didAnswer: boolean;
  /** null if the round has no correct answer yet, or this player didn't answer. */
  isCorrect: boolean | null;
  /** Milliseconds from question start to this player's answer, if known. */
  elapsedMs: number | null;
}

export interface RoundVibeInput {
  questionIndex: number;
  totalQuestions: number;
  questionText: string;
  correctOptionText: string | null;
  players: RoundVibePlayer[];
  katrineFacts?: string;
}

function nonKatrinePlayers(input: RoundVibeInput): RoundVibePlayer[] {
  return input.players.filter((p) => !p.isKatrine);
}

/**
 * Rule-based fallback commentary for between rounds, used whenever no
 * ANTHROPIC_API_KEY is configured or the AI call fails — the reveal screen
 * must never break because of this.
 */
export function pickRoundFallback(input: RoundVibeInput): string {
  const contenders = nonKatrinePlayers(input);
  const answered = contenders.filter((p) => p.didAnswer);
  const correct = contenders.filter((p) => p.isCorrect);

  if (contenders.length === 0) {
    return "🎉 Endnu en runde i logbogen!";
  }

  if (answered.length === 0) {
    return "😴 Ingen nåede at svare den runde — er alle faldet i søvn?";
  }

  if (correct.length === 0) {
    return "😅 Ingen gættede Katrines svar denne runde — hun er sværere at gennemskue, end I troede!";
  }

  const fastest = [...correct]
    .filter((p) => p.elapsedMs !== null)
    .sort((a, b) => (a.elapsedMs ?? 0) - (b.elapsedMs ?? 0))[0];

  if (fastest) {
    const avatar = fastest.avatar ? `${fastest.avatar} ` : "";
    return `⚡ ${avatar}${fastest.name} var hurtigst med det rigtige svar! ${correct.length} af ${answered.length} gættede rigtigt denne runde.`;
  }

  return `🎉 ${correct.length} af ${answered.length} gættede rigtigt denne runde!`;
}

/**
 * Builds the prompt sent to Claude for a short, funny "live commentator"
 * line shown on screen between questions — referencing specific players by
 * name and avatar, and comparing how correct/fast they were.
 */
export function buildRoundVibePrompt(input: RoundVibeInput): string {
  const lines = nonKatrinePlayers(input)
    .map((p) => {
      const avatar = p.avatar ?? "🙂";
      if (!p.didAnswer) return `${avatar} ${p.name}: svarede slet ikke`;
      const speed =
        p.elapsedMs !== null ? `brugte ${(p.elapsedMs / 1000).toFixed(1)} sekunder` : "svartid ukendt";
      const verdict = p.isCorrect ? "gættede RIGTIGT" : "gættede forkert";
      return `${avatar} ${p.name}: ${verdict}, ${speed}`;
    })
    .join("\n");

  const factsBlock =
    input.katrineFacts && input.katrineFacts.trim()
      ? `\n\nSjove/personlige detaljer om Katrine (må gerne bruges løst hvis relevant):\n${input.katrineFacts.trim()}`
      : "";

  return `Du er en levende, sjov speaker til en fest-quiz kaldet "Kender du Katrine?", afholdt i anledning af Katrines 18-års fødselsdag. Quizzen handler om at gætte, hvad Katrine ville svare.

Spørgsmål ${input.questionIndex + 1} af ${input.totalQuestions} er lige blevet afsløret. Katrines (og dermed det "rigtige") svar var: "${input.correctOptionText ?? "ukendt"}".

Sådan klarede spillerne sig denne runde (avatar-emoji + navn: resultat og svartid):
${lines || "(ingen svarede)"}
${factsBlock}

Skriv ÉN sjov, kort kommentar på dansk til at vise på skærmen, mens alle venter på næste spørgsmål — som en hurtig, underholdende live-kommentator. Nævn gerne specifikke spillere ved navn og deres avatar-emoji, sammenlign hvem der var hurtigst/langsomst eller mest overraskende, og lav godmodigt sjov med resultaterne.

Regler:
- Maks 2-3 korte sætninger.
- Varm, godmodig drilleri, aldrig ondskabsfuldt eller sårende.
- Du må gerne bruge spillernes avatar-emoji i teksten.
- Skriv i almindeligt prosasprog uden tankestreger.
- Svar KUN med selve kommentaren, ingen anførselstegn, ingen forklaring.`;
}
