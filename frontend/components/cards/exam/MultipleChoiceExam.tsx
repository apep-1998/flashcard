import AudioButton from "@/components/cards/view/AudioButton";
import type { MultipleChoiceConfig } from "@/lib/schemas/cards";

type Props = {
  value: MultipleChoiceConfig;
  onSelect: (answer: string, isCorrect: boolean) => void;
};

const normalize = (input: string) => input.trim().toLowerCase();

export default function MultipleChoiceExam({ value, onSelect }: Props) {
  const handleSelect = (option: string) => {
    onSelect(option, normalize(option) === normalize(value.answer));
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="text-xs uppercase tracking-[0.2em] text-white/60">
        Multiple choice
      </div>
      <div className="mt-2 text-sm text-white/70">{value.question || "—"}</div>
      {(value.image_file_url || value.voice_file_url) && (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          {value.voice_file_url && <AudioButton src={value.voice_file_url} />}
          {value.image_file_url && (
            <img
              src={value.image_file_url}
              alt="Question visual"
              className="h-32 w-32 rounded-2xl border border-white/10 object-cover"
            />
          )}
        </div>
      )}
      <div className="mt-3 grid gap-2">
        {value.options.map((option, index) => (
          <button
            type="button"
            key={`${option}-${index}`}
            onClick={() => handleSelect(option)}
            className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-left text-sm text-white/70 transition hover:border-white/40 hover:text-white"
          >
            {option || `Option ${index + 1}`}
          </button>
        ))}
      </div>
    </div>
  );
}
