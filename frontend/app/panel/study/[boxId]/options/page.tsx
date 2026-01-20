"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiFetch, getApiBaseUrl } from "@/lib/auth";
import type { CardType } from "@/lib/schemas/cards";

type ReadySummary = {
  count: number;
  levels: number[];
  types: CardType[];
};

type BoxDetail = {
  id: number;
  name: string;
  description?: string;
};

export default function StudyOptionsPage() {
  const params = useParams();
  const router = useRouter();
  const boxId = Array.isArray(params.boxId)
    ? params.boxId[0]
    : params.boxId ?? "";
  const boxIdNumber = Number(boxId);

  const [box, setBox] = useState<BoxDetail | null>(null);
  const [summary, setSummary] = useState<ReadySummary | null>(null);
  const [availableCount, setAvailableCount] = useState(0);
  const [selectedLevels, setSelectedLevels] = useState<number[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<CardType[]>([]);
  const [shuffle, setShuffle] = useState(true);
  const [cardCount, setCardCount] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!boxIdNumber) return;
    const loadData = async () => {
      try {
        const [boxResponse, summaryResponse] = await Promise.all([
          apiFetch(`${getApiBaseUrl()}/api/boxes/${boxIdNumber}/`),
          apiFetch(
            `${getApiBaseUrl()}/api/cards/ready-summary/?box=${boxIdNumber}`,
          ),
        ]);
        if (!boxResponse.ok || !summaryResponse.ok) {
          throw new Error("Unable to load study options.");
        }
        const boxData = (await boxResponse.json()) as BoxDetail;
        const summaryData = (await summaryResponse.json()) as ReadySummary;
        setBox(boxData);
        setSummary(summaryData);
        setSelectedLevels(summaryData.levels);
        setSelectedTypes(summaryData.types);
        setAvailableCount(summaryData.count);
        setCardCount(Math.min(summaryData.count, 50));
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Unable to load study options.",
        );
      }
    };
    loadData();
  }, [boxIdNumber]);

  useEffect(() => {
    if (!summary) return;
    const loadFilteredCount = async () => {
      try {
        const params = new URLSearchParams({ box: String(boxIdNumber) });
        if (selectedLevels.length) {
          params.set("level", selectedLevels.join(","));
        }
        if (selectedTypes.length) {
          params.set("type", selectedTypes.join(","));
        }
        const response = await apiFetch(
          `${getApiBaseUrl()}/api/cards/ready-summary/?${params.toString()}`,
        );
        if (!response.ok) {
          throw new Error("Unable to refresh available cards.");
        }
        const data = (await response.json()) as ReadySummary;
        setAvailableCount(data.count);
        setCardCount((current) =>
          Math.min(Math.max(current || 1, 1), Math.min(data.count, 50) || 1),
        );
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to refresh available cards.",
        );
      }
    };
    loadFilteredCount();
  }, [boxIdNumber, selectedLevels, selectedTypes, summary]);

  const maxCount = Math.min(availableCount, 50);

  const toggleLevel = (level: number) => {
    setSelectedLevels((current) => {
      if (current.includes(level)) {
        return current.filter((value) => value !== level);
      }
      return [...current, level].sort((a, b) => a - b);
    });
  };

  const toggleType = (type: CardType) => {
    setSelectedTypes((current) => {
      if (current.includes(type)) {
        return current.filter((value) => value !== type);
      }
      return [...current, type];
    });
  };

  const canStart =
    availableCount > 0 &&
    selectedLevels.length > 0 &&
    selectedTypes.length > 0 &&
    cardCount > 0;

  const levelsLabel = useMemo(() => {
    if (!summary) return "All levels";
    return selectedLevels.length === summary.levels.length
      ? "All levels"
      : selectedLevels.join(", ");
  }, [selectedLevels, summary]);

  const typesLabel = useMemo(() => {
    if (!summary) return "All types";
    return selectedTypes.length === summary.types.length
      ? "All types"
      : selectedTypes.join(", ");
  }, [selectedTypes, summary]);

  const handleStart = () => {
    if (!canStart) return;
    const params = new URLSearchParams();
    params.set("levels", selectedLevels.join(","));
    params.set("types", selectedTypes.join(","));
    params.set("count", String(Math.min(cardCount, 50)));
    params.set("shuffle", shuffle ? "1" : "0");
    router.push(`/panel/study/${boxIdNumber}/session?${params.toString()}`);
  };

  return (
    <section className="flex h-[calc(100vh-14rem)] flex-col space-y-6 overflow-hidden">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <h1 className="text-xl font-semibold">
          Study options{box ? ` — ${box.name}` : ""}
        </h1>
        <p className="mt-2 text-sm text-white/60">
          Choose which ready cards you want to review before starting.
        </p>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto scrollbar-hidden">
        {error && (
          <div className="rounded-3xl border border-red-400/40 bg-red-500/10 p-6 text-sm text-red-100">
            {error}
          </div>
        )}
        {!summary && !error && (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-white/60">
            Loading options...
          </div>
        )}
        {summary && (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 space-y-6">
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-white/60">
                Cards available
              </div>
              <div className="mt-2 text-3xl font-semibold">
                {availableCount}
              </div>
            </div>

            <div className="space-y-3">
              <div className="text-xs uppercase tracking-[0.2em] text-white/60">
                Levels ({levelsLabel})
              </div>
              <div className="flex flex-wrap gap-2">
                {summary.levels.map((level) => {
                  const isActive = selectedLevels.includes(level);
                  return (
                    <button
                      key={level}
                      type="button"
                      onClick={() => toggleLevel(level)}
                      className={`rounded-full border px-3 py-1 text-xs uppercase tracking-[0.2em] transition ${
                        isActive
                          ? "border-white/40 bg-white/10 text-white"
                          : "border-white/10 text-white/60 hover:text-white"
                      }`}
                    >
                      Level {level}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-3">
              <div className="text-xs uppercase tracking-[0.2em] text-white/60">
                Card types ({typesLabel})
              </div>
              <div className="flex flex-wrap gap-2">
                {summary.types.map((type) => {
                  const isActive = selectedTypes.includes(type);
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => toggleType(type)}
                      className={`rounded-full border px-3 py-1 text-xs uppercase tracking-[0.2em] transition ${
                        isActive
                          ? "border-white/40 bg-white/10 text-white"
                          : "border-white/10 text-white/60 hover:text-white"
                      }`}
                    >
                      {type}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block text-sm text-white/70">
                Number of cards
                <input
                  type="number"
                  min={1}
                  max={maxCount || 1}
                  value={cardCount}
                  onChange={(event) =>
                    setCardCount(
                      Math.min(
                        Math.max(Number(event.target.value), 1),
                        maxCount || 1,
                      ),
                    )
                  }
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-[#0f141b] px-4 py-3 text-white outline-none transition focus:border-white/40"
                />
              </label>
              <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <div>
                  <div className="text-xs uppercase tracking-[0.2em] text-white/60">
                    Shuffle cards
                  </div>
                  <div className="text-sm text-white/70">
                    {shuffle ? "On" : "Off"}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShuffle((current) => !current)}
                  className={`h-10 w-16 rounded-full border transition ${
                    shuffle
                      ? "border-white/40 bg-white/20"
                      : "border-white/10 bg-white/5"
                  }`}
                >
                  <span
                    className={`block h-8 w-8 rounded-full bg-white transition ${
                      shuffle ? "translate-x-7" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={handleStart}
              disabled={!canStart}
              className="w-full rounded-2xl bg-[#2b59ff] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#1f46d8] disabled:cursor-not-allowed disabled:opacity-60"
            >
              Start study session
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
