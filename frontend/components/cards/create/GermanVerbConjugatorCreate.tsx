import type { GermanVerbConfig } from "@/lib/schemas/cards";
import VoiceInput from "./VoiceInput";
import TextInput from "@/components/forms/TextInput";

type Props = {
  value: GermanVerbConfig;
  onChange: (next: GermanVerbConfig) => void;
};

const PRONOUN_FIELDS = [
  ["ich", "ich"],
  ["du", "du"],
  ["er/sie/es", "er/sie/es"],
  ["wir", "wir"],
  ["ihr", "ihr"],
  ["sie", "sie"],
] as const;

export default function GermanVerbConjugatorCreate({ value, onChange }: Props) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <TextInput
        label="Verb"
        value={value.verb}
        onChange={(event) => onChange({ ...value, verb: event.target.value })}
        placeholder="gehen"
        sx={{ gridColumn: { md: "span 2" } }}
      />
      <div className="md:col-span-2">
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
      </div>
      {PRONOUN_FIELDS.map(([key, label]) => (
        <TextInput
          key={key}
          label={label}
          value={value[key]}
          onChange={(event) =>
            onChange({ ...value, [key]: event.target.value })
          }
          placeholder={`${label} form`}
        />
      ))}
    </div>
  );
}
