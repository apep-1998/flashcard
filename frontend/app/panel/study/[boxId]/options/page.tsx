"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiFetch, getApiBaseUrl } from "@/lib/auth";
import TextInput from "@/components/forms/TextInput";
import ActionButton from "@/components/buttons/ActionButton";
import type { CardType } from "@/lib/schemas/cards";
import Box from "@mui/material/Box";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Typography from "@mui/material/Typography";

type ReadySummary = {
  count: number;
  levels: number[];
  types: CardType[];
};

type BoxDetail = {
  id: number;
  name: string;
  description?: string;
};

export default function StudyOptionsPage() {
  const params = useParams();
  const router = useRouter();
  const boxId = Array.isArray(params.boxId)
    ? params.boxId[0]
    : params.boxId ?? "";
  const boxIdNumber = Number(boxId);

  const [box, setBox] = useState<BoxDetail | null>(null);
  const [summary, setSummary] = useState<ReadySummary | null>(null);
  const [availableCount, setAvailableCount] = useState(0);
  const [selectedLevels, setSelectedLevels] = useState<number[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<CardType[]>([]);
  const [shuffle, setShuffle] = useState(true);
  const [cardCount, setCardCount] = useState(0);
  const [error, setError] = useState("");
  const lastAvailableRef = useRef(0);

  useEffect(() => {
    if (!boxIdNumber) return;
    const loadData = async () => {
      try {
        const [boxResponse, summaryResponse] = await Promise.all([
          apiFetch(`${getApiBaseUrl()}/api/boxes/${boxIdNumber}/`),
          apiFetch(
            `${getApiBaseUrl()}/api/cards/ready-summary/?box=${boxIdNumber}`,
          ),
        ]);
        if (!boxResponse.ok || !summaryResponse.ok) {
          throw new Error("Unable to load study options.");
        }
        const boxData = (await boxResponse.json()) as BoxDetail;
        const summaryData = (await summaryResponse.json()) as ReadySummary;
        setBox(boxData);
        setSummary(summaryData);
        setSelectedLevels(summaryData.levels);
        setSelectedTypes(summaryData.types);
        setAvailableCount(summaryData.count);
        setCardCount(Math.min(summaryData.count, 50));
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Unable to load study options.",
        );
      }
    };
    loadData();
  }, [boxIdNumber]);

  useEffect(() => {
    if (!summary) return;
    const loadFilteredCount = async () => {
      try {
        const params = new URLSearchParams({ box: String(boxIdNumber) });
        if (selectedLevels.length) {
          params.set("level", selectedLevels.join(","));
        }
        if (selectedTypes.length) {
          params.set("type", selectedTypes.join(","));
        }
        const response = await apiFetch(
          `${getApiBaseUrl()}/api/cards/ready-summary/?${params.toString()}`,
        );
        if (!response.ok) {
          throw new Error("Unable to refresh available cards.");
        }
        const data = (await response.json()) as ReadySummary;
        const nextMax = Math.min(data.count, 50) || 1;
        setAvailableCount(data.count);
        setCardCount((current) => {
          if (!current) return nextMax;
          if (lastAvailableRef.current && current === lastAvailableRef.current) {
            return nextMax;
          }
          return Math.min(Math.max(current, 1), nextMax);
        });
        lastAvailableRef.current = nextMax;
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to refresh available cards.",
        );
      }
    };
    loadFilteredCount();
  }, [boxIdNumber, selectedLevels, selectedTypes, summary]);

  const maxCount = Math.min(availableCount, 50);

  const canStart =
    availableCount > 0 &&
    selectedLevels.length > 0 &&
    selectedTypes.length > 0 &&
    cardCount > 0;

  const levelsLabel = useMemo(() => {
    if (!summary) return "All levels";
    return selectedLevels.length === summary.levels.length
      ? "All levels"
      : selectedLevels.join(", ");
  }, [selectedLevels, summary]);

  const typesLabel = useMemo(() => {
    if (!summary) return "All types";
    return selectedTypes.length === summary.types.length
      ? "All types"
      : selectedTypes.join(", ");
  }, [selectedTypes, summary]);

  const handleStart = () => {
    if (!canStart) return;
    const params = new URLSearchParams();
    params.set("levels", selectedLevels.join(","));
    params.set("types", selectedTypes.join(","));
    params.set("count", String(Math.min(cardCount, 50)));
    params.set("shuffle", shuffle ? "1" : "0");
    router.push(`/panel/study/${boxIdNumber}/session?${params.toString()}`);
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
          Study options{box ? ` — ${box.name}` : ""}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Choose which ready cards you want to review before starting.
        </Typography>
      </Box>

      <Box sx={{ flexGrow: 1, minHeight: 0, overflow: "hidden" }}>
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
        {!summary && !error && (
          <Box
            sx={{
              borderRadius: 3,
              border: "1px solid var(--panel-border)",
              bgcolor: "var(--panel-surface)",
              p: 3,
            }}
          >
            <Typography variant="body2" color="text.secondary">
              Loading options...
            </Typography>
          </Box>
        )}
        {summary && (
          <Box
            sx={{
              borderRadius: 3,
              border: "1px solid var(--panel-border)",
              bgcolor: "var(--color-dark-bg)",
              p: 3,
              display: "flex",
              flexDirection: "column",
              gap: 3,
              maxWidth: 900,
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "baseline",
                gap: 2,
                direction: "ltr",
              }}
            >
              <Typography variant="h3" fontWeight={700}>
                {availableCount}
              </Typography>
              <Typography variant="h3" fontWeight={700} color="text.secondary">
                cards available
              </Typography>
            </Box>

            <Box>
              <ToggleButtonGroup
                value={selectedLevels}
                onChange={(_, value) => setSelectedLevels(value ?? [])}
                sx={{ ...toggleGroupSx, flexWrap: "wrap" }}
              >
                {summary.levels.map((level) => (
                  <ToggleButton key={level} value={level}>
                    Level {level}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
            </Box>

            <Box>
              <ToggleButtonGroup
                value={selectedTypes}
                onChange={(_, value) =>
                  setSelectedTypes((value as CardType[]) ?? [])
                }
                sx={{ ...toggleGroupSx, flexWrap: "wrap" }}
              >
                {summary.types.map((type) => (
                  <ToggleButton key={type} value={type}>
                    {type}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
            </Box>

            <Box
              sx={{
                display: "grid",
                gap: 2,
                gridTemplateColumns: { md: "1fr 1fr" },
                alignItems: "center",
              }}
            >
              <TextInput
                label="Number of cards"
                type="number"
                value={cardCount}
                onChange={(event) =>
                  setCardCount(
                    Math.min(
                      Math.max(Number(event.target.value), 1),
                      maxCount || 1,
                    ),
                  )
                }
                inputProps={{ min: 1, max: maxCount || 1 }}
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={shuffle}
                    onChange={() => setShuffle((current) => !current)}
                    color="primary"
                  />
                }
                label="Shuffle cards"
                sx={{ color: "text.secondary" }}
              />
            </Box>

            <ActionButton
              action="submit"
              onClick={handleStart}
              disabled={!canStart}
              sx={{ alignSelf: "flex-start", minWidth: 220 }}
            >
              Start study session
            </ActionButton>
          </Box>
        )}
      </Box>
    </Box>
  );
}
