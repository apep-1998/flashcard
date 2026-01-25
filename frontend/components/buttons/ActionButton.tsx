"use client";

import Button from "@mui/material/Button";
import type { ButtonProps } from "@mui/material/Button";

type ActionKind = "delete" | "create" | "submit" | "cancel" | "exercise";

type Props = ButtonProps & {
  action: ActionKind;
};

const ACTION_STYLES: Record<ActionKind, ButtonProps["sx"]> = {
  create: {
    bgcolor: "var(--color-action)",
    color: "#EEEEEE",
    "&:hover": { bgcolor: "#13508f" },
  },
  submit: {
    bgcolor: "var(--color-action)",
    color: "#EEEEEE",
    "&:hover": { bgcolor: "#13508f" },
  },
  delete: {
    bgcolor: "#430A0A",
    color: "#EEEEEE",
    "&:hover": { bgcolor: "#320707" },
  },
  exercise: {
    bgcolor: "#042F04",
    color: "#EEEEEE",
    "&:hover": { bgcolor: "#032503" },
  },
  cancel: {
    bgcolor: "transparent",
    color: "#EEEEEE",
    border: "1px solid var(--panel-border)",
    "&:hover": { bgcolor: "rgba(50, 56, 62, 0.4)" },
  },
};

export default function ActionButton({ action, sx, ...props }: Props) {
  return (
    <Button
      {...props}
      sx={{
        borderRadius: 0.5,
        textTransform: "none",
        fontWeight: 700,
        ...ACTION_STYLES[action],
        ...sx,
      }}
    />
  );
}
