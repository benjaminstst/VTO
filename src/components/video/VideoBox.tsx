"use client";

import { useEffect, useRef } from "react";
import { Camera, Monitor } from "lucide-react";

interface VideoBoxProps {
  label: string;
  type: "camera" | "output";
  stream: MediaStream | null;
  mirrored?: boolean;
}

export function VideoBox({
  label,
  type,
  stream,
  mirrored = false,
}: VideoBoxProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const Icon = type === "camera" ? Camera : Monitor;
  const hasStream = !!stream;

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;

    if (stream) {
      el.srcObject = stream;
      el.style.display = "block";
    } else {
      el.srcObject = null;
      el.style.display = "none";
    }

    return () => {
      el.srcObject = null;
    };
  }, [stream]);

  return (
    <div className="relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-xl bg-black/5">
      {/* Video element */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={type === "camera"}
        className={`absolute inset-0 h-full w-full object-cover ${
          mirrored ? "scale-x-[-1]" : ""
        }`}
        style={{ display: "none" }}
      />

      {/* Placeholder (hidden when stream is active) */}
      {!hasStream && (
        <div className="flex flex-col items-center gap-2 text-brand-gray">
          <Icon className="h-10 w-10" strokeWidth={1.5} />
          <span className="text-sm font-medium">{label}</span>
          <span className="text-xs">
            {type === "camera"
              ? "Camera feed will appear here"
              : "Try-on output will appear here"}
          </span>
        </div>
      )}

      {/* Label badge */}
      <span className="absolute left-3 top-3 rounded bg-black/40 px-2 py-0.5 text-xs font-medium text-white">
        {label}
      </span>
    </div>
  );
}
