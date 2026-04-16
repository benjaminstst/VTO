"use client";

import { Camera, Monitor } from "lucide-react";

interface VideoBoxProps {
  label: string;
  type: "camera" | "output";
  videoRef?: React.RefObject<HTMLVideoElement>;
  mirrored?: boolean;
}

export function VideoBox({
  label,
  type,
  videoRef,
  mirrored = false,
}: VideoBoxProps) {
  const Icon = type === "camera" ? Camera : Monitor;

  return (
    <div className="relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-xl bg-black/5">
      {/* Video element (hidden until a stream is assigned) */}
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

      {/* Placeholder */}
      <div className="flex flex-col items-center gap-2 text-brand-gray">
        <Icon className="h-10 w-10" strokeWidth={1.5} />
        <span className="text-sm font-medium">{label}</span>
        <span className="text-xs">
          {type === "camera"
            ? "Camera feed will appear here"
            : "Try-on output will appear here"}
        </span>
      </div>

      {/* Label badge */}
      <span className="absolute left-3 top-3 rounded bg-black/40 px-2 py-0.5 text-xs font-medium text-white">
        {label}
      </span>
    </div>
  );
}
