import { useEffect, useState } from "react";
import AudioButton from "@/components/cards/view/AudioButton";
import MarkdownText from "@/components/common/MarkdownText";
import type { StandardConfig } from "@/lib/schemas/cards";

type Props = {
  value: StandardConfig;
  isBusy?: boolean;
  onResult: (isCorrect: boolean) => void;
};

export default function StandardExam({ value, isBusy, onResult }: Props) {
  const [isFlipped, setIsFlipped] = useState(false);

  const frontAudio = value.front_voice_file_url;
  const backAudio = value.back_voice_file_url;

  useEffect(() => {
    setIsFlipped(false);
  }, [value.front, value.back]);

  return (
    <div className="relative flex h-full flex-col justify-between rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
      <div className="text-xs uppercase tracking-[0.2em] text-white/60">
        Standard card
      </div>
      <div className="mt-5 space-y-4">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-white/50">
            Front
          </div>
          <div className="mt-2 text-lg font-semibold text-white">
            <MarkdownText content={value.front} />
          </div>
          {frontAudio && (
            <div className="mt-4 flex justify-center">
              <AudioButton src={frontAudio} autoPlay />
            </div>
          )}
        </div>
        {isFlipped && (
          <div>
          <div className="text-xs uppercase tracking-[0.2em] text-white/50">
            Back
          </div>
          <div className="mt-2 text-lg font-semibold text-white">
            <MarkdownText content={value.back} />
          </div>
            {backAudio && (
              <div className="mt-4 flex justify-center">
                <AudioButton src={backAudio} autoPlay />
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mt-4 flex w-full items-center justify-center">
        {!isFlipped ? (
          <button
            type="button"
            disabled={isBusy}
            onClick={() => setIsFlipped(true)}
            className="rounded-full border border-white/20 bg-white/10 px-6 py-3 text-xs uppercase tracking-[0.2em] text-white/70 transition hover:border-white/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            Flip card
          </button>
        ) : (
          <div className="flex w-full items-center justify-between gap-4">
            <button
              type="button"
              disabled={isBusy}
              onClick={() => onResult(true)}
              className="flex-1 rounded-full border border-emerald-400/40 bg-emerald-500/20 px-5 py-3 text-xs uppercase tracking-[0.2em] text-emerald-100 transition hover:border-emerald-300 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isBusy ? "Saving..." : "Correct"}
            </button>
            <button
              type="button"
              disabled={isBusy}
              onClick={() => onResult(false)}
              className="flex-1 rounded-full border border-rose-400/40 bg-rose-500/20 px-5 py-3 text-xs uppercase tracking-[0.2em] text-rose-100 transition hover:border-rose-300 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isBusy ? "Saving..." : "Incorrect"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
