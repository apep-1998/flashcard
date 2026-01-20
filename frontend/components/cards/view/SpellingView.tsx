import type { SpellingConfig } from "@/lib/schemas/cards";
import AudioButton from "./AudioButton";

type Props = {
  value: SpellingConfig;
};

export default function SpellingView({ value }: Props) {
  return (
    <div className="space-y-2 text-sm text-white/70">
      <div>
        Voice: {value.voice_file_url ? <AudioButton src={value.voice_file_url} /> : "—"}
      </div>
      <div>
        TTS:{" "}
        {value.text_to_speech
          ? `${value.text_to_speech} (${value.text_to_speech_language || "en"})`
          : "—"}
      </div>
      <div>Spelling: {value.spelling || "—"}</div>
    </div>
  );
}
