import AudioButton from "@/components/cards/view/AudioButton";
import type { MultipleChoiceConfig } from "@/lib/schemas/cards";

type Props = {
  value: MultipleChoiceConfig;
  isBusy?: boolean;
  onSelect: (answer: string, isCorrect: boolean) => void;
};

const normalize = (input: string) => input.trim().toLowerCase();

export default function MultipleChoiceExam({ value, isBusy, onSelect }: Props) {
  const handleSelect = (option: string) => {
    if (isBusy) return;
    onSelect(option, normalize(option) === normalize(value.answer));
  };

  return (
    <div className="relative rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
      <div className="text-xs uppercase tracking-[0.2em] text-white/60">
        Multiple choice
      </div>
      {value.voice_file_url && (
        <div className="absolute right-4 top-4">
          <AudioButton src={value.voice_file_url} autoPlay />
        </div>
      )}
      <div className="mt-3 text-lg font-semibold text-white">
        {value.question || "—"}
      </div>
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
    </div>
  );
}
