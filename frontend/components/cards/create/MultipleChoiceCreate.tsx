import type { MultipleChoiceConfig } from "@/lib/schemas/cards";
import ImageInput from "./ImageInput";
import VoiceInput from "./VoiceInput";

type Props = {
  value: MultipleChoiceConfig;
  onChange: (next: MultipleChoiceConfig) => void;
};

const EMPTY_OPTION = "";

export default function MultipleChoiceCreate({ value, onChange }: Props) {
  const options = value.options.length ? value.options : [EMPTY_OPTION, EMPTY_OPTION];

  const updateOption = (index: number, next: string) => {
    const updated = [...options];
    updated[index] = next;
    onChange({ ...value, options: updated });
  };

  const addOption = () => {
    onChange({ ...value, options: [...options, EMPTY_OPTION] });
  };

  const removeOption = (index: number) => {
    const updated = options.filter((_, idx) => idx !== index);
    onChange({ ...value, options: updated.length ? updated : [EMPTY_OPTION] });
  };

  return (
    <div className="space-y-4">
      <label className="block text-sm text-white/70">
        Question
        <textarea
          value={value.question}
          onChange={(event) => onChange({ ...value, question: event.target.value })}
          className="mt-2 min-h-[120px] w-full resize-none rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-white/40"
          placeholder="What is the capital of Germany?"
        />
      </label>

      <VoiceInput
        label="Voice file (optional)"
        value={value.voice_file_url ?? ""}
        onChange={(next) => onChange({ ...value, voice_file_url: next })}
        ttsValue={value.text_to_speech ?? ""}
        onChangeTts={(next) => onChange({ ...value, text_to_speech: next })}
        ttsLanguage={value.text_to_speech_language ?? ""}
        onChangeLanguage={(next) =>
          onChange({ ...value, text_to_speech_language: next })
        }
      />

      <ImageInput
        label="Image file (optional)"
        value={value.image_file_url ?? ""}
        onChange={(next) => onChange({ ...value, image_file_url: next })}
      />

      <label className="block text-sm text-white/70">
        Answer
        <input
          value={value.answer}
          onChange={(event) => onChange({ ...value, answer: event.target.value })}
          className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-white/40"
          placeholder="Berlin"
        />
      </label>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-white/70">Options</span>
          <button
            type="button"
            onClick={addOption}
            className="rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-white/70 transition hover:text-white"
          >
            Add option
          </button>
        </div>
        {options.map((option, index) => (
          <div key={`${index}-${option}`} className="flex items-center gap-2">
            <input
              value={option}
              onChange={(event) => updateOption(index, event.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-white outline-none transition focus:border-white/40"
              placeholder={`Option ${index + 1}`}
            />
            <button
              type="button"
              onClick={() => removeOption(index)}
              className="rounded-full border border-white/10 px-3 py-2 text-xs uppercase tracking-[0.2em] text-white/60 transition hover:text-white"
            >
              Remove
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
