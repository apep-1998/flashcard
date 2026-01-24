"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { apiFetch, getApiBaseUrl } from "@/lib/auth";

type ExerciseItem = {
  id: number;
  title: string;
  question_making_prompt: string;
  evaluate_prompt: string;
  exercises: string[];
};

type ExerciseHistoryItem = {
  id: number;
  question: string;
  answer: string;
  review: {
    score: number;
    mistakes: Array<{
      type: string;
      incorrect: string;
      correct: string;
    }>;
    feedbacks?: string[];
  };
  created_at: string;
};

type PaginatedExercises = {
  count: number;
  next: string | null;
  previous: string | null;
  results: ExerciseItem[];
};

export default function ExercisesPage() {
  const [exercises, setExercises] = useState<ExerciseItem[]>([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [nextUrl, setNextUrl] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [editingExercise, setEditingExercise] = useState<ExerciseItem | null>(
    null,
  );
  const [deleteTarget, setDeleteTarget] = useState<ExerciseItem | null>(null);
  const [title, setTitle] = useState("");
  const [questionPrompt, setQuestionPrompt] = useState("");
  const [evaluatePrompt, setEvaluatePrompt] = useState("");
  const [bulkJson, setBulkJson] = useState("");
  const [bulkErrors, setBulkErrors] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [menuTargetId, setMenuTargetId] = useState<number | null>(null);
  const [historyTarget, setHistoryTarget] = useState<ExerciseItem | null>(null);
  const [historyItems, setHistoryItems] = useState<ExerciseHistoryItem[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const buildExercisesUrl = useCallback(() => {
    const params = new URLSearchParams();
    if (search.trim()) {
      params.set("search", search.trim());
    }
    const query = params.toString();
    return query
      ? `${getApiBaseUrl()}/api/exercises/?${query}`
      : `${getApiBaseUrl()}/api/exercises/`;
  }, [search]);

  const loadExercises = useCallback(async (url: string, append: boolean) => {
    try {
      if (append) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
      }
      const response = await apiFetch(url);
      if (!response.ok) {
        throw new Error("Unable to load exercises.");
      }
      const data = (await response.json()) as PaginatedExercises | ExerciseItem[];
      if (Array.isArray(data)) {
        setExercises(data);
        setNextUrl(null);
        return;
      }
      setExercises((current) =>
        append ? [...current, ...data.results] : data.results,
      );
      setNextUrl(data.next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load exercises.");
    } finally {
      if (append) {
        setIsLoadingMore(false);
      } else {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const url = buildExercisesUrl();
    setError("");
    setExercises([]);
    setNextUrl(null);
    loadExercises(url, false);
  }, [buildExercisesUrl, loadExercises]);

  useEffect(() => {
    if (!nextUrl || !sentinelRef.current) return;
    const sentinel = sentinelRef.current;
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry?.isIntersecting && nextUrl && !isLoadingMore) {
          loadExercises(nextUrl, true);
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [isLoadingMore, loadExercises, nextUrl]);

  const resetForm = () => {
    setTitle("");
    setQuestionPrompt("");
    setEvaluatePrompt("");
    setEditingExercise(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setIsCreateOpen(true);
  };

  const handleOpenEdit = (exercise: ExerciseItem) => {
    setEditingExercise(exercise);
    setTitle(exercise.title);
    setQuestionPrompt(exercise.question_making_prompt);
    setEvaluatePrompt(exercise.evaluate_prompt);
    setIsCreateOpen(true);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSaving) return;
    setError("");

    const payload = {
      title: title.trim(),
      question_making_prompt: questionPrompt.trim(),
      evaluate_prompt: evaluatePrompt.trim(),
    };

    if (!payload.title || !payload.question_making_prompt || !payload.evaluate_prompt) {
      setError("Title, question prompt, and evaluation prompt are required.");
      return;
    }

    try {
      setIsSaving(true);
      const url = editingExercise
        ? `${getApiBaseUrl()}/api/exercises/${editingExercise.id}/`
        : `${getApiBaseUrl()}/api/exercises/`;
      const method = editingExercise ? "PATCH" : "POST";
      const response = await apiFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data?.detail || "Unable to save exercise.");
      }
      const updated = (await response.json()) as ExerciseItem;
      setExercises((current) => {
        if (!editingExercise) {
          return [updated, ...current];
        }
        return current.map((item) => (item.id === updated.id ? updated : item));
      });
      setIsCreateOpen(false);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save exercise.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const response = await apiFetch(
        `${getApiBaseUrl()}/api/exercises/${deleteTarget.id}/`,
        { method: "DELETE" },
      );
      if (!response.ok) {
        throw new Error("Unable to delete exercise.");
      }
      setExercises((current) =>
        current.filter((item) => item.id !== deleteTarget.id),
      );
      setDeleteTarget(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete exercise.");
    }
  };

  const loadHistory = async (exercise: ExerciseItem) => {
    setIsHistoryLoading(true);
    setError("");
    try {
      const response = await apiFetch(
        `${getApiBaseUrl()}/api/exercises/${exercise.id}/history/`,
      );
      if (!response.ok) {
        throw new Error("Unable to load exercise history.");
      }
      const data = (await response.json()) as
        | ExerciseHistoryItem[]
        | { results: ExerciseHistoryItem[] };
      const list = Array.isArray(data) ? data : data.results;
      setHistoryItems(list);
      setHistoryTarget(exercise);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load exercise history.",
      );
    } finally {
      setIsHistoryLoading(false);
    }
  };

  const handleBulkSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    setBulkErrors([]);
    setError("");

    let parsed: unknown;
    try {
      parsed = JSON.parse(bulkJson);
    } catch {
      setBulkErrors(["Invalid JSON format."]);
      return;
    }

    if (!Array.isArray(parsed)) {
      setBulkErrors(["JSON must be an array of exercises."]);
      return;
    }

    try {
      const response = await apiFetch(
        `${getApiBaseUrl()}/api/exercises/bulk-create/`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(parsed),
        },
      );
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        if (Array.isArray(data?.errors)) {
          setBulkErrors(
            data.errors.map((item: { index: number; error: string }) => {
              return `Item ${item.index + 1}: ${item.error}`;
            }),
          );
          return;
        }
        throw new Error(data?.detail || "Unable to create exercises.");
      }
      const created = (await response.json()) as ExerciseItem[];
      setExercises((current) => [...created, ...current]);
      setBulkJson("");
      setIsBulkOpen(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to create exercises.",
      );
    }
  };

  const totalExercises = useMemo(() => exercises.length, [exercises.length]);

  return (
    <div className="space-y-6 pb-24 px-4 sm:px-6 lg:px-10">
      <header className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold">Exercises</h1>
            <p className="text-sm text-white/60">
              Manage prompt-driven exercises and reuse them in practice sessions.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleOpenCreate}
              className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs uppercase tracking-[0.2em] text-white/70 transition hover:border-white/40 hover:text-white"
            >
              New
            </button>
            <button
              type="button"
              onClick={() => setIsBulkOpen(true)}
              className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.2em] text-white/70 transition hover:border-white/40 hover:text-white"
            >
              JSON
            </button>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-4">
          <div className="flex flex-1 items-center gap-3 rounded-full border border-white/10 bg-[#0f141b] px-4 py-3">
            <span className="text-xs uppercase tracking-[0.2em] text-white/50">
              Search
            </span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Title contains..."
              className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/30"
            />
          </div>
          <span className="text-xs uppercase tracking-[0.2em] text-white/40">
            {totalExercises} exercises
          </span>
        </div>
      </header>

      {error && (
        <div className="rounded-3xl border border-red-400/40 bg-red-500/10 p-6 text-sm text-red-100">
          {error}
        </div>
      )}

      <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
        {isLoading ? (
          <div className="text-sm text-white/60">Loading exercises...</div>
        ) : exercises.length === 0 ? (
          <div className="text-sm text-white/60">
            No exercises yet. Create your first one.
          </div>
        ) : (
          <div className="space-y-4">
            {exercises.map((exercise) => (
              <article
                key={exercise.id}
                className="rounded-2xl border border-white/10 bg-[#0b1017] p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h2 className="text-base font-semibold text-white">
                      {exercise.title}
                    </h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/panel/exercises/${exercise.id}`}
                      className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs uppercase tracking-[0.2em] text-white/70 transition hover:border-white/40 hover:text-white"
                    >
                      Do exercise
                    </Link>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() =>
                          setMenuTargetId((current) =>
                            current === exercise.id ? null : exercise.id,
                          )
                        }
                        className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70 transition hover:border-white/40 hover:text-white"
                        aria-label="Exercise actions"
                      >
                        <span className="text-lg leading-none">⋮</span>
                      </button>
                      {menuTargetId === exercise.id && (
                        <div className="absolute right-0 top-12 z-20 w-40 rounded-2xl border border-white/10 bg-[#0b1017] p-2 text-xs text-white/70 shadow-xl">
                          <button
                            type="button"
                            onClick={() => {
                              setMenuTargetId(null);
                              handleOpenEdit(exercise);
                            }}
                            className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left transition hover:bg-white/10 hover:text-white"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setMenuTargetId(null);
                              loadHistory(exercise);
                            }}
                            className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left transition hover:bg-white/10 hover:text-white"
                          >
                            History
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setMenuTargetId(null);
                              setDeleteTarget(exercise);
                            }}
                            className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-rose-200 transition hover:bg-rose-500/10 hover:text-rose-100"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            ))}
            {nextUrl && (
              <div ref={sentinelRef} className="py-4 text-center text-xs text-white/50">
                {isLoadingMore ? "Loading more..." : "Scroll for more"}
              </div>
            )}
          </div>
        )}
      </section>

      {isCreateOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center px-6 py-12">
          <button
            type="button"
            onClick={() => setIsCreateOpen(false)}
            className="fixed inset-0 bg-black/60"
            aria-label="Close create exercise"
          />
          <div className="relative z-10 w-full max-w-lg rounded-3xl border border-white/10 bg-[#0b1017] p-6 text-white">
            <h2 className="text-lg font-semibold">
              {editingExercise ? "Edit exercise" : "New exercise"}
            </h2>
            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <label className="block text-sm text-white/70">
                Title
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-white/40"
                  placeholder="German sentence drill"
                />
              </label>
              <label className="block text-sm text-white/70">
                Exercise making prompt
                <textarea
                  value={questionPrompt}
                  onChange={(event) => setQuestionPrompt(event.target.value)}
                  className="mt-2 min-h-[120px] w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-white/40"
                  placeholder="Generate short exercises about..."
                />
              </label>
              <label className="block text-sm text-white/70">
                Evaluate prompt
                <textarea
                  value={evaluatePrompt}
                  onChange={(event) => setEvaluatePrompt(event.target.value)}
                  className="mt-2 min-h-[120px] w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-white/40"
                  placeholder="Check the answer for..."
                />
              </label>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="rounded-full border border-white/15 px-4 py-2 text-xs uppercase tracking-[0.2em] text-white/60 transition hover:border-white/40 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs uppercase tracking-[0.2em] text-white/70 transition hover:border-white/40 hover:text-white"
                >
                  {isSaving ? "Saving..." : "Save exercise"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isBulkOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center px-6 py-12">
          <button
            type="button"
            onClick={() => setIsBulkOpen(false)}
            className="fixed inset-0 bg-black/60"
            aria-label="Close JSON exercise import"
          />
          <div className="relative z-10 w-full max-w-2xl rounded-3xl border border-white/10 bg-[#0b1017] p-6 text-white">
            <h2 className="text-lg font-semibold">Import exercises JSON</h2>
            <form onSubmit={handleBulkSubmit} className="mt-4 space-y-4">
              <textarea
                value={bulkJson}
                onChange={(event) => setBulkJson(event.target.value)}
                className="min-h-[220px] w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 font-mono text-xs text-white outline-none transition focus:border-white/40"
                placeholder={`[\n  {\n    \"title\": \"Vocabulary drill\",\n    \"question_making_prompt\": \"Create 5 short exercises\",\n    \"evaluate_prompt\": \"Check grammar and meaning\"\n  }\n]`}
              />
              {bulkErrors.length > 0 && (
                <div className="rounded-2xl border border-rose-400/40 bg-rose-500/10 p-4 text-sm text-rose-100">
                  {bulkErrors.map((item) => (
                    <div key={item}>{item}</div>
                  ))}
                </div>
              )}
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsBulkOpen(false)}
                  className="rounded-full border border-white/15 px-4 py-2 text-xs uppercase tracking-[0.2em] text-white/60 transition hover:border-white/40 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs uppercase tracking-[0.2em] text-white/70 transition hover:border-white/40 hover:text-white"
                >
                  Import exercises
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-40 flex items-center justify-center px-6 py-12">
          <button
            type="button"
            onClick={() => setDeleteTarget(null)}
            className="fixed inset-0 bg-black/60"
            aria-label="Close delete exercise"
          />
          <div className="relative z-10 w-full max-w-md rounded-3xl border border-white/10 bg-[#0b1017] p-6 text-white">
            <h2 className="text-lg font-semibold">Delete exercise</h2>
            <p className="mt-3 text-sm text-white/70">
              Are you sure you want to delete “{deleteTarget.title}”?
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="rounded-full border border-white/15 px-4 py-2 text-xs uppercase tracking-[0.2em] text-white/60 transition hover:border-white/40 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="rounded-full border border-rose-400/40 bg-rose-500/10 px-4 py-2 text-xs uppercase tracking-[0.2em] text-rose-100 transition hover:border-rose-300/80"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {historyTarget && (
        <div className="fixed inset-0 z-40 flex items-center justify-center px-6 py-12">
          <button
            type="button"
            onClick={() => setHistoryTarget(null)}
            className="fixed inset-0 bg-black/60"
            aria-label="Close exercise history"
          />
          <div className="relative z-10 w-full max-w-3xl rounded-3xl border border-white/10 bg-[#0b1017] p-6 text-white">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-white/50">
                  Exercise history
                </p>
                <h2 className="text-lg font-semibold">{historyTarget.title}</h2>
              </div>
              <button
                type="button"
                onClick={() => setHistoryTarget(null)}
                className="rounded-full border border-white/15 px-4 py-2 text-xs uppercase tracking-[0.2em] text-white/60 transition hover:border-white/40 hover:text-white"
              >
                Close
              </button>
            </div>

            <div className="mt-5 max-h-[60vh] space-y-4 overflow-y-auto pr-2">
              {isHistoryLoading ? (
                <div className="text-sm text-white/60">Loading history...</div>
              ) : historyItems.length === 0 ? (
                <div className="text-sm text-white/60">
                  No history yet for this exercise.
                </div>
              ) : (
                historyItems.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-white/10 bg-[#0f141b] p-4"
                  >
                    <div className="text-xs uppercase tracking-[0.2em] text-white/50">
                      {new Date(item.created_at).toLocaleString()}
                    </div>
                    <div className="mt-3 text-sm text-white/80">
                      <span className="text-white/60">Exercise:</span>{" "}
                      {item.question}
                    </div>
                    <div className="mt-2 text-sm text-white/80">
                      <span className="text-white/60">Answer:</span>{" "}
                      {item.answer}
                    </div>
                    <div className="mt-3 rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-white/70">
                      <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-white/60">
                        <span>Review</span>
                        <span className="rounded-full border border-emerald-400/40 bg-emerald-500/10 px-2 py-1 text-[10px] text-emerald-100">
                          Score {item.review.score}/10
                        </span>
                      </div>
                      {item.review.feedbacks && item.review.feedbacks.length > 0 && (
                        <ul className="mt-2 space-y-1 text-white/70">
                          {item.review.feedbacks.map((feedback, index) => (
                            <li key={`${item.id}-feedback-${index}`}>
                              • {feedback}
                            </li>
                          ))}
                        </ul>
                      )}
                      {item.review.mistakes.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {item.review.mistakes.map((mistake, index) => (
                            <div
                              key={`${item.id}-mistake-${index}`}
                              className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-3 py-2"
                            >
                              <div className="text-xs uppercase tracking-[0.2em] text-rose-200">
                                {mistake.type}
                              </div>
                              <div className="mt-1 text-xs text-white/70">
                                <span className="text-rose-200">Incorrect:</span>{" "}
                                {mistake.incorrect}
                              </div>
                              <div className="mt-1 text-xs text-white/70">
                                <span className="text-emerald-200">Correct:</span>{" "}
                                {mistake.correct}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
