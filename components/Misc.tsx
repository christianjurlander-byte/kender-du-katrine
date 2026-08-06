export function Spinner() {
  return (
    <div className="flex items-center justify-center py-10">
      <div
        className="rounded-full animate-spin"
        style={{
          width: 40,
          height: 40,
          border: "4px solid var(--card-border)",
          borderTopColor: "var(--party-purple)",
        }}
      />
    </div>
  );
}

export function ErrorBanner({ message }: { message: string }) {
  return (
    <div
      className="card !p-3 text-center font-semibold"
      style={{ background: "#fee2e2", borderColor: "#fecaca", color: "#b91c1c" }}
    >
      {message}
    </div>
  );
}

export function GameCodeBadge({ code }: { code: string }) {
  return (
    <div
      className="mx-auto text-center font-black tracking-[0.3em]"
      style={{
        fontSize: "2.5rem",
        background: "linear-gradient(135deg, var(--party-purple), var(--party-pink))",
        WebkitBackgroundClip: "text",
        backgroundClip: "text",
        color: "transparent",
      }}
    >
      {code}
    </div>
  );
}
