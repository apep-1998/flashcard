export type Theme = "dark" | "light";

const THEME_KEY = "learning-fast.theme";

export const getStoredTheme = (): Theme | null => {
  if (typeof window === "undefined") return null;
  const value = window.localStorage.getItem(THEME_KEY);
  if (value === "dark" || value === "light") {
    return value;
  }
  return null;
};

export const applyTheme = (theme: Theme) => {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.theme = theme;
};

export const setTheme = (theme: Theme) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(THEME_KEY, theme);
  applyTheme(theme);
};
