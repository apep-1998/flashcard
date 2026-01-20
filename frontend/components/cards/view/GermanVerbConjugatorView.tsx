import type { GermanVerbConfig } from "@/lib/schemas/cards";
import AudioButton from "./AudioButton";

type Props = {
  value: GermanVerbConfig;
};

export default function GermanVerbConjugatorView({ value }: Props) {
  return (
    <div className="grid gap-2 text-sm text-white/70 sm:grid-cols-2">
      <div>Verb: {value.verb || "—"}</div>
      <div>
        Voice: {value.voice_file_url ? <AudioButton src={value.voice_file_url} /> : "—"}
      </div>
      <div className="sm:col-span-2">
        TTS:{" "}
        {value.text_to_speech
          ? `${value.text_to_speech} (${value.text_to_speech_language || "en"})`
          : "—"}
      </div>
      <div>ich: {value.ich || "—"}</div>
      <div>du: {value.du || "—"}</div>
      <div>er/sie/es: {value["er/sie/es"] || "—"}</div>
      <div>wir: {value.wir || "—"}</div>
      <div>ihr: {value.ihr || "—"}</div>
      <div>sie: {value.sie || "—"}</div>
    </div>
  );
}
