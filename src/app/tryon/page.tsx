"use client";

import { useCallback, useEffect, useRef } from "react";
import { Sidebar } from "@/components/sidebar/Sidebar";
import { VideoStage } from "@/components/video/VideoStage";
import { useTryOnStore } from "@/stores/tryonStore";
import { useCamera } from "@/hooks/useCamera";
import { useClientToken } from "@/hooks/useClientToken";
import { useDecartSession } from "@/hooks/useDecartSession";

export default function TryOnPage() {
  const {
    selectedProduct,
    selectedColor,
    prompt,
    customGarmentImage,
    status,
  } = useTryOnStore();

  const { stream: cameraStream, startCamera, stopCamera } = useCamera();
  const { fetchToken } = useClientToken();
  const { start, stop, updateOutfit, outputStream } = useDecartSession();

  // Dev mode API key override
  const devApiKeyRef = useRef<string | null>(null);

  const handleStart = useCallback(async () => {
    try {
      const stream = await startCamera();

      // Use dev API key if set, otherwise fetch a client token
      const apiKey = devApiKeyRef.current || (await fetchToken());

      await start(stream, apiKey);
    } catch {
      // Errors are already handled in the hooks and reflected in the store
    }
  }, [startCamera, fetchToken, start]);

  const handleStop = useCallback(() => {
    stop();
    stopCamera();
  }, [stop, stopCamera]);

  const handleDevApiKey = useCallback((key: string) => {
    devApiKeyRef.current = key;
  }, []);

  // Send outfit updates when product/color/prompt changes during a live session
  const isLive = status === "live";
  const prevPromptRef = useRef(prompt);
  const prevProductRef = useRef(selectedProduct?.id);
  const prevColorRef = useRef(selectedColor?.hex);

  useEffect(() => {
    if (!isLive) return;

    const promptChanged = prevPromptRef.current !== prompt;
    const productChanged = prevProductRef.current !== selectedProduct?.id;
    const colorChanged = prevColorRef.current !== selectedColor?.hex;

    prevPromptRef.current = prompt;
    prevProductRef.current = selectedProduct?.id;
    prevColorRef.current = selectedColor?.hex;

    if (!promptChanged && !productChanged && !colorChanged) return;
    if (!prompt) return;

    const image =
      customGarmentImage ||
      selectedColor?.garmentImageUrl ||
      selectedProduct?.garmentImageUrl;

    updateOutfit(prompt, image || undefined);
  }, [
    isLive,
    prompt,
    selectedProduct,
    selectedColor,
    customGarmentImage,
    updateOutfit,
  ]);

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      {/* Sidebar */}
      <div className="w-full shrink-0 border-b border-black/10 md:w-80 md:border-b-0 md:border-r lg:w-96">
        <Sidebar
          onStart={handleStart}
          onStop={handleStop}
          onDevApiKey={handleDevApiKey}
        />
      </div>

      {/* Main area */}
      <main className="flex flex-1 flex-col gap-6 p-4 md:p-6 lg:p-8">
        {/* Header */}
        <h2 className="font-display text-xl font-semibold text-brand-charcoal">
          Live Preview
        </h2>

        {/* Video panes */}
        <VideoStage
          cameraStream={cameraStream}
          outputStream={outputStream}
        />

        {/* Selected product info bar */}
        {selectedProduct && (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg bg-white p-3 text-sm shadow-sm">
            <span className="font-medium text-brand-charcoal">
              {selectedProduct.name}
            </span>
            <span className="text-brand-gray">{selectedProduct.styleCode}</span>
            {selectedColor && (
              <span className="flex items-center gap-1.5 text-brand-gray">
                <span
                  className="inline-block h-3 w-3 rounded-full ring-1 ring-inset ring-black/10"
                  style={{ backgroundColor: selectedColor.hex }}
                />
                {selectedColor.name}
              </span>
            )}
            <span className="text-brand-gray">{selectedProduct.material}</span>
            <div className="flex gap-1">
              {selectedProduct.certifications.map((cert) => (
                <span
                  key={cert}
                  className="rounded bg-brand-green-light px-1.5 py-0.5 text-[10px] font-medium text-brand-green"
                >
                  {cert}
                </span>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
