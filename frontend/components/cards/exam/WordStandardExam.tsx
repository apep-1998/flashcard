import { useEffect, useState } from "react";
import AudioButton from "@/components/cards/view/AudioButton";
import MarkdownText from "@/components/common/MarkdownText";
import ActionButton from "@/components/buttons/ActionButton";
import type { WordStandardConfig } from "@/lib/schemas/cards";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";

type Props = {
  value: WordStandardConfig;
  isBusy?: boolean;
  onResult: (isCorrect: boolean) => void;
};

export default function WordStandardExam({ value, isBusy, onResult }: Props) {
  const [isFlipped, setIsFlipped] = useState(false);

  useEffect(() => {
    setIsFlipped(false);
  }, [value.word, value.back]);

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
      <Typography variant="overline" color="text.secondary">
        Define the word
      </Typography>
      <Box sx={{ mt: 3, display: "grid", gap: 3 }}>
        <Box>
          <Typography variant="h6" fontWeight={600}>
            {value.word || "—"}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {value.part_of_speech || ""}
          </Typography>
          {value.voice_file_url && (
            <Box sx={{ mt: 2, display: "flex", justifyContent: "center" }}>
              <AudioButton src={value.voice_file_url} autoPlay />
            </Box>
          )}
        </Box>
        {isFlipped && (
          <Box>
            <Typography variant="overline" color="text.secondary">
              Back
            </Typography>
            <Typography variant="h6" fontWeight={600} sx={{ mt: 1 }}>
              <MarkdownText content={value.back} />
            </Typography>
          </Box>
        )}
      </Box>

      <Box sx={{ mt: 3, display: "flex", justifyContent: "center" }}>
        {!isFlipped ? (
          <ActionButton
            action="submit"
            disabled={isBusy}
            onClick={() => setIsFlipped(true)}
            sx={{ minWidth: 160 }}
          >
            Flip card
          </ActionButton>
        ) : (
          <Box sx={{ display: "flex", gap: 2, width: "100%" }}>
            <Button
              type="button"
              disabled={isBusy}
              onClick={() => onResult(true)}
              sx={{
                flex: 1,
                borderRadius: 2,
                border: "1px solid rgba(52, 211, 153, 0.4)",
                bgcolor: "rgba(16, 185, 129, 0.2)",
                color: "rgba(167, 243, 208, 1)",
                textTransform: "none",
                fontWeight: 700,
                "&:hover": { bgcolor: "rgba(16, 185, 129, 0.3)" },
              }}
            >
              {isBusy ? "Saving..." : "Correct"}
            </Button>
            <Button
              type="button"
              disabled={isBusy}
              onClick={() => onResult(false)}
              sx={{
                flex: 1,
                borderRadius: 2,
                border: "1px solid rgba(248, 113, 113, 0.4)",
                bgcolor: "rgba(239, 68, 68, 0.2)",
                color: "rgba(254, 202, 202, 1)",
                textTransform: "none",
                fontWeight: 700,
                "&:hover": { bgcolor: "rgba(239, 68, 68, 0.3)" },
              }}
            >
              {isBusy ? "Saving..." : "Incorrect"}
            </Button>
          </Box>
        )}
      </Box>
    </Box>
  );
}
