import { create } from "zustand";
import type { Product, ColorVariant, ProductCategory } from "@/types/product";
import type { ConnectionStatus } from "@/types/session";

interface TryOnState {
  // Product selection
  selectedProduct: Product | null;
  selectedColor: ColorVariant | null;
  activeCategory: ProductCategory;
  searchQuery: string;

  // Prompt
  prompt: string;
  isPromptManuallyEdited: boolean;

  // Custom garment upload
  customGarmentImage: File | null;
  customGarmentPreview: string | null;

  // Session
  status: ConnectionStatus;
  elapsedSeconds: number;
  error: string | null;

  // Actions — product
  selectProduct: (product: Product) => void;
  selectColor: (color: ColorVariant) => void;
  setActiveCategory: (category: ProductCategory) => void;
  setSearchQuery: (query: string) => void;

  // Actions — prompt
  setPrompt: (prompt: string) => void;
  setPromptManuallyEdited: (edited: boolean) => void;

  // Actions — upload
  setCustomGarmentImage: (file: File | null, preview: string | null) => void;

  // Actions — session
  setStatus: (status: ConnectionStatus) => void;
  setElapsedSeconds: (seconds: number) => void;
  setError: (error: string | null) => void;
  resetSession: () => void;
}

export const useTryOnStore = create<TryOnState>((set) => ({
  // Initial state
  selectedProduct: null,
  selectedColor: null,
  activeCategory: "tshirts",
  searchQuery: "",
  prompt: "",
  isPromptManuallyEdited: false,
  customGarmentImage: null,
  customGarmentPreview: null,
  status: "idle",
  elapsedSeconds: 0,
  error: null,

  // Actions
  selectProduct: (product) =>
    set({
      selectedProduct: product,
      selectedColor: product.colors[0] ?? null,
      isPromptManuallyEdited: false,
    }),

  selectColor: (color) =>
    set({
      selectedColor: color,
      isPromptManuallyEdited: false,
    }),

  setActiveCategory: (category) =>
    set({ activeCategory: category, searchQuery: "" }),

  setSearchQuery: (query) => set({ searchQuery: query }),

  setPrompt: (prompt) => set({ prompt }),
  setPromptManuallyEdited: (edited) => set({ isPromptManuallyEdited: edited }),

  setCustomGarmentImage: (file, preview) =>
    set({ customGarmentImage: file, customGarmentPreview: preview }),

  setStatus: (status) => set({ status }),
  setElapsedSeconds: (seconds) => set({ elapsedSeconds: seconds }),
  setError: (error) => set({ error }),
  resetSession: () =>
    set({
      status: "idle",
      elapsedSeconds: 0,
      error: null,
    }),
}));
