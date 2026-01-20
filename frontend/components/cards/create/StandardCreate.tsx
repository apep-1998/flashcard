import type { StandardConfig } from "@/lib/schemas/cards";
import VoiceInput from "./VoiceInput";

type Props = {
  value: StandardConfig;
  onChange: (next: StandardConfig) => void;
};

export default function StandardCreate({ value, onChange }: Props) {
  return (
    <div className="space-y-4">
      <label className="block text-sm text-white/70">
        Front
        <textarea
          value={value.front}
          onChange={(event) => onChange({ ...value, front: event.target.value })}
          className="mt-2 min-h-[120px] w-full resize-none rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-white/40"
          placeholder="Front of the card."
        />
      </label>

      <VoiceInput
        label="Front voice (optional)"
        value={value.front_voice_file_url ?? ""}
        onChange={(next) => onChange({ ...value, front_voice_file_url: next })}
        ttsValue={value.front_text_to_speech ?? ""}
        onChangeTts={(next) => onChange({ ...value, front_text_to_speech: next })}
        ttsLanguage={value.front_text_to_speech_language ?? ""}
        onChangeLanguage={(next) =>
          onChange({ ...value, front_text_to_speech_language: next })
        }
      />

      <label className="block text-sm text-white/70">
        Back
        <textarea
          value={value.back}
          onChange={(event) => onChange({ ...value, back: event.target.value })}
          className="mt-2 min-h-[120px] w-full resize-none rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-white/40"
          placeholder="Back of the card."
        />
      </label>

      <VoiceInput
        label="Back voice (optional)"
        value={value.back_voice_file_url ?? ""}
        onChange={(next) => onChange({ ...value, back_voice_file_url: next })}
        ttsValue={value.back_text_to_speech ?? ""}
        onChangeTts={(next) => onChange({ ...value, back_text_to_speech: next })}
        ttsLanguage={value.back_text_to_speech_language ?? ""}
        onChangeLanguage={(next) =>
          onChange({ ...value, back_text_to_speech_language: next })
        }
      />
    </div>
  );
}
