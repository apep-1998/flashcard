import { useMemo, useState, useRef, useEffect } from "react";
import AudioButton from "@/components/cards/view/AudioButton";
import ActionButton from "@/components/buttons/ActionButton";
import TextInput from "@/components/forms/TextInput";
import type { SpellingConfig } from "@/lib/schemas/cards";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

type Props = {
  value: SpellingConfig;
  isBusy?: boolean;
  onResult: (isCorrect: boolean) => void;
};

const normalize = (input: string) => input.trim().toLowerCase();

export default function SpellingExam({ value, isBusy, onResult }: Props) {
  const [answer, setAnswer] = useState("");
  const [review, setReview] = useState<null | { answer: string }>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const expected = useMemo(
    () => normalize(value.spelling),
    [value.spelling],
  );

  useEffect(() => {
    if (!review) {
      inputRef.current?.focus();
    }
  }, [value, review]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isBusy) return;
    const cleaned = normalize(answer);
    if (!cleaned) {
      setReview({ answer: "" });
      setAnswer("");
      return;
    }
    const isCorrect = cleaned === expected;
    if (isCorrect) {
      onResult(true);
      setAnswer("");
      return;
    }
    setReview({ answer });
    setAnswer("");
  };

  const handleFinishReview = () => {
    if (isBusy) return;
    setReview(null);
    onResult(false);
  };

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
            Review the answer
          </Typography>
          <Box sx={{ mt: 3, display: "flex", flexDirection: "column", gap: 2 }}>
            <Box
              sx={{
                borderRadius: 2,
                border: "1px solid rgba(248, 113, 113, 0.4)",
                bgcolor: "rgba(239, 68, 68, 0.12)",
                px: 3,
                py: 2,
              }}
            >
              <Typography variant="subtitle1" color="error.light">
                Your answer: {review.answer ? review.answer : "—"}
              </Typography>
            </Box>
            <Box
              sx={{
                borderRadius: 2,
                border: "1px solid rgba(52, 211, 153, 0.4)",
                bgcolor: "rgba(16, 185, 129, 0.12)",
                px: 3,
                py: 2,
              }}
            >
              <Typography variant="subtitle1" color="success.light">
                Correct: {value.spelling}
              </Typography>
            </Box>
          </Box>
          <ActionButton
            action="submit"
            disabled={isBusy}
            onClick={handleFinishReview}
            sx={{ mt: 3, alignSelf: "center" }}
          >
            Finish review
          </ActionButton>
        </>
      ) : (
        <>
          <Typography variant="overline" color="text.secondary">
            Listen and spell
          </Typography>
          {value.front ? (
            <Typography variant="h6" fontWeight={600} sx={{ mt: 2 }}>
              {value.front}
            </Typography>
          ) : null}
          {value.voice_file_url ? (
            <Box sx={{ mt: 2, display: "flex", justifyContent: "center" }}>
              <AudioButton src={value.voice_file_url} autoPlay />
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              No audio file available.
            </Typography>
          )}

          <Box sx={{ mt: 3 }}>
            <TextInput
              label="Your answer"
              value={answer}
              onChange={(event) => setAnswer(event.target.value)}
              disabled={isBusy}
              inputRef={inputRef}
              placeholder="Type the spelling"
            />
          </Box>

          <ActionButton
            action="submit"
            type="submit"
            disabled={isBusy}
            sx={{ mt: 3, alignSelf: "center" }}
          >
            {isBusy ? "Checking..." : "Submit"}
          </ActionButton>
        </>
      )}
    </Box>
  );
}
