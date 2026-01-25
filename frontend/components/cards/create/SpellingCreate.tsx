import type { SpellingConfig } from "@/lib/schemas/cards";
import VoiceInput from "./VoiceInput";
import TextInput from "@/components/forms/TextInput";

type Props = {
  value: SpellingConfig;
  onChange: (next: SpellingConfig) => void;
};

export default function SpellingCreate({ value, onChange }: Props) {
  return (
    <div className="flex flex-col gap-6">
      <TextInput
        label="Front (optional)"
        value={value.front ?? ""}
        onChange={(event) => onChange({ ...value, front: event.target.value })}
        placeholder="A hint or prompt..."
      />
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
      <TextInput
        label="Spelling"
        value={value.spelling}
        onChange={(event) =>
          onChange({ ...value, spelling: event.target.value })
        }
        placeholder="Schule"
      />
    </div>
  );
}
