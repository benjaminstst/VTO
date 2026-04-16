"use client";

import { ProductGrid } from "./ProductGrid";
import { ColorPicker } from "./ColorPicker";
import { PromptEditor } from "./PromptEditor";
import { SessionControls } from "./SessionControls";
import { ApiKeyInput } from "./ApiKeyInput";
import { useTryOnStore } from "@/stores/tryonStore";
import { getAllProducts } from "@/lib/products";

interface SidebarProps {
  onStart: () => void;
  onStop: () => void;
  onDevApiKey: (key: string) => void;
}

const products = getAllProducts();

export function Sidebar({ onStart, onStop, onDevApiKey }: SidebarProps) {
  const { selectedProduct, selectedColor, selectProduct, selectColor } =
    useTryOnStore();

  return (
    <aside className="flex h-full w-full flex-col gap-4 overflow-y-auto bg-white p-4">
      {/* Header */}
      <div>
        <h1 className="font-display text-lg font-semibold text-brand-charcoal">
          Virtual Try-On
        </h1>
        <p className="text-xs text-brand-gray">Select a garment to try on</p>
      </div>

      {/* Dev mode API key input */}
      <ApiKeyInput onApiKeySet={onDevApiKey} />

      {/* Session controls */}
      <SessionControls onStart={onStart} onStop={onStop} />

      {/* Product grid */}
      <ProductGrid
        products={products}
        selectedProductId={selectedProduct?.id ?? null}
        onSelectProduct={selectProduct}
      />

      {/* Color picker (shown when a product is selected) */}
      {selectedProduct && (
        <ColorPicker
          colors={selectedProduct.colors}
          selectedColor={selectedColor}
          onSelectColor={selectColor}
        />
      )}

      {/* Prompt editor (shown when a product is selected) */}
      <PromptEditor />
    </aside>
  );
}
