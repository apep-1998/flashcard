"use client";

import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import CardCreateFactory from "@/components/cards/create/CardCreateFactory";
import ActionButton from "@/components/buttons/ActionButton";
import TextArea from "@/components/forms/TextArea";
import TextInput from "@/components/forms/TextInput";
import { apiFetch, getApiBaseUrl } from "@/lib/auth";
import {
  boxSchema,
  cardConfigSchema,
  cardSchema,
  type AiReviewerConfig,
  type CardConfig,
  type CardType,
  type GermanVerbConfig,
  type MultipleChoiceConfig,
  type SpellingConfig,
  type StandardConfig,
  type WordStandardConfig,
} from "@/lib/schemas/cards";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";

type BoxItem = {
  id: number;
  name: string;
};

type Props = {
  isOpen: boolean;
  boxes: BoxItem[];
  onClose: () => void;
  onCreated: () => void;
};

const DEFAULT_CONFIGS: Record<CardType, CardConfig> = {
  spelling: {
    type: "spelling",
    front: "",
    voice_file_url: "",
    text_to_speech: "",
    text_to_speech_language: "en",
    spelling: "",
  } satisfies SpellingConfig,
  "multiple-choice": {
    type: "multiple-choice",
    question: "",
    voice_file_url: "",
    text_to_speech: "",
    text_to_speech_language: "en",
    image_file_url: "",
    answer: "",
    options: ["", ""],
  } satisfies MultipleChoiceConfig,
  "ai-reviewer": {
    type: "ai-reviewer",
    question: "",
    validate_answer_promt: "",
  } satisfies AiReviewerConfig,
  standard: {
    type: "standard",
    front: "",
    back: "",
    front_voice_file_url: "",
    back_voice_file_url: "",
    front_text_to_speech: "",
    front_text_to_speech_language: "en",
    back_text_to_speech: "",
    back_text_to_speech_language: "en",
  } satisfies StandardConfig,
  "word-standard": {
    type: "word-standard",
    word: "",
    part_of_speech: "",
    voice_file_url: "",
    text_to_speech: "",
    text_to_speech_language: "en",
    back: "",
  } satisfies WordStandardConfig,
  "german-verb-conjugator": {
    type: "german-verb-conjugator",
    verb: "",
    voice_file_url: "",
    text_to_speech: "",
    text_to_speech_language: "en",
    ich: "",
    du: "",
    "er/sie/es": "",
    wir: "",
    ihr: "",
    sie: "",
  } satisfies GermanVerbConfig,
};

const CARD_TYPES = Object.keys(DEFAULT_CONFIGS) as CardType[];

export default function CardCreateModal({
  isOpen,
  boxes,
  onClose,
  onCreated,
}: Props) {
  const [selectedBoxId, setSelectedBoxId] = useState<number | null>(null);
  const [groupId, setGroupId] = useState("");
  const [cardType, setCardType] = useState<CardType>("spelling");
  const [config, setConfig] = useState<CardConfig>(DEFAULT_CONFIGS.spelling);
  const [bulkJson, setBulkJson] = useState("");
  const [mode, setMode] = useState<"single" | "bulk">("single");
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [bulkErrors, setBulkErrors] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const boxOptions = useMemo(() => boxSchema.array().parse(boxes), [boxes]);

  useEffect(() => {
    if (!isOpen) return;
    if (!selectedBoxId && boxOptions.length) {
      setSelectedBoxId(boxOptions[0].id);
    }
  }, [boxOptions, isOpen, selectedBoxId]);

  if (!isOpen) return null;

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

  const handleTypeChange = (nextType: CardType) => {
    setCardType(nextType);
    setConfig(DEFAULT_CONFIGS[nextType]);
    setFormError("");
    setSuccessMessage("");
    setBulkErrors([]);
  };

  const normalizeConfigInput = (input: Record<string, unknown>) => {
    if ("image_url" in input && !("image_file_url" in input)) {
      return { ...input, image_file_url: input.image_url };
    }
    return input;
  };

  const resetStatus = () => {
    setFormError("");
    setSuccessMessage("");
    setBulkErrors([]);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    resetStatus();

    if (!selectedBoxId) {
      setFormError("Select a box before creating a card.");
      return;
    }

    const draftCard = {
      boxId: selectedBoxId,
      userId: "mock-user",
      finished: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      level: 0,
      groupId: groupId.trim() || "default-group",
      nextReviewTime: null,
      config,
    };

    const parsed = cardSchema.safeParse(draftCard);
    if (!parsed.success) {
      const issue = parsed.error.issues?.[0];
      setFormError(issue?.message ?? "Invalid card data.");
      return;
    }

    try {
      setIsSaving(true);
      const response = await apiFetch(`${getApiBaseUrl()}/api/cards/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          box_id: selectedBoxId,
          group_id: groupId.trim(),
          finished: false,
          level: 0,
          config,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data?.detail || "Unable to save card.");
      }

      setSuccessMessage("Card saved.");
      onCreated();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Unable to save card.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleBulkSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    resetStatus();

    if (!selectedBoxId) {
      setFormError("Select a box before adding cards.");
      return;
    }

    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(bulkJson);
    } catch {
      setFormError("Invalid JSON. Paste a valid JSON array.");
      return;
    }

    if (!Array.isArray(parsedJson)) {
      setFormError("JSON must be an array of card configs.");
      return;
    }

    const configs: Array<{ config: CardConfig; groupId?: string }> = [];
    const errors: string[] = [];
    for (const [index, item] of parsedJson.entries()) {
      if (!item || typeof item !== "object") {
        errors.push(`Item ${index}: must be a card config object.`);
        continue;
      }
      const normalized = normalizeConfigInput(item as Record<string, unknown>);
      const groupId =
        typeof normalized.group_id === "string"
          ? normalized.group_id.trim()
          : undefined;
      const { group_id: _groupId, ...configInput } = normalized;
      const result = cardConfigSchema.safeParse(configInput);
      if (!result.success) {
        const issue = result.error.issues?.[0];
        const message = issue?.message ?? "Invalid card config.";
        const path = issue?.path?.join(".") ?? "config";
        errors.push(`Item ${index}: ${path} - ${message}`);
        continue;
      }
      configs.push({ config: result.data, groupId });
    }

    if (errors.length) {
      setBulkErrors(errors);
      return;
    }

    try {
      setIsSaving(true);
      const fallbackGroupId = groupId.trim();
      const payloadCards = configs.map(({ config, groupId: itemGroupId }) => ({
        ...config,
        ...(itemGroupId ? { group_id: itemGroupId } : {}),
      }));
      const response = await apiFetch(
        `${getApiBaseUrl()}/api/cards/bulk-create/`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            box_id: selectedBoxId,
            group_id: fallbackGroupId,
            cards: payloadCards,
          }),
        },
      );
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        if (Array.isArray(data?.errors)) {
          setBulkErrors(
            data.errors.map((item: { index: number; error: string }) => {
              const indexLabel = Number.isFinite(item.index)
                ? `Item ${item.index}: `
                : "";
              return `${indexLabel}${item.error}`;
            }),
          );
          return;
        }
        throw new Error(data?.detail || "Unable to save cards.");
      }
      const data = (await response.json()) as { created?: number };
      const createdCount =
        typeof data?.created === "number" ? data.created : configs.length;
      setSuccessMessage(`Saved ${createdCount} cards.`);
      onCreated();
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Unable to save cards.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center px-6 py-12">
      <button
        type="button"
        onClick={onClose}
        className="fixed inset-0 bg-black/60"
        aria-label="Close create card"
      />
      <div className="relative z-10 w-full max-w-4xl rounded-3xl border border-white/10 bg-[var(--color-dark-bg)] p-6 text-white">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-lg font-semibold">Create cards</h2>
          <ToggleButtonGroup
            value={mode}
            exclusive
            onChange={(_, value) => {
              if (value) setMode(value);
            }}
            sx={{
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
            }}
          >
            <ToggleButton value="single">Single card</ToggleButton>
            <ToggleButton value="bulk">JSON import</ToggleButton>
          </ToggleButtonGroup>
        </div>

        <form
          onSubmit={mode === "single" ? handleSubmit : handleBulkSubmit}
          className="mt-6 flex flex-col gap-6"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <FormControl fullWidth>
              <InputLabel sx={{ color: "text.secondary" }}>
                Select box
              </InputLabel>
              <Select
                value={selectedBoxId ?? ""}
                label="Select box"
                onChange={(event) =>
                  setSelectedBoxId(Number(event.target.value))
                }
                sx={selectSx}
              >
                {boxOptions.map((box) => (
                  <MenuItem key={box.id} value={box.id}>
                    {box.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel sx={{ color: "text.secondary" }}>
                Card type
              </InputLabel>
              <Select
                value={cardType}
                label="Card type"
                onChange={(event) =>
                  handleTypeChange(event.target.value as CardType)
                }
                sx={selectSx}
              >
                {CARD_TYPES.map((type) => (
                  <MenuItem key={type} value={type}>
                    {type}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextInput
              label="Group ID"
              value={groupId}
              onChange={(event) => setGroupId(event.target.value)}
              placeholder="e.g. german-unit-2"
              sx={{ gridColumn: { md: "span 2" } }}
            />
          </div>

          {mode === "single" ? (
            <CardCreateFactory
              type={cardType}
              value={config}
              onChange={setConfig}
            />
          ) : (
            <TextArea
              label="JSON payload"
              value={bulkJson}
              onChange={(event) => setBulkJson(event.target.value)}
              rows={8}
              className="resize-none"
              placeholder='[\n  { "type": "standard", "front": "...", "back": "..." }\n]'
              inputProps={{ style: { fontFamily: "var(--font-app-mono)" } }}
            />
          )}

          {formError && (
            <div className="rounded-2xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-xs text-red-100">
              {formError}
            </div>
          )}
          {bulkErrors.length > 0 && (
            <div className="rounded-2xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-xs text-red-100">
              <div className="font-semibold">JSON errors:</div>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                {bulkErrors.map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            </div>
          )}
          {successMessage && (
            <div className="rounded-2xl border border-emerald-400/40 bg-emerald-500/10 px-4 py-3 text-xs text-emerald-100">
              {successMessage}
            </div>
          )}

          <div className="flex flex-wrap justify-between gap-3">
            <ActionButton
              action="submit"
              type="submit"
              disabled={isSaving}
              sx={{ minWidth: 140 }}
            >
              {mode === "single"
                ? isSaving
                  ? "Saving..."
                  : "Save card"
                : isSaving
                  ? "Adding..."
                  : "Add cards"}
            </ActionButton>
            <ActionButton action="cancel" onClick={onClose} sx={{ minWidth: 140 }}>
              Close
            </ActionButton>
          </div>
        </form>
      </div>
    </div>
  );
}
