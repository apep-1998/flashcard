import type { MultipleChoiceConfig } from "@/lib/schemas/cards";
import AudioButton from "./AudioButton";

type Props = {
  value: MultipleChoiceConfig;
};

export default function MultipleChoiceView({ value }: Props) {
  return (
    <div className="space-y-2 text-sm text-white/70">
      <div>Question: {value.question || "—"}</div>
      <div>
        Voice: {value.voice_file_url ? <AudioButton src={value.voice_file_url} /> : "—"}
      </div>
      <div>
        TTS:{" "}
        {value.text_to_speech
          ? `${value.text_to_speech} (${value.text_to_speech_language || "en"})`
          : "—"}
      </div>
      <div>
        Image:{" "}
        {value.image_file_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={value.image_file_url}
            alt="Card visual"
            className="mt-2 h-32 w-full rounded-2xl border border-white/10 object-cover"
          />
        ) : (
          "—"
        )}
      </div>
      <div>Answer: {value.answer || "—"}</div>
      <div>Options: {value.options.length ? value.options.join(", ") : "—"}</div>
    </div>
  );
}
