"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { apiFetch, getApiBaseUrl } from "@/lib/auth";

type BoxItem = {
  id: number;
  name: string;
  description?: string;
  ready_cards: number;
};

type PaginatedBoxes = {
  count: number;
  next: string | null;
  previous: string | null;
  results: BoxItem[];
};

export default function StudyPage() {
  const [boxes, setBoxes] = useState<BoxItem[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [nextUrl, setNextUrl] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const loadBoxes = useCallback(async (url: string, append: boolean) => {
    try {
      if (append) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
      }
      const response = await apiFetch(url);
      if (!response.ok) {
        throw new Error("Unable to load study boxes.");
      }
      const data = (await response.json()) as PaginatedBoxes;
      setBoxes((current) =>
        append ? [...current, ...data.results] : data.results,
      );
      setNextUrl(data.next);
      setTotalCount(data.count);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load study boxes.",
      );
    } finally {
      if (append) {
        setIsLoadingMore(false);
      } else {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const url = `${getApiBaseUrl()}/api/boxes/?ready_only=1`;
    setError("");
    setBoxes([]);
    setNextUrl(null);
    setTotalCount(null);
    loadBoxes(url, false);
  }, [loadBoxes]);

  useEffect(() => {
    if (!nextUrl || !sentinelRef.current) return;
    const sentinel = sentinelRef.current;
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry?.isIntersecting && nextUrl && !isLoadingMore) {
          loadBoxes(nextUrl, true);
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [isLoadingMore, loadBoxes, nextUrl]);

  return (
    <section className="flex h-[calc(100vh-14rem)] flex-col space-y-6 overflow-hidden">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold">Study</h1>
            <p className="text-sm text-white/60">
              Choose a box with ready cards to start a study session.
            </p>
          </div>
          <span className="rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-white/60">
            {totalCount ?? boxes.length} ready boxes
          </span>
        </div>
      </div>

      <div className="scrollbar-hidden flex-1 space-y-4 overflow-y-auto">
        {isLoading && (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-white/60">
            Loading ready boxes...
          </div>
        )}
        {error && (
          <div className="rounded-3xl border border-red-400/40 bg-red-500/10 p-6 text-sm text-red-100">
            {error}
          </div>
        )}
        {boxes.map((box) => (
          <article
            key={box.id}
            className="rounded-3xl border border-white/10 bg-[#0b1017] p-5"
          >
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold">{box.name}</h2>
                {box.description && (
                  <p className="mt-1 text-sm text-white/60">
                    {box.description}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-3">
                <span className="rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-white/60">
                  {box.ready_cards} ready
                </span>
                <Link
                  href={`/panel/study/${box.id}/options`}
                  className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs uppercase tracking-[0.2em] text-white/70 transition hover:border-white/40 hover:text-white"
                >
                  Start
                </Link>
              </div>
            </div>
          </article>
        ))}
        {!isLoading && boxes.length === 0 && !error && (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-white/60">
            No boxes have ready cards right now.
          </div>
        )}
        {isLoadingMore && (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-xs uppercase tracking-[0.2em] text-white/60">
            Loading more...
          </div>
        )}
        <div ref={sentinelRef} />
      </div>
    </section>
  );
}
