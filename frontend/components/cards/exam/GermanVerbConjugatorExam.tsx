import { useMemo, useState } from "react";
import AudioButton from "@/components/cards/view/AudioButton";
import type { GermanVerbConfig } from "@/lib/schemas/cards";

type Props = {
  value: GermanVerbConfig;
  isBusy?: boolean;
  onSubmit: (answers: Record<string, string>, isCorrect: boolean) => void;
};

const normalize = (input: string) => input.trim().toLowerCase();

export default function GermanVerbConjugatorExam({
  value,
  isBusy,
  onSubmit,
}: Props) {
  const fields = useMemo(
    () => [
      { key: "ich", label: "ich", expected: value.ich },
      { key: "du", label: "du", expected: value.du },
      { key: "er/sie/es", label: "er/sie/es", expected: value["er/sie/es"] },
      { key: "wir", label: "wir", expected: value.wir },
      { key: "ihr", label: "ihr", expected: value.ihr },
      { key: "sie", label: "sie", expected: value.sie },
    ],
    [value],
  );

  const shuffledFields = useMemo(() => {
    return [...fields].sort(() => Math.random() - 0.5);
  }, [fields]);

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");

  const handleChange = (key: string, next: string) => {
    setAnswers((current) => ({ ...current, [key]: next }));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (fields.some((field) => !(answers[field.key] ?? "").trim())) {
      setFormError("Fill all conjugations before evaluating.");
      return;
    }
    setFormError("");
    const allCorrect = fields.every((field) => {
      const answer = answers[field.key] ?? "";
      return normalize(answer) === normalize(field.expected);
    });
    onSubmit(answers, allCorrect);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="relative flex h-full flex-col justify-between rounded-2xl border border-white/10 bg-white/5 p-6 text-center"
    >
      <div className="text-xs uppercase tracking-[0.2em] text-white/60">
        Conjugate the verb
      </div>
      <div className="mt-3 text-2xl font-semibold text-white">
        {value.verb || "—"}
      </div>
      {value.voice_file_url && (
        <div className="absolute right-4 top-4">
          <AudioButton src={value.voice_file_url} />
        </div>
      )}
      <div className="text-sm text-white/60">Fill all six forms.</div>
      <div className="mt-5 grid gap-3 text-left md:grid-cols-2">
        {shuffledFields.map((field) => (
          <label
            key={field.key}
            className="block rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70"
          >
            <span className="text-xs uppercase tracking-[0.2em] text-white/60">
              {field.label}
            </span>
            <input
              value={answers[field.key] ?? ""}
              onChange={(event) => handleChange(field.key, event.target.value)}
              disabled={isBusy}
              className="mt-2 w-full rounded-xl border border-white/10 bg-[#0f141b] px-3 py-2 text-base font-semibold text-white outline-none transition focus:border-white/40"
              placeholder="Type conjugation"
            />
          </label>
        ))}
      </div>
      <button
        type="submit"
        disabled={isBusy}
        className="mt-6 rounded-full border border-white/20 bg-white/10 px-5 py-3 text-xs uppercase tracking-[0.2em] text-white/70 transition hover:border-white/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isBusy ? "Saving..." : "Evaluate"}
      </button>
      {formError && (
        <div className="mt-3 rounded-2xl border border-red-400/40 bg-red-500/10 px-4 py-2 text-xs text-red-100">
          {formError}
        </div>
      )}
    </form>
  );
}
