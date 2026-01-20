import { useMemo, useState } from "react";
import AudioButton from "@/components/cards/view/AudioButton";
import type { SpellingConfig } from "@/lib/schemas/cards";

type Props = {
  value: SpellingConfig;
  onSubmit: (answer: string, isCorrect: boolean) => void;
};

const normalize = (input: string) => input.trim().toLowerCase();

export default function SpellingExam({ value, onSubmit }: Props) {
  const [answer, setAnswer] = useState("");

  const expected = useMemo(
    () => normalize(value.spelling),
    [value.spelling],
  );

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const cleaned = normalize(answer);
    if (!cleaned) return;
    onSubmit(answer, cleaned === expected);
    setAnswer("");
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-white/10 bg-white/5 p-4"
    >
      <div className="text-xs uppercase tracking-[0.2em] text-white/60">
        Listen and spell
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        {value.voice_file_url ? (
          <AudioButton src={value.voice_file_url} autoPlay />
        ) : (
          <span className="text-sm text-white/60">
            No audio file available.
          </span>
        )}
        {/* TTS text is intentionally hidden during exams. */}
      </div>

      <label className="mt-4 block text-sm text-white/70">
        Your answer
        <input
          value={answer}
          onChange={(event) => setAnswer(event.target.value)}
          className="mt-2 w-full rounded-2xl border border-white/10 bg-[#0f141b] px-4 py-3 text-white outline-none transition focus:border-white/40"
          placeholder="Type the spelling"
        />
      </label>

      <button
        type="submit"
        className="mt-4 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs uppercase tracking-[0.2em] text-white/70 transition hover:border-white/40 hover:text-white"
      >
        Submit
      </button>
    </form>
  );
}
