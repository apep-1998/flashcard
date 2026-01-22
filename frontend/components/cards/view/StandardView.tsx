import type { StandardConfig } from "@/lib/schemas/cards";
import MarkdownText from "@/components/common/MarkdownText";
import AudioButton from "./AudioButton";

type Props = {
  value: StandardConfig;
};

export default function StandardView({ value }: Props) {
  return (
    <div className="space-y-2 text-sm text-white/70">
      <div className="space-y-1">
        <div className="text-xs uppercase tracking-[0.2em] text-white/50">
          Front
        </div>
        <MarkdownText content={value.front} />
      </div>
      <div className="space-y-1">
        <div className="text-xs uppercase tracking-[0.2em] text-white/50">
          Back
        </div>
        <MarkdownText content={value.back} />
      </div>
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
