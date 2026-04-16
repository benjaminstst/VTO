"use client";

import { useEffect } from "react";
import { useTryOnStore } from "@/stores/tryonStore";
import { buildVtonPrompt, buildEnhancedPrompt } from "@/lib/prompts";

export function usePromptBuilder() {
  const {
    selectedProduct,
    selectedColor,
    isPromptManuallyEdited,
    setPrompt,
  } = useTryOnStore();

  // Auto-generate prompt when product/color changes (unless manually edited)
  useEffect(() => {
    if (isPromptManuallyEdited) return;
    if (!selectedProduct || !selectedColor) {
      setPrompt("");
      return;
    }
    const prompt = buildVtonPrompt(selectedProduct, selectedColor);
    setPrompt(prompt);
  }, [selectedProduct, selectedColor, isPromptManuallyEdited, setPrompt]);

  const enhancePrompt = () => {
    if (!selectedProduct || !selectedColor) return;
    const enhanced = buildEnhancedPrompt(selectedProduct, selectedColor);
    setPrompt(enhanced);
    useTryOnStore.getState().setPromptManuallyEdited(false);
  };

  const resetToAuto = () => {
    useTryOnStore.getState().setPromptManuallyEdited(false);
    if (!selectedProduct || !selectedColor) return;
    const prompt = buildVtonPrompt(selectedProduct, selectedColor);
    setPrompt(prompt);
  };

  return { enhancePrompt, resetToAuto };
}
