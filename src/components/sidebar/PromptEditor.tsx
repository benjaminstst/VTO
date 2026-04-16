"use client";

import { Sparkles, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useTryOnStore } from "@/stores/tryonStore";
import { usePromptBuilder } from "@/hooks/usePromptBuilder";

export function PromptEditor() {
  const {
    prompt,
    isPromptManuallyEdited,
    selectedProduct,
    setPrompt,
    setPromptManuallyEdited,
  } = useTryOnStore();

  const { enhancePrompt, resetToAuto } = usePromptBuilder();

  if (!selectedProduct) return null;

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPrompt(e.target.value);
    setPromptManuallyEdited(true);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-brand-gray">
          Try-on prompt
        </span>
        {isPromptManuallyEdited && (
          <button
            type="button"
            onClick={resetToAuto}
            className="flex items-center gap-1 text-xs text-brand-green hover:underline"
          >
            <RotateCcw className="h-3 w-3" />
            Reset
          </button>
        )}
      </div>

      <textarea
        value={prompt}
        onChange={handleChange}
        rows={3}
        placeholder="Select a product to generate a prompt..."
        className="w-full resize-none rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-brand-charcoal placeholder:text-brand-gray focus:border-brand-green focus:outline-none focus:ring-1 focus:ring-brand-green"
      />

      <Button
        variant="secondary"
        size="sm"
        onClick={enhancePrompt}
        className="self-start"
      >
        <Sparkles className="mr-1.5 h-3.5 w-3.5" />
        Auto enhance
      </Button>
    </div>
  );
}
