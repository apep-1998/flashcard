"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import ActionButton from "@/components/buttons/ActionButton";
import CardCreateFactory from "@/components/cards/create/CardCreateFactory";
import CardViewFactory from "@/components/cards/view/CardViewFactory";
import TextInput from "@/components/forms/TextInput";
import CardCreateModal from "@/components/modals/CardCreateModal";
import DataTable from "@/components/tables/DataTable";
import { apiFetch, getApiBaseUrl } from "@/lib/auth";
import { type CardConfig, type CardType } from "@/lib/schemas/cards";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import Box from "@mui/material/Box";
import FormControl from "@mui/material/FormControl";
import IconButton from "@mui/material/IconButton";
import InputLabel from "@mui/material/InputLabel";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Typography from "@mui/material/Typography";

type BoxItem = {
  id: number;
  name: string;
};

type CardItem = {
  id: number;
  box: number;
  finished: boolean;
  level: number;
  group_id: string;
  is_important?: boolean;
  config: CardConfig;
  created_at?: string;
};

type PaginatedBoxes = {
  count: number;
  next: string | null;
  previous: string | null;
  results: BoxItem[];
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

const LEVEL_OPTIONS = ["all", "0", "1", "2", "3", "4", "5", "6", "7"];

const getCardSummary = (config: CardConfig) => {
  const truncate = (value: string) =>
    value.length > 80 ? `${value.slice(0, 80)}…` : value;
  switch (config.type) {
    case "standard":
      return truncate(`${config.front} → ${config.back}`);
    case "spelling":
      return truncate(config.front || config.spelling);
    case "word-standard":
      return truncate(`${config.word} (${config.part_of_speech})`);
    case "german-verb-conjugator":
      return truncate(config.verb);
    case "multiple-choice":
      return truncate(config.question);
    case "ai-reviewer":
      return truncate(config.question);
    default:
      return "Card";
  }
};

export default function CardsPage() {
  const [boxes, setBoxes] = useState<BoxItem[]>([]);
  const [cards, setCards] = useState<CardItem[]>([]);
  const [boxFilter, setBoxFilter] = useState<"all" | number>("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [levelFilter, setLevelFilter] = useState("all");
  const [groupSearch, setGroupSearch] = useState("");
  const [error, setError] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [menuTarget, setMenuTarget] = useState<CardItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CardItem | null>(null);
  const [editTarget, setEditTarget] = useState<CardItem | null>(null);
  const [editConfig, setEditConfig] = useState<CardConfig | null>(null);
  const [editError, setEditError] = useState("");
  const [viewTarget, setViewTarget] = useState<CardItem | null>(null);

  const cardCount = totalCount ?? cards.length;

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

  const boxMap = useMemo(
    () => new Map(boxes.map((box) => [box.id, box.name])),
    [boxes],
  );

  const handleMenuOpen = useCallback(
    (event: React.MouseEvent<HTMLElement>, card: CardItem) => {
      setMenuAnchor(event.currentTarget);
      setMenuTarget(card);
    },
    [],
  );

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setMenuTarget(null);
  };

  const openEditModal = (card: CardItem) => {
    setEditTarget(card);
    setEditConfig(card.config);
    setEditError("");
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

  const columns = useMemo(
    () => [
      { key: "id", label: "ID", minWidth: 80 },
      {
        key: "box",
        label: "Box",
        minWidth: 140,
        render: (row: CardItem) => boxMap.get(row.box) ?? `Box ${row.box}`,
      },
      {
        key: "type",
        label: "Type",
        minWidth: 150,
        render: (row: CardItem) => row.config.type,
      },
      { key: "level", label: "Level", minWidth: 80 },
      {
        key: "group_id",
        label: "Group ID",
        minWidth: 140,
        render: (row: CardItem) => row.group_id || "—",
      },
      {
        key: "summary",
        label: "Summary",
        minWidth: 260,
        render: (row: CardItem) => getCardSummary(row.config),
      },
      {
        key: "actions",
        label: "Actions",
        minWidth: 120,
        render: (row: CardItem) => (
          <IconButton
            onClick={(event) => handleMenuOpen(event, row)}
            aria-label="Card actions"
            sx={{
              bgcolor: "transparent",
              color: "text.primary",
              "&:hover": { bgcolor: "rgba(50, 56, 62, 0.6)" },
            }}
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
              <circle cx="5" cy="12" r="2" fill="currentColor" />
              <circle cx="12" cy="12" r="2" fill="currentColor" />
              <circle cx="19" cy="12" r="2" fill="currentColor" />
            </svg>
          </IconButton>
        ),
      },
    ],
    [boxMap, handleMenuOpen],
  );

  const buildCardsUrl = useCallback(() => {
    const params = new URLSearchParams();
    if (boxFilter !== "all") params.set("box", String(boxFilter));
    if (typeFilter !== "all") params.set("type", typeFilter);
    if (levelFilter !== "all") params.set("level", levelFilter);
    if (groupSearch.trim()) params.set("group_id", groupSearch.trim());
    params.set("page", String(page + 1));
    params.set("page_size", String(rowsPerPage));
    const query = params.toString();
    return query
      ? `${getApiBaseUrl()}/api/cards/?${query}`
      : `${getApiBaseUrl()}/api/cards/`;
  }, [boxFilter, groupSearch, levelFilter, page, rowsPerPage, typeFilter]);

  const loadCards = useCallback(async (url: string) => {
    try {
      setIsLoading(true);
      const response = await apiFetch(url);
      if (!response.ok) {
        throw new Error("Unable to load cards.");
      }
      const data = (await response.json()) as PaginatedCards | CardItem[];
      if (Array.isArray(data)) {
        setCards(data);
        setTotalCount(data.length);
        return;
      }
      setCards(data.results);
      setTotalCount(data.count);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load cards.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reloadCards = useCallback(() => {
    const url = buildCardsUrl();
    setError("");
    setCards([]);
    setTotalCount(null);
    loadCards(url);
  }, [buildCardsUrl, loadCards]);

  const loadBoxes = useCallback(async () => {
    try {
      const response = await apiFetch(`${getApiBaseUrl()}/api/boxes/`);
      if (!response.ok) {
        throw new Error("Unable to load boxes.");
      }
      const data = (await response.json()) as PaginatedBoxes | BoxItem[];
      const results = Array.isArray(data) ? data : data.results;
      setBoxes(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load boxes.");
    }
  }, []);

  useEffect(() => {
    loadBoxes();
  }, [loadBoxes]);

  useEffect(() => {
    reloadCards();
  }, [reloadCards]);

  useEffect(() => {
    setPage(0);
  }, [boxFilter, typeFilter, levelFilter, groupSearch]);

  return (
    <>
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
          <Typography color="text.primary">Cards</Typography>
        </Breadcrumbs>

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
              Cards
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {cardCount} cards
            </Typography>
          </Box>
          <ActionButton action="create" onClick={() => setIsCreateOpen(true)}>
            Create cards
          </ActionButton>
        </Box>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "repeat(4, minmax(0, 1fr))" },
            gap: 2,
          }}
        >
          <FormControl fullWidth>
            <InputLabel sx={{ color: "text.secondary" }}>Box</InputLabel>
            <Select
              value={boxFilter}
              label="Box"
              onChange={(event) => {
                const value = event.target.value as string;
                setBoxFilter(value === "all" ? "all" : Number(value));
              }}
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

          <FormControl fullWidth>
            <InputLabel sx={{ color: "text.secondary" }}>Card type</InputLabel>
            <Select
              value={typeFilter}
              label="Card type"
              onChange={(event) => setTypeFilter(event.target.value)}
              sx={selectSx}
            >
              {CARD_TYPE_OPTIONS.map((type) => (
                <MenuItem key={type} value={type}>
                  {type}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel sx={{ color: "text.secondary" }}>Level</InputLabel>
            <Select
              value={levelFilter}
              label="Level"
              onChange={(event) => setLevelFilter(event.target.value)}
              sx={selectSx}
            >
              {LEVEL_OPTIONS.map((level) => (
                <MenuItem key={level} value={level}>
                  {level}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextInput
            value={groupSearch}
            onChange={(event) => setGroupSearch(event.target.value)}
            placeholder="Search group id"
            sx={{ borderRadius: 0.5 }}
          />
        </Box>

        <Box sx={{ flexGrow: 1, minHeight: 0, overflow: "hidden" }}>
          <DataTable
            title="Cards"
            columns={columns}
            rows={cards}
            getRowKey={(row) => row.id}
            loading={isLoading}
            emptyMessage="No cards match your filters."
            page={page}
            rowsPerPage={rowsPerPage}
            count={totalCount ?? 0}
            onPageChange={(_, nextPage) => setPage(nextPage)}
            onRowsPerPageChange={(event) => {
              setRowsPerPage(Number(event.target.value));
              setPage(0);
            }}
            rowsPerPageOptions={[15, 20, 50]}
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
      </Box>

      <CardCreateModal
        isOpen={isCreateOpen}
        boxes={boxes}
        onClose={() => setIsCreateOpen(false)}
        onCreated={reloadCards}
      />

      {deleteTarget && (
        <div className="fixed inset-0 z-40 flex items-center justify-center px-6 py-12">
          <button
            type="button"
            aria-label="Close delete dialog"
            onClick={() => setDeleteTarget(null)}
            className="fixed inset-0 bg-black/60"
          />
          <div className="relative z-10 w-full max-w-md rounded-3xl border border-white/10 bg-[var(--color-dark-bg)] p-6 shadow-2xl shadow-black/40">
            <h2 className="text-lg font-semibold text-white">Delete card</h2>
            <p className="mt-2 text-sm text-white/70">
              Delete card #{deleteTarget.id}? This cannot be undone.
            </p>
            <div className="mt-6 flex flex-wrap justify-between gap-3">
              <ActionButton action="cancel" onClick={() => setDeleteTarget(null)}>
                Cancel
              </ActionButton>
              <ActionButton
                action="delete"
                onClick={() => handleDelete(deleteTarget)}
              >
                Delete
              </ActionButton>
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
          <div className="relative z-10 w-full max-w-3xl rounded-3xl border border-white/10 bg-[var(--color-dark-bg)] p-6 shadow-2xl shadow-black/40">
            <h2 className="text-lg font-semibold text-white">Edit card</h2>
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
            <div className="mt-6 flex flex-wrap justify-between gap-3">
              <ActionButton action="cancel" onClick={() => setEditTarget(null)}>
                Cancel
              </ActionButton>
              <ActionButton action="submit" onClick={handleEditSave}>
                Save changes
              </ActionButton>
            </div>
          </div>
        </div>
      )}

      {viewTarget && (
        <div className="fixed inset-0 z-40 flex items-center justify-center px-6 py-12">
          <button
            type="button"
            aria-label="Close view dialog"
            onClick={() => setViewTarget(null)}
            className="fixed inset-0 bg-black/60"
          />
          <div className="relative z-10 w-full max-w-3xl rounded-3xl border border-white/10 bg-[var(--color-dark-bg)] p-6 shadow-2xl shadow-black/40">
            <h2 className="text-lg font-semibold text-white">Card details</h2>
            <p className="mt-2 text-sm text-white/70">
              {viewTarget.config.type} • Group{" "}
              {viewTarget.group_id || "—"} • Level {viewTarget.level}
            </p>
            <div className="mt-6 opacity-70">
              <fieldset disabled className="space-y-6">
                <CardCreateFactory
                  type={viewTarget.config.type as CardType}
                  value={viewTarget.config}
                  onChange={() => {}}
                />
              </fieldset>
            </div>
            <div className="mt-6 flex justify-end">
              <ActionButton action="cancel" onClick={() => setViewTarget(null)}>
                Close
              </ActionButton>
            </div>
          </div>
        </div>
      )}

      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        PaperProps={{
          sx: {
            bgcolor: "var(--panel-surface)",
            border: "1px solid var(--panel-border)",
            boxShadow: "0 20px 40px rgba(0,0,0,0.35)",
          },
        }}
      >
        <MenuItem
          onClick={() => {
            if (!menuTarget) return;
            setViewTarget(menuTarget);
            handleMenuClose();
          }}
        >
          View card
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (!menuTarget) return;
            openEditModal(menuTarget);
            handleMenuClose();
          }}
        >
          Edit card
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (!menuTarget) return;
            setDeleteTarget(menuTarget);
            handleMenuClose();
          }}
          sx={{ color: "error.main" }}
        >
          Delete card
        </MenuItem>
      </Menu>
    </>
  );
}
