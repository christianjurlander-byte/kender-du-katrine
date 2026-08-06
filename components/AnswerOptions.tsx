interface AnswerOptionsProps {
  options: string[];
  selectedIndex: number | null;
  disabled?: boolean;
  onSelect: (index: number) => void;
}

const LETTERS = ["A", "B", "C", "D"];

export function AnswerOptions({ options, selectedIndex, disabled, onSelect }: AnswerOptionsProps) {
  return (
    <div className="flex flex-col gap-3">
      {options.map((option, i) => (
        <button
          key={i}
          className={`answer-option ${selectedIndex === i ? "selected" : ""}`}
          disabled={disabled}
          onClick={() => onSelect(i)}
        >
          <span
            className="inline-flex items-center justify-center rounded-lg mr-3 font-bold"
            style={{
              width: 32,
              height: 32,
              background: "var(--card-border)",
              color: "var(--foreground)",
            }}
          >
            {LETTERS[i] ?? i + 1}
          </span>
          {option}
        </button>
      ))}
    </div>
  );
}
