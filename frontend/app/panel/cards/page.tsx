"use client";

import { useEffect, useMemo, useState } from "react";
import CardCreateFactory from "@/components/cards/create/CardCreateFactory";
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

type BoxItem = {
  id: number;
  name: string;
};

type PaginatedBoxes = {
  count: number;
  next: string | null;
  previous: string | null;
  results: BoxItem[];
};

const DEFAULT_CONFIGS: Record<CardType, CardConfig> = {
  spelling: {
    type: "spelling",
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

export default function CardsPage() {
  const [boxes, setBoxes] = useState<BoxItem[]>([]);
  const [selectedBoxId, setSelectedBoxId] = useState<number | null>(null);
  const [groupId, setGroupId] = useState("");
  const [cardType, setCardType] = useState<CardType>("spelling");
  const [config, setConfig] = useState<CardConfig>(DEFAULT_CONFIGS.spelling);
  const [bulkJson, setBulkJson] = useState("");
  const [mode, setMode] = useState<"single" | "bulk">("single");
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [bulkErrors, setBulkErrors] = useState<string[]>([]);

  const boxOptions = useMemo(() => boxSchema.array().parse(boxes), [boxes]);

  useEffect(() => {
    const loadBoxes = async () => {
      try {
        const response = await apiFetch(`${getApiBaseUrl()}/api/boxes/`);
        if (!response.ok) {
          throw new Error("Unable to load boxes.");
        }
        const data = (await response.json()) as PaginatedBoxes | BoxItem[];
        const results = Array.isArray(data) ? data : data.results;
        setBoxes(results);
        if (results.length) {
          setSelectedBoxId(results[0].id);
        }
      } catch (err) {
        setFormError(
          err instanceof Error ? err.message : "Unable to load boxes.",
        );
      }
    };

    loadBoxes();
  }, []);

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

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError("");
    setSuccessMessage("");
    setBulkErrors([]);

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
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Unable to save card.");
    }
  };

  const handleBulkSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError("");
    setSuccessMessage("");
    setBulkErrors([]);

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

    const now = new Date().toISOString();
    const fallbackGroupId = groupId.trim() || "default-group";
    const draftCards = configs.map(({ config, groupId: itemGroupId }, index) => ({
      boxId: selectedBoxId,
      userId: "mock-user",
      finished: false,
      createdAt: now,
      updatedAt: now,
      level: 0,
      groupId: itemGroupId ?? fallbackGroupId,
      nextReviewTime: null,
      config,
      groupIndex: index,
    }));

    const schemaErrors = draftCards
      .map((card, index) => ({ index, parsed: cardSchema.safeParse(card) }))
      .filter((entry) => !entry.parsed.success);

    if (schemaErrors.length) {
      setFormError(
        schemaErrors[0].parsed.success
          ? "Invalid card data."
          : schemaErrors[0].parsed.error.issues?.[0]?.message ??
              `Invalid card at index ${schemaErrors[0].index}.`,
      );
      return;
    }

    try {
      await Promise.all(
        configs.map(({ config, groupId: itemGroupId }) =>
          apiFetch(`${getApiBaseUrl()}/api/cards/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              box_id: selectedBoxId,
              group_id: itemGroupId ?? fallbackGroupId,
              finished: false,
              level: 0,
              config,
            }),
          }),
        ),
      );
      setSuccessMessage(`Saved ${configs.length} cards.`);
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Unable to save cards.",
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <div className="grid gap-4 md:grid-cols-3">
          <label className="block text-sm text-white/70">
            Select box
            <select
              value={selectedBoxId ?? ""}
              onChange={(event) => setSelectedBoxId(Number(event.target.value))}
              className="mt-2 w-full rounded-2xl border border-white/10 bg-[#0f141b] px-4 py-3 text-white outline-none transition focus:border-white/40"
            >
              {boxOptions.map((box) => (
                <option key={box.id} value={box.id}>
                  {box.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm text-white/70">
            Group ID
            <input
              value={groupId}
              onChange={(event) => setGroupId(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-white/40"
              placeholder="e.g. german-unit-2"
            />
          </label>

          <label className="block text-sm text-white/70">
            Card type
            <select
              value={cardType}
              onChange={(event) =>
                handleTypeChange(event.target.value as CardType)
              }
              className="mt-2 w-full rounded-2xl border border-white/10 bg-[#0f141b] px-4 py-3 text-white outline-none transition focus:border-white/40"
            >
              {CARD_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-lg font-semibold">Create new card</h2>
          <div className="flex gap-2 text-xs uppercase tracking-[0.2em] text-white/60">
            {(["single", "bulk"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setMode(tab)}
                className={`rounded-full border px-3 py-1 transition ${
                  mode === tab
                    ? "border-white/40 text-white"
                    : "border-white/10 text-white/60 hover:text-white"
                }`}
              >
                {tab === "single" ? "Single card" : "JSON import"}
              </button>
            ))}
          </div>
        </div>

        {mode === "single" ? (
          <form onSubmit={handleSubmit} className="mt-6">
            <p className="text-sm text-white/70">
              Fill the fields for the selected card type.
            </p>

            <div className="mt-6">
              <CardCreateFactory
                type={cardType}
                value={config}
                onChange={setConfig}
              />
            </div>

            {formError && (
              <div className="mt-4 rounded-2xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-xs text-red-100">
                {formError}
              </div>
            )}
            {bulkErrors.length > 0 && (
              <div className="mt-4 rounded-2xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-xs text-red-100">
                <div className="font-semibold">JSON errors:</div>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  {bulkErrors.map((error) => (
                    <li key={error}>{error}</li>
                  ))}
                </ul>
              </div>
            )}
            {successMessage && (
              <div className="mt-4 rounded-2xl border border-emerald-400/40 bg-emerald-500/10 px-4 py-3 text-xs text-emerald-100">
                {successMessage}
              </div>
            )}

            <button
              type="submit"
              className="mt-6 w-full rounded-2xl bg-[#2b59ff] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#1f46d8]"
            >
              Save card
            </button>
          </form>
        ) : (
          <form onSubmit={handleBulkSubmit} className="mt-6">
            <p className="text-sm text-white/70">
              Paste an array of card configs. All cards will share the selected
              box and group ID.
            </p>

            <textarea
              value={bulkJson}
              onChange={(event) => setBulkJson(event.target.value)}
              className="mt-4 min-h-[240px] w-full resize-none rounded-2xl border border-white/10 bg-white/5 px-4 py-3 font-mono text-xs text-white outline-none transition focus:border-white/40"
              placeholder='[\n  { "type": "standard", "front": "...", "back": "..." }\n]'
            />

            {formError && (
              <div className="mt-4 rounded-2xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-xs text-red-100">
                {formError}
              </div>
            )}
            {bulkErrors.length > 0 && (
              <div className="mt-4 rounded-2xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-xs text-red-100">
                <div className="font-semibold">JSON errors:</div>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  {bulkErrors.map((error) => (
                    <li key={error}>{error}</li>
                  ))}
                </ul>
              </div>
            )}
            {successMessage && (
              <div className="mt-4 rounded-2xl border border-emerald-400/40 bg-emerald-500/10 px-4 py-3 text-xs text-emerald-100">
                {successMessage}
              </div>
            )}

            <button
              type="submit"
              className="mt-6 w-full rounded-2xl bg-[#2b59ff] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#1f46d8]"
            >
              Add cards
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
