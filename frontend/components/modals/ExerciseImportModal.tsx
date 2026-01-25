"use client";

import type { FormEvent } from "react";
import ActionButton from "@/components/buttons/ActionButton";
import TextArea from "@/components/forms/TextArea";

type Props = {
  isOpen: boolean;
  bulkJson: string;
  bulkErrors: string[];
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onBulkChange: (value: string) => void;
};

export default function ExerciseImportModal({
  isOpen,
  bulkJson,
  bulkErrors,
  onClose,
  onSubmit,
  onBulkChange,
}: Props) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center px-6 py-12">
      <button
        type="button"
        onClick={onClose}
        className="fixed inset-0 bg-black/60"
        aria-label="Close JSON exercise import"
      />
      <div className="relative z-10 w-full max-w-2xl rounded-3xl border border-white/10 bg-[#0B0D0E] p-6 text-white">
        <h2 className="text-lg font-semibold">Import exercises JSON</h2>
        <form onSubmit={onSubmit} className="mt-4 flex flex-col gap-6">
          <TextArea
            label="JSON payload"
            value={bulkJson}
            onChange={(event) => onBulkChange(event.target.value)}
            rows={8}
            className="resize-none"
            placeholder={`[\n  {\n    \"title\": \"Vocabulary drill\",\n    \"question_making_prompt\": \"Create 5 short exercises\",\n    \"evaluate_prompt\": \"Check grammar and meaning\"\n  }\n]`}
            inputProps={{ style: { fontFamily: "var(--font-app-mono)" } }}
          />
          {bulkErrors.length > 0 && (
            <div className="rounded-2xl border border-rose-400/40 bg-rose-500/10 p-4 text-sm text-rose-100">
              {bulkErrors.map((item) => (
                <div key={item}>{item}</div>
              ))}
            </div>
          )}
          <div className="flex justify-end gap-3">
            <ActionButton action="cancel" onClick={onClose}>
              Cancel
            </ActionButton>
            <ActionButton action="submit" type="submit">
              Import exercises
            </ActionButton>
          </div>
        </form>
      </div>
    </div>
  );
}
