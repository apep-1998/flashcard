import type { AiReviewerConfig } from "@/lib/schemas/cards";

type Props = {
  value: AiReviewerConfig;
  onChange: (next: AiReviewerConfig) => void;
};

export default function AiReviewerCreate({ value, onChange }: Props) {
  return (
    <div className="space-y-4">
      <label className="block text-sm text-white/70">
        Question
        <textarea
          value={value.question}
          onChange={(event) => onChange({ ...value, question: event.target.value })}
          className="mt-2 min-h-[120px] w-full resize-none rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-white/40"
          placeholder="Explain how photosynthesis works."
        />
      </label>
      <label className="block text-sm text-white/70">
        Validate answer prompt
        <textarea
          value={value.validate_answer_promt}
          onChange={(event) =>
            onChange({ ...value, validate_answer_promt: event.target.value })
          }
          className="mt-2 min-h-[140px] w-full resize-none rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-white/40"
          placeholder="Check if the answer mentions light, CO2, water, and glucose."
        />
      </label>
    </div>
  );
}
