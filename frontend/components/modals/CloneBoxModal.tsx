"use client";

import TextInput from "@/components/forms/TextInput";
import ActionButton from "@/components/buttons/ActionButton";

type Props = {
  isOpen: boolean;
  cloneCode: string;
  onClose: () => void;
  onClone: () => void;
  onCodeChange: (value: string) => void;
};

export default function CloneBoxModal({
  isOpen,
  cloneCode,
  onClose,
  onClone,
  onCodeChange,
}: Props) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center px-6 py-12">
      <button
        type="button"
        aria-label="Close clone dialog"
        onClick={onClose}
        className="fixed inset-0 bg-black/60"
      />
      <div className="relative z-10 w-full max-w-lg rounded-3xl border border-white/10 bg-[#0B0D0E] p-6 shadow-2xl shadow-black/40">
        <h2 className="text-lg font-semibold">Clone a box</h2>
        <p className="mt-2 text-sm text-white/70">
          Paste a share code to create a fresh copy of a box.
        </p>

        <TextInput
          label="Share code"
          value={cloneCode}
          onChange={(event) => onCodeChange(event.target.value)}
          placeholder="Paste share code"
          sx={{ mt: 3 }}
        />

        <div className="mt-6 flex flex-wrap gap-3">
          <ActionButton action="cancel" onClick={onClose} fullWidth>
            Cancel
          </ActionButton>
          <ActionButton action="submit" onClick={onClone} fullWidth>
            Clone box
          </ActionButton>
        </div>
      </div>
    </div>
  );
}
