import type { AiReviewerConfig } from "@/lib/schemas/cards";
import TextArea from "@/components/forms/TextArea";

type Props = {
  value: AiReviewerConfig;
  onChange: (next: AiReviewerConfig) => void;
};

export default function AiReviewerCreate({ value, onChange }: Props) {
  return (
    <div className="flex flex-col gap-6">
      <TextArea
        label="Question"
        value={value.question}
        onChange={(event) => onChange({ ...value, question: event.target.value })}
        rows={4}
        className="resize-none"
        placeholder="Explain how photosynthesis works."
      />
      <TextArea
        label="Validate answer prompt"
        value={value.validate_answer_promt}
        onChange={(event) =>
          onChange({ ...value, validate_answer_promt: event.target.value })
        }
        rows={5}
        className="resize-none"
        placeholder="Check if the answer mentions light, CO2, water, and glucose."
      />
    </div>
  );
}
