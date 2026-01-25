"use client";

import type { FormEvent } from "react";
import ActionButton from "@/components/buttons/ActionButton";
import TextArea from "@/components/forms/TextArea";
import TextInput from "@/components/forms/TextInput";

type Props = {
  isOpen: boolean;
  isEditing: boolean;
  isReadOnly?: boolean;
  title: string;
  questionPrompt: string;
  evaluatePrompt: string;
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onTitleChange: (value: string) => void;
  onQuestionPromptChange: (value: string) => void;
  onEvaluatePromptChange: (value: string) => void;
};

export default function ExerciseCreateModal({
  isOpen,
  isEditing,
  isReadOnly = false,
  title,
  questionPrompt,
  evaluatePrompt,
  isSaving,
  onClose,
  onSubmit,
  onTitleChange,
  onQuestionPromptChange,
  onEvaluatePromptChange,
}: Props) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center px-6 py-12">
      <button
        type="button"
        onClick={onClose}
        className="fixed inset-0 bg-black/60"
        aria-label="Close create exercise"
      />
      <div className="relative z-10 w-full max-w-3xl rounded-3xl border border-white/10 bg-[#0B0D0E] p-6 text-white">
        <h2 className="text-lg font-semibold">
          {isEditing ? "Edit exercise" : "New exercise"}
        </h2>
        <form onSubmit={onSubmit} className="mt-4 flex flex-col gap-6">
          <TextInput
            label="Title"
            value={title}
            disabled={isReadOnly}
            onChange={(event) => onTitleChange(event.target.value)}
            placeholder="German sentence drill"
          />
          <TextArea
            label="Exercise making prompt"
            value={questionPrompt}
            disabled={isReadOnly}
            onChange={(event) => onQuestionPromptChange(event.target.value)}
            rows={8}
            className="resize-none"
            placeholder="Generate short exercises about..."
          />
          <TextArea
            label="Evaluate prompt"
            value={evaluatePrompt}
            disabled={isReadOnly}
            onChange={(event) => onEvaluatePromptChange(event.target.value)}
            rows={8}
            className="resize-none"
            placeholder="Check the answer for..."
          />
          <div className="flex justify-end gap-3">
            <ActionButton action="cancel" onClick={onClose}>
              Close
            </ActionButton>
            {!isReadOnly && (
              <ActionButton action="submit" type="submit" disabled={isSaving}>
                {isSaving ? "Saving..." : "Save exercise"}
              </ActionButton>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
