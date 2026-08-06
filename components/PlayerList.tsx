import type { PublicPlayer } from "@/lib/types";

interface PlayerListProps {
  players: PublicPlayer[];
  onSelectKatrine?: (playerId: string) => void;
  selectable?: boolean;
}

export function PlayerList({ players, onSelectKatrine, selectable }: PlayerListProps) {
  if (players.length === 0) {
    return (
      <p className="text-center" style={{ color: "var(--muted)" }}>
        Ingen spillere har tilsluttet sig endnu.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {players.map((player) => (
        <li
          key={player.id}
          className="card !p-3 flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-2">
            <span
              className="inline-block w-2.5 h-2.5 rounded-full"
              style={{ background: player.connected ? "#22c55e" : "#d1d5db" }}
              aria-hidden
            />
            <span className="font-semibold">{player.name}</span>
            {player.is_katrine && <span className="badge badge-katrine">👑 Katrine</span>}
          </div>
          {selectable && onSelectKatrine && (
            <button
              className="btn btn-secondary !min-h-0 !w-auto !py-2 !px-3 !text-sm"
              onClick={() => onSelectKatrine(player.id)}
            >
              {player.is_katrine ? "Er Katrine" : "Vælg som Katrine"}
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}
