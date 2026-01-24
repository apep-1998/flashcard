"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { apiFetch, getApiBaseUrl } from "@/lib/auth";

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
  const [menuTargetId, setMenuTargetId] = useState<number | null>(null);
  const [deleteCardsTarget, setDeleteCardsTarget] = useState<BoxItem | null>(
    null,
  );
  const [deleteCardsConfirm, setDeleteCardsConfirm] = useState("");
  const [shareTarget, setShareTarget] = useState<BoxItem | null>(null);
  const [shareCode, setShareCode] = useState("");
  const [cloneCode, setCloneCode] = useState("");
  const [isCloneOpen, setIsCloneOpen] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

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
    setMenuTargetId(null);
  }, [search]);

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

  return (
    <>
      <section className="flex h-[calc(100vh-14rem)] flex-col space-y-6 overflow-hidden">
        <div className="flex h-full flex-col rounded-3xl border border-white/10 bg-white/5">
          <div className="rounded-3xl p-4 backdrop-blur">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <span className="rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-white/60">
                {totalBoxes} boxes
              </span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    resetForm();
                    setIsCreateOpen((open) => !open);
                  }}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-white shadow-lg shadow-blue-500/10 backdrop-blur transition hover:border-white/40 hover:bg-white/20"
                  aria-label={isCreateOpen ? "Close new box form" : "Add new box"}
                >
                  <span className="text-2xl leading-none">+</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsCloneOpen(true)}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-white shadow-lg shadow-emerald-500/10 backdrop-blur transition hover:border-white/40 hover:bg-white/20"
                  aria-label="Clone a box"
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
                    <path
                      d="M12 4v10m0 0 4-4m-4 4-4-4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M5 16v3a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-3"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <label className="mt-4 block text-sm text-white/70">
              <span className="sr-only">Search by name</span>
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-white/40"
                placeholder="Search boxes"
              />
            </label>
          </div>

          <div className="scrollbar-hidden flex-1 overflow-y-auto p-6">
            <div className="space-y-4">
              {isLoading && (
                <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-white/60">
                  Loading boxes...
                </div>
              )}
              {!isLoading &&
                boxes.map((box) => (
                  <article
                    key={box.id}
                    className={`rounded-3xl border border-white/10 bg-[#0b1017] p-5 ${
                      menuTargetId === box.id ? "relative z-40" : "relative z-0"
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-semibold">{box.name}</h3>
                        {box.description && (
                          <p className="mt-1 text-sm text-white/60">
                            {box.description}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs uppercase tracking-[0.2em] text-white/60">
                        <div className="relative z-50">
                          <button
                            type="button"
                            onClick={() =>
                              setMenuTargetId(
                                menuTargetId === box.id ? null : box.id,
                              )
                            }
                            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70 transition hover:border-white/40 hover:text-white"
                            aria-label="Box actions"
                          >
                            •••
                          </button>
                          {menuTargetId === box.id && (
                            <div className="absolute right-0 z-50 mt-2 w-44 rounded-2xl border border-white/10 bg-[#0f141b] p-2 text-xs uppercase tracking-[0.2em] text-white/70 shadow-2xl">
                              <Link
                                href={`/panel/boxes/${box.id}/cards`}
                                onClick={() => setMenuTargetId(null)}
                                className="flex items-center gap-2 rounded-xl px-3 py-2 transition hover:bg-white/10"
                              >
                                <span aria-hidden="true">📄</span>
                                View cards
                              </Link>
                              <button
                                type="button"
                                onClick={() => {
                                  setMenuTargetId(null);
                                  setActivateTarget(box);
                                  setActivateCount("10");
                                }}
                                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left transition hover:bg-white/10"
                              >
                                <span aria-hidden="true">⚡</span>
                                Activate cards
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setMenuTargetId(null);
                                  setDeleteCardsTarget(box);
                                }}
                                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left transition hover:bg-white/10"
                              >
                                <span aria-hidden="true">🧹</span>
                                Clear cards
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setMenuTargetId(null);
                                  setShareTarget(box);
                                  setShareCode("");
                                }}
                                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left transition hover:bg-white/10"
                              >
                                <span aria-hidden="true">🔗</span>
                                Share box
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setMenuTargetId(null);
                                  handleEdit(box);
                                }}
                                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left transition hover:bg-white/10"
                              >
                                <span aria-hidden="true">✏️</span>
                                Edit box
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setMenuTargetId(null);
                                  setDeleteTarget(box);
                                }}
                                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-red-200 transition hover:bg-red-500/10"
                              >
                                <span aria-hidden="true">🗑️</span>
                                Delete box
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 text-sm text-white/70 sm:grid-cols-5">
                      <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
                        Total cards{" "}
                        <span className="ml-2 text-white">
                          {box.total_cards}
                        </span>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
                        Active{" "}
                        <span className="ml-2 text-white">
                          {box.active_cards}
                        </span>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
                        Active %{" "}
                        <span className="ml-2 text-white">
                          {box.total_cards
                            ? ((box.active_cards / box.total_cards) * 100).toFixed(2)
                            : "0.00"}
                          %
                        </span>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
                        Finished{" "}
                        <span className="ml-2 text-white">
                          {box.finished_cards}
                        </span>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
                        Ready{" "}
                        <span className="ml-2 text-white">
                          {box.ready_cards}
                        </span>
                      </div>
                    </div>
                  </article>
                ))}
              {!isLoading && boxes.length === 0 && (
                <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-white/60">
                  No boxes match your search.
                </div>
              )}
              {isLoadingMore && (
                <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-xs uppercase tracking-[0.2em] text-white/60">
                  Loading more...
                </div>
              )}
              <div ref={sentinelRef} />
              {error && (
                <div className="rounded-3xl border border-red-400/40 bg-red-500/10 p-6 text-sm text-red-100">
                  {error}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {isCreateOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center px-6 py-12">
          <button
            type="button"
            aria-label="Close new box form"
            onClick={() => setIsCreateOpen(false)}
            className="fixed inset-0 bg-black/60"
          />
          <form
            onSubmit={handleAddOrEditBox}
            className="relative z-10 w-full max-w-lg rounded-3xl border border-white/10 bg-[#0f141b] p-6 shadow-2xl shadow-black/40"
          >
            <h2 className="text-lg font-semibold">
              {editingBox ? "Edit box" : "Create new box"}
            </h2>
            <p className="mt-2 text-sm text-white/70">
              Give your box a clear name and an optional description.
            </p>

            <label className="mt-6 block text-sm text-white/70">
              Box name *
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-white/40"
                placeholder="e.g. Product Design Glossary"
              />
            </label>

            <label className="mt-4 block text-sm text-white/70">
              Description (optional)
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                className="mt-2 min-h-[120px] w-full resize-none rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-white/40"
                placeholder="What will you practice in this box?"
              />
            </label>

            {error && (
              <div className="mt-4 rounded-2xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-xs text-red-100">
                {error}
              </div>
            )}

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsCreateOpen(false);
                  resetForm();
                }}
                className="flex-1 rounded-2xl border border-white/20 px-4 py-3 text-sm font-semibold text-white/70 transition hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 rounded-2xl bg-[#2b59ff] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#1f46d8]"
              >
                {editingBox ? "Save changes" : "Add box"}
              </button>
            </div>
          </form>
        </div>
      )}

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
          <div className="relative z-10 w-full max-w-md rounded-3xl border border-white/10 bg-[#0f141b] p-6 shadow-2xl shadow-black/40">
            <h2 className="text-lg font-semibold">Delete box</h2>
            <p className="mt-2 text-sm text-white/70">
              Delete \"{deleteTarget.name}\"? This cannot be undone.
            </p>
            <label className="mt-6 block text-sm text-white/70">
              Type <span className="font-semibold text-white">confirm</span> to
              continue
              <input
                value={deleteConfirm}
                onChange={(event) => setDeleteConfirm(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-white/40"
                placeholder="confirm"
              />
            </label>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => {
                  setDeleteTarget(null);
                  setDeleteConfirm("");
                }}
                className="flex-1 rounded-2xl border border-white/20 px-4 py-3 text-sm font-semibold text-white/70 transition hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  handleDelete(deleteTarget.id);
                  setDeleteTarget(null);
                  setDeleteConfirm("");
                }}
                disabled={deleteConfirm.trim().toLowerCase() !== "confirm"}
                className="flex-1 rounded-2xl bg-red-500/80 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Delete
              </button>
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
          <div className="relative z-10 w-full max-w-md rounded-3xl border border-white/10 bg-[#0f141b] p-6 shadow-2xl shadow-black/40">
            <h2 className="text-lg font-semibold">Activate cards</h2>
            <p className="mt-2 text-sm text-white/70">
              Choose how many groups to activate in "{activateTarget.name}".
            </p>
            <label className="mt-6 block text-sm text-white/70">
              Number of groups
              <input
                type="number"
                min={1}
                value={activateCount}
                onChange={(event) => setActivateCount(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-white/40"
              />
            </label>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setActivateTarget(null)}
                className="flex-1 rounded-2xl border border-white/20 px-4 py-3 text-sm font-semibold text-white/70 transition hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleActivate(activateTarget.id)}
                className="flex-1 rounded-2xl bg-[#2b59ff] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#1f46d8]"
              >
                Activate
              </button>
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
          <div className="relative z-10 w-full max-w-md rounded-3xl border border-white/10 bg-[#0f141b] p-6 shadow-2xl shadow-black/40">
            <h2 className="text-lg font-semibold">Delete all cards</h2>
            <p className="mt-2 text-sm text-white/70">
              Delete every card in "{deleteCardsTarget.name}"? This cannot be
              undone.
            </p>
            <label className="mt-6 block text-sm text-white/70">
              Type <span className="font-semibold text-white">confirm</span> to
              continue
              <input
                value={deleteCardsConfirm}
                onChange={(event) => setDeleteCardsConfirm(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-white/40"
                placeholder="confirm"
              />
            </label>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => {
                  setDeleteCardsTarget(null);
                  setDeleteCardsConfirm("");
                }}
                className="flex-1 rounded-2xl border border-white/20 px-4 py-3 text-sm font-semibold text-white/70 transition hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteCards(deleteCardsTarget.id)}
                disabled={deleteCardsConfirm.trim().toLowerCase() !== "confirm"}
                className="flex-1 rounded-2xl bg-red-500/80 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Delete all
              </button>
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
          <div className="relative z-10 w-full max-w-lg rounded-3xl border border-white/10 bg-[#0f141b] p-6 shadow-2xl shadow-black/40">
            <h2 className="text-lg font-semibold">Share box</h2>
            <p className="mt-2 text-sm text-white/70">
              Generate a share code or paste one to clone a box.
            </p>

            <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-white/60">
                Share code
              </div>
              <div className="mt-2 break-all text-sm text-white">
                {shareCode || "—"}
              </div>
              <button
                type="button"
                onClick={() => handleShare(shareTarget.id)}
                className="mt-4 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs uppercase tracking-[0.2em] text-white/70 transition hover:border-white/40 hover:text-white"
              >
                Generate code
              </button>
            </div>
          </div>
        </div>
      )}

      {isCloneOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center px-6 py-12">
          <button
            type="button"
            aria-label="Close clone dialog"
            onClick={() => setIsCloneOpen(false)}
            className="fixed inset-0 bg-black/60"
          />
          <div className="relative z-10 w-full max-w-lg rounded-3xl border border-white/10 bg-[#0f141b] p-6 shadow-2xl shadow-black/40">
            <h2 className="text-lg font-semibold">Clone a box</h2>
            <p className="mt-2 text-sm text-white/70">
              Paste a share code to create a fresh copy of a box.
            </p>

            <label className="mt-6 block text-sm text-white/70">
              Share code
              <input
                value={cloneCode}
                onChange={(event) => setCloneCode(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-white/40"
                placeholder="Paste share code"
              />
            </label>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setIsCloneOpen(false)}
                className="flex-1 rounded-2xl border border-white/20 px-4 py-3 text-sm font-semibold text-white/70 transition hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleClone}
                className="flex-1 rounded-2xl bg-[#2b59ff] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#1f46d8]"
              >
                Clone box
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
