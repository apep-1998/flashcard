import { useEffect, useRef, useState } from "react";
import { apiFetch, getApiBaseUrl } from "@/lib/auth";
import type { AiReviewerConfig } from "@/lib/schemas/cards";

type ReviewData = {
  score: number;
  mistakes: Array<{
    type: string;
    incorrect: string;
    correct: string;
  }>;
};

type Props = {
  value: AiReviewerConfig;
  cardId?: number;
  isBusy?: boolean;
  onResult: (isCorrect: boolean) => void;
};

export default function AiReviewerExam({
  value,
  cardId,
  isBusy,
  onResult,
}: Props) {
  const [answer, setAnswer] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [review, setReview] = useState<ReviewData | null>(null);
  const [isCorrect, setIsCorrect] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (!review) {
      inputRef.current?.focus();
    }
  }, [value, review]);

  const handleSubmit = async (
    event:
      | React.FormEvent<HTMLFormElement>
      | React.KeyboardEvent<HTMLTextAreaElement>,
  ) => {
    event.preventDefault();
    const trimmed = answer.trim();
    if (!trimmed) {
      setError("Answer is required.");
      return;
    }
    if (!cardId) {
      setError("Card is missing an id.");
      return;
    }
    setError("");
    setIsSubmitting(true);
    try {
      const response = await apiFetch(
        `${getApiBaseUrl()}/api/cards/${cardId}/ai-review/`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ answer: trimmed }),
        },
      );
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data?.detail || "Unable to review answer.");
      }
      const data = (await response.json()) as ReviewData;
      const correct = data.score >= 7;
      const shouldReview = data.score < 10 || data.mistakes.length > 0;
      setIsCorrect(correct);
      setAnswer("");
      if (!shouldReview) {
        onResult(correct);
        return;
      }
      setReview(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to submit answer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinishReview = () => {
    if (isSubmitting || isBusy) return;
    setReview(null);
    onResult(isCorrect);
  };

  const isLocked = isSubmitting || isBusy;

  return (
    <form
      onSubmit={handleSubmit}
      className="flex h-full flex-col justify-between rounded-2xl border border-white/10 bg-white/5 p-6 text-center"
    >
      {review ? (
        <>
          <div className="text-xs uppercase tracking-[0.2em] text-white/60">
            AI review
          </div>
          <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-white/70">
            <div className="flex items-center justify-between">
              <div className="text-xs uppercase tracking-[0.2em] text-white/60">
                Score
              </div>
              <div className="text-lg font-semibold">
                {review.score}/10
              </div>
            </div>
            <div className="mt-4 space-y-2">
              {review.mistakes.length === 0 ? (
                <div className="text-sm text-white/60">
                  No mistakes were detected.
                </div>
              ) : (
                review.mistakes.map((mistake, index) => (
                  <div
                    key={`${mistake.type}-${index}`}
                    className="rounded-2xl border border-white/10 bg-[#0f141b] px-3 py-2"
                  >
                    <div className="text-xs uppercase tracking-[0.2em] text-white/50">
                      {mistake.type}
                    </div>
                    <div className="mt-1 text-sm text-white/70">
                      Incorrect:{" "}
                      <span className="text-white">
                        {mistake.incorrect?.toString() || "—"}
                      </span>
                    </div>
                    <div className="mt-1 text-sm text-white/70">
                      Correct:{" "}
                      <span className="text-white">
                        {mistake.correct?.toString() || "—"}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          <button
            type="button"
            disabled={isLocked}
            onClick={handleFinishReview}
            className="mt-6 rounded-full border border-white/20 bg-white/10 px-5 py-3 text-xs uppercase tracking-[0.2em] text-white/70 transition hover:border-white/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLocked ? "Saving..." : "Finish review"}
          </button>
        </>
      ) : (
        <>
          <div className="text-xs uppercase tracking-[0.2em] text-white/60">
            AI review
          </div>
          <div className="mt-3 text-lg font-semibold text-white">
            {value.question || "—"}
          </div>
          <label className="mt-6 block text-sm text-white/70">
            <span className="text-base font-semibold text-white">
              Your answer
            </span>
            <textarea
              value={answer}
              onChange={(event) => setAnswer(event.target.value)}
              ref={inputRef}
              className="mt-3 min-h-[180px] w-full resize-none rounded-2xl border border-white/10 bg-[#0f141b] px-4 py-3 text-base text-white outline-none transition focus:border-white/40"
              placeholder="Write your answer here..."
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  if (!isLocked) {
                    handleSubmit(event as unknown as React.FormEvent<HTMLFormElement>);
                  }
                }
              }}
            />
          </label>

          {error && (
            <div className="mt-4 rounded-2xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-xs text-red-100">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLocked}
            className="mt-6 rounded-full border border-white/20 bg-white/10 px-5 py-3 text-xs uppercase tracking-[0.2em] text-white/70 transition hover:border-white/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Reviewing..." : "Submit"}
          </button>
        </>
      )}
    </form>
  );
}
