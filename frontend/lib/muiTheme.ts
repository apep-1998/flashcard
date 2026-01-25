import { createTheme } from "@mui/material/styles";
import type { Theme } from "@/lib/theme";

const PALETTE = {
  dark: {
    accent: "#00ADB5",
    accentStrong: "#009AA1",
    background: "#000000",
    surface: "#0B0D0E",
    text: "#EEEEEE",
    textMuted: "rgba(238, 238, 238, 0.82)",
  },
  light: {
    accent: "#00ADB5",
    accentStrong: "#009AA1",
    background: "#EEEEEE",
    surface: "#FFFFFF",
    text: "#222831",
    textMuted: "rgba(34, 40, 49, 0.78)",
  },
};

export const createAppTheme = (mode: Theme) => {
  const palette = PALETTE[mode];
  return createTheme({
    palette: {
      mode,
      primary: { main: palette.accent },
      secondary: { main: palette.accentStrong },
      background: {
        default: palette.background,
        paper: palette.surface,
      },
      text: {
        primary: palette.text,
        secondary: palette.textMuted,
      },
    },
    shape: { borderRadius: 14 },
    typography: {
      fontFamily: "var(--font-app-sans), \"Segoe UI\", sans-serif",
      button: {
        textTransform: "none",
        fontWeight: 600,
        letterSpacing: 0.4,
      },
    },
    components: {
      MuiPaper: { styleOverrides: { root: { backgroundImage: "none" } } },
      MuiDrawer: { styleOverrides: { paper: { backgroundImage: "none" } } },
      MuiAppBar: { styleOverrides: { root: { backgroundImage: "none" } } },
    },
  });
};
