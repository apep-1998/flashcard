import { useEffect, useMemo, useRef, useState } from "react";
import AudioButton from "@/components/cards/view/AudioButton";
import ActionButton from "@/components/buttons/ActionButton";
import TextInput from "@/components/forms/TextInput";
import type { GermanVerbConfig } from "@/lib/schemas/cards";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

type Props = {
  value: GermanVerbConfig;
  isBusy?: boolean;
  onResult: (isCorrect: boolean) => void;
};

const normalize = (input: string) => input.trim().toLowerCase();

export default function GermanVerbConjugatorExam({
  value,
  isBusy,
  onResult,
}: Props) {
  const fields = useMemo(
    () => [
      { key: "ich", label: "ich", expected: value.ich },
      { key: "du", label: "du", expected: value.du },
      { key: "er/sie/es", label: "er/sie/es", expected: value["er/sie/es"] },
      { key: "wir", label: "wir", expected: value.wir },
      { key: "ihr", label: "ihr", expected: value.ihr },
      { key: "sie", label: "sie", expected: value.sie },
    ],
    [value],
  );

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [review, setReview] = useState(false);
  const ichRef = useRef<HTMLInputElement | null>(null);

  const handleChange = (key: string, next: string) => {
    setAnswers((current) => ({ ...current, [key]: next }));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const allCorrect = fields.every((field) => {
      const answer = answers[field.key] ?? "";
      return normalize(answer) === normalize(field.expected);
    });
    if (allCorrect) {
      onResult(true);
      setAnswers({});
      return;
    }
    setReview(true);
  };

  const handleFinishReview = () => {
    if (isBusy) return;
    setReview(false);
    setAnswers({});
    onResult(false);
  };

  useEffect(() => {
    if (!review) {
      ichRef.current?.focus();
    }
  }, [value, review]);

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
            Review the conjugations
          </Typography>
          <Box
            sx={{
              mt: 3,
              borderRadius: 2,
              border: "1px solid var(--panel-border)",
              bgcolor: "rgba(255,255,255,0.04)",
              p: 3,
            }}
          >
            <Typography variant="overline" color="text.secondary">
              Expected conjugations
            </Typography>
            <Box sx={{ mt: 2, display: "grid", gap: 2, gridTemplateColumns: { md: "1fr 1fr" } }}>
              {fields.map((field) => {
                const answer = answers[field.key] ?? "";
                const isCorrect = normalize(answer) === normalize(field.expected);
                return (
                  <Box
                    key={field.key}
                    sx={{
                      borderRadius: 2,
                      border: `1px solid ${
                        isCorrect ? "rgba(52, 211, 153, 0.4)" : "rgba(248, 113, 113, 0.4)"
                      }`,
                      bgcolor: isCorrect
                        ? "rgba(16, 185, 129, 0.12)"
                        : "rgba(239, 68, 68, 0.12)",
                      px: 3,
                      py: 2,
                      textAlign: "left",
                    }}
                  >
                    <Typography variant="overline" color="text.secondary">
                      {field.label}
                    </Typography>
                    <Typography variant="h6" fontWeight={600}>
                      {field.expected}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Your answer: {answer.trim() ? answer : "—"}
                    </Typography>
                  </Box>
                );
              })}
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
            Conjugate the verb
          </Typography>
          <Typography variant="h4" fontWeight={700} sx={{ mt: 1 }}>
            {value.verb || "—"}
          </Typography>
          {value.voice_file_url && (
            <Box sx={{ mt: 2, display: "flex", justifyContent: "center" }}>
              <AudioButton src={value.voice_file_url} autoPlay />
            </Box>
          )}
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Leave blank to review the correct answers.
          </Typography>
          <Box sx={{ mt: 3, display: "grid", gap: 2, gridTemplateColumns: { md: "1fr 1fr" } }}>
            {fields.map((field) => (
              <TextInput
                key={field.key}
                label={field.label}
                value={answers[field.key] ?? ""}
                onChange={(event) =>
                  handleChange(field.key, event.target.value)
                }
                disabled={isBusy}
                inputRef={field.key === "ich" ? ichRef : undefined}
                placeholder="Type conjugation"
              />
            ))}
          </Box>
          <ActionButton
            action="submit"
            type="submit"
            disabled={isBusy}
            sx={{ mt: 3, alignSelf: "center" }}
          >
            {isBusy ? "Saving..." : "Evaluate"}
          </ActionButton>
        </>
      )}
    </Box>
  );
}
