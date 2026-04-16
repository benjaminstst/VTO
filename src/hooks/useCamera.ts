"use client";

import { useState, useCallback, useRef } from "react";

interface UseCameraReturn {
  stream: MediaStream | null;
  facing: "user" | "environment";
  error: string | null;
  startCamera: () => Promise<MediaStream>;
  stopCamera: () => void;
  toggleCamera: () => void;
}

const VIDEO_CONSTRAINTS = {
  frameRate: { ideal: 25 },
  width: { ideal: 1280 },
  height: { ideal: 720 },
};

export function useCamera(): UseCameraReturn {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facing, setFacing] = useState<"user" | "environment">("user");
  const [error, setError] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      setStream(null);
    }
  }, []);

  const startCamera = useCallback(async (): Promise<MediaStream> => {
    // Stop any existing stream first
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
    }

    setError(null);

    try {
      const s = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: facing,
          ...VIDEO_CONSTRAINTS,
        },
      });
      streamRef.current = s;
      setStream(s);
      return s;
    } catch (err) {
      if (err instanceof DOMException) {
        switch (err.name) {
          case "NotAllowedError":
            setError(
              "Camera permission denied. Please allow camera access in your browser settings.",
            );
            break;
          case "NotFoundError":
            setError("No camera found on this device.");
            break;
          case "NotReadableError":
            setError(
              "Camera is in use by another application. Please close it and try again.",
            );
            break;
          case "OverconstrainedError":
            // Fallback to less strict constraints
            try {
              const fallback = await navigator.mediaDevices.getUserMedia({
                audio: false,
                video: { facingMode: facing },
              });
              streamRef.current = fallback;
              setStream(fallback);
              return fallback;
            } catch {
              setError("Could not access camera with supported settings.");
            }
            break;
          default:
            setError(`Camera error: ${err.message}`);
        }
      } else {
        setError("An unexpected error occurred while accessing the camera.");
      }
      throw err;
    }
  }, [facing]);

  const toggleCamera = useCallback(() => {
    setFacing((f) => (f === "user" ? "environment" : "user"));
  }, []);

  return { stream, facing, error, startCamera, stopCamera, toggleCamera };
}
