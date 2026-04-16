"use client";

import { useCallback, useEffect, useRef } from "react";
import { createDecartClient, models } from "@decartai/sdk";
import type { ConnectionStatus } from "@/types/session";
import { useTryOnStore } from "@/stores/tryonStore";

const VTON_MODEL = models.realtime("lucy-vton-latest");
const PROMPT_DEBOUNCE_MS = 400;

interface UseDecartSessionReturn {
  start: (stream: MediaStream, apiKey: string) => Promise<void>;
  stop: () => void;
  updateOutfit: (prompt: string, image?: File | string) => void;
  outputStream: MediaStream | null;
}

export function useDecartSession(): UseDecartSessionReturn {
  const { setStatus, setElapsedSeconds, setError, resetSession } =
    useTryOnStore();

  type DecartClient = ReturnType<typeof createDecartClient>;
  type RealtimeClient = Awaited<ReturnType<DecartClient["realtime"]["connect"]>>;
  const realtimeClientRef = useRef<RealtimeClient | null>(null);
  const outputStreamRef = useRef<MediaStream | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const mapConnectionState = useCallback(
    (state: string): ConnectionStatus => {
      switch (state) {
        case "connecting":
          return "connecting";
        case "connected":
        case "generating":
          return "live";
        case "reconnecting":
          return "reconnecting";
        case "disconnected":
          return "idle";
        default:
          return "idle";
      }
    },
    [],
  );

  const stop = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    if (realtimeClientRef.current) {
      try {
        realtimeClientRef.current.disconnect();
      } catch {
        // Ignore disconnect errors
      }
      realtimeClientRef.current = null;
    }

    outputStreamRef.current = null;
    resetSession();
  }, [resetSession]);

  const start = useCallback(
    async (stream: MediaStream, apiKey: string): Promise<void> => {
      // Clean up any existing session
      if (realtimeClientRef.current) {
        stop();
      }

      setStatus("connecting");
      setError(null);

      try {
        const client = createDecartClient({ apiKey });

        const realtimeClient = await client.realtime.connect(stream, {
          model: VTON_MODEL,
          onRemoteStream: (editedStream: MediaStream) => {
            outputStreamRef.current = editedStream;
          },
        });

        realtimeClientRef.current = realtimeClient;

        // Connection state changes
        realtimeClient.on(
          "connectionChange",
          (state: string) => {
            const mapped = mapConnectionState(state);
            setStatus(mapped);

            if (state === "disconnected") {
              realtimeClientRef.current = null;
              outputStreamRef.current = null;
            }
          },
        );

        // Error handling
        realtimeClient.on(
          "error",
          (error: { code: string; message: string }) => {
            console.error(`[Decart ${error.code}] ${error.message}`);

            switch (error.code) {
              case "INVALID_API_KEY":
                setError(
                  "Session token expired or invalid. Please restart the session.",
                );
                setStatus("error");
                break;
              case "WEB_RTC_ERROR":
                setError("Network issue. Attempting to reconnect...");
                break;
              case "MODEL_NOT_FOUND":
                setError(
                  "The try-on service is currently unavailable. Please try again later.",
                );
                setStatus("error");
                break;
              default:
                setError(error.message || "An unexpected error occurred.");
                setStatus("error");
            }
          },
        );

        // Session timer
        realtimeClient.on(
          "generationTick",
          ({ seconds }: { seconds: number }) => {
            setElapsedSeconds(seconds);
          },
        );

        setStatus("live");
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Failed to connect to try-on service";
        setError(message);
        setStatus("error");
        throw err;
      }
    },
    [stop, setStatus, setError, setElapsedSeconds, mapConnectionState],
  );

  const updateOutfit = useCallback(
    (prompt: string, image?: File | string) => {
      if (!realtimeClientRef.current) return;

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(async () => {
        if (!realtimeClientRef.current) return;

        const wordCount = prompt.trim().split(/\s+/).length;
        const enhance = wordCount < 10;

        try {
          const payload: { prompt: string; enhance: boolean; image?: File | string } = {
            prompt,
            enhance,
          };
          if (image) {
            payload.image = image;
          }
          await realtimeClientRef.current.set(payload);
        } catch (err) {
          console.error("Failed to update outfit:", err);
        }
      }, PROMPT_DEBOUNCE_MS);
    },
    [],
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  return {
    start,
    stop,
    updateOutfit,
    outputStream: outputStreamRef.current,
  };
}
