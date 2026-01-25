import type { StandardConfig } from "@/lib/schemas/cards";
import VoiceInput from "./VoiceInput";
import TextArea from "@/components/forms/TextArea";

type Props = {
  value: StandardConfig;
  onChange: (next: StandardConfig) => void;
};

export default function StandardCreate({ value, onChange }: Props) {
  return (
    <div className="flex flex-col gap-6">
      <TextArea
        label="Front"
        value={value.front}
        onChange={(event) => onChange({ ...value, front: event.target.value })}
        rows={4}
        className="resize-none"
        placeholder="Front of the card."
      />

      <VoiceInput
        label="Front voice (optional)"
        value={value.front_voice_file_url ?? ""}
        onChange={(next) => onChange({ ...value, front_voice_file_url: next })}
        ttsValue={value.front_text_to_speech ?? ""}
        onChangeTts={(next) =>
          onChange({ ...value, front_text_to_speech: next })
        }
        ttsLanguage={value.front_text_to_speech_language ?? ""}
        onChangeLanguage={(next) =>
          onChange({ ...value, front_text_to_speech_language: next })
        }
      />

      <TextArea
        label="Back"
        value={value.back}
        onChange={(event) => onChange({ ...value, back: event.target.value })}
        rows={4}
        className="resize-none"
        placeholder="Back of the card."
      />

      <VoiceInput
        label="Back voice (optional)"
        value={value.back_voice_file_url ?? ""}
        onChange={(next) => onChange({ ...value, back_voice_file_url: next })}
        ttsValue={value.back_text_to_speech ?? ""}
        onChangeTts={(next) =>
          onChange({ ...value, back_text_to_speech: next })
        }
        ttsLanguage={value.back_text_to_speech_language ?? ""}
        onChangeLanguage={(next) =>
          onChange({ ...value, back_text_to_speech_language: next })
        }
      />
    </div>
  );
}
