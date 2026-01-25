"use client";

import ActionButton from "@/components/buttons/ActionButton";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import { useState } from "react";

type HistoryReview = {
  score: number;
  mistakes: Array<{
    type: string;
    incorrect: string;
    correct: string;
  }>;
  feedbacks?: string[];
};

type ExerciseHistoryItem = {
  id: number;
  question: string;
  answer: string;
  review: HistoryReview;
  created_at: string;
};

type Props = {
  isOpen: boolean;
  item: ExerciseHistoryItem | null;
  onClose: () => void;
};

export default function ExerciseHistoryDetailModal({
  isOpen,
  item,
  onClose,
}: Props) {
  const [tab, setTab] = useState(0);
  if (!isOpen || !item) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center px-6 py-12">
      <button
        type="button"
        onClick={onClose}
        className="fixed inset-0 bg-black/60"
        aria-label="Close exercise history detail"
      />
      <div className="relative z-10 w-full max-w-3xl rounded-3xl border border-white/10 bg-[var(--color-dark-bg)] p-6 text-white text-base">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-white/50">
              Exercise review
            </p>
            <h2 className="text-xl font-semibold">
              {new Date(item.created_at).toLocaleString()}
            </h2>
          </div>
          <ActionButton action="cancel" onClick={onClose}>
            Close
          </ActionButton>
        </div>

        <Tabs
          value={tab}
          onChange={(_, value) => setTab(value)}
          sx={{
            mt: 4,
            borderBottom: "1px solid var(--panel-border)",
            "& .MuiTab-root": {
              color: "rgba(238, 238, 238, 0.7)",
              textTransform: "none",
              fontWeight: 600,
            },
            "& .Mui-selected": { color: "#EEEEEE" },
            "& .MuiTabs-indicator": { bgcolor: "var(--color-action)" },
          }}
        >
          <Tab label="Review" />
          <Tab label="Mistakes" />
        </Tabs>

        {tab === 0 && (
          <div className="mt-5 space-y-4">
            <div className="rounded-2xl border border-white/10 bg-[#0B0D0E] p-4 text-base text-white/80">
              <div className="text-xs uppercase tracking-[0.2em] text-white/50">
                Question
              </div>
              <p className="mt-2">{item.question}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[#0B0D0E] p-4 text-base text-white/80">
              <div className="text-xs uppercase tracking-[0.2em] text-white/50">
                Answer
              </div>
              <p className="mt-2">{item.answer}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[#0B0D0E] p-4 text-base text-white/80">
              <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-white/60">
                <span>Review</span>
                <span className="rounded-full border border-emerald-400/40 bg-emerald-500/10 px-2 py-1 text-[10px] text-emerald-100">
                  Score {item.review.score}/10
                </span>
              </div>
              {item.review.feedbacks && item.review.feedbacks.length > 0 && (
                <ul className="mt-3 space-y-1 text-white/70 text-base">
                  {item.review.feedbacks.map((feedback, index) => (
                    <li key={`${item.id}-feedback-${index}`}>• {feedback}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {tab === 1 && (
          <div className="mt-5">
            {item.review.mistakes.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-[#0B0D0E] p-4 text-base text-white/70">
                No mistakes recorded for this attempt.
              </div>
            ) : (
              <div className="space-y-2">
                {item.review.mistakes.map((mistake, index) => (
                  <div
                    key={`${item.id}-mistake-${index}`}
                    className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-3 py-2"
                  >
                    <div className="text-xs uppercase tracking-[0.2em] text-rose-200">
                      {mistake.type}
                    </div>
                    <div className="mt-1 text-sm text-white/70">
                      <span className="text-rose-200">Incorrect:</span>{" "}
                      {mistake.incorrect}
                    </div>
                    <div className="mt-1 text-sm text-white/70">
                      <span className="text-emerald-200">Correct:</span>{" "}
                      {mistake.correct}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
