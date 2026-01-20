"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import CardViewFactory from "@/components/cards/view/CardViewFactory";
import CardCreateFactory from "@/components/cards/create/CardCreateFactory";
import { type CardConfig, type CardType } from "@/lib/schemas/cards";
import { apiFetch, getApiBaseUrl } from "@/lib/auth";

type CardItem = {
  id: number;
  box: number;
  finished: boolean;
  level: number;
  group_id: string;
  config: CardConfig;
};

type PaginatedCards = {
  count: number;
  next: string | null;
  previous: string | null;
  results: CardItem[];
};

const CARD_TYPE_OPTIONS: Array<"all" | CardType> = [
  "all",
  "standard",
  "spelling",
  "word-standard",
  "german-verb-conjugator",
  "multiple-choice",
  "ai-reviewer",
];

const LEVEL_OPTIONS = ["all", "0", "1", "2", "3", "4", "5"];

export default function BoxCardsPage() {
  const params = useParams();
  const boxId = Array.isArray(params.boxId)
    ? params.boxId[0]
    : params.boxId ?? "";
  const boxIdNumber = Number(boxId);

  const [typeFilter, setTypeFilter] = useState("all");
  const [levelFilter, setLevelFilter] = useState("all");
  const [groupSearch, setGroupSearch] = useState("");
  const [cards, setCards] = useState<CardItem[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [nextUrl, setNextUrl] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CardItem | null>(null);
  const [editTarget, setEditTarget] = useState<CardItem | null>(null);
  const [editConfig, setEditConfig] = useState<CardConfig | null>(null);
  const [editError, setEditError] = useState("");
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const buildCardsUrl = useCallback(() => {
    if (!boxIdNumber) return null;
    const params = new URLSearchParams({ box: String(boxIdNumber) });
    if (typeFilter !== "all") params.set("type", typeFilter);
    if (levelFilter !== "all") params.set("level", levelFilter);
    if (groupSearch.trim()) params.set("group_id", groupSearch.trim());
    return `${getApiBaseUrl()}/api/cards/?${params.toString()}`;
  }, [boxIdNumber, groupSearch, levelFilter, typeFilter]);

  const loadCards = useCallback(
    async (url: string, append: boolean) => {
      try {
        if (append) {
          setIsLoadingMore(true);
        } else {
          setIsLoading(true);
        }
        const response = await apiFetch(url);
        if (!response.ok) {
          throw new Error("Unable to load cards.");
        }
        const data = (await response.json()) as
          | PaginatedCards
          | CardItem[];
        if (Array.isArray(data)) {
          setCards(data);
          setNextUrl(null);
          setTotalCount(data.length);
          return;
        }
        setCards((current) =>
          append ? [...current, ...data.results] : data.results,
        );
        setNextUrl(data.next);
        setTotalCount(data.count);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load cards.");
      } finally {
        if (append) {
          setIsLoadingMore(false);
        } else {
          setIsLoading(false);
        }
      }
    },
    [],
  );

  useEffect(() => {
    const url = buildCardsUrl();
    if (!url) return;
    setError("");
    setCards([]);
    setNextUrl(null);
    setTotalCount(null);
    loadCards(url, false);
  }, [buildCardsUrl, loadCards]);

  const hasMore = Boolean(nextUrl);
  const cardCount = totalCount ?? cards.length;

  useEffect(() => {
    if (!hasMore || !sentinelRef.current) return;
    const sentinel = sentinelRef.current;
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry?.isIntersecting && nextUrl && !isLoadingMore) {
          loadCards(nextUrl, true);
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, isLoadingMore, loadCards, nextUrl]);

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
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "Unable to update card.");
    }
  };

  return (
    <div className="flex h-[calc(100vh-14rem)] flex-col space-y-6 overflow-hidden">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Box cards</h2>
            <p className="text-sm text-white/60">Box ID: {boxId}</p>
          </div>
          <span className="rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-white/60">
            {cardCount} cards
          </span>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <label className="block text-sm text-white/70">
            Card type
            <select
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-white/10 bg-[#0f141b] px-4 py-3 text-white outline-none transition focus:border-white/40"
            >
              {CARD_TYPE_OPTIONS.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm text-white/70">
            Level
            <select
              value={levelFilter}
              onChange={(event) => setLevelFilter(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-white/10 bg-[#0f141b] px-4 py-3 text-white outline-none transition focus:border-white/40"
            >
              {LEVEL_OPTIONS.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm text-white/70">
            Group ID
            <input
              value={groupSearch}
              onChange={(event) => setGroupSearch(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-white/40"
              placeholder="Search group id"
            />
          </label>
        </div>
      </div>

      <div className="scrollbar-hidden flex-1 space-y-4 overflow-y-auto">
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
        {cards.map((card) => (
          <article
            key={card.id}
            className="rounded-3xl border border-white/10 bg-white/5 p-5"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-white/60">
                  {card.config.type}
                </div>
                <h3 className="mt-2 text-base font-semibold">
                  Card #{card.id}
                </h3>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs uppercase tracking-[0.2em] text-white/60">
                Level {card.level}
              </div>
            </div>
            <div className="mt-3 text-sm text-white/60">
              Group: {card.group_id || "—"}
            </div>
            <div className="mt-4 rounded-2xl border border-white/10 bg-[#0b1017] p-4">
              <CardViewFactory
                type={card.config.type as CardType}
                value={card.config}
              />
            </div>
            <div className="mt-4 flex flex-wrap gap-2 text-xs uppercase tracking-[0.2em] text-white/60">
              <button
                type="button"
                onClick={() => openEditModal(card)}
                className="rounded-full border border-white/10 px-3 py-1 hover:border-white/30 hover:text-white"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => setDeleteTarget(card)}
                className="rounded-full border border-red-400/30 px-3 py-1 text-red-200 hover:border-red-300 hover:text-red-100"
              >
                Delete
              </button>
            </div>
          </article>
        ))}
        {!isLoading && cards.length === 0 && (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-white/60">
            No cards match these filters.
          </div>
        )}
        {isLoadingMore && (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-xs uppercase tracking-[0.2em] text-white/60">
            Loading more...
          </div>
        )}
        <div ref={sentinelRef} />
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
    </div>
  );
}
