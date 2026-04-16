"use client";

import { Play, Square, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { StatusPill } from "@/components/ui/StatusPill";
import { useTryOnStore } from "@/stores/tryonStore";

interface SessionControlsProps {
  onStart: () => void;
  onStop: () => void;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function SessionControls({ onStart, onStop }: SessionControlsProps) {
  const { status, elapsedSeconds, error } = useTryOnStore();

  const isIdle = status === "idle";
  const isConnecting = status === "connecting";
  const isLive = status === "live";
  const isActive = isConnecting || isLive || status === "reconnecting";

  const creditsUsed = elapsedSeconds * 2;

  return (
    <div className="flex flex-col gap-3">
      {/* Start / Stop */}
      <div className="flex items-center gap-2">
        {isActive ? (
          <Button variant="danger" size="md" onClick={onStop} className="flex-1">
            <Square className="mr-1.5 h-4 w-4" />
            Stop
          </Button>
        ) : (
          <Button
            variant="primary"
            size="md"
            onClick={onStart}
            disabled={isConnecting}
            className="flex-1"
          >
            {isConnecting ? (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            ) : (
              <Play className="mr-1.5 h-4 w-4" />
            )}
            {isConnecting ? "Connecting..." : "Start Try-On"}
          </Button>
        )}
        <StatusPill status={status} />
      </div>

      {/* Timer + cost (shown during active session) */}
      {isActive && (
        <div className="flex items-center justify-between rounded-lg bg-black/5 px-3 py-2 text-xs">
          <span className="text-brand-gray">
            Session: <span className="font-medium text-brand-charcoal">{formatTime(elapsedSeconds)}</span>
          </span>
          <span className="text-brand-gray">
            Credits: <span className="font-medium text-brand-charcoal">{creditsUsed}</span>
          </span>
        </div>
      )}

      {/* Error message */}
      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-brand-error">
          {error}
        </p>
      )}
    </div>
  );
}
