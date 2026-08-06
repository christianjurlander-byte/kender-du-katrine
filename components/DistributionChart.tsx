interface DistributionChartProps {
  options: string[];
  distribution: number[];
  correctOptionIndex: number | null;
  selectedOptionIndex?: number | null;
}

export function DistributionChart({
  options,
  distribution,
  correctOptionIndex,
  selectedOptionIndex,
}: DistributionChartProps) {
  const total = distribution.reduce((sum, n) => sum + n, 0) || 1;

  return (
    <div className="flex flex-col gap-3">
      {options.map((option, i) => {
        const count = distribution[i] ?? 0;
        const pct = Math.round((count / total) * 100);
        const isCorrect = i === correctOptionIndex;
        const isMine = i === selectedOptionIndex;
        return (
          <div key={i}>
            <div className="flex items-center justify-between mb-1 gap-2">
              <span className="font-semibold flex items-center gap-2">
                {option}
                {isCorrect && <span title="Katrines svar">👑</span>}
                {isMine && (
                  <span className="badge" style={{ background: "#ede9fe", color: "#5b21b6" }}>
                    dit svar
                  </span>
                )}
              </span>
              <span className="font-bold" style={{ color: "var(--muted)" }}>
                {count} ({pct}%)
              </span>
            </div>
            <div
              className="w-full rounded-full overflow-hidden"
              style={{ background: "var(--card-border)", height: 14 }}
            >
              <div
                className="h-full rounded-full"
                style={{
                  width: `${pct}%`,
                  background: isCorrect
                    ? "linear-gradient(90deg, #fbbf24, #ec4899)"
                    : "linear-gradient(90deg, #a78bfa, #7c3aed)",
                  transition: "width 0.4s ease",
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
