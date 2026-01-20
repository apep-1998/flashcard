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
      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white/80 backdrop-blur transition hover:border-white/40 hover:text-white"
      aria-label={isPlaying ? "Stop audio" : "Play audio"}
    >
      {isPlaying ? (
        <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
          <path
            d="M8 7h3v10H8zM13 7h3v10h-3z"
            fill="currentColor"
          />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
          <path
            d="M8 6.5v11l9-5.5z"
            fill="currentColor"
          />
        </svg>
      )}
    </button>
  );
}
