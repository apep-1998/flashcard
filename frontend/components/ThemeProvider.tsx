"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ThemeProvider as MuiThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { applyTheme, getStoredTheme, type Theme } from "@/lib/theme";
import { createAppTheme } from "@/lib/muiTheme";

type Props = {
  children: ReactNode;
};

export default function ThemeProvider({ children }: Props) {
  const [mode, setMode] = useState<Theme>("dark");
  const muiTheme = useMemo(() => createAppTheme(mode), [mode]);

  useEffect(() => {
    const stored = getStoredTheme() ?? "dark";
    applyTheme(stored);
    setMode(stored);

    const handleThemeChange = (event: Event) => {
      const detail = (event as CustomEvent).detail;
      if (detail === "dark" || detail === "light") {
        setMode(detail);
        applyTheme(detail);
        return;
      }
      const fallback = getStoredTheme() ?? "dark";
      setMode(fallback);
      applyTheme(fallback);
    };

    const handleStorage = () => {
      const next = getStoredTheme() ?? "dark";
      setMode(next);
      applyTheme(next);
    };

    window.addEventListener("theme-change", handleThemeChange);
    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener("theme-change", handleThemeChange);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  return (
    <MuiThemeProvider theme={muiTheme}>
      <CssBaseline />
      {children}
    </MuiThemeProvider>
  );
}
