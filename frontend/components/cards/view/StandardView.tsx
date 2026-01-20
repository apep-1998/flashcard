import type { StandardConfig } from "@/lib/schemas/cards";
import AudioButton from "./AudioButton";

type Props = {
  value: StandardConfig;
};

export default function StandardView({ value }: Props) {
  return (
    <div className="space-y-2 text-sm text-white/70">
      <div>Front: {value.front || "—"}</div>
      <div>Back: {value.back || "—"}</div>
      <div>
        Front voice:{" "}
        {value.front_voice_file_url ? (
          <AudioButton src={value.front_voice_file_url} />
        ) : (
          "—"
        )}
      </div>
      <div>
        Front TTS:{" "}
        {value.front_text_to_speech
          ? `${value.front_text_to_speech} (${
              value.front_text_to_speech_language || "en"
            })`
          : "—"}
      </div>
      <div>
        Back voice:{" "}
        {value.back_voice_file_url ? (
          <AudioButton src={value.back_voice_file_url} />
        ) : (
          "—"
        )}
      </div>
      <div>
        Back TTS:{" "}
        {value.back_text_to_speech
          ? `${value.back_text_to_speech} (${
              value.back_text_to_speech_language || "en"
            })`
          : "—"}
      </div>
    </div>
  );
}
