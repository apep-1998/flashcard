import type { SpellingConfig } from "@/lib/schemas/cards";
import VoiceInput from "./VoiceInput";

type Props = {
  value: SpellingConfig;
  onChange: (next: SpellingConfig) => void;
};

export default function SpellingCreate({ value, onChange }: Props) {
  return (
    <div className="space-y-4">
      <label className="block text-sm text-white/70">
        Front (optional)
        <input
          value={value.front ?? ""}
          onChange={(event) =>
            onChange({ ...value, front: event.target.value })
          }
          className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-white/40"
          placeholder="A hint or prompt..."
        />
      </label>
      <VoiceInput
        label="Voice file"
        value={value.voice_file_url ?? ""}
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
        Spelling
        <input
          value={value.spelling}
          onChange={(event) => onChange({ ...value, spelling: event.target.value })}
          className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-white/40"
          placeholder="Schule"
        />
      </label>
    </div>
  );
}
