import { useMemo, useState } from "react";
import AudioButton from "@/components/cards/view/AudioButton";
import type { SpellingConfig } from "@/lib/schemas/cards";

type Props = {
  value: SpellingConfig;
  isBusy?: boolean;
  onSubmit: (answer: string, isCorrect: boolean) => void;
};

const normalize = (input: string) => input.trim().toLowerCase();

export default function SpellingExam({ value, isBusy, onSubmit }: Props) {
  const [answer, setAnswer] = useState("");

  const expected = useMemo(
    () => normalize(value.spelling),
    [value.spelling],
  );

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isBusy) return;
    const cleaned = normalize(answer);
    if (!cleaned) return;
    onSubmit(answer, cleaned === expected);
    setAnswer("");
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="relative rounded-2xl border border-white/10 bg-white/5 p-6 text-center"
    >
      <div className="text-xs uppercase tracking-[0.2em] text-white/60">
        Listen and spell
      </div>
      {value.voice_file_url && (
        <div className="absolute right-4 top-4">
          <AudioButton src={value.voice_file_url} autoPlay />
        </div>
      )}
      {!value.voice_file_url && (
        <div className="mt-4 text-sm text-white/60">
          No audio file available.
        </div>
      )}

      <label className="mt-4 block text-sm text-white/70">
        <span className="text-base font-semibold text-white">
          Your answer
        </span>
        <input
          value={answer}
          onChange={(event) => setAnswer(event.target.value)}
          disabled={isBusy}
          className="mt-3 w-full rounded-2xl border border-white/10 bg-[#0f141b] px-4 py-3 text-base font-semibold text-white outline-none transition focus:border-white/40"
          placeholder="Type the spelling"
        />
      </label>

      <button
        type="submit"
        disabled={isBusy}
        className="mt-6 rounded-full border border-white/20 bg-white/10 px-5 py-3 text-xs uppercase tracking-[0.2em] text-white/70 transition hover:border-white/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isBusy ? "Checking..." : "Submit"}
      </button>
    </form>
  );
}
