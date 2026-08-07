import type { PublicPlayer } from "@/lib/types";

interface AnsweredGridProps {
  players: PublicPlayer[];
  answeredPlayerIds: string[];
}

/** A grid of player bubbles that light up as each one submits an answer. */
export function AnsweredGrid({ players, answeredPlayerIds }: AnsweredGridProps) {
  const answeredSet = new Set(answeredPlayerIds);

  return (
    <div className="flex flex-wrap justify-center gap-3">
      {players.map((player) => {
        const hasAnswered = answeredSet.has(player.id);
        return (
          <div
            key={player.id}
            className="flex flex-col items-center gap-1 transition-opacity"
            style={{ opacity: hasAnswered ? 1 : 0.4 }}
          >
            <div
              className="rounded-full flex items-center justify-center"
              style={{
                width: 56,
                height: 56,
                fontSize: "1.75rem",
                background: hasAnswered
                  ? "linear-gradient(135deg, var(--party-purple), var(--party-pink))"
                  : "var(--card-border)",
              }}
            >
              {hasAnswered ? "✅" : (player.avatar ?? "🙂")}
            </div>
            <span className="text-xs font-semibold">{player.name}</span>
          </div>
        );
      })}
    </div>
  );
}
