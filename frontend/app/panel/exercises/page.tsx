"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { apiFetch, getApiBaseUrl } from "@/lib/auth";
import ActionButton from "@/components/buttons/ActionButton";
import ExerciseCreateModal from "@/components/modals/ExerciseCreateModal";
import ExerciseImportModal from "@/components/modals/ExerciseImportModal";
import TextInput from "@/components/forms/TextInput";
import DataTable from "@/components/tables/DataTable";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Typography from "@mui/material/Typography";

type ExerciseItem = {
  id: number;
  title: string;
  question_making_prompt: string;
  evaluate_prompt: string;
  exercises: string[];
  history_count: number;
  success_count: number;
};

type PaginatedExercises = {
  count: number;
  next: string | null;
  previous: string | null;
  results: ExerciseItem[];
};

export default function ExercisesPage() {
  const [exercises, setExercises] = useState<ExerciseItem[]>([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [editingExercise, setEditingExercise] = useState<ExerciseItem | null>(
    null,
  );
  const [deleteTarget, setDeleteTarget] = useState<ExerciseItem | null>(null);
  const [title, setTitle] = useState("");
  const [questionPrompt, setQuestionPrompt] = useState("");
  const [evaluatePrompt, setEvaluatePrompt] = useState("");
  const [bulkJson, setBulkJson] = useState("");
  const [bulkErrors, setBulkErrors] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [menuTarget, setMenuTarget] = useState<ExerciseItem | null>(null);
  const [viewTarget, setViewTarget] = useState<ExerciseItem | null>(null);
  const buildExercisesUrl = useCallback(() => {
    const params = new URLSearchParams();
    if (search.trim()) {
      params.set("search", search.trim());
    }
    const query = params.toString();
    return query
      ? `${getApiBaseUrl()}/api/exercises/?${query}`
      : `${getApiBaseUrl()}/api/exercises/`;
  }, [search]);

  const loadExercises = useCallback(async (url: string) => {
    try {
      setIsLoading(true);
      const response = await apiFetch(url);
      if (!response.ok) {
        throw new Error("Unable to load exercises.");
      }
      const data = (await response.json()) as PaginatedExercises | ExerciseItem[];
      if (Array.isArray(data)) {
        setExercises(data);
        return;
      }
      setExercises(data.results);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load exercises.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const url = buildExercisesUrl();
    setError("");
    setExercises([]);
    loadExercises(url);
  }, [buildExercisesUrl, loadExercises]);

  const handleMenuOpen = useCallback(
    (event: React.MouseEvent<HTMLElement>, exercise: ExerciseItem) => {
      setMenuAnchor(event.currentTarget);
      setMenuTarget(exercise);
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
        key: "title",
        label: "Title",
        minWidth: 280,
        render: (exercise: ExerciseItem) => (
          <Box>
            <Typography variant="subtitle2" fontWeight={600}>
              {exercise.title}
            </Typography>
          </Box>
        ),
      },
      {
        key: "history_count",
        label: "History",
        render: (exercise: ExerciseItem) => exercise.history_count ?? 0,
      },
      {
        key: "success_count",
        label: "Score ≥7",
        render: (exercise: ExerciseItem) => exercise.success_count ?? 0,
      },
      {
        key: "do",
        label: "Practice",
        render: (exercise: ExerciseItem) => (
          <ActionButton
            action="exercise"
            component={Link}
            href={`/panel/exercises/${exercise.id}`}
            sx={{ minWidth: 120 }}
          >
            Do exercise
          </ActionButton>
        ),
      },
      {
        key: "actions",
        label: "Actions",
        render: (exercise: ExerciseItem) => (
          <IconButton
            onClick={(event) => handleMenuOpen(event, exercise)}
            aria-label="Exercise actions"
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

  const resetForm = () => {
    setTitle("");
    setQuestionPrompt("");
    setEvaluatePrompt("");
    setEditingExercise(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setIsCreateOpen(true);
  };

  const handleOpenEdit = (exercise: ExerciseItem) => {
    setEditingExercise(exercise);
    setTitle(exercise.title);
    setQuestionPrompt(exercise.question_making_prompt);
    setEvaluatePrompt(exercise.evaluate_prompt);
    setIsCreateOpen(true);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSaving) return;
    setError("");

    const payload = {
      title: title.trim(),
      question_making_prompt: questionPrompt.trim(),
      evaluate_prompt: evaluatePrompt.trim(),
    };

    if (!payload.title || !payload.question_making_prompt || !payload.evaluate_prompt) {
      setError("Title, question prompt, and evaluation prompt are required.");
      return;
    }

    try {
      setIsSaving(true);
      const url = editingExercise
        ? `${getApiBaseUrl()}/api/exercises/${editingExercise.id}/`
        : `${getApiBaseUrl()}/api/exercises/`;
      const method = editingExercise ? "PATCH" : "POST";
      const response = await apiFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data?.detail || "Unable to save exercise.");
      }
      const updated = (await response.json()) as ExerciseItem;
      setExercises((current) => {
        if (!editingExercise) {
          return [updated, ...current];
        }
        return current.map((item) => (item.id === updated.id ? updated : item));
      });
      setIsCreateOpen(false);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save exercise.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const response = await apiFetch(
        `${getApiBaseUrl()}/api/exercises/${deleteTarget.id}/`,
        { method: "DELETE" },
      );
      if (!response.ok) {
        throw new Error("Unable to delete exercise.");
      }
      setExercises((current) =>
        current.filter((item) => item.id !== deleteTarget.id),
      );
      setDeleteTarget(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete exercise.");
    }
  };

  const handleBulkSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    setBulkErrors([]);
    setError("");

    let parsed: unknown;
    try {
      parsed = JSON.parse(bulkJson);
    } catch {
      setBulkErrors(["Invalid JSON format."]);
      return;
    }

    if (!Array.isArray(parsed)) {
      setBulkErrors(["JSON must be an array of exercises."]);
      return;
    }

    try {
      const response = await apiFetch(
        `${getApiBaseUrl()}/api/exercises/bulk-create/`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(parsed),
        },
      );
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        if (Array.isArray(data?.errors)) {
          setBulkErrors(
            data.errors.map((item: { index: number; error: string }) => {
              return `Item ${item.index + 1}: ${item.error}`;
            }),
          );
          return;
        }
        throw new Error(data?.detail || "Unable to create exercises.");
      }
      const created = (await response.json()) as ExerciseItem[];
      setExercises((current) => [...created, ...current]);
      setBulkJson("");
      setIsBulkOpen(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to create exercises.",
      );
    }
  };

  const totalExercises = useMemo(() => exercises.length, [exercises.length]);

  return (
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
        <Typography color="text.primary">Exercises</Typography>
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
            Exercises
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {totalExercises} exercises
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 1.5 }}>
          <ActionButton action="create" onClick={handleOpenCreate}>
            Create exercise
          </ActionButton>
          <ActionButton action="cancel" onClick={() => setIsBulkOpen(true)}>
            JSON import
          </ActionButton>
        </Box>
      </Box>

      <TextInput
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Search exercises"
        sx={{ borderRadius: 0.5 }}
      />

      <Box sx={{ flexGrow: 1, minHeight: 0 }}>
        <DataTable
          title="Exercises"
          columns={columns}
          rows={exercises}
          getRowKey={(row) => row.id}
          loading={isLoading}
          emptyMessage="No exercises yet. Create your first one."
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
          View
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (!menuTarget) return;
            handleOpenEdit(menuTarget);
            handleMenuClose();
          }}
        >
          Edit
        </MenuItem>
        <MenuItem
          component={Link}
          href={menuTarget ? `/panel/exercises/${menuTarget.id}/history` : "#"}
          onClick={handleMenuClose}
        >
          History
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (!menuTarget) return;
            setDeleteTarget(menuTarget);
            handleMenuClose();
          }}
          sx={{ color: "error.main" }}
        >
          Delete
        </MenuItem>
      </Menu>

      <ExerciseCreateModal
        isOpen={isCreateOpen}
        isEditing={Boolean(editingExercise)}
        title={title}
        questionPrompt={questionPrompt}
        evaluatePrompt={evaluatePrompt}
        isSaving={isSaving}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={handleSubmit}
        onTitleChange={setTitle}
        onQuestionPromptChange={setQuestionPrompt}
        onEvaluatePromptChange={setEvaluatePrompt}
      />

      <ExerciseCreateModal
        isOpen={Boolean(viewTarget)}
        isEditing={false}
        isReadOnly
        title={viewTarget?.title ?? ""}
        questionPrompt={viewTarget?.question_making_prompt ?? ""}
        evaluatePrompt={viewTarget?.evaluate_prompt ?? ""}
        isSaving={false}
        onClose={() => setViewTarget(null)}
        onSubmit={(event) => event.preventDefault()}
        onTitleChange={() => {}}
        onQuestionPromptChange={() => {}}
        onEvaluatePromptChange={() => {}}
      />

      <ExerciseImportModal
        isOpen={isBulkOpen}
        bulkJson={bulkJson}
        bulkErrors={bulkErrors}
        onClose={() => setIsBulkOpen(false)}
        onSubmit={handleBulkSubmit}
        onBulkChange={setBulkJson}
      />

      {deleteTarget && (
        <div className="fixed inset-0 z-40 flex items-center justify-center px-6 py-12">
          <button
            type="button"
            onClick={() => setDeleteTarget(null)}
            className="fixed inset-0 bg-black/60"
            aria-label="Close delete exercise"
          />
          <div className="relative z-10 w-full max-w-md rounded-3xl border border-white/10 bg-[#0B0D0E] p-6 text-white">
            <h2 className="text-lg font-semibold">Delete exercise</h2>
            <p className="mt-3 text-sm text-white/70">
              Are you sure you want to delete “{deleteTarget.title}”?
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <ActionButton action="cancel" onClick={() => setDeleteTarget(null)}>
                Cancel
              </ActionButton>
              <ActionButton action="delete" onClick={handleDelete}>
                Delete
              </ActionButton>
            </div>
          </div>
        </div>
      )}

    </Box>
  );
}
