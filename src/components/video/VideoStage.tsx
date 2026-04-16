"use client";

import { VideoBox } from "./VideoBox";
import { LiveBadge } from "./LiveBadge";
import { useTryOnStore } from "@/stores/tryonStore";

interface VideoStageProps {
  cameraStream: MediaStream | null;
  outputStream: MediaStream | null;
}

export function VideoStage({ cameraStream, outputStream }: VideoStageProps) {
  const status = useTryOnStore((s) => s.status);

  return (
    <div className="flex w-full flex-col gap-4 md:flex-row">
      <div className="relative flex-1">
        <VideoBox label="You" type="camera" stream={cameraStream} mirrored />
      </div>
      <div className="relative flex-1">
        <VideoBox label="Try-On" type="output" stream={outputStream} />
        {status === "live" && (
          <div className="absolute right-3 top-3">
            <LiveBadge />
          </div>
        )}
      </div>
    </div>
  );
}
