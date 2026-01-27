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
import DataTable from "@/components/tables/DataTable";
import Box from "@mui/material/Box";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Typography from "@mui/material/Typography";

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

type ChallengingCard = {
  card_id: number;
  box_id: number;
  incorrect_count: number;
  config: {
    type: string;
    [key: string]: unknown;
  };
  display: string;
};

type ChallengingRow = ChallengingCard & { rank: number };

type ChallengingResponse = {
  results: ChallengingCard[];
};

const TIMELINE_LABELS: Record<Timeline, string> = {
  day: "Last 30 days",
  week: "Last 24 weeks",
  month: "Last 12 months",
};

const toggleGroupSx = {
  bgcolor: "#0B0D0E",
  borderRadius: 0.5,
  "& .MuiToggleButton-root": {
    color: "#EEEEEE",
    borderColor: "var(--panel-border)",
    textTransform: "none",
    fontSize: 13,
    fontWeight: 700,
    letterSpacing: "0.02em",
    fontFamily: "var(--font-app-sans), \"Segoe UI\", sans-serif",
    px: 2,
  },
  "& .Mui-selected": {
    bgcolor: "var(--color-dark-selected)",
    color: "#EEEEEE",
  },
} as const;

export default function ActivityPage() {
  const [timeline, setTimeline] = useState<Timeline>("day");
  const [boxes, setBoxes] = useState<BoxItem[]>([]);
  const [boxFilter, setBoxFilter] = useState("all");
  const [tab, setTab] = useState<"charts" | "challenging">("charts");
  const [activity, setActivity] = useState<ActivityResponse | null>(null);
  const [challenging, setChallenging] = useState<ChallengingCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isChallengingLoading, setIsChallengingLoading] = useState(false);
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
    if (tab === "charts") {
      loadActivity();
    }
  }, [timeline, boxFilter, tab]);

  useEffect(() => {
    const loadChallenging = async () => {
      setIsChallengingLoading(true);
      setError("");
      try {
        const params = new URLSearchParams();
        if (boxFilter !== "all") {
          params.set("box", boxFilter);
        }
        const response = await apiFetch(
          `${getApiBaseUrl()}/api/activity/challenging/?${params.toString()}`,
        );
        if (!response.ok) {
          throw new Error("Unable to load challenging cards.");
        }
        const data = (await response.json()) as ChallengingResponse;
        setChallenging(data.results ?? []);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Unable to load challenging cards.",
        );
      } finally {
        setIsChallengingLoading(false);
      }
    };
    if (tab === "challenging") {
      loadChallenging();
    }
  }, [boxFilter, tab]);

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

  const selectSx = {
    bgcolor: "#0B0D0E",
    borderRadius: 0.5,
    color: "#EEEEEE",
    "& .MuiOutlinedInput-notchedOutline": {
      borderColor: "var(--panel-border)",
    },
    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
      borderColor: "var(--panel-border)",
    },
    "& .MuiSvgIcon-root": { color: "#EEEEEE" },
  } as const;

  const challengingRows: ChallengingRow[] = useMemo(
    () =>
      challenging.map((card, index) => ({
        ...card,
        rank: index + 1,
      })),
    [challenging],
  );

  const challengingColumns = useMemo(
    () => [
      { key: "rank", label: "#", minWidth: 60 },
      {
        key: "type",
        label: "Type",
        minWidth: 140,
        render: (row: ChallengingRow) => row.config?.type ?? "unknown",
      },
      {
        key: "display",
        label: "Card",
        minWidth: 260,
        render: (row: ChallengingRow) =>
          row.display ? row.display : `Card ID: ${row.card_id}`,
      },
      {
        key: "incorrect_count",
        label: "Incorrect",
        minWidth: 120,
        render: (row: ChallengingRow) => row.incorrect_count,
      },
    ],
    [],
  );

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 3,
        height: "100%",
        minHeight: 0,
        bgcolor: "var(--color-dark-bg)",
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          borderRadius: 3,
          border: "1px solid var(--panel-border)",
          bgcolor: "var(--panel-surface)",
          p: 3,
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 2,
          }}
        >
          <Box>
            <Typography variant="h5" fontWeight={700}>
              Activity
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Track activations and reviews across your boxes.
            </Typography>
          </Box>
          <Typography variant="caption" color="text.secondary">
            {TIMELINE_LABELS[timeline]}
          </Typography>
        </Box>

        <Box
          sx={{
            mt: 3,
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: 2,
          }}
        >
          <ToggleButtonGroup
            value={tab}
            exclusive
            onChange={(_, value) => value && setTab(value)}
            sx={toggleGroupSx}
          >
            <ToggleButton value="charts">Charts</ToggleButton>
            <ToggleButton value="challenging">Challenging</ToggleButton>
          </ToggleButtonGroup>

          <ToggleButtonGroup
            value={timeline}
            exclusive
            onChange={(_, value) => value && setTimeline(value)}
            sx={toggleGroupSx}
          >
            <ToggleButton value="day">Day</ToggleButton>
            <ToggleButton value="week">Week</ToggleButton>
            <ToggleButton value="month">Month</ToggleButton>
          </ToggleButtonGroup>

          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel sx={{ color: "text.secondary" }}>Box</InputLabel>
            <Select
              value={boxFilter}
              label="Box"
              onChange={(event) => setBoxFilter(String(event.target.value))}
              sx={selectSx}
            >
              <MenuItem value="all">All boxes</MenuItem>
              {boxes.map((box) => (
                <MenuItem key={box.id} value={box.id}>
                  {box.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Box>

      <Box sx={{ flexGrow: 1, minHeight: 0, overflowY: "auto", pr: 1 }}>
        {error && (
          <Box
            sx={{
              borderRadius: 3,
              border: "1px solid rgba(248, 113, 113, 0.4)",
              bgcolor: "rgba(239, 68, 68, 0.12)",
              p: 3,
              mb: 3,
            }}
          >
            <Typography variant="body2" color="error">
              {error}
            </Typography>
          </Box>
        )}

        {tab === "charts" ? (
          isLoading ? (
            <Box
              sx={{
                borderRadius: 3,
                border: "1px solid var(--panel-border)",
                bgcolor: "var(--panel-surface)",
                p: 3,
              }}
            >
              <Typography variant="body2" color="text.secondary">
                Loading activity...
              </Typography>
            </Box>
          ) : (
            <Box sx={{ display: "grid", gap: 3 }}>
              <Box
                sx={{
                  borderRadius: 3,
                  border: "1px solid var(--panel-border)",
                  bgcolor: "var(--panel-surface)",
                  p: 3,
                }}
              >
                <Typography variant="overline" color="text.secondary">
                  Activated cards
                </Typography>
                <Box sx={{ mt: 2, height: 280 }}>
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
                        width={32}
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
                </Box>
              </Box>

              <Box
                sx={{
                  borderRadius: 3,
                  border: "1px solid var(--panel-border)",
                  bgcolor: "var(--panel-surface)",
                  p: 3,
                }}
              >
                <Typography variant="overline" color="text.secondary">
                  Checked cards
                </Typography>
                <Box sx={{ mt: 2, height: 280 }}>
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
                        width={32}
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
                </Box>
              </Box>

              <Box
                sx={{
                  borderRadius: 3,
                  border: "1px solid var(--panel-border)",
                  bgcolor: "var(--panel-surface)",
                  p: 3,
                }}
              >
                <Typography variant="overline" color="text.secondary">
                  Checked levels
                </Typography>
                <Box sx={{ mt: 2, height: 320 }}>
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
                        width={32}
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
                          radius={
                            index === levelKeys.length - 1 ? [6, 6, 0, 0] : 0
                          }
                          name={key.replace("level_", "Level ")}
                        />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </Box>
            </Box>
          )
        ) : (
          <Box sx={{ minHeight: 0 }}>
            <DataTable
              title="Most challenging cards"
              columns={challengingColumns}
              rows={challengingRows}
              getRowKey={(row) => `${row.card_id}-${row.rank}`}
              loading={isChallengingLoading}
              emptyMessage="No challenging cards yet."
            />
          </Box>
        )}
      </Box>
    </Box>
  );
}
