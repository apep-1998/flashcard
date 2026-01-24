"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { apiFetch, getApiBaseUrl } from "@/lib/auth";

type Exercise = {
  id: number;
  title: string;
  question_making_prompt: string;
  evaluate_prompt: string;
  exercises: string[];
};

type Review = {
  score: number;
  mistakes: Array<{
    type: string;
    incorrect: string;
    correct: string;
  }>;
  feedbacks: string[];
};

export default function ExerciseSessionPage() {
  const params = useParams<{ exerciseId: string }>();
  const exerciseId = Number(params.exerciseId);

  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [answer, setAnswer] = useState("");
  const [review, setReview] = useState<Review | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const currentExercise = useMemo(() => {
    if (!exercise?.exercises?.length) return "";
    return exercise.exercises[0];
  }, [exercise]);

  const loadExercise = async () => {
    setIsLoading(true);
    setError("");
    try {
      const response = await apiFetch(
        `${getApiBaseUrl()}/api/exercises/${exerciseId}/`,
      );
      if (!response.ok) {
        throw new Error("Unable to load exercise.");
      }
      const data = (await response.json()) as Exercise;
      setExercise(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load exercise.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!Number.isFinite(exerciseId)) return;
    loadExercise();
  }, [exerciseId]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!currentExercise || !answer.trim()) return;
    setIsSubmitting(true);
    setError("");
    try {
      const response = await apiFetch(
        `${getApiBaseUrl()}/api/exercises/${exerciseId}/evaluate/`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            question: currentExercise,
            answer: answer.trim(),
          }),
        },
      );
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data?.detail || "Unable to evaluate answer.");
      }
      const data = (await response.json()) as Review;
      setReview(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to evaluate answer.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTryAgain = () => {
    setReview(null);
  };

  const handleDone = async () => {
    if (!currentExercise) return;
    setIsSubmitting(true);
    setError("");
    try {
      const response = await apiFetch(
        `${getApiBaseUrl()}/api/exercises/${exerciseId}/complete/`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question: currentExercise }),
        },
      );
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data?.detail || "Unable to complete question.");
      }
      const data = (await response.json()) as Exercise;
      setExercise(data);
      setAnswer("");
      setReview(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to complete question.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-white/60">
        Loading exercise...
      </div>
    );
  }

  if (!exercise) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-white/60">
        Exercise not found.
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24">
      <header className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-white/50">
              Exercise
            </p>
            <h1 className="text-xl font-semibold">{exercise.title}</h1>
          </div>
          <span className="rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-white/60">
            {exercise.exercises.length ? "Exercise 1" : "No exercises"}
          </span>
        </div>
      </header>

      {error && (
        <div className="rounded-3xl border border-red-400/40 bg-red-500/10 p-6 text-sm text-red-100">
          {error}
        </div>
      )}

      <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
        {currentExercise ? (
          <div className="space-y-6">
            <div className="rounded-2xl border border-white/10 bg-[#0b1017] px-5 py-4 text-base font-semibold text-white">
              {currentExercise}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <label className="block text-sm text-white/70">
                Your answer
                <textarea
                  value={answer}
                  onChange={(event) => setAnswer(event.target.value)}
                  className="mt-2 min-h-[160px] w-full rounded-2xl border border-white/10 bg-[#0f141b] px-4 py-3 text-base text-white outline-none transition focus:border-white/40"
                  placeholder="Write your response..."
                />
              </label>
              <div className="flex flex-wrap justify-end gap-3">
                <button
                  type="submit"
                  disabled={isSubmitting || !answer.trim()}
                  className="rounded-full border border-white/20 bg-white/10 px-5 py-3 text-xs uppercase tracking-[0.2em] text-white/70 transition hover:border-white/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? "Evaluating..." : "Send"}
                </button>
              </div>
            </form>

            {review && (
              <div className="rounded-2xl border border-white/10 bg-[#0b1017] p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="text-sm uppercase tracking-[0.2em] text-white/60">
                    AI feedback
                  </div>
                  <span className="rounded-full border border-emerald-400/40 bg-emerald-500/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-emerald-100">
                    Score {review.score}/10
                  </span>
                </div>
                <div className="mt-4 space-y-4 text-sm text-white/70">
                  {review.feedbacks.length > 0 && (
                    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                      <div className="text-xs uppercase tracking-[0.2em] text-white/60">
                        Feedback
                      </div>
                      <ul className="mt-2 space-y-1 text-white/70">
                        {review.feedbacks.map((item, index) => (
                          <li key={`${item}-${index}`}>• {item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {review.mistakes.length > 0 ? (
                    <div className="space-y-3">
                      {review.mistakes.map((mistake, index) => (
                        <div
                          key={`${mistake.type}-${index}`}
                          className="rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3"
                        >
                          <div className="text-xs uppercase tracking-[0.2em] text-rose-200">
                            {mistake.type}
                          </div>
                          <div className="mt-2 text-white/70">
                            <span className="text-rose-200">Incorrect:</span>{" "}
                            {mistake.incorrect}
                          </div>
                          <div className="mt-1 text-white/70">
                            <span className="text-emerald-200">Correct:</span>{" "}
                            {mistake.correct}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-white/70">
                      Great job. No mistakes detected.
                    </div>
                  )}
                </div>

                <div className="mt-5 flex flex-wrap justify-end gap-3">
                  <button
                    type="button"
                    onClick={handleTryAgain}
                    className="rounded-full border border-white/15 px-4 py-2 text-xs uppercase tracking-[0.2em] text-white/60 transition hover:border-white/40 hover:text-white"
                  >
                    Try again
                  </button>
                  <button
                    type="button"
                    onClick={handleDone}
                    disabled={isSubmitting}
                    className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs uppercase tracking-[0.2em] text-white/70 transition hover:border-white/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSubmitting ? "Saving..." : "Done"}
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-sm text-white/60">
            No exercises available. We’re generating new prompts.
          </div>
        )}
      </section>
    </div>
  );
}
