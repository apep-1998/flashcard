"use client";

import { useRef, useState } from "react";
import { apiFetch, getApiBaseUrl } from "@/lib/auth";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import TextArea from "@/components/forms/TextArea";
import TextInput from "@/components/forms/TextInput";

type Mode = "url" | "upload" | "record" | "tts";

type Props = {
  label: string;
  value: string;
  onChange: (next: string) => void;
  ttsValue: string;
  onChangeTts: (next: string) => void;
  ttsLanguage: string;
  onChangeLanguage: (next: string) => void;
  required?: boolean;
};

const LANGUAGE_OPTIONS = [
  { value: "en", label: "English" },
  { value: "de", label: "German" },
  { value: "es", label: "Spanish" },
  { value: "fr", label: "French" },
];

export default function VoiceInput({
  label,
  value,
  onChange,
  ttsValue,
  onChangeTts,
  ttsLanguage,
  onChangeLanguage,
  required,
}: Props) {
  const [mode, setMode] = useState<Mode>("url");
  const [error, setError] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    setError("");
    if (!navigator?.mediaDevices?.getUserMedia) {
      setError("Audio recording is not supported in this browser.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        handleUploadBlob(blob, "recording.webm");
        setIsRecording(false);
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
    } catch (err) {
      setError("Unable to access the microphone.");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
  };

  const handleUploadBlob = async (blob: Blob, filename: string) => {
    setError("");
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", blob, filename);
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
    <div className="space-y-3 pt-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm text-white/70">
          {label}
          {required ? " *" : ""}
        </span>
        <ToggleButtonGroup
          value={mode}
          exclusive
          onChange={(_, value) => {
            if (!value) return;
            setMode(value);
            if (value === "tts" && !ttsLanguage) {
              onChangeLanguage("en");
            }
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
          <ToggleButton value="record">record</ToggleButton>
          <ToggleButton value="tts">tts</ToggleButton>
        </ToggleButtonGroup>
      </div>

      {mode === "url" && (
        <TextInput
          label="Audio URL"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="https://cdn.example.com/audio.mp3"
        />
      )}

      {mode === "upload" && (
        <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
          <input
            type="file"
            accept="audio/*"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              handleUploadBlob(file, file.name);
            }}
            className="text-sm text-white/70 file:mr-4 file:rounded-full file:border-0 file:bg-white/10 file:px-3 file:py-1 file:text-xs file:uppercase file:tracking-[0.2em] file:text-white/70"
          />
        </div>
      )}

      {mode === "record" && (
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={isRecording ? stopRecording : startRecording}
            className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${
              isRecording
                ? "bg-red-500/80 text-white hover:bg-red-500"
                : "bg-white/10 text-white hover:bg-white/20"
            }`}
          >
            {isRecording ? "Stop recording" : "Start recording"}
          </button>
          <button
            type="button"
            onClick={() => onChange("")}
            className="rounded-2xl border border-white/20 px-4 py-3 text-sm text-white/70 transition hover:text-white"
          >
            Clear audio
          </button>
        </div>
      )}

      {isUploading && (
        <div className="text-xs text-white/60">Uploading audio...</div>
      )}

      {mode === "tts" && (
        <div className="space-y-3">
          <TextArea
            label="Text to speech"
            value={ttsValue}
            onChange={(event) => onChangeTts(event.target.value)}
            rows={4}
            className="resize-none"
            placeholder="Enter text to convert to speech."
          />
          <label className="block text-sm text-white/70">
            Language
            <select
              value={ttsLanguage || "en"}
              onChange={(event) => onChangeLanguage(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-white/10 bg-[#0f141b] px-4 py-3 text-white outline-none transition focus:border-white/40"
            >
              {LANGUAGE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}

      {value && (
        <div className="text-xs text-white/60">
          Current: <span className="text-white/80">{value}</span>
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-xs text-red-100">
          {error}
        </div>
      )}
    </div>
  );
}
