import { useState } from "react";
import type { AiReviewerConfig } from "@/lib/schemas/cards";

type Props = {
  value: AiReviewerConfig;
  onSubmit: (answer: string) => Promise<void>;
};

export default function AiReviewerExam({ value, onSubmit }: Props) {
  const [answer, setAnswer] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = answer.trim();
    if (!trimmed) {
      setError("Answer is required.");
      return;
    }
    setError("");
    setIsSubmitting(true);
    try {
      await onSubmit(trimmed);
      setAnswer("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to submit answer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center"
    >
      <div className="text-xs uppercase tracking-[0.2em] text-white/60">
        AI review
      </div>
      <div className="mt-3 text-lg font-semibold text-white">
        {value.question || "—"}
      </div>
      <label className="mt-6 block text-sm text-white/70">
        <span className="text-base font-semibold text-white">Your answer</span>
        <textarea
          value={answer}
          onChange={(event) => setAnswer(event.target.value)}
          className="mt-3 min-h-[180px] w-full resize-none rounded-2xl border border-white/10 bg-[#0f141b] px-4 py-3 text-base text-white outline-none transition focus:border-white/40"
          placeholder="Write your answer here..."
        />
      </label>

      {error && (
        <div className="mt-4 rounded-2xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-xs text-red-100">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-6 rounded-full border border-white/20 bg-white/10 px-5 py-3 text-xs uppercase tracking-[0.2em] text-white/70 transition hover:border-white/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "Reviewing..." : "Submit"}
      </button>
    </form>
  );
}
