import { useState } from "react";
import AudioButton from "@/components/cards/view/AudioButton";
import ActionButton from "@/components/buttons/ActionButton";
import type { MultipleChoiceConfig } from "@/lib/schemas/cards";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";

type Props = {
  value: MultipleChoiceConfig;
  isBusy?: boolean;
  onResult: (isCorrect: boolean) => void;
};

const normalize = (input: string) => input.trim().toLowerCase();

export default function MultipleChoiceExam({ value, isBusy, onResult }: Props) {
  const [review, setReview] = useState<null | { answer: string }>(null);

  const handleSelect = (option: string) => {
    if (isBusy || review) return;
    const isCorrect = normalize(option) === normalize(value.answer);
    if (isCorrect) {
      onResult(true);
      return;
    }
    setReview({ answer: option });
  };

  const handleFinishReview = () => {
    if (isBusy) return;
    setReview(null);
    onResult(false);
  };

  return (
    <Box
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
                Your answer: {review.answer}
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
                Correct answer: {value.answer}
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
            Multiple choice
          </Typography>
          <Typography variant="h6" fontWeight={600} sx={{ mt: 2 }}>
            {value.question || "—"}
          </Typography>
          {value.voice_file_url && (
            <Box sx={{ mt: 2, display: "flex", justifyContent: "center" }}>
              <AudioButton src={value.voice_file_url} autoPlay />
            </Box>
          )}
          {value.image_file_url && (
            <Box sx={{ mt: 2, display: "flex", justifyContent: "center" }}>
              <Box
                component="img"
                src={value.image_file_url}
                alt="Question visual"
                sx={{
                  height: 160,
                  width: 160,
                  borderRadius: 2,
                  border: "1px solid var(--panel-border)",
                  objectFit: "cover",
                }}
              />
            </Box>
          )}
          <Box sx={{ mt: 3, display: "grid", gap: 1.5, textAlign: "left" }}>
            {value.options.map((option, index) => (
              <Button
                key={`${option}-${index}`}
                type="button"
                onClick={() => handleSelect(option)}
                disabled={isBusy}
                sx={{
                  justifyContent: "flex-start",
                  borderRadius: 2,
                  border: "1px solid var(--panel-border)",
                  bgcolor: "rgba(255,255,255,0.04)",
                  color: "#EEEEEE",
                  textTransform: "none",
                  fontWeight: 600,
                  px: 2,
                  py: 1.5,
                  "&:hover": {
                    bgcolor: "rgba(255,255,255,0.08)",
                    borderColor: "rgba(255,255,255,0.4)",
                  },
                }}
              >
                {option || `Option ${index + 1}`}
              </Button>
            ))}
          </Box>
        </>
      )}
    </Box>
  );
}
