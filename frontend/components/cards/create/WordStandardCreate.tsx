import type { WordStandardConfig } from "@/lib/schemas/cards";
import VoiceInput from "./VoiceInput";
import TextArea from "@/components/forms/TextArea";
import TextInput from "@/components/forms/TextInput";

type Props = {
  value: WordStandardConfig;
  onChange: (next: WordStandardConfig) => void;
};

export default function WordStandardCreate({ value, onChange }: Props) {
  return (
    <div className="flex flex-col gap-6">
      <TextInput
        label="Word"
        value={value.word}
        onChange={(event) => onChange({ ...value, word: event.target.value })}
        placeholder="Photosynthesis"
      />
      <TextInput
        label="Part of speech"
        value={value.part_of_speech}
        onChange={(event) =>
          onChange({ ...value, part_of_speech: event.target.value })
        }
        placeholder="noun"
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
      <TextArea
        label="Back content"
        value={value.back}
        onChange={(event) => onChange({ ...value, back: event.target.value })}
        rows={4}
        className="resize-none"
        placeholder="Definition, usage, or explanation."
      />
    </div>
  );
}
