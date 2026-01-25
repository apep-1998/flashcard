"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Typography from "@mui/material/Typography";
import ActionButton from "@/components/buttons/ActionButton";
import SpellingExam from "@/components/cards/exam/SpellingExam";
import GermanVerbConjugatorExam from "@/components/cards/exam/GermanVerbConjugatorExam";
import { apiFetch, getApiBaseUrl } from "@/lib/auth";
import MultipleChoiceExam from "@/components/cards/exam/MultipleChoiceExam";
import StandardExam from "@/components/cards/exam/StandardExam";
import AiReviewerExam from "@/components/cards/exam/AiReviewerExam";
import WordStandardExam from "@/components/cards/exam/WordStandardExam";
import CardCreateFactory from "@/components/cards/create/CardCreateFactory";
import type {
  AiReviewerConfig,
  CardConfig,
  CardType,
  GermanVerbConfig,
  MultipleChoiceConfig,
  SpellingConfig,
  StandardConfig,
  WordStandardConfig,
} from "@/lib/schemas/cards";

type CardItem = {
  id: number;
  box: number;
  finished: boolean;
  level: number;
  group_id: string;
  next_review_time: string | null;
  is_important: boolean;
  config: CardConfig;
};

type PaginatedCards = {
  count: number;
  next: string | null;
  previous: string | null;
  results: CardItem[];
};

const parseListParam = (value: string | null) =>
  value
    ? value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
    : [];

export default function StudySessionPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const boxId = Array.isArray(params.boxId)
    ? params.boxId[0]
    : (params.boxId ?? "");
  const boxIdNumber = Number(boxId);

  const [cards, setCards] = useState<CardItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showCorrect, setShowCorrect] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const reviewQueueRef = useRef<
    Array<{ cardId: number; correct: boolean; attempts: number }>
  >([]);
  const isQueueRunningRef = useRef(false);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [failedSync, setFailedSync] = useState<
    Array<{ cardId: number; correct: boolean }>
  >([]);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [isStarUpdating, setIsStarUpdating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CardItem | null>(null);
  const [editTarget, setEditTarget] = useState<CardItem | null>(null);
  const [editConfig, setEditConfig] = useState<CardConfig | null>(null);
  const [editError, setEditError] = useState("");
  const [boxName, setBoxName] = useState("");

  const levels = useMemo(
    () => parseListParam(searchParams.get("levels")),
    [searchParams],
  );
  const types = useMemo(
    () => parseListParam(searchParams.get("types")) as CardType[],
    [searchParams],
  );
  const count = useMemo(() => {
    const value = Number(searchParams.get("count"));
    return Number.isFinite(value) && value > 0 ? Math.min(value, 50) : 0;
  }, [searchParams]);
  const shuffle = searchParams.get("shuffle") !== "0";

  const loadCards = useCallback(async () => {
    if (!boxIdNumber || !count) return;
    setError("");
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        box: String(boxIdNumber),
        ready: "1",
      });
      if (levels.length) params.set("level", levels.join(","));
      if (types.length) params.set("type", types.join(","));
      if (!shuffle) params.set("order", "next_review_time");

      const response = await apiFetch(
        `${getApiBaseUrl()}/api/cards/?${params.toString()}`,
      );
      if (!response.ok) {
        throw new Error("Unable to load study cards.");
      }
      const data = (await response.json()) as PaginatedCards;
      const limited = data.results.slice(0, count);
      const results = shuffle
        ? [...limited].sort(() => Math.random() - 0.5)
        : limited;
      setCards(results);
      setCurrentIndex(0);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load study cards.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [boxIdNumber, count, levels, shuffle, types]);

  useEffect(() => {
    loadCards();
  }, [loadCards]);

  useEffect(() => {
    setMenuAnchor(null);
  }, [currentIndex]);

  useEffect(() => {
    if (!boxIdNumber) return;
    const loadBox = async () => {
      try {
        const response = await apiFetch(
          `${getApiBaseUrl()}/api/boxes/${boxIdNumber}/`,
        );
        if (!response.ok) {
          throw new Error("Unable to load box.");
        }
        const data = (await response.json()) as { name?: string };
        setBoxName(data?.name ?? "");
      } catch {
        setBoxName("");
      }
    };
    loadBox();
  }, [boxIdNumber]);

  const currentCard = cards[currentIndex];
  const total = cards.length;

  const advanceCard = () => {
    setError("");
    setCurrentIndex((prev) => Math.min(prev + 1, total));
  };

  const openEditModal = (card: CardItem) => {
    setEditTarget(card);
    setEditConfig(card.config);
    setEditError("");
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
      setCurrentIndex((prev) => Math.min(prev, Math.max(total - 2, 0)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete card.");
    }
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
      setEditError(
        err instanceof Error ? err.message : "Unable to update card.",
      );
    }
  };

  const handleToggleImportant = async () => {
    if (!currentCard || isStarUpdating) return;
    const nextValue = !currentCard.is_important;
    setIsStarUpdating(true);
    setCards((current) =>
      current.map((item) =>
        item.id === currentCard.id
          ? { ...item, is_important: nextValue }
          : item,
      ),
    );
    try {
      const response = await apiFetch(
        `${getApiBaseUrl()}/api/cards/${currentCard.id}/`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ is_important: nextValue }),
        },
      );
      if (!response.ok) {
        throw new Error("Unable to update card.");
      }
      const updated = (await response.json()) as CardItem;
      setCards((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
    } catch (err) {
      setCards((current) =>
        current.map((item) =>
          item.id === currentCard.id
            ? { ...item, is_important: !nextValue }
            : item,
        ),
      );
      setError(err instanceof Error ? err.message : "Unable to update card.");
    } finally {
      setIsStarUpdating(false);
    }
  };

  const handleReviewUpdate = async (cardId: number, correct: boolean) => {
    try {
      const response = await apiFetch(
        `${getApiBaseUrl()}/api/cards/${cardId}/review/`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ correct }),
        },
      );
      return response.ok;
    } catch {
      return false;
    }
  };

  const processReviewQueue = useCallback(async () => {
    if (isQueueRunningRef.current) return;
    isQueueRunningRef.current = true;

    while (reviewQueueRef.current.length) {
      const current = reviewQueueRef.current[0];
      const success = await handleReviewUpdate(current.cardId, current.correct);
      if (success) {
        reviewQueueRef.current.shift();
        setPendingSyncCount(reviewQueueRef.current.length);
        continue;
      }
      current.attempts += 1;
      if (current.attempts >= 5) {
        setFailedSync((prev) => [
          ...prev,
          { cardId: current.cardId, correct: current.correct },
        ]);
        reviewQueueRef.current.shift();
        setPendingSyncCount(reviewQueueRef.current.length);
        continue;
      }
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }

    isQueueRunningRef.current = false;
  }, []);

  const enqueueReviewUpdate = useCallback(
    (cardId: number, correct: boolean) => {
      reviewQueueRef.current.push({ cardId, correct, attempts: 0 });
      setPendingSyncCount(reviewQueueRef.current.length);
      void processReviewQueue();
    },
    [processReviewQueue],
  );

  const retryFailedSync = () => {
    if (!failedSync.length) return;
    const retryItems = failedSync.map((item) => ({
      cardId: item.cardId,
      correct: item.correct,
      attempts: 0,
    }));
    setFailedSync([]);
    reviewQueueRef.current.push(...retryItems);
    setPendingSyncCount(reviewQueueRef.current.length);
    void processReviewQueue();
  };

  const handleCardResult = (correct: boolean) => {
    if (!currentCard) return;
    enqueueReviewUpdate(currentCard.id, correct);

    if (correct) {
      setShowCorrect(true);
      setTimeout(() => {
        setShowCorrect(false);
        advanceCard();
      }, 650);
      return;
    }
    advanceCard();
  };

  const cardContainerSx = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 3,
    width: "100%",
    maxWidth: 900,
    minHeight: 0,
    height: "100%",
    borderRadius: 3,
    border: "1px solid var(--panel-border)",
    bgcolor: "var(--panel-surface)",
    p: 4,
    textAlign: "center",
    overflow: "auto",
  } as const;
  const activeCardSx = {
    ...cardContainerSx,
    alignItems: "stretch",
    justifyContent: "stretch",
    bgcolor: "var(--color-dark-bg)",
    p: 0,
    gap: 0,
    "& > *": {
      width: "100%",
      height: "100%",
    },
  } as const;
  const allDone = !isLoading && !error && total > 0 && currentIndex >= total;
  const shouldHoldOnFinish =
    allDone && (pendingSyncCount > 0 || failedSync.length > 0);

  useEffect(() => {
    if (allDone && pendingSyncCount === 0 && failedSync.length === 0) {
      router.push("/panel/study");
    }
  }, [allDone, failedSync.length, pendingSyncCount, router]);

  return (
    <Container
      id="exam-screen"
      disableGutters
      maxWidth={false}
      sx={{
        display: "flex",
        width: 1,
        height: "100svh",
        paddingBottom: "6rem",
        boxSizing: "border-box",
      }}
    >
      <Box
        id="exam-container"
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "stretch",
          justifyContent: "flex-start",
          width: 1,
          height: 1,
          gap: 3,
          p: { xs: 0, sm: 1.5, md: 3 },
        }}
      >
        <Box
          id="exam-header"
          component="header"
          sx={{
            display: "grid",
            gridTemplateColumns: "1fr auto 1fr",
            alignItems: "center",
            gap: 3,
            width: "100%",
            maxWidth: 900,
            mx: "auto",
            borderRadius: 3,
            border: "1px solid var(--panel-border)",
            bgcolor: "var(--panel-surface)",
            p: 2.5,
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h6" fontWeight={700} noWrap>
              {boxName ? boxName : `Box ${boxIdNumber || ""}`}
            </Typography>
          </Box>
          <Typography variant="subtitle2" color="text.secondary" textAlign="center">
            {total ? `${currentIndex + 1} of ${total}` : "No cards loaded"}
          </Typography>
          {currentCard && (
            <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1.5 }}>
              <Chip
                label={`Level ${currentCard.level}`}
                variant="outlined"
                sx={{
                  borderColor: "var(--panel-border)",
                  color: "text.secondary",
                }}
              />
              <IconButton
                onClick={handleToggleImportant}
                disabled={isStarUpdating}
                sx={{
                  border: "1px solid var(--panel-border)",
                  bgcolor: "rgba(255,255,255,0.04)",
                  color: currentCard.is_important
                    ? "#FACC15"
                    : "text.secondary",
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  "&:hover": { bgcolor: "rgba(255,255,255,0.08)" },
                }}
              >
                {currentCard.is_important ? "★" : "☆"}
              </IconButton>
              <IconButton
                onClick={(event) => setMenuAnchor(event.currentTarget)}
                sx={{
                  border: "1px solid var(--panel-border)",
                  bgcolor: "rgba(255,255,255,0.04)",
                  color: "text.secondary",
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  "&:hover": { bgcolor: "rgba(255,255,255,0.08)" },
                }}
              >
                •••
              </IconButton>
            </Box>
          )}
        </Box>
        <Box
          id="exam-body"
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 3,
            flexGrow: 1,
            width: 1,
            minHeight: 0,
          }}
        >
          {isLoading && (
            <Box id="exam-card-loading" sx={cardContainerSx}>
              <Typography variant="body2" color="text.secondary">
                Loading cards...
              </Typography>
            </Box>
          )}
          {error && (
            <Box id="exam-card-error" sx={cardContainerSx}>
              <Box
                sx={{
                  borderRadius: 2,
                  border: "1px solid rgba(248, 113, 113, 0.4)",
                  bgcolor: "rgba(239, 68, 68, 0.12)",
                  px: 3,
                  py: 2,
                }}
              >
                <Typography variant="body2" color="error">
                  {error}
                </Typography>
              </Box>
            </Box>
          )}
          {!isLoading && !currentCard && !error && (
            <Box id="exam-card-empty" sx={cardContainerSx}>
              <Typography variant="body2" color="text.secondary">
                No cards match this study setup.
              </Typography>
            </Box>
          )}
          {shouldHoldOnFinish && (
            <Box id="exam-card-sync" sx={cardContainerSx}>
              <Typography variant="overline" color="text.secondary">
                Finishing sync
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Saving your last answers. You can wait here or retry failed
                updates.
              </Typography>
              {pendingSyncCount > 0 && (
                <Box
                  sx={{
                    borderRadius: 2,
                    border: "1px solid var(--panel-border)",
                    bgcolor: "rgba(255,255,255,0.04)",
                    px: 3,
                    py: 2,
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    Pending updates: {pendingSyncCount}
                  </Typography>
                </Box>
              )}
              {failedSync.length > 0 && (
                <Box
                  sx={{
                    borderRadius: 2,
                    border: "1px solid rgba(248, 113, 113, 0.4)",
                    bgcolor: "rgba(239, 68, 68, 0.12)",
                    px: 3,
                    py: 2,
                  }}
                >
                  <Typography variant="body2" color="error">
                    Failed updates: {failedSync.length}
                  </Typography>
                </Box>
              )}
              {failedSync.length > 0 && (
                <ActionButton action="submit" onClick={retryFailedSync}>
                  Retry failed updates
                </ActionButton>
              )}
            </Box>
          )}
          {!shouldHoldOnFinish && !isLoading && !error && currentCard && (
            <Box id="exam-card-active" sx={activeCardSx}>
              {currentCard.config.type === "spelling" ? (
                <SpellingExam
                  key={`spelling-${currentCard.id}`}
                  value={currentCard.config as SpellingConfig}
                  onResult={handleCardResult}
                />
              ) : currentCard.config.type === "multiple-choice" ? (
                <MultipleChoiceExam
                  key={`multiple-choice-${currentCard.id}`}
                  value={currentCard.config as MultipleChoiceConfig}
                  onResult={handleCardResult}
                />
              ) : currentCard.config.type === "standard" ? (
                <StandardExam
                  key={`standard-${currentCard.id}`}
                  value={currentCard.config as StandardConfig}
                  onResult={handleCardResult}
                />
              ) : currentCard.config.type === "word-standard" ? (
                <WordStandardExam
                  key={`word-standard-${currentCard.id}`}
                  value={currentCard.config as WordStandardConfig}
                  onResult={handleCardResult}
                />
              ) : currentCard.config.type === "german-verb-conjugator" ? (
                <GermanVerbConjugatorExam
                  key={`german-verb-${currentCard.id}`}
                  value={currentCard.config as GermanVerbConfig}
                  onResult={handleCardResult}
                />
              ) : currentCard.config.type === "ai-reviewer" ? (
                <AiReviewerExam
                  key={`ai-reviewer-${currentCard.id}`}
                  cardId={currentCard.id}
                  value={currentCard.config as AiReviewerConfig}
                  onResult={handleCardResult}
                />
              ) : (
                <Box sx={{ display: "grid", gap: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Exam mode for this card type isn’t ready yet.
                  </Typography>
                  <ActionButton
                    action="cancel"
                    onClick={() => handleCardResult(false)}
                  >
                    Skip card
                  </ActionButton>
                </Box>
              )}
            </Box>
          )}
        </Box>
      </Box>
      {showCorrect && (
        <Box
          sx={{
            pointerEvents: "none",
            position: "fixed",
            inset: 0,
            zIndex: 40,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Box
            sx={{
              borderRadius: 999,
              border: "1px solid rgba(52, 211, 153, 0.4)",
              bgcolor: "rgba(16, 185, 129, 0.2)",
              px: 4,
              py: 2,
              textTransform: "uppercase",
              letterSpacing: "0.3em",
              color: "rgba(167, 243, 208, 1)",
              boxShadow: "0 10px 30px rgba(16, 185, 129, 0.2)",
            }}
          >
            Correct
          </Box>
        </Box>
      )}
      {deleteTarget && (
        <Box
          sx={{
            position: "fixed",
            inset: 0,
            zIndex: 40,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            px: 3,
            py: 6,
          }}
        >
          <Box
            onClick={() => setDeleteTarget(null)}
            sx={{ position: "fixed", inset: 0, bgcolor: "rgba(0,0,0,0.6)" }}
          />
          <Box
            sx={{
              position: "relative",
              zIndex: 1,
              width: "100%",
              maxWidth: 480,
              borderRadius: 3,
              border: "1px solid var(--panel-border)",
              bgcolor: "var(--color-dark-bg)",
              p: 3,
            }}
          >
            <Typography variant="h6" fontWeight={700}>
              Delete card
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Delete card #{deleteTarget.id}? This cannot be undone.
            </Typography>
            <Box
              sx={{
                mt: 3,
                display: "flex",
                gap: 2,
                justifyContent: "space-between",
              }}
            >
              <ActionButton
                action="cancel"
                onClick={() => setDeleteTarget(null)}
              >
                Cancel
              </ActionButton>
              <ActionButton
                action="delete"
                onClick={() => handleDelete(deleteTarget)}
              >
                Delete
              </ActionButton>
            </Box>
          </Box>
        </Box>
      )}
      {editTarget && (
        <Box
          sx={{
            position: "fixed",
            inset: 0,
            zIndex: 40,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            px: 3,
            py: 6,
          }}
        >
          <Box
            onClick={() => setEditTarget(null)}
            sx={{ position: "fixed", inset: 0, bgcolor: "rgba(0,0,0,0.6)" }}
          />
          <Box
            sx={{
              position: "relative",
              zIndex: 1,
              width: "100%",
              maxWidth: 720,
              borderRadius: 3,
              border: "1px solid var(--panel-border)",
              bgcolor: "var(--color-dark-bg)",
              p: 3,
            }}
          >
            <Typography variant="h6" fontWeight={700}>
              Edit card
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Update the card fields. Level and group cannot be changed here.
            </Typography>
            {editConfig && (
              <Box sx={{ mt: 3 }}>
                <CardCreateFactory
                  type={editConfig.type as CardType}
                  value={editConfig}
                  onChange={setEditConfig}
                />
              </Box>
            )}
            {editError && (
              <Box
                sx={{
                  mt: 2,
                  borderRadius: 2,
                  border: "1px solid rgba(248, 113, 113, 0.4)",
                  bgcolor: "rgba(239, 68, 68, 0.12)",
                  px: 3,
                  py: 2,
                }}
              >
                <Typography variant="body2" color="error">
                  {editError}
                </Typography>
              </Box>
            )}
            <Box
              sx={{
                mt: 3,
                display: "flex",
                gap: 2,
                justifyContent: "space-between",
              }}
            >
              <ActionButton action="cancel" onClick={() => setEditTarget(null)}>
                Cancel
              </ActionButton>
              <ActionButton action="submit" onClick={handleEditSave}>
                Save changes
              </ActionButton>
            </Box>
          </Box>
        </Box>
      )}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
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
            if (!currentCard) return;
            openEditModal(currentCard);
            setMenuAnchor(null);
          }}
        >
          Edit card
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (!currentCard) return;
            setDeleteTarget(currentCard);
            setMenuAnchor(null);
          }}
          sx={{ color: "error.main" }}
        >
          Delete card
        </MenuItem>
      </Menu>
    </Container>
  );
}
