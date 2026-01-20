import type { AiReviewerConfig } from "@/lib/schemas/cards";

type Props = {
  value: AiReviewerConfig;
};

export default function AiReviewerView({ value }: Props) {
  return (
    <div className="space-y-2 text-sm text-white/70">
      <div>Question: {value.question || "—"}</div>
      <div>Validate prompt: {value.validate_answer_promt || "—"}</div>
    </div>
  );
}
