import type { WordStandardConfig } from "@/lib/schemas/cards";
import AudioButton from "./AudioButton";

type Props = {
  value: WordStandardConfig;
};

export default function WordStandardView({ value }: Props) {
  return (
    <div className="space-y-2 text-sm text-white/70">
      <div>Word: {value.word || "—"}</div>
      <div>Part of speech: {value.part_of_speech || "—"}</div>
      <div>
        Voice: {value.voice_file_url ? <AudioButton src={value.voice_file_url} /> : "—"}
      </div>
      <div>
        TTS:{" "}
        {value.text_to_speech
          ? `${value.text_to_speech} (${value.text_to_speech_language || "en"})`
          : "—"}
      </div>
      <div>Back: {value.back || "—"}</div>
    </div>
  );
}
