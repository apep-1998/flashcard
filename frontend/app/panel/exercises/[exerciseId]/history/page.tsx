"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import DataTable from "@/components/tables/DataTable";
import ExerciseHistoryDetailModal from "@/components/modals/ExerciseHistoryDetailModal";
import { apiFetch, getApiBaseUrl } from "@/lib/auth";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

type ExerciseItem = {
  id: number;
  title: string;
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

type PaginatedHistory = {
  count: number;
  next: string | null;
  previous: string | null;
  results: ExerciseHistoryItem[];
};

export default function ExerciseHistoryPage() {
  const params = useParams();
  const exerciseId = Array.isArray(params.exerciseId)
    ? params.exerciseId[0]
    : params.exerciseId ?? "";

  const [exercise, setExercise] = useState<ExerciseItem | null>(null);
  const [historyItems, setHistoryItems] = useState<ExerciseHistoryItem[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(15);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [viewTarget, setViewTarget] = useState<ExerciseHistoryItem | null>(null);

  const columns = useMemo(
    () => [
      {
        key: "created_at",
        label: "Date",
        minWidth: 180,
        render: (item: ExerciseHistoryItem) =>
          new Date(item.created_at).toLocaleString(),
      },
      {
        key: "score",
        label: "Score",
        minWidth: 120,
        render: (item: ExerciseHistoryItem) => `${item.review.score}/10`,
      },
      {
        key: "mistakes",
        label: "Mistakes",
        minWidth: 120,
        render: (item: ExerciseHistoryItem) => item.review.mistakes.length,
      },
      {
        key: "actions",
        label: "Actions",
        minWidth: 140,
        render: (item: ExerciseHistoryItem) => (
          <button
            type="button"
            onClick={() => setViewTarget(item)}
            className="rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-white/70 transition hover:text-white"
          >
            Review
          </button>
        ),
      },
    ],
    [],
  );

  const loadExercise = useCallback(async () => {
    if (!exerciseId) return;
    try {
      const response = await apiFetch(
        `${getApiBaseUrl()}/api/exercises/${exerciseId}/`,
      );
      if (!response.ok) {
        throw new Error("Unable to load exercise.");
      }
      const data = (await response.json()) as ExerciseItem;
      setExercise(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load exercise.");
    }
  }, [exerciseId]);

  const loadHistory = useCallback(async () => {
    if (!exerciseId) return;
    setIsLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({
        page: String(page + 1),
        page_size: String(rowsPerPage),
      });
      const response = await apiFetch(
        `${getApiBaseUrl()}/api/exercises/${exerciseId}/history/?${params.toString()}`,
      );
      if (!response.ok) {
        throw new Error("Unable to load exercise history.");
      }
      const data = (await response.json()) as
        | PaginatedHistory
        | ExerciseHistoryItem[];
      if (Array.isArray(data)) {
        setHistoryItems(data);
        setTotalCount(data.length);
      } else {
        setHistoryItems(data.results);
        setTotalCount(data.count);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load exercise history.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [exerciseId, page, rowsPerPage]);

  useEffect(() => {
    loadExercise();
  }, [loadExercise]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  useEffect(() => {
    setPage(0);
  }, [rowsPerPage]);

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
      <Breadcrumbs sx={{ color: "text.secondary" }}>
        <Link href="/panel/study">Study</Link>
        <Link href="/panel/exercises">Exercises</Link>
        <Typography color="text.primary">History</Typography>
      </Breadcrumbs>

      <Box>
        <Typography variant="h5" fontWeight={700}>
          Exercise history
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {exercise ? exercise.title : "Exercise"} •{" "}
          {(totalCount ?? historyItems.length).toLocaleString()} entries
        </Typography>
      </Box>

      <Box sx={{ flexGrow: 1, minHeight: 0, overflow: "hidden" }}>
        <DataTable
          title="History"
          columns={columns}
          rows={historyItems}
          getRowKey={(row) => row.id}
          loading={isLoading}
          emptyMessage="No history yet."
          page={page}
          rowsPerPage={rowsPerPage}
          count={totalCount ?? 0}
          rowsPerPageOptions={[15, 20, 50]}
          onPageChange={(_, nextPage) => setPage(nextPage)}
          onRowsPerPageChange={(event) => {
            setRowsPerPage(Number(event.target.value));
            setPage(0);
          }}
        />
        {error && (
          <Box
            sx={{
              mt: 2,
              p: 2,
              borderRadius: 2,
              border: "1px solid rgba(248, 113, 113, 0.4)",
              bgcolor: "rgba(239, 68, 68, 0.12)",
            }}
          >
            <Typography variant="body2" color="error">
              {error}
            </Typography>
          </Box>
        )}
      </Box>

      <ExerciseHistoryDetailModal
        isOpen={Boolean(viewTarget)}
        item={viewTarget}
        onClose={() => setViewTarget(null)}
      />
    </Box>
  );
}
