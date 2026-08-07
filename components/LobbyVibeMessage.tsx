interface LobbyVibeMessageProps {
  message: string | null;
}

export function LobbyVibeMessage({ message }: LobbyVibeMessageProps) {
  if (!message) return null;

  return (
    <div
      className="card text-center italic"
      style={{ borderColor: "var(--party-yellow)", background: "rgba(251, 191, 36, 0.08)" }}
    >
      {message}
    </div>
  );
}
