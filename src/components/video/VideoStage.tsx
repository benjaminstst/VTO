"use client";

import { VideoBox } from "./VideoBox";

export function VideoStage() {
  return (
    <div className="flex w-full flex-col gap-4 md:flex-row">
      <VideoBox label="You" type="camera" mirrored />
      <VideoBox label="Try-On" type="output" />
    </div>
  );
}
