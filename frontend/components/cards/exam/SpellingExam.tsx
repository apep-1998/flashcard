import { useMemo, useState, useRef, useEffect } from "react";
import AudioButton from "@/components/cards/view/AudioButton";
import type { SpellingConfig } from "@/lib/schemas/cards";

type Props = {
  value: SpellingConfig;
  isBusy?: boolean;
  onResult: (isCorrect: boolean) => void;
};

const normalize = (input: string) => input.trim().toLowerCase();

export default function SpellingExam({ value, isBusy, onResult }: Props) {
  const [answer, setAnswer] = useState("");
  const [review, setReview] = useState<null | { answer: string }>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const expected = useMemo(
    () => normalize(value.spelling),
    [value.spelling],
  );

  useEffect(() => {
    if (!review) {
      inputRef.current?.focus();
    }
  }, [value, review]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isBusy) return;
    const cleaned = normalize(answer);
    if (!cleaned) {
      setReview({ answer: "" });
      setAnswer("");
      return;
    }
    const isCorrect = cleaned === expected;
    if (isCorrect) {
      onResult(true);
      setAnswer("");
      return;
    }
    setReview({ answer });
    setAnswer("");
  };

  const handleFinishReview = () => {
    if (isBusy) return;
    setReview(null);
    onResult(false);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="relative flex h-full flex-col justify-between rounded-2xl border border-white/10 bg-white/5 p-6 text-center"
    >
      {review ? (
        <>
          <div className="text-xs uppercase tracking-[0.2em] text-white/60">
            Review the answer
          </div>
          <div className="mt-6 space-y-3 text-left">
            <div className="rounded-2xl border border-rose-400/40 bg-rose-500/15 px-4 py-3 text-base font-semibold text-rose-100">
              Your answer: {review.answer ? review.answer : "—"}
            </div>
            <div className="rounded-2xl border border-emerald-400/40 bg-emerald-500/15 px-4 py-3 text-base font-semibold text-emerald-100">
              Correct: {value.spelling}
            </div>
          </div>
          <button
            type="button"
            disabled={isBusy}
            onClick={handleFinishReview}
            className="mt-6 rounded-full border border-white/20 bg-white/10 px-5 py-3 text-xs uppercase tracking-[0.2em] text-white/70 transition hover:border-white/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            Finish review
          </button>
        </>
      ) : (
        <>
          <div className="text-xs uppercase tracking-[0.2em] text-white/60">
            Listen and spell
          </div>
          {value.front ? (
            <div className="mt-4 text-lg font-semibold text-white">
              {value.front}
            </div>
          ) : null}
          {value.voice_file_url ? (
            <div className="mt-4 flex justify-center">
              <AudioButton src={value.voice_file_url} autoPlay />
            </div>
          ) : (
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
              ref={inputRef}
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
        </>
      )}
    </form>
  );
}
