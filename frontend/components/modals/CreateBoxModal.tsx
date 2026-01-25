"use client";

import type { FormEvent } from "react";
import TextArea from "@/components/forms/TextArea";
import TextInput from "@/components/forms/TextInput";
import ActionButton from "@/components/buttons/ActionButton";

type Props = {
  isOpen: boolean;
  isEditing: boolean;
  name: string;
  description: string;
  error: string;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onNameChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
};

export default function CreateBoxModal({
  isOpen,
  isEditing,
  name,
  description,
  error,
  onClose,
  onSubmit,
  onNameChange,
  onDescriptionChange,
}: Props) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center px-6 py-12">
      <button
        type="button"
        aria-label="Close box form"
        onClick={onClose}
        className="fixed inset-0 bg-black/60"
      />
      <form
        onSubmit={onSubmit}
        className="relative z-10 w-full max-w-lg rounded-3xl border border-white/10 bg-[#0B0D0E] p-6 shadow-2xl shadow-black/40"
      >
        <h2 className="text-lg font-semibold">
          {isEditing ? "Edit box" : "Create new box"}
        </h2>
        <p className="mt-2 text-sm text-white/70">
          Give your box a clear name and an optional description.
        </p>

        <TextInput
          label="Box name *"
          value={name}
          onChange={(event) => onNameChange(event.target.value)}
          placeholder="e.g. Product Design Glossary"
          sx={{ mt: 3 }}
        />

        <TextArea
          label="Description (optional)"
          value={description}
          onChange={(event) => onDescriptionChange(event.target.value)}
          rows={4}
          className="resize-none"
          placeholder="What will you practice in this box?"
          sx={{ mt: 3 }}
        />

        {error && (
          <div className="mt-4 rounded-2xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-xs text-red-100">
            {error}
          </div>
        )}

        <div className="mt-6 flex flex-wrap gap-3">
          <ActionButton action="cancel" onClick={onClose} fullWidth>
            Cancel
          </ActionButton>
          <ActionButton action="submit" type="submit" fullWidth>
            {isEditing ? "Save changes" : "Add box"}
          </ActionButton>
        </div>
      </form>
    </div>
  );
}
