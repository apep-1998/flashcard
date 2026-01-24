"use client";

import { useEffect, type ReactNode } from "react";
import { applyTheme, getStoredTheme } from "@/lib/theme";

type Props = {
  children: ReactNode;
};

export default function ThemeProvider({ children }: Props) {
  useEffect(() => {
    applyTheme(getStoredTheme() ?? "dark");
  }, []);

  return <>{children}</>;
}
