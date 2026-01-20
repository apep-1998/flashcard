"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import SpellingExam from "@/components/cards/exam/SpellingExam";
import GermanVerbConjugatorExam from "@/components/cards/exam/GermanVerbConjugatorExam";
import { apiFetch, getApiBaseUrl } from "@/lib/auth";
import MultipleChoiceExam from "@/components/cards/exam/MultipleChoiceExam";
import StandardExam from "@/components/cards/exam/StandardExam";
import AiReviewerExam from "@/components/cards/exam/AiReviewerExam";
import WordStandardExam from "@/components/cards/exam/WordStandardExam";
import CardCreateFactory from "@/components/cards/create/CardCreateFactory";
import type {
  AiReviewerConfig,
  CardConfig,
  CardType,
  GermanVerbConfig,
  MultipleChoiceConfig,
  SpellingConfig,
  StandardConfig,
  WordStandardConfig,
} from "@/lib/schemas/cards";

type CardItem = {
  id: number;
  box: number;
  finished: boolean;
  level: number;
  group_id: string;
  next_review_time: string | null;
  config: CardConfig;
};

type PaginatedCards = {
  count: number;
  next: string | null;
  previous: string | null;
  results: CardItem[];
};

const parseListParam = (value: string | null) =>
  value ? value.split(",").map((item) => item.trim()).filter(Boolean) : [];

export default function StudySessionPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const boxId = Array.isArray(params.boxId)
    ? params.boxId[0]
    : params.boxId ?? "";
  const boxIdNumber = Number(boxId);

  const [cards, setCards] = useState<CardItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [reviewState, setReviewState] = useState<
    | {
        type: "spelling";
        answer: string;
        expected: string;
      }
    | {
        type: "multiple-choice";
        answer: string;
        expected: string;
        question: string;
      }
    | {
        type: "german-verb-conjugator";
        answers: Record<string, string>;
        expected: Record<string, string>;
      }
    | {
        type: "ai-reviewer";
        score: number;
        mistakes: Array<{
          type: string;
          incorrect: string;
          correct: string;
        }>;
      }
    | null
  >(null);
  const [showCorrect, setShowCorrect] = useState(false);
  const [showIncorrect, setShowIncorrect] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CardItem | null>(null);
  const [editTarget, setEditTarget] = useState<CardItem | null>(null);
  const [editConfig, setEditConfig] = useState<CardConfig | null>(null);
  const [editError, setEditError] = useState("");

  const levels = useMemo(
    () => parseListParam(searchParams.get("levels")),
    [searchParams],
  );
  const types = useMemo(
    () => parseListParam(searchParams.get("types")) as CardType[],
    [searchParams],
  );
  const count = useMemo(() => {
    const value = Number(searchParams.get("count"));
    return Number.isFinite(value) && value > 0 ? Math.min(value, 50) : 0;
  }, [searchParams]);
  const shuffle = searchParams.get("shuffle") !== "0";

  const loadCards = useCallback(async () => {
    if (!boxIdNumber || !count) return;
    setError("");
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        box: String(boxIdNumber),
        ready: "1",
      });
      if (levels.length) params.set("level", levels.join(","));
      if (types.length) params.set("type", types.join(","));
      if (!shuffle) params.set("order", "next_review_time");

      const response = await apiFetch(
        `${getApiBaseUrl()}/api/cards/?${params.toString()}`,
      );
      if (!response.ok) {
        throw new Error("Unable to load study cards.");
      }
      const data = (await response.json()) as PaginatedCards;
      const limited = data.results.slice(0, count);
      const results = shuffle
        ? [...limited].sort(() => Math.random() - 0.5)
        : limited;
      setCards(results);
      setCurrentIndex(0);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load study cards.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [boxIdNumber, count, levels, shuffle, types]);

  useEffect(() => {
    loadCards();
  }, [loadCards]);

  useEffect(() => {
    setShowMenu(false);
  }, [currentIndex]);

  const currentCard = cards[currentIndex];
  const total = cards.length;

  const advanceCard = () => {
    setReviewState(null);
    setError("");
    setCurrentIndex((prev) => Math.min(prev + 1, total));
  };

  const openEditModal = (card: CardItem) => {
    setEditTarget(card);
    setEditConfig(card.config);
    setEditError("");
  };

  const handleDelete = async (card: CardItem) => {
    try {
      const response = await apiFetch(
        `${getApiBaseUrl()}/api/cards/${card.id}/`,
        { method: "DELETE" },
      );
      if (!response.ok) {
        throw new Error("Unable to delete card.");
      }
      setCards((current) => current.filter((item) => item.id !== card.id));
      setDeleteTarget(null);
      setShowMenu(false);
      setCurrentIndex((prev) => Math.min(prev, Math.max(total - 2, 0)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete card.");
    }
  };

  const handleEditSave = async () => {
    if (!editTarget) return;
    setEditError("");
    if (!editConfig) {
      setEditError("Card config is required.");
      return;
    }

    try {
      const response = await apiFetch(
        `${getApiBaseUrl()}/api/cards/${editTarget.id}/`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            config: editConfig,
          }),
        },
      );
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data?.detail || "Unable to update card.");
      }
      const updated = (await response.json()) as CardItem;
      setCards((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
      setEditTarget(null);
      setShowMenu(false);
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "Unable to update card.");
    }
  };

  const handleReviewUpdate = async (cardId: number, correct: boolean) => {
    try {
      const response = await apiFetch(
        `${getApiBaseUrl()}/api/cards/${cardId}/review/`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ correct }),
        },
      );
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data?.detail || "Unable to update card.");
      }
      return true;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to update card.",
      );
      return false;
    }
  };

  const handleSpellingSubmit = async (
    config: SpellingConfig,
    answer: string,
    isCorrect: boolean,
  ) => {
    if (!currentCard) return;
    const updated = await handleReviewUpdate(currentCard.id, isCorrect);
    if (!updated) return;

    if (isCorrect) {
      setShowCorrect(true);
      setTimeout(() => {
        setShowCorrect(false);
        advanceCard();
      }, 650);
      return;
    }
    setShowIncorrect(true);
    setTimeout(() => setShowIncorrect(false), 800);
    setReviewState({
      type: "spelling",
      answer,
      expected: config.spelling,
    });
  };

  const handleMultipleChoiceSelect = async (
    config: MultipleChoiceConfig,
    answer: string,
    isCorrect: boolean,
  ) => {
    if (!currentCard) return;
    const updated = await handleReviewUpdate(currentCard.id, isCorrect);
    if (!updated) return;

    if (isCorrect) {
      setShowCorrect(true);
      setTimeout(() => {
        setShowCorrect(false);
        advanceCard();
      }, 650);
      return;
    }
    setShowIncorrect(true);
    setTimeout(() => setShowIncorrect(false), 800);
    setReviewState({
      type: "multiple-choice",
      answer,
      expected: config.answer,
      question: config.question,
    });
  };

  const handleStandardAnswer = async (isCorrect: boolean) => {
    if (!currentCard) return;
    const updated = await handleReviewUpdate(currentCard.id, isCorrect);
    if (!updated) return;

    if (isCorrect) {
      setShowCorrect(true);
      setTimeout(() => {
        setShowCorrect(false);
        advanceCard();
      }, 650);
      return;
    }
    setShowIncorrect(true);
    setTimeout(() => setShowIncorrect(false), 800);
    advanceCard();
  };

  const handleGermanVerbSubmit = async (
    answers: Record<string, string>,
    isCorrect: boolean,
    config: GermanVerbConfig,
  ) => {
    if (!currentCard) return;
    const updated = await handleReviewUpdate(currentCard.id, isCorrect);
    if (!updated) return;

    if (isCorrect) {
      setShowCorrect(true);
      setTimeout(() => {
        setShowCorrect(false);
        advanceCard();
      }, 650);
      return;
    }
    setShowIncorrect(true);
    setTimeout(() => setShowIncorrect(false), 800);
    setReviewState({
      type: "german-verb-conjugator",
      answers,
      expected: {
        ich: config.ich,
        du: config.du,
        "er/sie/es": config["er/sie/es"],
        wir: config.wir,
        ihr: config.ihr,
        sie: config.sie,
      },
    });
  };

  const handleAiReviewerSubmit = async (
    _config: AiReviewerConfig,
    text: string,
  ) => {
    if (!currentCard) return;
    try {
      const response = await apiFetch(
        `${getApiBaseUrl()}/api/cards/${currentCard.id}/ai-review/`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ answer: text }),
        },
      );
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data?.detail || "Unable to review answer.");
      }
      const data = (await response.json()) as {
        score: number;
        mistakes: Array<{
          type: string;
          incorrect: string;
          correct: string;
        }>;
      };
      const isCorrect = data.score >= 7;
      const shouldReview = data.score < 10 || data.mistakes.length > 0;
      const updated = await handleReviewUpdate(currentCard.id, isCorrect);
      if (!updated) return;

      if (!shouldReview) {
        setShowCorrect(true);
        setTimeout(() => {
          setShowCorrect(false);
          advanceCard();
        }, 650);
        return;
      }
      if (isCorrect) {
        setShowCorrect(true);
        setTimeout(() => setShowCorrect(false), 800);
      } else {
        setShowIncorrect(true);
        setTimeout(() => setShowIncorrect(false), 800);
      }
      setReviewState({
        type: "ai-reviewer",
        score: data.score,
        mistakes: data.mistakes,
      });
    } catch (err) {
      throw err instanceof Error ? err : new Error("Unable to review answer.");
    }
  };

  return (
    <section className="flex h-[calc(100vh-14rem)] flex-col space-y-6 overflow-hidden">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold">Study session</h1>
            <p className="text-sm text-white/60">
              {total ? `${currentIndex + 1} of ${total}` : "No cards loaded"}
            </p>
          </div>
          {currentCard && (
            <div className="flex items-center gap-3">
              <span className="rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-white/60">
                Level {currentCard.level}
              </span>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowMenu((current) => !current)}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70 transition hover:border-white/40 hover:text-white"
                  aria-label="Card actions"
                >
                  •••
                </button>
                {showMenu && (
                  <div className="absolute right-0 mt-2 w-36 rounded-2xl border border-white/10 bg-[#0f141b] p-2 text-xs uppercase tracking-[0.2em] text-white/70 shadow-xl">
                    <button
                      type="button"
                      onClick={() => {
                        setShowMenu(false);
                        openEditModal(currentCard);
                      }}
                      className="w-full rounded-xl px-3 py-2 text-left transition hover:bg-white/10"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowMenu(false);
                        setDeleteTarget(currentCard);
                      }}
                      className="w-full rounded-xl px-3 py-2 text-left text-red-200 transition hover:bg-red-500/10"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto scrollbar-hidden">
        {isLoading && (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-white/60">
            Loading cards...
          </div>
        )}
        {error && (
          <div className="rounded-3xl border border-red-400/40 bg-red-500/10 p-6 text-sm text-red-100">
            {error}
          </div>
        )}
        {!isLoading && !currentCard && (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-white/60">
            No cards match this study setup.
          </div>
        )}

        {!isLoading && currentCard && reviewState && (
          <div className="rounded-3xl border border-white/10 bg-[#0b1017] p-6 space-y-4">
            <div className="text-xs uppercase tracking-[0.2em] text-white/60">
              Review
            </div>
            {reviewState.type === "multiple-choice" && (
              <div className="text-sm text-white/70">
                Question:{" "}
                <span className="text-white">{reviewState.question}</span>
              </div>
            )}
            {reviewState.type === "german-verb-conjugator" && (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-white/70">
                <div className="text-xs uppercase tracking-[0.2em] text-white/60">
                  Expected conjugations
                </div>
                <div className="mt-2 grid gap-2 md:grid-cols-2">
                  {Object.entries(reviewState.expected).map(([key, value]) => (
                    <div key={key} className="flex items-center gap-2">
                      <span className="text-xs uppercase tracking-[0.2em] text-white/40">
                        {key}
                      </span>
                      <span className="text-white">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {reviewState.type === "ai-reviewer" && (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-white/70">
                <div className="flex items-center justify-between">
                  <div className="text-xs uppercase tracking-[0.2em] text-white/60">
                    Score
                  </div>
                  <div className="text-lg font-semibold">
                    {reviewState.score}/10
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  {reviewState.mistakes.length === 0 ? (
                    <div className="text-sm text-white/60">
                      No mistakes were detected.
                    </div>
                  ) : (
                    reviewState.mistakes.map((mistake, index) => (
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
            )}
            <div className="text-sm text-white/70">
              Your answer:{" "}
              <span className="text-white">
                {reviewState.type === "german-verb-conjugator"
                  ? "See inputs above"
                  : reviewState.type === "ai-reviewer"
                  ? "See AI review below"
                  : reviewState.answer}
              </span>
            </div>
            <div className="text-sm text-white/70">
              Correct answer:{" "}
              <span className="text-white">
                {reviewState.type === "german-verb-conjugator"
                  ? "See expected values above"
                  : reviewState.type === "ai-reviewer"
                  ? "See AI feedback above"
                  : reviewState.expected}
              </span>
            </div>
            <button
              type="button"
              onClick={advanceCard}
              className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs uppercase tracking-[0.2em] text-white/70 transition hover:border-white/40 hover:text-white"
            >
              Done review
            </button>
          </div>
        )}

        {!isLoading && currentCard && !reviewState && (
          <div className="rounded-3xl border border-white/10 bg-[#0b1017] p-6 space-y-4">
            <div className="text-xs uppercase tracking-[0.2em] text-white/60">
              {currentCard.config.type}
            </div>
            {currentCard.config.type === "spelling" ? (
              <SpellingExam
                value={currentCard.config as SpellingConfig}
                onSubmit={(answer, isCorrect) =>
                  handleSpellingSubmit(
                    currentCard.config as SpellingConfig,
                    answer,
                    isCorrect,
                  )
                }
              />
            ) : currentCard.config.type === "multiple-choice" ? (
              <MultipleChoiceExam
                value={currentCard.config as MultipleChoiceConfig}
                onSelect={(answer, isCorrect) =>
                  handleMultipleChoiceSelect(
                    currentCard.config as MultipleChoiceConfig,
                    answer,
                    isCorrect,
                  )
                }
              />
            ) : currentCard.config.type === "standard" ? (
              <StandardExam
                key={`standard-${currentCard.id}`}
                value={currentCard.config as StandardConfig}
                onAnswer={handleStandardAnswer}
              />
            ) : currentCard.config.type === "word-standard" ? (
              <WordStandardExam
                key={`word-standard-${currentCard.id}`}
                value={currentCard.config as WordStandardConfig}
                onAnswer={handleStandardAnswer}
              />
            ) : currentCard.config.type === "german-verb-conjugator" ? (
              <GermanVerbConjugatorExam
                value={currentCard.config as GermanVerbConfig}
                onSubmit={(answers, isCorrect) =>
                  handleGermanVerbSubmit(
                    answers,
                    isCorrect,
                    currentCard.config as GermanVerbConfig,
                  )
                }
              />
            ) : currentCard.config.type === "ai-reviewer" ? (
              <AiReviewerExam
                value={currentCard.config as AiReviewerConfig}
                onSubmit={(answer) =>
                  handleAiReviewerSubmit(
                    currentCard.config as AiReviewerConfig,
                    answer,
                  )
                }
              />
            ) : (
              <div className="space-y-3">
                <div className="text-sm text-white/70">
                  Exam mode for this card type isn’t ready yet.
                </div>
                <button
                  type="button"
                  onClick={advanceCard}
                  className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs uppercase tracking-[0.2em] text-white/70 transition hover:border-white/40 hover:text-white"
                >
                  Skip card
                </button>
              </div>
            )}
          </div>
        )}
        {showCorrect && (
          <div className="pointer-events-none fixed inset-0 z-40 flex items-center justify-center">
            <div className="animate-pulse rounded-full border border-emerald-300/40 bg-emerald-500/20 px-8 py-4 text-sm uppercase tracking-[0.3em] text-emerald-100 shadow-xl shadow-emerald-500/20">
              Correct
            </div>
          </div>
        )}
        {showIncorrect && (
          <div className="pointer-events-none fixed inset-0 z-40 flex items-center justify-center">
            <div className="animate-pulse rounded-full border border-rose-300/40 bg-rose-500/20 px-8 py-4 text-sm uppercase tracking-[0.3em] text-rose-100 shadow-xl shadow-rose-500/20">
              Incorrect
            </div>
          </div>
        )}
      </div>

      {deleteTarget && (
        <div className="fixed inset-0 z-40 flex items-center justify-center px-6 py-12">
          <button
            type="button"
            aria-label="Close delete dialog"
            onClick={() => setDeleteTarget(null)}
            className="fixed inset-0 bg-black/60"
          />
          <div className="relative z-10 w-full max-w-md rounded-3xl border border-white/10 bg-[#0f141b] p-6 shadow-2xl shadow-black/40">
            <h2 className="text-lg font-semibold">Delete card</h2>
            <p className="mt-2 text-sm text-white/70">
              Delete card #{deleteTarget.id}? This cannot be undone.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="flex-1 rounded-2xl border border-white/20 px-4 py-3 text-sm font-semibold text-white/70 transition hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDelete(deleteTarget)}
                className="flex-1 rounded-2xl bg-red-500/80 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-500"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {editTarget && (
        <div className="fixed inset-0 z-40 flex items-center justify-center px-6 py-12">
          <button
            type="button"
            aria-label="Close edit dialog"
            onClick={() => setEditTarget(null)}
            className="fixed inset-0 bg-black/60"
          />
          <div className="relative z-10 w-full max-w-2xl rounded-3xl border border-white/10 bg-[#0f141b] p-6 shadow-2xl shadow-black/40">
            <h2 className="text-lg font-semibold">Edit card</h2>
            <p className="mt-2 text-sm text-white/70">
              Update the card fields. Level and group cannot be changed here.
            </p>
            {editConfig && (
              <div className="mt-6">
                <CardCreateFactory
                  type={editConfig.type as CardType}
                  value={editConfig}
                  onChange={setEditConfig}
                />
              </div>
            )}
            {editError && (
              <div className="mt-4 rounded-2xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-xs text-red-100">
                {editError}
              </div>
            )}
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setEditTarget(null)}
                className="flex-1 rounded-2xl border border-white/20 px-4 py-3 text-sm font-semibold text-white/70 transition hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleEditSave}
                className="flex-1 rounded-2xl bg-[#2b59ff] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#1f46d8]"
              >
                Save changes
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
