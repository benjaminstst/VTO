"use client";

import { Sidebar } from "@/components/sidebar/Sidebar";
import { VideoStage } from "@/components/video/VideoStage";
import { StatusPill } from "@/components/ui/StatusPill";
import { useTryOnStore } from "@/stores/tryonStore";

export default function TryOnPage() {
  const { status, selectedProduct, selectedColor } = useTryOnStore();

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      {/* Sidebar — product selection */}
      <div className="w-full shrink-0 border-b border-black/10 md:w-80 md:border-b-0 md:border-r lg:w-96">
        <Sidebar />
      </div>

      {/* Main area — video + info */}
      <main className="flex flex-1 flex-col gap-6 p-4 md:p-6 lg:p-8">
        {/* Status bar */}
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold text-brand-charcoal">
            Live Preview
          </h2>
          <StatusPill status={status} />
        </div>

        {/* Video panes */}
        <VideoStage />

        {/* Selected product info */}
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
