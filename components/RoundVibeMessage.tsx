interface RoundVibeMessageProps {
  message: string | null;
  large?: boolean;
}

export function RoundVibeMessage({ message, large }: RoundVibeMessageProps) {
  if (!message) return null;

  return (
    <div
      className="card text-center italic"
      style={{
        borderColor: "var(--party-pink)",
        background: "rgba(236, 72, 153, 0.08)",
        fontSize: large ? "1.35rem" : undefined,
      }}
    >
      🎙️ {message}
    </div>
  );
}
