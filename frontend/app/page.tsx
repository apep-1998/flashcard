"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getStoredTokens,
  isTokenExpired,
  loginUser,
  refreshAccessToken,
  registerUser,
} from "@/lib/auth";

type AuthMode = "login" | "register";

export default function Home() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      const tokens = getStoredTokens();
      if (!tokens) {
        setIsCheckingSession(false);
        return;
      }

      if (!isTokenExpired(tokens.access)) {
        router.push("/panel");
        return;
      }

      try {
        await refreshAccessToken(tokens.refresh);
        router.push("/panel");
        return;
      } catch {
        setIsCheckingSession(false);
      }
    };

    checkSession();
  }, []);

  useEffect(() => {
    setError("");
  }, [mode]);

  const helperText = useMemo(() => {
    if (mode === "login") {
      return "Sign in to continue to your learning panel.";
    }
    return "Create your learner profile to start building boxes.";
  }, [mode]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !password.trim() || (mode === "register" && !name)) {
      setError("Please complete all required fields.");
      setIsSubmitting(false);
      return;
    }

    try {
      if (mode === "register") {
        await registerUser({ name, email: trimmedEmail, password });
      }
      await loginUser({ email: trimmedEmail, password });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setIsSubmitting(false);
      return;
    }

    router.push("/panel");
  };

  if (isCheckingSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0f141b] text-white">
        Checking session...
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0f141b] px-6 py-16 text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-12 h-80 w-80 rounded-full bg-[#2b59ff] opacity-20 blur-[120px]" />
        <div className="absolute bottom-16 right-0 h-96 w-96 rounded-full bg-[#f97316] opacity-15 blur-[140px]" />
        <div className="absolute left-1/2 top-1/2 h-52 w-52 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10" />
      </div>

      <main className="relative grid w-full max-w-5xl gap-12 rounded-[32px] border border-white/10 bg-white/5 p-8 backdrop-blur-xl md:grid-cols-[1.1fr_0.9fr] md:p-12">
        <section className="flex flex-col justify-between gap-8">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-1 text-xs uppercase tracking-[0.2em] text-white/70">
              Daily Recall
            </div>
            <h1 className="text-3xl font-semibold leading-tight md:text-4xl">
              Build boxes of flashcards and practice every day.
            </h1>
            <p className="max-w-lg text-sm leading-relaxed text-white/70 md:text-base">
              Organize multiple card types, track your practice streak, and
              improve retention with a focused learning flow.
            </p>
          </div>

          <div className="grid gap-4 text-sm text-white/70">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              Keep card types together: definition, cloze, image, or drill.
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              Practice sessions are designed for quick daily momentum.
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-[#111827] p-6">
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 p-1">
            <button
              type="button"
              onClick={() => setMode("login")}
              className={`flex-1 rounded-full px-4 py-2 text-sm font-medium transition ${
                mode === "login"
                  ? "bg-white text-[#111827]"
                  : "text-white/60 hover:text-white"
              }`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => setMode("register")}
              className={`flex-1 rounded-full px-4 py-2 text-sm font-medium transition ${
                mode === "register"
                  ? "bg-white text-[#111827]"
                  : "text-white/60 hover:text-white"
              }`}
            >
              Register
            </button>
          </div>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            {mode === "register" && (
              <label className="block text-sm text-white/70">
                Name
                <input
                  type="text"
                  name="name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-white/40"
                  placeholder="Taylor Lee"
                />
              </label>
            )}

            <label className="block text-sm text-white/70">
              Email
              <input
                type="email"
                name="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-white/40"
                placeholder="you@example.com"
              />
            </label>

            <label className="block text-sm text-white/70">
              Password
              <input
                type="password"
                name="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-white/40"
                placeholder="••••••••"
              />
            </label>

            {error && (
              <div className="rounded-2xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-xs text-red-100">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-2xl bg-[#2b59ff] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#1f46d8] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting
                ? "Working..."
                : mode === "login"
                  ? "Sign in"
                  : "Create account"}
            </button>

            <p className="text-xs text-white/60">{helperText}</p>
          </form>
        </section>
      </main>
    </div>
  );
}
