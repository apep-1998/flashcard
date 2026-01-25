import { useEffect, useRef, useState } from "react";
import { apiFetch, getApiBaseUrl } from "@/lib/auth";
import ActionButton from "@/components/buttons/ActionButton";
import TextArea from "@/components/forms/TextArea";
import type { AiReviewerConfig } from "@/lib/schemas/cards";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

type ReviewData = {
  score: number;
  mistakes: Array<{
    type: string;
    incorrect: string;
    correct: string;
  }>;
};

type Props = {
  value: AiReviewerConfig;
  cardId?: number;
  isBusy?: boolean;
  onResult: (isCorrect: boolean) => void;
};

export default function AiReviewerExam({
  value,
  cardId,
  isBusy,
  onResult,
}: Props) {
  const [answer, setAnswer] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [review, setReview] = useState<ReviewData | null>(null);
  const [isCorrect, setIsCorrect] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (!review) {
      inputRef.current?.focus();
    }
  }, [value, review]);

  const handleSubmit = async (
    event:
      | React.FormEvent<HTMLFormElement>
      | React.KeyboardEvent<HTMLTextAreaElement>,
  ) => {
    event.preventDefault();
    const trimmed = answer.trim();
    if (!trimmed) {
      setError("Answer is required.");
      return;
    }
    if (!cardId) {
      setError("Card is missing an id.");
      return;
    }
    setError("");
    setIsSubmitting(true);
    try {
      const response = await apiFetch(
        `${getApiBaseUrl()}/api/cards/${cardId}/ai-review/`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ answer: trimmed }),
        },
      );
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data?.detail || "Unable to review answer.");
      }
      const data = (await response.json()) as ReviewData;
      const correct = data.score >= 7;
      const shouldReview = data.score < 10 || data.mistakes.length > 0;
      setIsCorrect(correct);
      setAnswer("");
      if (!shouldReview) {
        onResult(correct);
        return;
      }
      setReview(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to submit answer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinishReview = () => {
    if (isSubmitting || isBusy) return;
    setReview(null);
    onResult(isCorrect);
  };

  const isLocked = isSubmitting || isBusy;

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        height: "100%",
        borderRadius: 3,
        border: "1px solid var(--panel-border)",
        bgcolor: "var(--color-dark-bg)",
        p: 3,
        textAlign: "center",
      }}
    >
      {review ? (
        <>
          <Typography variant="overline" color="text.secondary">
            AI review
          </Typography>
          <Box
            sx={{
              mt: 3,
              borderRadius: 2,
              border: "1px solid var(--panel-border)",
              bgcolor: "rgba(255,255,255,0.04)",
              p: 3,
              textAlign: "left",
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Typography variant="overline" color="text.secondary">
                Score
              </Typography>
              <Typography variant="h6" fontWeight={700}>
                {review.score}/10
              </Typography>
            </Box>
            <Box sx={{ mt: 2, display: "grid", gap: 1.5 }}>
              {review.mistakes.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No mistakes were detected.
                </Typography>
              ) : (
                review.mistakes.map((mistake, index) => (
                  <Box
                    key={`${mistake.type}-${index}`}
                    sx={{
                      borderRadius: 2,
                      border: "1px solid var(--panel-border)",
                      bgcolor: "rgba(255,255,255,0.04)",
                      px: 2,
                      py: 1.5,
                    }}
                  >
                    <Typography variant="overline" color="text.secondary">
                      {mistake.type}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Incorrect:{" "}
                      <Box component="span" sx={{ color: "text.primary" }}>
                        {mistake.incorrect?.toString() || "—"}
                      </Box>
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Correct:{" "}
                      <Box component="span" sx={{ color: "text.primary" }}>
                        {mistake.correct?.toString() || "—"}
                      </Box>
                    </Typography>
                  </Box>
                ))
              )}
            </Box>
          </Box>
          <ActionButton
            action="submit"
            disabled={isLocked}
            onClick={handleFinishReview}
            sx={{ mt: 3, alignSelf: "center" }}
          >
            {isLocked ? "Saving..." : "Finish review"}
          </ActionButton>
        </>
      ) : (
        <>
          <Typography variant="overline" color="text.secondary">
            AI review
          </Typography>
          <Typography variant="h6" fontWeight={600} sx={{ mt: 2 }}>
            {value.question || "—"}
          </Typography>
          <Box sx={{ mt: 3 }}>
            <TextArea
              label="Your answer"
              value={answer}
              onChange={(event) => setAnswer(event.target.value)}
              inputRef={inputRef}
              rows={6}
              placeholder="Write your answer here..."
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  if (!isLocked) {
                    handleSubmit(
                      event as unknown as React.FormEvent<HTMLFormElement>,
                    );
                  }
                }
              }}
            />
          </Box>

          {error && (
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
                {error}
              </Typography>
            </Box>
          )}

          <ActionButton
            action="submit"
            type="submit"
            disabled={isLocked}
            sx={{ mt: 3, alignSelf: "center" }}
          >
            {isSubmitting ? "Reviewing..." : "Submit"}
          </ActionButton>
        </>
      )}
    </Box>
  );
}
