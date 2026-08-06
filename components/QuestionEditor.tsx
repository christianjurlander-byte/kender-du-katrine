"use client";

import { useState } from "react";
import { Button } from "./Button";

export interface EditableQuestion {
  index: number;
  text: string;
  options: string[];
}

interface QuestionEditorProps {
  initialQuestions: EditableQuestion[];
  onSave: (questions: EditableQuestion[]) => Promise<void>;
  onClose: () => void;
}

export function QuestionEditor({ initialQuestions, onSave, onClose }: QuestionEditorProps) {
  const [questions, setQuestions] = useState<EditableQuestion[]>(initialQuestions);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateText(index: number, text: string) {
    setQuestions((qs) => qs.map((q) => (q.index === index ? { ...q, text } : q)));
  }

  function updateOption(qIndex: number, optIndex: number, value: string) {
    setQuestions((qs) =>
      qs.map((q) =>
        q.index === qIndex
          ? { ...q, options: q.options.map((o, i) => (i === optIndex ? value : o)) }
          : q
      )
    );
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      await onSave(questions);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kunne ikke gemme spørgsmål.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" style={{ background: "var(--background)" }}>
      <div className="max-w-lg mx-auto px-4 py-6 flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black">Rediger spørgsmål</h2>
          <button className="btn btn-secondary !w-auto !min-h-0 !py-2 !px-4" onClick={onClose}>
            Luk
          </button>
        </div>

        {questions.map((q) => (
          <div key={q.index} className="card flex flex-col gap-3">
            <label className="text-sm font-bold" style={{ color: "var(--muted)" }}>
              Spørgsmål {q.index + 1}
            </label>
            <input
              className="input !text-left"
              value={q.text}
              onChange={(e) => updateText(q.index, e.target.value)}
            />
            <div className="flex flex-col gap-2">
              {q.options.map((opt, i) => (
                <input
                  key={i}
                  className="input !text-left"
                  value={opt}
                  onChange={(e) => updateOption(q.index, i, e.target.value)}
                  placeholder={`Svarmulighed ${String.fromCharCode(65 + i)}`}
                />
              ))}
            </div>
          </div>
        ))}

        {error && (
          <p className="text-center font-semibold" style={{ color: "#b91c1c" }}>
            {error}
          </p>
        )}

        <div className="sticky bottom-0 pb-4 pt-2" style={{ background: "var(--background)" }}>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Gemmer..." : "Gem spørgsmål"}
          </Button>
        </div>
      </div>
    </div>
  );
}
