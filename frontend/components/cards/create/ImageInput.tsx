"use client";

import { useState } from "react";
import { apiFetch, getApiBaseUrl } from "@/lib/auth";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import TextInput from "@/components/forms/TextInput";

type Mode = "url" | "upload";

type Props = {
  label: string;
  value: string;
  onChange: (next: string) => void;
};

export default function ImageInput({ label, value, onChange }: Props) {
  const [mode, setMode] = useState<Mode>("url");
  const [error, setError] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = async (file: File) => {
    setError("");
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file, file.name);
      const response = await apiFetch(`${getApiBaseUrl()}/api/uploads/`, {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        throw new Error("Upload failed.");
      }
      const data = (await response.json()) as { url: string };
      onChange(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm text-white/70">{label}</span>
        <ToggleButtonGroup
          value={mode}
          exclusive
          onChange={(_, value) => {
            if (value) setMode(value);
          }}
          sx={{
            bgcolor: "#0B0D0E",
            borderRadius: 0.5,
            "& .MuiToggleButton-root": {
              color: "#EEEEEE",
              borderColor: "var(--panel-border)",
              textTransform: "none",
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "0.02em",
              fontFamily: "var(--font-app-sans), \"Segoe UI\", sans-serif",
              px: 1.5,
              py: 0.4,
            },
            "& .Mui-selected": {
              bgcolor: "var(--color-dark-selected)",
              color: "#EEEEEE",
            },
          }}
        >
          <ToggleButton value="url">url</ToggleButton>
          <ToggleButton value="upload">upload</ToggleButton>
        </ToggleButtonGroup>
      </div>

      {mode === "url" && (
        <TextInput
          label="Image URL"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="https://cdn.example.com/image.png"
        />
      )}

      {mode === "upload" && (
        <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
          <input
            type="file"
            accept="image/*"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              handleUpload(file);
            }}
            className="text-sm text-white/70 file:mr-4 file:rounded-full file:border-0 file:bg-white/10 file:px-3 file:py-1 file:text-xs file:uppercase file:tracking-[0.2em] file:text-white/70"
          />
        </div>
      )}

      {value && (
        <div className="text-xs text-white/60">
          Current: <span className="text-white/80">{value}</span>
        </div>
      )}

      {isUploading && (
        <div className="text-xs text-white/60">Uploading image...</div>
      )}

      {error && (
        <div className="rounded-2xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-xs text-red-100">
          {error}
        </div>
      )}
    </div>
  );
}
