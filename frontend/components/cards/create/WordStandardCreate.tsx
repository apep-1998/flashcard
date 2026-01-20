import type { WordStandardConfig } from "@/lib/schemas/cards";
import VoiceInput from "./VoiceInput";

type Props = {
  value: WordStandardConfig;
  onChange: (next: WordStandardConfig) => void;
};

export default function WordStandardCreate({ value, onChange }: Props) {
  return (
    <div className="space-y-4">
      <label className="block text-sm text-white/70">
        Word
        <input
          value={value.word}
          onChange={(event) => onChange({ ...value, word: event.target.value })}
          className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-white/40"
          placeholder="Photosynthesis"
        />
      </label>
      <label className="block text-sm text-white/70">
        Part of speech
        <input
          value={value.part_of_speech}
          onChange={(event) =>
            onChange({ ...value, part_of_speech: event.target.value })
          }
          className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-white/40"
          placeholder="noun"
        />
      </label>
      <VoiceInput
        label="Voice file"
        value={value.voice_file_url}
        onChange={(next) => onChange({ ...value, voice_file_url: next })}
        ttsValue={value.text_to_speech ?? ""}
        onChangeTts={(next) => onChange({ ...value, text_to_speech: next })}
        ttsLanguage={value.text_to_speech_language ?? ""}
        onChangeLanguage={(next) =>
          onChange({ ...value, text_to_speech_language: next })
        }
        required
      />
      <label className="block text-sm text-white/70">
        Back content
        <textarea
          value={value.back}
          onChange={(event) => onChange({ ...value, back: event.target.value })}
          className="mt-2 min-h-[120px] w-full resize-none rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-white/40"
          placeholder="Definition, usage, or explanation."
        />
      </label>
    </div>
  );
}
