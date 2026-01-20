import type { GermanVerbConfig } from "@/lib/schemas/cards";
import VoiceInput from "./VoiceInput";

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
    <div className="grid gap-4 md:grid-cols-2">
      <label className="block text-sm text-white/70 md:col-span-2">
        Verb
        <input
          value={value.verb}
          onChange={(event) => onChange({ ...value, verb: event.target.value })}
          className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-white/40"
          placeholder="gehen"
        />
      </label>
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
        <label key={key} className="block text-sm text-white/70">
          {label}
          <input
            value={value[key]}
            onChange={(event) => onChange({ ...value, [key]: event.target.value })}
            className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-white/40"
            placeholder={`${label} form`}
          />
        </label>
      ))}
    </div>
  );
}
