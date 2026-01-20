"use client";

import { useState } from "react";
import { apiFetch, getApiBaseUrl } from "@/lib/auth";

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
        <div className="flex gap-2 text-xs uppercase tracking-[0.2em] text-white/60">
          {(["url", "upload"] as Mode[]).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setMode(item)}
              className={`rounded-full border px-3 py-1 transition ${
                mode === item
                  ? "border-white/40 text-white"
                  : "border-white/10 text-white/60 hover:text-white"
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      {mode === "url" && (
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-white/40"
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
