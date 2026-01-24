"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { apiFetch, getApiBaseUrl } from "@/lib/auth";

type Timeline = "day" | "week" | "month";

type BoxItem = {
  id: number;
  name: string;
};

type ActivityResponse = {
  labels: string[];
  activated: number[];
  checked: number[];
  levels: Array<Record<string, number | string>>;
};

const TIMELINE_LABELS: Record<Timeline, string> = {
  day: "Last 30 days",
  week: "Last 24 weeks",
  month: "Last 12 months",
};

export default function ActivityPage() {
  const [timeline, setTimeline] = useState<Timeline>("day");
  const [boxes, setBoxes] = useState<BoxItem[]>([]);
  const [boxFilter, setBoxFilter] = useState("all");
  const [activity, setActivity] = useState<ActivityResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadBoxes = async () => {
      try {
        const response = await apiFetch(`${getApiBaseUrl()}/api/boxes/`);
        if (!response.ok) {
          throw new Error("Unable to load boxes.");
        }
        const data = (await response.json()) as BoxItem[] | { results: BoxItem[] };
        const list = Array.isArray(data) ? data : data.results;
        setBoxes(list);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load boxes.");
      }
    };
    loadBoxes();
  }, []);

  useEffect(() => {
    const loadActivity = async () => {
      setIsLoading(true);
      setError("");
      try {
        const params = new URLSearchParams({ interval: timeline });
        if (boxFilter !== "all") {
          params.set("box", boxFilter);
        }
        const response = await apiFetch(
          `${getApiBaseUrl()}/api/activity/?${params.toString()}`,
        );
        if (!response.ok) {
          throw new Error("Unable to load activity.");
        }
        const data = (await response.json()) as ActivityResponse;
        setActivity(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load activity.");
      } finally {
        setIsLoading(false);
      }
    };
    loadActivity();
  }, [timeline, boxFilter]);

  const activatedSeries = useMemo(() => {
    if (!activity) return [];
    return activity.labels.map((label, index) => ({
      label,
      value: activity.activated[index] ?? 0,
    }));
  }, [activity]);

  const checkedSeries = useMemo(() => {
    if (!activity) return [];
    return activity.labels.map((label, index) => ({
      label,
      value: activity.checked[index] ?? 0,
    }));
  }, [activity]);

  const levelSeries = activity?.levels ?? [];
  const levelKeys = useMemo(() => {
    if (!levelSeries.length) return [];
    return Object.keys(levelSeries[0]).filter((key) => key.startsWith("level_"));
  }, [levelSeries]);

  return (
    <div className="space-y-6 pb-24">
      <header className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold">Activity</h1>
            <p className="text-sm text-white/60">
              Track activations and reviews across your boxes.
            </p>
          </div>
          <span className="rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-white/60">
            {TIMELINE_LABELS[timeline]}
          </span>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-4">
          <div className="flex flex-wrap gap-2 text-xs uppercase tracking-[0.2em] text-white/60">
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
          <label className="flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-white/60">
            Box
            <select
              value={boxFilter}
              onChange={(event) => setBoxFilter(event.target.value)}
              className="rounded-full border border-white/10 bg-[#0f141b] px-3 py-2 text-xs text-white outline-none transition focus:border-white/40"
            >
              <option value="all">All boxes</option>
              {boxes.map((box) => (
                <option key={box.id} value={box.id}>
                  {box.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      </header>

      {error && (
        <div className="rounded-3xl border border-red-400/40 bg-red-500/10 p-6 text-sm text-red-100">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-white/60">
          Loading activity...
        </div>
      ) : (
        <div className="grid gap-6">
          <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="text-xs uppercase tracking-[0.2em] text-white/60">
              Activated cards
            </div>
            <div className="mt-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={activatedSeries}>
                  <CartesianGrid
                    stroke="rgba(255,255,255,0.08)"
                    strokeDasharray="4 6"
                  />
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
                      background: "#0f141b",
                      borderRadius: 12,
                      border: "1px solid rgba(255,255,255,0.1)",
                      color: "white",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#38bdf8"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="text-xs uppercase tracking-[0.2em] text-white/60">
              Checked cards
            </div>
            <div className="mt-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={checkedSeries}>
                  <CartesianGrid
                    stroke="rgba(255,255,255,0.08)"
                    strokeDasharray="4 6"
                  />
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
                      background: "#0f141b",
                      borderRadius: 12,
                      border: "1px solid rgba(255,255,255,0.1)",
                      color: "white",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#22c55e"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="text-xs uppercase tracking-[0.2em] text-white/60">
              Checked levels
            </div>
            <div className="mt-4 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={levelSeries}>
                  <CartesianGrid
                    stroke="rgba(255,255,255,0.08)"
                    strokeDasharray="4 6"
                  />
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
                      background: "#0f141b",
                      borderRadius: 12,
                      border: "1px solid rgba(255,255,255,0.1)",
                      color: "white",
                    }}
                  />
                  <Legend wrapperStyle={{ color: "rgba(255,255,255,0.6)" }} />
                  {levelKeys.map((key, index) => (
                    <Bar
                      key={key}
                      dataKey={key}
                      stackId="levels"
                      fill={
                        [
                          "#38bdf8",
                          "#60a5fa",
                          "#818cf8",
                          "#a78bfa",
                          "#f472b6",
                          "#f59e0b",
                          "#f97316",
                          "#ef4444",
                          "#22c55e",
                        ][index % 9]
                      }
                      radius={index === levelKeys.length - 1 ? [6, 6, 0, 0] : 0}
                      name={key.replace("level_", "Level ")}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
