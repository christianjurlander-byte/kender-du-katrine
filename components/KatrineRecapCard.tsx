interface KatrineRecapCardProps {
  message: string | null;
  katrineName?: string | null;
  large?: boolean;
}

export function KatrineRecapCard({ message, katrineName, large }: KatrineRecapCardProps) {
  if (!message) return null;

  return (
    <div
      className="card text-center"
      style={{
        borderColor: "var(--party-gold)",
        borderWidth: 2,
        background: "linear-gradient(135deg, rgba(255, 209, 102, 0.16), rgba(236, 72, 153, 0.1))",
      }}
    >
      <p className="font-black mb-2" style={{ fontSize: large ? "1.4rem" : "1.1rem" }}>
        🎂 Hvad har vi lært om {katrineName ?? "Katrine"} i aften?
      </p>
      <p className="italic" style={{ fontSize: large ? "1.15rem" : undefined }}>
        {message}
      </p>
    </div>
  );
}
