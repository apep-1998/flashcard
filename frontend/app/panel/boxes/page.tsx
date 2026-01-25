"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { apiFetch, getApiBaseUrl } from "@/lib/auth";
import DataTable from "@/components/tables/DataTable";
import CloneBoxModal from "@/components/modals/CloneBoxModal";
import CreateBoxModal from "@/components/modals/CreateBoxModal";
import TextInput from "@/components/forms/TextInput";
import ActionButton from "@/components/buttons/ActionButton";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Typography from "@mui/material/Typography";

type BoxItem = {
  id: number;
  name: string;
  description?: string;
  total_cards: number;
  finished_cards: number;
  ready_cards: number;
  active_cards: number;
  share_code?: string;
};

type PaginatedBoxes = {
  count: number;
  next: string | null;
  previous: string | null;
  results: BoxItem[];
};

export default function BoxesPage() {
  const [boxes, setBoxes] = useState<BoxItem[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [nextUrl, setNextUrl] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [editingBox, setEditingBox] = useState<BoxItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BoxItem | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [activateTarget, setActivateTarget] = useState<BoxItem | null>(null);
  const [activateCount, setActivateCount] = useState("10");
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [menuTarget, setMenuTarget] = useState<BoxItem | null>(null);
  const [deleteCardsTarget, setDeleteCardsTarget] = useState<BoxItem | null>(
    null,
  );
  const [deleteCardsConfirm, setDeleteCardsConfirm] = useState("");
  const [shareTarget, setShareTarget] = useState<BoxItem | null>(null);
  const [shareCode, setShareCode] = useState("");
  const [cloneCode, setCloneCode] = useState("");
  const [isCloneOpen, setIsCloneOpen] = useState(false);

  const totalBoxes = totalCount ?? boxes.length;

  const buildBoxesUrl = useCallback(() => {
    const params = new URLSearchParams();
    if (search.trim()) params.set("search", search.trim());
    const query = params.toString();
    return query
      ? `${getApiBaseUrl()}/api/boxes/?${query}`
      : `${getApiBaseUrl()}/api/boxes/`;
  }, [search]);

  const loadBoxes = useCallback(async (url: string, append: boolean) => {
    try {
      if (append) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
      }
      const response = await apiFetch(url);
      if (!response.ok) {
        throw new Error("Unable to load boxes.");
      }
      const data = (await response.json()) as PaginatedBoxes | BoxItem[];
      if (Array.isArray(data)) {
        setBoxes(data);
        setNextUrl(null);
        setTotalCount(data.length);
        return;
      }
      setBoxes((current) =>
        append ? [...current, ...data.results] : data.results,
      );
      setNextUrl(data.next);
      setTotalCount(data.count);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load boxes.");
    } finally {
      if (append) {
        setIsLoadingMore(false);
      } else {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const url = buildBoxesUrl();
    setError("");
    setBoxes([]);
    setNextUrl(null);
    setTotalCount(null);
    loadBoxes(url, false);
  }, [buildBoxesUrl, loadBoxes]);

  useEffect(() => {
    setMenuAnchor(null);
    setMenuTarget(null);
  }, [search]);

  const handleTableScroll = useCallback(
    (event: React.UIEvent<HTMLDivElement>) => {
      if (!nextUrl || isLoadingMore) return;
      const target = event.currentTarget;
      const distance =
        target.scrollHeight - target.scrollTop - target.clientHeight;
      if (distance < 220) {
        loadBoxes(nextUrl, true);
      }
    },
    [isLoadingMore, loadBoxes, nextUrl],
  );

  const resetForm = () => {
    setName("");
    setDescription("");
    setEditingBox(null);
  };

  const handleAddOrEditBox = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    setError("");

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Box name is required.");
      return;
    }

    const payload = {
      name: trimmedName,
      description: description.trim(),
    };

    try {
      const url = editingBox
        ? `${getApiBaseUrl()}/api/boxes/${editingBox.id}/`
        : `${getApiBaseUrl()}/api/boxes/`;
      const method = editingBox ? "PATCH" : "POST";
      const response = await apiFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data?.detail || "Unable to save box.");
      }

      const updated = (await response.json()) as BoxItem;
      setBoxes((current) => {
        if (!editingBox) {
          return [updated, ...current];
        }
        return current.map((box) => (box.id === updated.id ? updated : box));
      });
      resetForm();
      setIsCreateOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save box.");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const response = await apiFetch(`${getApiBaseUrl()}/api/boxes/${id}/`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Unable to delete box.");
      }
      setBoxes((current) => current.filter((box) => box.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete box.");
    }
  };

  const handleActivate = async (boxId: number) => {
    const parsedCount = Number.parseInt(activateCount, 10);
    if (!Number.isFinite(parsedCount) || parsedCount <= 0) {
      setError("Enter a valid number of groups to activate.");
      return;
    }
    try {
      const response = await apiFetch(
        `${getApiBaseUrl()}/api/boxes/${boxId}/activate-cards/`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ count: parsedCount }),
        },
      );
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data?.detail || "Unable to activate cards.");
      }
      const url = buildBoxesUrl();
      loadBoxes(url, false);
      setActivateTarget(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to activate cards.",
      );
    }
  };

  const handleDeleteCards = async (boxId: number) => {
    try {
      const response = await apiFetch(
        `${getApiBaseUrl()}/api/boxes/${boxId}/delete-cards/`,
        { method: "POST" },
      );
      if (!response.ok) {
        throw new Error("Unable to delete cards.");
      }
      const url = buildBoxesUrl();
      loadBoxes(url, false);
      setDeleteCardsTarget(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to delete cards.",
      );
    }
  };

  const handleShare = async (boxId: number) => {
    try {
      const response = await apiFetch(
        `${getApiBaseUrl()}/api/boxes/${boxId}/share/`,
        { method: "POST" },
      );
      if (!response.ok) {
        throw new Error("Unable to create share code.");
      }
      const data = (await response.json()) as { share_code?: string };
      setShareCode(data.share_code ?? "");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to create share code.",
      );
    }
  };

  const handleClone = async () => {
    const code = cloneCode.trim();
    if (!code) {
      setError("Enter a share code to clone.");
      return;
    }
    try {
      const response = await apiFetch(`${getApiBaseUrl()}/api/boxes/clone/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data?.code?.[0] || "Unable to clone box.");
      }
      const url = buildBoxesUrl();
      loadBoxes(url, false);
      setCloneCode("");
      setShareTarget(null);
      setIsCloneOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to clone box.");
    }
  };

  const handleEdit = (box: BoxItem) => {
    setEditingBox(box);
    setName(box.name);
    setDescription(box.description ?? "");
    setIsCreateOpen(true);
  };

  const handleMenuOpen = useCallback(
    (event: React.MouseEvent<HTMLElement>, box: BoxItem) => {
      setMenuAnchor(event.currentTarget);
      setMenuTarget(box);
    },
    [],
  );

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setMenuTarget(null);
  };

  const columns = useMemo(
    () => [
      {
        key: "name",
        label: "Box name",
        minWidth: 240,
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
      { key: "total_cards", label: "Total" },
      { key: "active_cards", label: "Active" },
      {
        key: "active_percent",
        label: "Active %",
        render: (box: BoxItem) =>
          box.total_cards
            ? `${((box.active_cards / box.total_cards) * 100).toFixed(1)}%`
            : "0.00%",
      },
      { key: "finished_cards", label: "Finished" },
      { key: "ready_cards", label: "Ready" },
      {
        key: "actions",
        label: "Actions",
        render: (box: BoxItem) => (
          <IconButton
            onClick={(event) => handleMenuOpen(event, box)}
            aria-label="Box actions"
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
    [handleMenuOpen],
  );

  return (
    <>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 2,
          height: "calc(100vh - 8rem)",
          overflow: "hidden",
          bgcolor: "var(--color-dark-bg)",
        }}
      >
        <Breadcrumbs sx={{ color: "text.secondary" }}>
          <Link href="/panel/study">Study</Link>
          <Typography color="text.primary">Boxes</Typography>
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
              Boxes
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {totalBoxes} boxes
            </Typography>
          </Box>
          <Box sx={{ display: "flex", gap: 1.5 }}>
            <ActionButton
              action="create"
              onClick={() => {
                resetForm();
                setIsCreateOpen(true);
              }}
            >
              Create box
            </ActionButton>
            <ActionButton action="cancel" onClick={() => setIsCloneOpen(true)}>
              Clone box
            </ActionButton>
          </Box>
        </Box>

        <TextInput
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search boxes"
          sx={{ borderRadius: 0.5 }}
        />

        <Box sx={{ flexGrow: 1, minHeight: 0 }}>
          <DataTable
            title="Boxes"
            columns={columns}
            rows={boxes}
            getRowKey={(row) => row.id}
            loading={isLoading}
            emptyMessage="No boxes match your search."
            onScroll={handleTableScroll}
          />
          {isLoadingMore && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mt: 2, textTransform: "uppercase", letterSpacing: 2 }}
            >
              Loading more...
            </Typography>
          )}
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

      <CreateBoxModal
        isOpen={isCreateOpen}
        isEditing={Boolean(editingBox)}
        name={name}
        description={description}
        error={error}
        onClose={() => {
          setIsCreateOpen(false);
          resetForm();
        }}
        onSubmit={handleAddOrEditBox}
        onNameChange={setName}
        onDescriptionChange={setDescription}
      />

      {deleteTarget && (
        <div className="fixed inset-0 z-40 flex items-center justify-center px-6 py-12">
          <button
            type="button"
            aria-label="Close delete dialog"
            onClick={() => {
              setDeleteTarget(null);
              setDeleteConfirm("");
            }}
            className="fixed inset-0 bg-black/60"
          />
          <div className="relative z-10 w-full max-w-md rounded-3xl border border-white/10 bg-[#0B0D0E] p-6 shadow-2xl shadow-black/40">
            <h2 className="text-lg font-semibold">Delete box</h2>
            <p className="mt-2 text-sm text-white/70">
              Delete \"{deleteTarget.name}\"? This cannot be undone.
            </p>
            <TextInput
              label='Type "confirm" to continue'
              value={deleteConfirm}
              onChange={(event) => setDeleteConfirm(event.target.value)}
              placeholder="confirm"
              sx={{ mt: 3 }}
            />

            <div className="mt-6 flex flex-wrap gap-3">
              <ActionButton
                action="cancel"
                onClick={() => {
                  setDeleteTarget(null);
                  setDeleteConfirm("");
                }}
                fullWidth
              >
                Cancel
              </ActionButton>
              <ActionButton
                action="delete"
                onClick={() => {
                  handleDelete(deleteTarget.id);
                  setDeleteTarget(null);
                  setDeleteConfirm("");
                }}
                disabled={deleteConfirm.trim().toLowerCase() !== "confirm"}
                fullWidth
              >
                Delete
              </ActionButton>
            </div>
          </div>
        </div>
      )}

      {activateTarget && (
        <div className="fixed inset-0 z-40 flex items-center justify-center px-6 py-12">
          <button
            type="button"
            aria-label="Close activate dialog"
            onClick={() => setActivateTarget(null)}
            className="fixed inset-0 bg-black/60"
          />
          <div className="relative z-10 w-full max-w-md rounded-3xl border border-white/10 bg-[#0B0D0E] p-6 shadow-2xl shadow-black/40">
            <h2 className="text-lg font-semibold">Activate cards</h2>
            <p className="mt-2 text-sm text-white/70">
              Choose how many groups to activate in "{activateTarget.name}".
            </p>
            <TextInput
              label="Number of groups"
              type="number"
              value={activateCount}
              onChange={(event) => setActivateCount(event.target.value)}
              inputProps={{ min: 1 }}
              sx={{ mt: 3 }}
            />

            <div className="mt-6 flex flex-wrap gap-3">
              <ActionButton
                action="cancel"
                onClick={() => setActivateTarget(null)}
                fullWidth
              >
                Cancel
              </ActionButton>
              <ActionButton
                action="submit"
                onClick={() => handleActivate(activateTarget.id)}
                fullWidth
              >
                Activate
              </ActionButton>
            </div>
          </div>
        </div>
      )}

      {deleteCardsTarget && (
        <div className="fixed inset-0 z-40 flex items-center justify-center px-6 py-12">
          <button
            type="button"
            aria-label="Close delete cards dialog"
            onClick={() => {
              setDeleteCardsTarget(null);
              setDeleteCardsConfirm("");
            }}
            className="fixed inset-0 bg-black/60"
          />
          <div className="relative z-10 w-full max-w-md rounded-3xl border border-white/10 bg-[#0B0D0E] p-6 shadow-2xl shadow-black/40">
            <h2 className="text-lg font-semibold">Delete all cards</h2>
            <p className="mt-2 text-sm text-white/70">
              Delete every card in "{deleteCardsTarget.name}"? This cannot be
              undone.
            </p>
            <TextInput
              label='Type "confirm" to continue'
              value={deleteCardsConfirm}
              onChange={(event) => setDeleteCardsConfirm(event.target.value)}
              placeholder="confirm"
              sx={{ mt: 3 }}
            />
            <div className="mt-6 flex flex-wrap gap-3">
              <ActionButton
                action="cancel"
                onClick={() => {
                  setDeleteCardsTarget(null);
                  setDeleteCardsConfirm("");
                }}
                fullWidth
              >
                Cancel
              </ActionButton>
              <ActionButton
                action="delete"
                onClick={() => handleDeleteCards(deleteCardsTarget.id)}
                disabled={deleteCardsConfirm.trim().toLowerCase() !== "confirm"}
                fullWidth
              >
                Delete all
              </ActionButton>
            </div>
          </div>
        </div>
      )}

      {shareTarget && (
        <div className="fixed inset-0 z-40 flex items-center justify-center px-6 py-12">
          <button
            type="button"
            aria-label="Close share dialog"
            onClick={() => setShareTarget(null)}
            className="fixed inset-0 bg-black/60"
          />
          <div className="relative z-10 w-full max-w-lg rounded-3xl border border-white/10 bg-[#0B0D0E] p-6 shadow-2xl shadow-black/40">
            <h2 className="text-lg font-semibold">Share box</h2>
            <p className="mt-2 text-sm text-white/70">
              Generate a share code or paste one to clone a box.
            </p>

            <div className="mt-6 rounded-2xl border border-white/10 bg-[#000000] p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-white/60">
                Share code
              </div>
              <div className="mt-2 break-all text-sm text-white">
                {shareCode || "—"}
              </div>
              <ActionButton
                action="submit"
                onClick={() => handleShare(shareTarget.id)}
                sx={{ mt: 2 }}
              >
                Generate code
              </ActionButton>
            </div>
          </div>
        </div>
      )}

      <CloneBoxModal
        isOpen={isCloneOpen}
        cloneCode={cloneCode}
        onClose={() => setIsCloneOpen(false)}
        onClone={handleClone}
        onCodeChange={setCloneCode}
      />

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
          component={Link}
          href={menuTarget ? `/panel/boxes/${menuTarget.id}/cards` : "#"}
          onClick={handleMenuClose}
        >
          View cards
        </MenuItem>
        <MenuItem
          component={Link}
          href={
            menuTarget ? `/panel/boxes/${menuTarget.id}/cards?important=1` : "#"
          }
          onClick={handleMenuClose}
        >
          Starred cards
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (!menuTarget) return;
            setActivateTarget(menuTarget);
            setActivateCount("10");
            handleMenuClose();
          }}
        >
          Activate cards
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (!menuTarget) return;
            setDeleteCardsTarget(menuTarget);
            handleMenuClose();
          }}
        >
          Clear cards
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (!menuTarget) return;
            setShareTarget(menuTarget);
            setShareCode("");
            handleMenuClose();
          }}
        >
          Share box
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (!menuTarget) return;
            handleEdit(menuTarget);
            handleMenuClose();
          }}
        >
          Edit box
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (!menuTarget) return;
            setDeleteTarget(menuTarget);
            handleMenuClose();
          }}
          sx={{ color: "error.main" }}
        >
          Delete box
        </MenuItem>
      </Menu>
    </>
  );
}
