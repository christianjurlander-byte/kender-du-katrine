"use client";

import { AVATAR_OPTIONS } from "@/lib/avatars";

interface AvatarPickerProps {
  value: string | null;
  onChange: (avatar: string) => void;
}

export function AvatarPicker({ value, onChange }: AvatarPickerProps) {
  return (
    <div>
      <p className="text-sm font-bold mb-2 text-center" style={{ color: "var(--muted)" }}>
        Vælg dit ikon
      </p>
      <div className="grid grid-cols-6 gap-2">
        {AVATAR_OPTIONS.map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => onChange(emoji)}
            className="answer-option !min-h-0 !p-0 flex items-center justify-center"
            style={{
              aspectRatio: "1 / 1",
              fontSize: "1.5rem",
              borderColor: value === emoji ? "var(--party-purple)" : undefined,
              background:
                value === emoji
                  ? "linear-gradient(135deg, rgba(124, 58, 237, 0.14), rgba(236, 72, 153, 0.1))"
                  : undefined,
            }}
            aria-pressed={value === emoji}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}
