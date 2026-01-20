import { useState } from "react";
import AudioButton from "@/components/cards/view/AudioButton";
import type { WordStandardConfig } from "@/lib/schemas/cards";

type Props = {
  value: WordStandardConfig;
  isBusy?: boolean;
  onAnswer: (isCorrect: boolean) => void;
};

export default function WordStandardExam({ value, isBusy, onAnswer }: Props) {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <div className="relative rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
      <div className="text-xs uppercase tracking-[0.2em] text-white/60">
        Define the word
      </div>
      {value.voice_file_url && !isFlipped && (
        <div className="absolute right-4 top-4">
          <AudioButton src={value.voice_file_url} autoPlay />
        </div>
      )}
      <div className="mt-5 space-y-4">
        <div>
          <div className="text-lg font-semibold text-white">
            {value.word || "—"}
          </div>
          <div className="text-sm text-white/60">
            {value.part_of_speech || ""}
          </div>
        </div>
        {isFlipped && (
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-white/50">
              Back
            </div>
            <div className="mt-2 text-lg font-semibold text-white">
              {value.back || "—"}
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {!isFlipped ? (
          <button
            type="button"
            disabled={isBusy}
            onClick={() => setIsFlipped(true)}
            className="rounded-full border border-white/20 bg-white/10 px-5 py-3 text-xs uppercase tracking-[0.2em] text-white/70 transition hover:border-white/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            Flip card
          </button>
        ) : (
          <>
            <button
              type="button"
              disabled={isBusy}
              onClick={() => onAnswer(true)}
              className="rounded-full border border-emerald-400/40 bg-emerald-500/20 px-5 py-3 text-xs uppercase tracking-[0.2em] text-emerald-100 transition hover:border-emerald-300 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isBusy ? "Saving..." : "Correct"}
            </button>
            <button
              type="button"
              disabled={isBusy}
              onClick={() => onAnswer(false)}
              className="rounded-full border border-rose-400/40 bg-rose-500/20 px-5 py-3 text-xs uppercase tracking-[0.2em] text-rose-100 transition hover:border-rose-300 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isBusy ? "Saving..." : "Incorrect"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
