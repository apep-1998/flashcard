"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { apiFetch, getApiBaseUrl } from "@/lib/auth";
import ActionButton from "@/components/buttons/ActionButton";
import DataTable from "@/components/tables/DataTable";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

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
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(15);

  const loadBoxes = useCallback(
    async (pageValue = page, pageSize = rowsPerPage) => {
      try {
        setIsLoading(true);
        const params = new URLSearchParams({
          ready_only: "1",
          page: String(pageValue + 1),
          page_size: String(pageSize),
        });
        const response = await apiFetch(
          `${getApiBaseUrl()}/api/boxes/?${params.toString()}`,
        );
        if (!response.ok) {
          throw new Error("Unable to load study boxes.");
        }
        const data = (await response.json()) as PaginatedBoxes;
        setBoxes(data.results);
        setTotalCount(data.count);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Unable to load study boxes.",
        );
      } finally {
        setIsLoading(false);
      }
    },
    [page, rowsPerPage],
  );

  useEffect(() => {
    setError("");
    loadBoxes();
  }, [loadBoxes]);

  const columns = useMemo(
    () => [
      {
        key: "name",
        label: "Box",
        minWidth: 220,
        render: (box: BoxItem) => (
          <Box>
            <Typography variant="subtitle2" fontWeight={600}>
              {box.name}
            </Typography>
            {box.description && (
              <Typography variant="caption" color="text.secondary">
                {box.description}
              </Typography>
            )}
          </Box>
        ),
      },
      {
        key: "ready_cards",
        label: "Ready cards",
        minWidth: 120,
        render: (box: BoxItem) => box.ready_cards,
      },
      {
        key: "action",
        label: "Start",
        minWidth: 140,
        render: (box: BoxItem) => (
          <ActionButton
            action="submit"
            component={Link}
            href={`/panel/study/${box.id}/options`}
            sx={{ minWidth: 120 }}
          >
            Start
          </ActionButton>
        ),
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
        <Typography variant="h5" fontWeight={700}>
          Study
        </Typography>
      </Box>

      {error && (
        <Box
          sx={{
            borderRadius: 3,
            border: "1px solid rgba(248, 113, 113, 0.4)",
            bgcolor: "rgba(239, 68, 68, 0.12)",
            p: 3,
          }}
        >
          <Typography variant="body2" color="error">
            {error}
          </Typography>
        </Box>
      )}

      <Box sx={{ flexGrow: 1, minHeight: 0 }}>
        <DataTable
          title="Ready boxes"
          columns={columns}
          rows={boxes}
          getRowKey={(row) => row.id}
          loading={isLoading}
          emptyMessage="No boxes have ready cards right now."
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
      </Box>
    </Box>
  );
}
