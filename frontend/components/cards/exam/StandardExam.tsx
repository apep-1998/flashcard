import { useState } from "react";
import AudioButton from "@/components/cards/view/AudioButton";
import type { StandardConfig } from "@/lib/schemas/cards";

type Props = {
  value: StandardConfig;
  onAnswer: (isCorrect: boolean) => void;
};

export default function StandardExam({ value, onAnswer }: Props) {
  const [isFlipped, setIsFlipped] = useState(false);

  const frontAudio = value.front_voice_file_url;
  const backAudio = value.back_voice_file_url;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="text-xs uppercase tracking-[0.2em] text-white/60">
        Standard card
      </div>
      <div className="mt-4 space-y-4">
        {!isFlipped ? (
          <>
            <div className="text-sm text-white/70">{value.front || "—"}</div>
            {frontAudio && (
              <AudioButton src={frontAudio} autoPlay />
            )}
          </>
        ) : (
          <>
            <div className="text-sm text-white/70">{value.back || "—"}</div>
            {backAudio && (
              <AudioButton src={backAudio} autoPlay />
            )}
          </>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setIsFlipped((current) => !current)}
          className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs uppercase tracking-[0.2em] text-white/70 transition hover:border-white/40 hover:text-white"
        >
          {isFlipped ? "Show front" : "Flip card"}
        </button>
        {isFlipped && (
          <>
            <button
              type="button"
              onClick={() => onAnswer(true)}
              className="rounded-full border border-emerald-400/40 bg-emerald-500/20 px-4 py-2 text-xs uppercase tracking-[0.2em] text-emerald-100 transition hover:border-emerald-300 hover:text-white"
            >
              Correct
            </button>
            <button
              type="button"
              onClick={() => onAnswer(false)}
              className="rounded-full border border-rose-400/40 bg-rose-500/20 px-4 py-2 text-xs uppercase tracking-[0.2em] text-rose-100 transition hover:border-rose-300 hover:text-white"
            >
              Incorrect
            </button>
          </>
        )}
      </div>
    </div>
  );
}
