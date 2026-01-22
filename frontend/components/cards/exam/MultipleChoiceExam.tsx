import { useState } from "react";
import AudioButton from "@/components/cards/view/AudioButton";
import type { MultipleChoiceConfig } from "@/lib/schemas/cards";

type Props = {
  value: MultipleChoiceConfig;
  isBusy?: boolean;
  onResult: (isCorrect: boolean) => void;
};

const normalize = (input: string) => input.trim().toLowerCase();

export default function MultipleChoiceExam({ value, isBusy, onResult }: Props) {
  const [review, setReview] = useState<null | { answer: string }>(null);

  const handleSelect = (option: string) => {
    if (isBusy || review) return;
    const isCorrect = normalize(option) === normalize(value.answer);
    if (isCorrect) {
      onResult(true);
      return;
    }
    setReview({ answer: option });
  };

  const handleFinishReview = () => {
    if (isBusy) return;
    setReview(null);
    onResult(false);
  };

  return (
    <div className="relative flex h-full flex-col justify-between rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
      {review ? (
        <>
          <div className="text-xs uppercase tracking-[0.2em] text-white/60">
            Review the answer
          </div>
          <div className="mt-5 space-y-3 text-left">
            <div className="rounded-2xl border border-rose-400/40 bg-rose-500/15 px-4 py-3 text-base font-semibold text-rose-100">
              Your answer: {review.answer}
            </div>
            <div className="rounded-2xl border border-emerald-400/40 bg-emerald-500/15 px-4 py-3 text-base font-semibold text-emerald-100">
              Correct answer: {value.answer}
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
            Multiple choice
          </div>
          <div className="mt-3 text-lg font-semibold text-white">
            {value.question || "—"}
          </div>
          {value.voice_file_url && (
            <div className="mt-4 flex justify-center">
              <AudioButton src={value.voice_file_url} autoPlay />
            </div>
          )}
          {value.image_file_url && (
            <div className="mt-4 flex justify-center">
              <img
                src={value.image_file_url}
                alt="Question visual"
                className="h-40 w-40 rounded-2xl border border-white/10 object-cover"
              />
            </div>
          )}
          <div className="mt-5 grid gap-2 text-left">
            {value.options.map((option, index) => (
              <button
                type="button"
                key={`${option}-${index}`}
                onClick={() => handleSelect(option)}
                disabled={isBusy}
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-base font-semibold text-white/70 transition hover:border-white/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {option || `Option ${index + 1}`}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
