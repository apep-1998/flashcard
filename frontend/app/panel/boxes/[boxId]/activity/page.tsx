"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Timeline = "day" | "week" | "month";
type ViewMode = "list" | "graph" | "stats";

type ActivityPoint = {
  label: string;
  added: number;
  finished: number;
  reviewed: number;
};

const TIMELINE_WINDOWS: Record<Timeline, number> = {
  day: 30,
  week: 30,
  month: 24,
};

const TIMELINE_LABELS: Record<Timeline, string> = {
  day: "Last 30 days",
  week: "Last 30 weeks",
  month: "Last 24 months",
};

const formatDate = (date: Date) =>
  date.toLocaleDateString("en-US", { month: "short", day: "numeric" });

const formatWeek = (date: Date) =>
  date.toLocaleDateString("en-US", { month: "short", day: "numeric" });

const formatMonth = (date: Date) =>
  date.toLocaleDateString("en-US", { month: "short", year: "2-digit" });

const mockSeries = (timeline: Timeline, count: number): ActivityPoint[] => {
  const today = new Date();
  return Array.from({ length: count }, (_, index) => {
    const base = (index % 7) + 2;
    const date = new Date(today);

    if (timeline === "day") {
      date.setDate(today.getDate() - (count - 1 - index));
    } else if (timeline === "week") {
      date.setDate(today.getDate() - (count - 1 - index) * 7);
    } else {
      date.setMonth(today.getMonth() - (count - 1 - index));
    }

    const label =
      timeline === "day"
        ? formatDate(date)
        : timeline === "week"
          ? formatWeek(date)
          : formatMonth(date);

    return {
      label,
      added: (base * 2) % 9,
      finished: (base * 3) % 11,
      reviewed: (base * 4) % 15,
    };
  });
};

export default function BoxActivityPage() {
  const params = useParams();
  const boxId = Array.isArray(params.boxId)
    ? params.boxId[0]
    : params.boxId ?? "";

  const [timeline, setTimeline] = useState<Timeline>("day");
  const [viewMode, setViewMode] = useState<ViewMode>("list");

  const series = useMemo(
    () => mockSeries(timeline, TIMELINE_WINDOWS[timeline]),
    [timeline],
  );
  const maxTotal = useMemo(
    () =>
      Math.max(
        ...series.map((point) => point.added + point.finished + point.reviewed),
        1,
      ),
    [series],
  );

  const totals = useMemo(() => {
    return series.reduce(
      (acc, point) => {
        acc.added += point.added;
        acc.finished += point.finished;
        acc.reviewed += point.reviewed;
        return acc;
      },
      { added: 0, finished: 0, reviewed: 0 },
    );
  }, [series]);

  return (
    <div className="flex h-[calc(100vh-14rem)] flex-col space-y-6 overflow-hidden">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Box activity</h2>
            <p className="text-sm text-white/60">Box ID: {boxId}</p>
          </div>
          <span className="rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-white/60">
            {TIMELINE_LABELS[timeline]}
          </span>
        </div>

        <div className="mt-6 flex flex-wrap gap-2 text-xs uppercase tracking-[0.2em] text-white/60">
          {(["day", "week", "month"] as Timeline[]).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setTimeline(option)}
              className={`rounded-full border px-3 py-2 transition ${
                timeline === option
                  ? "border-white/40 text-white"
                  : "border-white/10 text-white/60 hover:text-white"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      <div className="scrollbar-hidden flex-1 overflow-y-auto rounded-3xl border border-white/10 bg-white/5 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 text-xs uppercase tracking-[0.2em] text-white/60">
          <span>Activity</span>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex gap-2">
              {(["list", "graph", "stats"] as ViewMode[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setViewMode(mode)}
                  className={`rounded-full border px-3 py-1 transition ${
                    viewMode === mode
                      ? "border-white/40 text-white"
                      : "border-white/10 text-white/60 hover:text-white"
                  }`}
                >
                  {mode === "stats" ? "Stats for nerds" : mode}
                </button>
              ))}
            </div>
            <div className="flex gap-4">
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#2b59ff]" />
                Added
              </span>
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#f97316]" />
                Finished
              </span>
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#22c55e]" />
                Reviewed
              </span>
            </div>
          </div>
        </div>

        {viewMode === "list" ? (
          <div className="mt-6 grid gap-3">
            {series.map((point, index) => {
              const total = point.added + point.finished + point.reviewed;
              const addedWidth = (point.added / maxTotal) * 100;
              const finishedWidth = (point.finished / maxTotal) * 100;
              const reviewedWidth = (point.reviewed / maxTotal) * 100;

              return (
                <div key={`${point.label}-${index}`} className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-white/60">
                    <span>
                      {timeline} {point.label}
                    </span>
                    <span>
                      {total} total (A {point.added} / F {point.finished} / R{" "}
                      {point.reviewed})
                    </span>
                  </div>
                  <div className="flex h-3 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full bg-[#2b59ff]"
                      style={{ width: `${addedWidth}%` }}
                      title={`Added ${point.added}`}
                    />
                    <div
                      className="h-full bg-[#f97316]"
                      style={{ width: `${finishedWidth}%` }}
                      title={`Finished ${point.finished}`}
                    />
                    <div
                      className="h-full bg-[#22c55e]"
                      style={{ width: `${reviewedWidth}%` }}
                      title={`Reviewed ${point.reviewed}`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : viewMode === "graph" ? (
          <div className="rounded-3xl border border-white/10 bg-[#0b1017] p-6">
            <div className="mb-4 text-xs uppercase tracking-[0.2em] text-white/60">
              Activity chart
            </div>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={series} margin={{ top: 8, right: 12, left: 0, bottom: 8 }}>
                  <CartesianGrid stroke="rgba(255,255,255,0.08)" strokeDasharray="4 6" />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    width={28}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "rgba(15,20,27,0.95)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "12px",
                    }}
                    labelStyle={{ color: "rgba(255,255,255,0.7)" }}
                  />
                  <Legend
                    wrapperStyle={{ color: "rgba(255,255,255,0.7)", fontSize: 12 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="added"
                    stroke="#2b59ff"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="finished"
                    stroke="#f97316"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="reviewed"
                    stroke="#22c55e"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : (
          <div className="rounded-3xl border border-white/10 bg-[#0b1017] p-6">
            <div className="mb-4 text-xs uppercase tracking-[0.2em] text-white/60">
              Stats for nerds
            </div>
            <div className="grid gap-3 text-sm text-white/70 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                New cards: <span className="text-white">{totals.added}</span>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                Reviewed cards:{" "}
                <span className="text-white">{totals.reviewed}</span>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                Finished cards:{" "}
                <span className="text-white">{totals.finished}</span>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                Total activity:{" "}
                <span className="text-white">
                  {totals.added + totals.finished + totals.reviewed}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
