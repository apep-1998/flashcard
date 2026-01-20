"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  src: string;
  autoPlay?: boolean;
};

export default function AudioButton({ src, autoPlay = false }: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    audioRef.current = new Audio(src);
    const audio = audioRef.current;
    const handleEnded = () => setIsPlaying(false);
    audio.addEventListener("ended", handleEnded);
    if (autoPlay) {
      audio
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    }
    return () => {
      audio.pause();
      audio.removeEventListener("ended", handleEnded);
    };
  }, [autoPlay, src]);

  const handleToggle = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      audio.currentTime = 0;
      setIsPlaying(false);
      return;
    }
    try {
      await audio.play();
      setIsPlaying(true);
    } catch {
      setIsPlaying(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-2 text-xs uppercase tracking-[0.2em] text-white/70 backdrop-blur transition hover:border-white/40 hover:text-white"
      aria-label={isPlaying ? "Stop audio" : "Play audio"}
    >
      <span className="relative flex h-2 w-2">
        <span
          className={`absolute inline-flex h-full w-full rounded-full ${
            isPlaying ? "bg-[#2b59ff]" : "bg-white/70"
          }`}
        />
      </span>
      {isPlaying ? "Stop" : "Play"}
    </button>
  );
}
