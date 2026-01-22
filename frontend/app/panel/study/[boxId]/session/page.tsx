"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Container from "@mui/material/Container";
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
  value
    ? value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
    : [];

export default function StudySessionPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const boxId = Array.isArray(params.boxId)
    ? params.boxId[0]
    : (params.boxId ?? "");
  const boxIdNumber = Number(boxId);

  const [cards, setCards] = useState<CardItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showCorrect, setShowCorrect] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isReviewing, setIsReviewing] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CardItem | null>(null);
  const [editTarget, setEditTarget] = useState<CardItem | null>(null);
  const [editConfig, setEditConfig] = useState<CardConfig | null>(null);
  const [editError, setEditError] = useState("");
  const [boxName, setBoxName] = useState("");

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

  useEffect(() => {
    if (!boxIdNumber) return;
    const loadBox = async () => {
      try {
        const response = await apiFetch(
          `${getApiBaseUrl()}/api/boxes/${boxIdNumber}/`,
        );
        if (!response.ok) {
          throw new Error("Unable to load box.");
        }
        const data = (await response.json()) as { name?: string };
        setBoxName(data?.name ?? "");
      } catch {
        setBoxName("");
      }
    };
    loadBox();
  }, [boxIdNumber]);

  const currentCard = cards[currentIndex];
  const total = cards.length;

  const advanceCard = () => {
    setError("");
    setCurrentIndex((prev) => {
      const nextIndex = prev + 1;
      if (nextIndex >= total) {
        router.push("/panel/study");
        return prev;
      }
      return nextIndex;
    });
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
      setEditError(
        err instanceof Error ? err.message : "Unable to update card.",
      );
    }
  };

  const handleReviewUpdate = async (cardId: number, correct: boolean) => {
    if (isReviewing) return false;
    setIsReviewing(true);
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
      setError(err instanceof Error ? err.message : "Unable to update card.");
      return false;
    } finally {
      setIsReviewing(false);
    }
  };

  const handleCardResult = async (correct: boolean) => {
    if (!currentCard) return;
    const updated = await handleReviewUpdate(currentCard.id, correct);
    if (!updated) return;

    if (correct) {
      setShowCorrect(true);
      setTimeout(() => {
        setShowCorrect(false);
        advanceCard();
      }, 650);
      return;
    }
    advanceCard();
  };

  const bodyCardClass =
    "flex h-full w-full max-w-4xl min-h-0 flex-col items-center justify-between gap-6 rounded-3xl border border-white/10 bg-[#0b1017] p-8 text-center overflow-auto scrollbar-hidden";

  return (
    <Container
      id="exam-screen"
      disableGutters
      maxWidth={false}
      sx={{
        display: "flex",
        width: 1,
        height: "100svh",
        paddingBottom: "6rem",
        boxSizing: "border-box",
      }}
    >
      <Container
        id="exam-container"
        disableGutters
        maxWidth={false}
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "stretch",
          justifyContent: "flex-start",
          width: 1,
          height: 1,
        }}
      >
        <Container
          id="exam-header"
          component="header"
          disableGutters
          maxWidth={false}
          sx={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 4,
            width: 1,
            padding: 2,
            paddingX: 4,
            borderBottom: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 24,
          }}
        >
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-lg font-semibold">
              {boxName ? boxName : `Box ${boxIdNumber || ""}`}
            </h1>
            <p className="text-xs text-white/70">
              {total ? `${currentIndex + 1} of ${total}` : "No cards loaded"}
            </p>
          </div>
          {currentCard && (
            <div className="flex flex-shrink-0 items-center gap-3">
              <span className="rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-white/70">
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
        </Container>
        <Container
          id="exam-body"
          disableGutters
          maxWidth={false}
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "stretch",
            justifyContent: "space-between",
            gap: 4,
            flexGrow: 1,
            width: 1,
            minHeight: 0,
          }}
        >
          {isLoading && (
            <Container
              id="exam-card-loading"
              disableGutters
              maxWidth={false}
              className={bodyCardClass}
            >
              <div className="text-sm text-white/70">Loading cards...</div>
            </Container>
          )}
          {error && (
            <Container
              id="exam-card-error"
              disableGutters
              maxWidth={false}
              className={bodyCardClass}
            >
              <div className="rounded-2xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                {error}
              </div>
            </Container>
          )}
          {!isLoading && !currentCard && !error && (
            <Container
              id="exam-card-empty"
              disableGutters
              maxWidth={false}
              className={bodyCardClass}
            >
              <div className="text-sm text-white/70">
                No cards match this study setup.
              </div>
            </Container>
          )}
          {!isLoading && !error && currentCard && (
            <Container
              id="exam-card-active"
              disableGutters
              maxWidth={false}
              className={bodyCardClass}
            >
              {currentCard.config.type === "spelling" ? (
                <SpellingExam
                  key={`spelling-${currentCard.id}`}
                  value={currentCard.config as SpellingConfig}
                  isBusy={isReviewing}
                  onResult={handleCardResult}
                />
              ) : currentCard.config.type === "multiple-choice" ? (
                <MultipleChoiceExam
                  key={`multiple-choice-${currentCard.id}`}
                  value={currentCard.config as MultipleChoiceConfig}
                  isBusy={isReviewing}
                  onResult={handleCardResult}
                />
              ) : currentCard.config.type === "standard" ? (
                <StandardExam
                  key={`standard-${currentCard.id}`}
                  value={currentCard.config as StandardConfig}
                  isBusy={isReviewing}
                  onResult={handleCardResult}
                />
              ) : currentCard.config.type === "word-standard" ? (
                <WordStandardExam
                  key={`word-standard-${currentCard.id}`}
                  value={currentCard.config as WordStandardConfig}
                  isBusy={isReviewing}
                  onResult={handleCardResult}
                />
              ) : currentCard.config.type === "german-verb-conjugator" ? (
                <GermanVerbConjugatorExam
                  key={`german-verb-${currentCard.id}`}
                  value={currentCard.config as GermanVerbConfig}
                  isBusy={isReviewing}
                  onResult={handleCardResult}
                />
              ) : currentCard.config.type === "ai-reviewer" ? (
                <AiReviewerExam
                  key={`ai-reviewer-${currentCard.id}`}
                  cardId={currentCard.id}
                  value={currentCard.config as AiReviewerConfig}
                  isBusy={isReviewing}
                  onResult={handleCardResult}
                />
              ) : (
                <div className="space-y-3">
                  <div className="text-sm text-white/70">
                    Exam mode for this card type isn’t ready yet.
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCardResult(false)}
                    className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs uppercase tracking-[0.2em] text-white/70 transition hover:border-white/40 hover:text-white"
                  >
                    Skip card
                  </button>
                </div>
              )}
            </Container>
          )}
        </Container>
      </Container>
      {showCorrect && (
        <div className="pointer-events-none fixed inset-0 z-40 flex items-center justify-center">
          <div className="animate-pulse rounded-full border border-emerald-300/40 bg-emerald-500/20 px-8 py-4 text-sm uppercase tracking-[0.3em] text-emerald-100 shadow-xl shadow-emerald-500/20">
            Correct
          </div>
        </div>
      )}
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
    </Container>
  );
}
